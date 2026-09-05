from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class LoginRequest(BaseModel):
    username: str
    password: str
    device_fingerprint: str
    os: Optional[str] = None
    browser: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    timestamp: Optional[str] = None
    typing_duration_ms: Optional[int] = 0 # Optional ISO timestamp for simulation

class LoginResponse(BaseModel):
    token: Optional[str] = None
    action: str # allow, challenge, block
    risk_score: float
    message: str

class VerifyMFARequest(BaseModel):
    username: str
    code: str
    device_fingerprint: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    user_id: int
    action_type: str
    payload: Dict[str, Any]
    timestamp: datetime
    
    class Config:
        from_attributes = True

class RiskAssessmentResponse(BaseModel):
    id: int
    event_id: int
    risk_score: float
    explanation: List[Dict[str, Any]]
    action_taken: str
    created_at: datetime

    class Config:
        from_attributes = True
