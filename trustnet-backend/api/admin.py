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
            "timestamp": a.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if a.created_at else datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "explanations": a.explanation
        })
    return alerts

@router.get("/ai-summary")
def get_ai_investigation_summary(db: Session = Depends(get_db)):
    high_risk = db.query(RiskAssessment).filter(RiskAssessment.risk_score >= 70).order_by(desc(RiskAssessment.created_at)).limit(3).all()
    
    if not high_risk:
        return {
            "summary": "All systems operating within safe operational parameters. Zero high-risk interdictions recorded in recent telemetry window.",
            "recommendation": "Maintain automated background Zero-Trust evaluation baselines.",
            "threat_level": "LOW"
        }
        
    findings = []
    for r in high_risk:
        user = r.event.user.username
        signals = [exp["signal"] for exp in (r.explanation or [])]
        findings.append(f"Intercepted suspicious access attempt on user '{user}' with Risk Score {r.risk_score:.0f}/100 (Drivers: {', '.join(signals)}).")
        
    return {
        "summary": f"AI Copilot identified {len(high_risk)} critical threat vectors. " + " ".join(findings),
        "recommendation": "Enforce mandatory hardware device re-binding and require Step-Up MFA TOTP authentication for affected users.",
        "threat_level": "HIGH"
    }
