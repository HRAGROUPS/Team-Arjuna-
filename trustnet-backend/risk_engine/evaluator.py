from models.database import SessionLocal, UserDevice, Session, Event
from sqlalchemy import desc
from datetime import datetime

class RiskEvaluator:
    def __init__(self, db_session):
        self.db = db_session

    def evaluate_login(self, user_id: int, device_fingerprint: str, ip_address: str, location: str) -> dict:
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
        # Check last 5 sessions for this user
        recent_sessions = self.db.query(Session).filter(
            Session.user_id == user_id
        ).order_by(desc(Session.started_at)).limit(5).all()

        if recent_sessions:
            known_ips = [s.ip_address for s in recent_sessions]
            known_locations = [s.location for s in recent_sessions]

            if ip_address not in known_ips:
                score += 20
                explanations.append({"signal": "New IP Address", "weight": "+20"})
            else:
                score += 0
                explanations.append({"signal": "Known IP Address", "weight": "-5"})

            if location and location not in known_locations:
                score += 30
                explanations.append({"signal": "New Geographical Location", "weight": "+30"})
        else:
            # First time logging in (or no history)
            pass

        # Calculate final action based on score
        # Ensure score stays between 0 and 100
        final_score = max(0, min(100, score))
        
        action = "allow"
        if final_score > 70:
            action = "block"
        elif final_score > 30:
            action = "challenge"

        return {
            "risk_score": final_score,
            "explanation": explanations,
            "action_taken": action
        }
