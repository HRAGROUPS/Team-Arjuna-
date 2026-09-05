from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import json

from models.database import get_db, User, Device, UserDevice, Session as DbSession, Event, RiskAssessment
from models.schemas import LoginRequest, LoginResponse
from core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from risk_engine.evaluator import RiskEvaluator

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # 1. Verify Identity (Authentication)
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. CONTINUOUS DIGITAL TRUST EVALUATION (Risk Engine)
    # MUST be called BEFORE we insert the new device/session into the database!
    evaluator = RiskEvaluator(db)
    risk_result = evaluator.evaluate_login(
        user_id=user.id, 
        device_fingerprint=request.device_fingerprint, 
        ip_address=request.ip_address, 
        location=request.location
    )

    action = risk_result["action_taken"]

    # 3. Track / Verify Device ONLY IF NOT BLOCKED
    session_id = None
    if action != "block":
        device = db.query(Device).filter(Device.fingerprint == request.device_fingerprint).first()
        if not device:
            # New device unseen by system entirely
            device = Device(fingerprint=request.device_fingerprint, os=request.os, browser=request.browser)
            db.add(device)
            db.commit()
            db.refresh(device)

        # Link user to device if not linked
        user_device = db.query(UserDevice).filter(UserDevice.user_id == user.id, UserDevice.device_id == device.id).first()
        if not user_device:
            user_device = UserDevice(user_id=user.id, device_id=device.id, trust_level="unknown")
            db.add(user_device)
            db.commit()

        # Create Session
        session = DbSession(
            user_id=user.id,
            device_id=device.id,
            ip_address=request.ip_address,
            location=request.location
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id

    # 4. Always Ingest Event and Risk Assessment
    event = Event(
        user_id=user.id,
        session_id=session_id,
        action_type="login",
        payload={"ip": request.ip_address, "location": request.location, "device": request.device_fingerprint}
    )
    db.add(event)
    db.commit()
    db.refresh(event)


    # Save the risk assessment
    assessment = RiskAssessment(
        event_id=event.id,
        risk_score=risk_result["risk_score"],
        explanation=risk_result["explanation"],
        action_taken=risk_result["action_taken"]
    )
    db.add(assessment)
    db.commit()

    # 6. Actionable Security Decision
    if risk_result["action_taken"] == "block":
        return LoginResponse(
            action="block",
            risk_score=risk_result["risk_score"],
            message="Access blocked due to highly suspicious activity."
        )
    
    if risk_result["action_taken"] == "challenge":
        return LoginResponse(
            action="challenge",
            risk_score=risk_result["risk_score"],
            message="Unusual activity detected. Additional verification required."
        )

    # If allowed, generate token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )

    return LoginResponse(
        token=access_token,
        action="allow",
        risk_score=risk_result["risk_score"],
        message="Login successful."
    )
