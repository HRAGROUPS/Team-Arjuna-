from models.database import SessionLocal, UserDevice, Session, Event
from sqlalchemy import desc
from datetime import datetime
from risk_engine.ml_model import BehaviouralModel

class RiskEvaluator:
    def __init__(self, db_session):
        self.db = db_session

    def evaluate_login(self, user_id: int, device_fingerprint: str, ip_address: str, location: str, simulation_timestamp: str = None, typing_duration_ms: int = 0, is_pwned: bool = False) -> dict:
        score = 0
        explanations = []

        # 1. Device Check
        # Have we seen this user on this device before?
        device_link = self.db.query(UserDevice).filter(
            UserDevice.user_id == user_id,
            UserDevice.device.has(fingerprint=device_fingerprint)
        ).first()

        if not device_link:
            score += 40
            explanations.append({"signal": "Unrecognized Device", "weight": "+40"})
        elif device_link.trust_level == "suspicious":
            score += 50
            explanations.append({"signal": "Previously Suspicious Device", "weight": "+50"})
        elif device_link.trust_level == "trusted":
            score -= 10
            explanations.append({"signal": "Trusted Device", "weight": "-10"})
        else:
            score += 10
            explanations.append({"signal": "Unverified Device History", "weight": "+10"})

        # 2. IP / Location Check
        # Check last 5 sessions AND events for this user
        recent_sessions = self.db.query(Session).filter(
            Session.user_id == user_id
        ).order_by(desc(Session.started_at)).limit(5).all()

        recent_events = self.db.query(Event).filter(
            Event.user_id == user_id,
            Event.action_type == "login"
        ).order_by(desc(Event.timestamp)).limit(5).all()

        known_ips = set()
        known_locations = set()
        last_login_location = None
        last_login_time = None

        for s in recent_sessions:
            if s.ip_address: known_ips.add(s.ip_address)
            if s.location: known_locations.add(s.location)

        for e in recent_events:
            payload = e.payload if isinstance(e.payload, dict) else {}
            e_ip = payload.get("ip")
            e_loc = payload.get("location")
            if e_ip: known_ips.add(e_ip)
            if e_loc: known_locations.add(e_loc)

        if recent_events:
            last_e = recent_events[0]
            payload = last_e.payload if isinstance(last_e.payload, dict) else {}
            last_login_location = payload.get("location")
            last_login_time = last_e.timestamp
        elif recent_sessions:
            last_s = recent_sessions[0]
            last_login_location = last_s.location
            last_login_time = last_s.started_at

        if known_ips or known_locations:
            if ip_address and ip_address not in known_ips:
                score += 20
                explanations.append({"signal": "New IP Address", "weight": "+20"})

            if location and location not in known_locations:
                score += 30
                explanations.append({"signal": "New Geographical Location", "weight": "+30"})

        # Get eval_time for ML and Impossible Travel
        if simulation_timestamp:
            eval_time = datetime.fromisoformat(simulation_timestamp.replace("Z", "+00:00")).replace(tzinfo=None)
        else:
            eval_time = datetime.now()

        # IMPOSSIBLE TRAVEL CALCULATION
        if last_login_location and location and last_login_location != location and last_login_time:
            time_diff_hours = (eval_time - last_login_time).total_seconds() / 3600.0
            if time_diff_hours < 4.0:
                score += 50
                explanations.append({"signal": "Impossible Travel Velocity", "weight": "+50"})

        # 3. ML Behavioural Anomaly Detection (Isolation Forest)
        ml_model = BehaviouralModel(self.db)
            
        ml_result = ml_model.predict_anomaly(user_id, eval_time)
        
        if ml_result["is_anomaly"]:
            score += ml_result["score_penalty"]
            explanations.append(ml_result["explanation"])

        # 4. KEYSTROKE DYNAMICS (Typing Biometrics)
        if typing_duration_ms > 0 and typing_duration_ms < 150:
            score += 50
            explanations.append({"signal": "Bot Automation (Typing < 150ms)", "weight": "+50"})

        # 5. DARK WEB CREDENTIAL CHECK
        if is_pwned:
            score += 40
            explanations.append({"signal": "Compromised Credential (Dark Web)", "weight": "+40"})

        # Calculate final action based on score
        # Ensure score stays between 0 and 100
        final_score = max(0, min(100, score))
        
        # DEMO HARDENING: If ML model catches an anomaly, guarantee at least a CHALLENGE
        if ml_result["is_anomaly"] and final_score < 40:
            final_score = 50

        action = "allow"
        if final_score >= 70:
            action = "block"
        elif final_score >= 30:
            action = "challenge"

        return {
            "risk_score": final_score,
            "explanation": explanations,
            "action_taken": action
        }
