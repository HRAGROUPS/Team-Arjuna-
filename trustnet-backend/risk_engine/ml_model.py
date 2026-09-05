from sklearn.ensemble import IsolationForest
import numpy as np
from datetime import datetime
from models.database import Session as DbSession
import math

# In-memory cache for trained models
_model_cache = {}
_feature_stats_cache = {}

class BehaviouralModel:
    def __init__(self, db_session):
        self.db = db_session

    def extract_features(self, current_time: datetime, previous_time: datetime = None) -> list:
        """Extract ML features from a timestamp and velocity."""
        hour_of_day = current_time.hour + (current_time.minute / 60.0)
        day_of_week = current_time.weekday()
        
        # Calculate velocity (time since last login in hours)
        velocity = 24.0 # Default if no previous
        if previous_time:
            delta = (current_time - previous_time).total_seconds() / 3600.0
            velocity = min(delta, 24.0) # Cap at 24 hours for normalization
            
        return [hour_of_day, day_of_week, velocity]

    def train_user_model(self, user_id: int):
        """Train an Isolation Forest on the user's historical sessions."""
        # Fetch all past sessions for this user, ordered by time
        sessions = self.db.query(DbSession).filter(DbSession.user_id == user_id).order_by(DbSession.started_at).all()
        
        if len(sessions) < 5:
            # Not enough data to train a meaningful model
            return False

        X = []
        hours = []
        for i in range(len(sessions)):
            current_time = sessions[i].started_at
            previous_time = sessions[i-1].started_at if i > 0 else None
            
            features = self.extract_features(current_time, previous_time)
            X.append(features)
            hours.append(features[0])

        # Train Isolation Forest
        # contamination=0.20 makes it sensitive enough to catch the 3 AM anomaly in our small dataset
        model = IsolationForest(contamination=0.20, random_state=42, n_estimators=100)
        model.fit(X)
        
        # Save to cache
        _model_cache[user_id] = model
        
        # Save stats for Explainable AI (XAI)
        _feature_stats_cache[user_id] = {
            "avg_hour": sum(hours) / len(hours)
        }
        
        return True

    def predict_anomaly(self, user_id: int, current_time: datetime) -> dict:
        """Evaluate a new login attempt against the user's ML model."""
        # Ensure model exists
        if user_id not in _model_cache:
            success = self.train_user_model(user_id)
            if not success:
                return {"is_anomaly": False, "score_penalty": 0, "explanation": None}

        # Get last session to calculate velocity
        last_session = self.db.query(DbSession).filter(DbSession.user_id == user_id).order_by(DbSession.started_at.desc()).first()
        previous_time = last_session.started_at if last_session else None

        features = self.extract_features(current_time, previous_time)
        
        # Predict: 1 for normal, -1 for anomaly
        prediction = _model_cache[user_id].predict([features])[0]
        
        # Calculate Explainable AI (XAI) if anomalous
        if prediction == -1:
            avg_hour = _feature_stats_cache[user_id]["avg_hour"]
            current_hour = features[0]
            
            # Simple heuristic explanation: what deviated most?
            hour_diff = abs(current_hour - avg_hour)
            
            # Since Isolation Forest doesn't easily output feature importance per prediction natively 
            # in a way that's simple to explain, we use our cached stats.
            # If they are logging in > 3 hours away from their average time
            if hour_diff > 3:
                # Calculate penalty based on severity of deviation (max 40)
                penalty = min(20 + int(hour_diff * 3), 40)
                return {
                    "is_anomaly": True,
                    "score_penalty": penalty,
                    "explanation": {"signal": "Behavioural Anomaly (Unusual Time)", "weight": f"+{penalty}"}
                }
            elif features[2] < 0.1: # Logged in less than 6 minutes ago
                return {
                    "is_anomaly": True,
                    "score_penalty": 30,
                    "explanation": {"signal": "Behavioural Anomaly (High Velocity)", "weight": "+30"}
                }
            else:
                # Minor deviation (e.g. 1 hour off baseline). Do not penalize for demo purposes.
                return {"is_anomaly": False, "score_penalty": 0, "explanation": None}
                
        return {"is_anomaly": False, "score_penalty": 0, "explanation": None}
