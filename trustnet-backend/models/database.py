from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime
import json

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user") # 'user' or 'admin'
    risk_status = Column(String, default="low") # 'low', 'medium', 'high'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    devices = relationship("UserDevice", back_populates="user")
    sessions = relationship("Session", back_populates="user")
    events = relationship("Event", back_populates="user")

class Device(Base):
    __tablename__ = 'devices'
    id = Column(Integer, primary_key=True, index=True)
    fingerprint = Column(String, unique=True, index=True)
    os = Column(String)
    browser = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("UserDevice", back_populates="device")
    sessions = relationship("Session", back_populates="device")

class UserDevice(Base):
    __tablename__ = 'user_devices'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    device_id = Column(Integer, ForeignKey('devices.id'))
    trust_level = Column(String, default="trusted") # 'trusted', 'suspicious'
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="devices")
    device = relationship("Device", back_populates="users")

class Session(Base):
    __tablename__ = 'sessions'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    device_id = Column(Integer, ForeignKey('devices.id'))
    ip_address = Column(String, index=True)
    location = Column(String) # e.g., "New York, USA"
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")
    device = relationship("Device", back_populates="sessions")
    events = relationship("Event", back_populates="session")

class Event(Base):
    __tablename__ = 'events'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    session_id = Column(Integer, ForeignKey('sessions.id'), nullable=True)
    action_type = Column(String, index=True) # 'login', 'transfer', 'profile_update'
    payload = Column(JSON) # Detailed context of the event
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="events")
    session = relationship("Session", back_populates="events")
    risk_assessment = relationship("RiskAssessment", back_populates="event", uselist=False)

class RiskAssessment(Base):
    __tablename__ = 'risk_assessments'
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey('events.id'))
    risk_score = Column(Float) # 0 to 100
    explanation = Column(JSON) # e.g., [{"signal": "New Device", "weight": "+30"}]
    action_taken = Column(String) # 'allow', 'challenge', 'block'
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="risk_assessment")

# Database Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./trustnet.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
