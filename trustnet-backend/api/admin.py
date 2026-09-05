from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from models.database import get_db, RiskAssessment, Event, User, Session as DbSession
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class AlertResponse(BaseModel):
    id: int
    user: str
    action_type: str
    risk_score: float
    action_taken: str
    timestamp: datetime
    explanations: list

    class Config:
        from_attributes = True

@router.get("/alerts", response_model=List[AlertResponse])
def get_recent_alerts(db: Session = Depends(get_db)):
    # Fetch all recent risk assessments, highest score first, or just chronological
    assessments = db.query(RiskAssessment).join(Event).join(User).order_by(desc(RiskAssessment.created_at)).limit(20).all()
    
    alerts = []
    for a in assessments:
        alerts.append({
            "id": a.id,
            "user": a.event.user.username,
            "action_type": a.event.action_type,
            "risk_score": a.risk_score,
            "action_taken": a.action_taken,
            "timestamp": a.created_at,
            "explanations": a.explanation
        })
    return alerts
