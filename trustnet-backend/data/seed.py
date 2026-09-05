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

    # No historic or suspicious events are seeded for Alice.
    # This clean state lets you demonstrate the effect of the typing‑biometrics rule without other penalties.
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
