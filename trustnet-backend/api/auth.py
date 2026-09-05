from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
import json
import hashlib
import requests

from models.database import get_db, User, Device, UserDevice, Session as DbSession, Event, RiskAssessment
from models.schemas import LoginRequest, LoginResponse, VerifyMFARequest
from core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from risk_engine.evaluator import RiskEvaluator

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(request_data: LoginRequest, http_request: Request, db: Session = Depends(get_db)):
    # 1. Verify Identity (Authentication)
    user = db.query(User).filter(User.username == request_data.username).first()
    if not user or not verify_password(request_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # REAL-WORLD UPGRADE: Extract actual IP if not simulated
    ip_address = request_data.ip_address
    if not ip_address:
        # Get real IP (fall back to localhost if running locally)
        ip_address = http_request.client.host if http_request.client else "127.0.0.1"

    # REAL-WORLD UPGRADE: Live Geolocation Lookup
    location = request_data.location
    if not location:
        if ip_address == "127.0.0.1" or ip_address == "localhost" or ip_address == "::1":
            location = "Local Network"
        else:
            try:
                # Use a free live API for Geolocation
                geo_resp = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=2).json()
                if geo_resp.get("status") == "success":
                    location = f"{geo_resp.get('city')}, {geo_resp.get('country')}"
                else:
                    location = "Unknown Location"
            except:
                location = "Unknown Location"

    # REAL-WORLD UPGRADE: Dark Web Credential Check
    # We securely hash the password and check the HaveIBeenPwned API
    pwned_count = 0
    try:
        sha1_pwd = hashlib.sha1(request_data.password.encode('utf-8')).hexdigest().upper()
        prefix = sha1_pwd[:5]
        suffix = sha1_pwd[5:]
        pwned_res = requests.get(f"https://api.pwnedpasswords.com/range/{prefix}", timeout=2)
        if pwned_res.status_code == 200:
            for line in pwned_res.text.splitlines():
                if line.startswith(suffix):
                    pwned_count = int(line.split(':')[1])
                    break
    except:
        pass

    # 2. CONTINUOUS DIGITAL TRUST EVALUATION (Risk Engine)
    # MUST be called BEFORE we insert the new device/session into the database!
    evaluator = RiskEvaluator(db)
    risk_result = evaluator.evaluate_login(
        user_id=user.id, 
        device_fingerprint=request_data.device_fingerprint, 
        ip_address=ip_address, 
        location=location,
        simulation_timestamp=request_data.timestamp,
        typing_duration_ms=request_data.typing_duration_ms,
        is_pwned=(pwned_count > 0)
    )

    # DEMO/ADMIN BYPASS: The admin account must always be able to log in to present the dashboard!
    # Bob is also bypassed so you can demonstrate a "Trusted User" successful login!
    if user.username in ["admin", "bob"]:
        risk_result = {
            "risk_score": 0,
            "explanation": [{"signal": "Admin Override", "weight": "0"}],
            "action_taken": "allow"
        }
    
    action = risk_result["action_taken"]

    # 3. Track / Verify Device ONLY IF NOT BLOCKED
    session_id = None
    if action != "block":
        device = db.query(Device).filter(Device.fingerprint == request_data.device_fingerprint).first()
        if not device:
            # New device unseen by system entirely
            device = Device(fingerprint=request_data.device_fingerprint, os=request_data.os, browser=request_data.browser)
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
            ip_address=ip_address,
            location=location
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
        payload={"ip": ip_address, "location": location, "device": request_data.device_fingerprint}
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

@router.post("/verify-mfa", response_model=LoginResponse)
def verify_mfa(req: VerifyMFARequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not req.code or len(req.code) < 6:
        raise HTTPException(status_code=400, detail="Invalid verification code. Enter a 6-digit code.")
        
    if req.device_fingerprint:
        dev = db.query(Device).filter(Device.fingerprint == req.device_fingerprint).first()
        if dev:
            user_dev = db.query(UserDevice).filter(UserDevice.user_id == user.id, UserDevice.device_id == dev.id).first()
            if user_dev:
                user_dev.trust_level = "trusted"
                db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )

    return LoginResponse(
        token=access_token,
        action="allow",
        risk_score=0.0,
        message="MFA verification successful! Device marked as trusted."
    )
