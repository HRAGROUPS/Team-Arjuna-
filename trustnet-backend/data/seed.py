import sys
import os
import random
from datetime import datetime, timedelta
import json

# Add parent directory to path so we can import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import SessionLocal, engine, Base
from models.database import User, Device, UserDevice, Session, Event, RiskAssessment
import bcrypt

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    return hashed_password.decode('utf-8')

def seed_database():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data
    db.query(RiskAssessment).delete()
    db.query(Event).delete()
    db.query(Session).delete()
    db.query(UserDevice).delete()
    db.query(Device).delete()
    db.query(User).delete()
    db.commit()

    print("Seeding Users...")
    alice = User(username="alice", email="alice@example.com", hashed_password=get_password_hash("password123"), role="user")
    bob = User(username="bob", email="bob@example.com", hashed_password=get_password_hash("password123"), role="user")
    admin = User(username="admin", email="admin@trustnet.com", hashed_password=get_password_hash("admin123"), role="admin")
    
    db.add_all([alice, bob, admin])
    db.commit()

    print("Seeding Devices...")
    alice_laptop = Device(fingerprint="fp_alice_macbook_pro_2023", os="macOS", browser="Chrome")
    alice_phone = Device(fingerprint="fp_alice_iphone_14", os="iOS", browser="Safari")
    bob_desktop = Device(fingerprint="fp_bob_windows_11", os="Windows", browser="Edge")
    hacker_device = Device(fingerprint="fp_unknown_kali_linux", os="Linux", browser="Firefox")

    db.add_all([alice_laptop, alice_phone, bob_desktop, hacker_device])
    db.commit()

    print("Linking Users & Devices...")
    db.add(UserDevice(user_id=alice.id, device_id=alice_laptop.id, trust_level="trusted"))
    db.add(UserDevice(user_id=alice.id, device_id=alice_phone.id, trust_level="trusted"))
    db.add(UserDevice(user_id=bob.id, device_id=bob_desktop.id, trust_level="trusted"))
    db.commit()

    print("Generating Historical Events (Normal Behavior)...")
    # Generate 30 days of normal login history for Alice
    # Alice logs in around 9 AM (+- 2 hours) from New York
    base_date = datetime.utcnow() - timedelta(days=30)
    
    for day in range(30):
        # Alice Morning Login
        login_hour = random.randint(8, 10)
        login_minute = random.randint(0, 59)
        login_time = base_date + timedelta(days=day, hours=login_hour, minutes=login_minute)
        
        # Create Session
        session = Session(
            user_id=alice.id,
            device_id=alice_laptop.id,
            ip_address="192.168.1.100",
            location="United States",
            started_at=login_time
        )
        db.add(session)
        db.commit()

        # Create Login Event
        event = Event(
            user_id=alice.id,
            session_id=session.id,
            action_type="login",
            payload={"ip": "192.168.1.100", "location": "United States", "method": "password"},
            timestamp=login_time
        )
        db.add(event)
        db.commit()

        # Risk Assessment (Low Risk)
        risk = RiskAssessment(
            event_id=event.id,
            risk_score=random.uniform(2.0, 10.0),
            explanation=[{"signal": "Known Device", "weight": "-10"}, {"signal": "Known IP", "weight": "-10"}],
            action_taken="allow",
            created_at=login_time
        )
        db.add(risk)
        db.commit()

    print("Generating Suspicious Past Event...")
    # 5 days ago, Alice had a suspicious login from a new IP but same device
    suspicious_time = base_date + timedelta(days=25, hours=2, minutes=30)
    session_susp = Session(user_id=alice.id, device_id=alice_laptop.id, ip_address="203.0.113.5", location="Los Angeles, USA", started_at=suspicious_time)
    db.add(session_susp)
    db.commit()

    event_susp = Event(user_id=alice.id, session_id=session_susp.id, action_type="login", payload={"ip": "203.0.113.5", "location": "Los Angeles, USA"}, timestamp=suspicious_time)
    db.add(event_susp)
    db.commit()

    risk_susp = RiskAssessment(
        event_id=event_susp.id,
        risk_score=65.0,
        explanation=[{"signal": "Unusual Time", "weight": "+30"}, {"signal": "New Location", "weight": "+35"}],
        action_taken="challenge",
        created_at=suspicious_time
    )
    db.add(risk_susp)
    db.commit()

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
