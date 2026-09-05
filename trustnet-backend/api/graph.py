from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.database import get_db, User, Device, UserDevice, Session as DbSession
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

@router.get("/{username}")
def get_trust_graph(username: str, db: Session = Depends(get_db)):
    """Generate a Node/Link graph representing the user's identity footprint."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return {"nodes": [], "links": []}

    nodes = []
    links = []
    
    # 1. User Node
    user_node_id = f"user_{user.id}"
    nodes.append({
        "id": user_node_id,
        "name": user.username,
        "val": 20,
        "color": "#3B82F6", # Primary Blue
        "type": "User"
    })

    # 2. Device Nodes
    devices = db.query(UserDevice).filter(UserDevice.user_id == user.id).all()
    for d in devices:
        device = d.device
        dev_node_id = f"dev_{device.id}"
        
        # Color based on trust
        color = "#10B981" if d.trust_level == "trusted" else ("#EF4444" if d.trust_level == "suspicious" else "#F59E0B")
        
        nodes.append({
            "id": dev_node_id,
            "name": f"{device.os} ({device.browser})",
            "val": 10,
            "color": color,
            "type": "Device"
        })
        links.append({
            "source": user_node_id,
            "target": dev_node_id,
            "color": "rgba(255,255,255,0.2)"
        })

    # 3. IP / Location Nodes (from Sessions)
    # Get distinct IPs and Locations
    sessions = db.query(DbSession).filter(DbSession.user_id == user.id).all()
    
    seen_ips = set()
    for s in sessions:
        if s.ip_address not in seen_ips:
            seen_ips.add(s.ip_address)
            ip_node_id = f"ip_{s.ip_address}"
            nodes.append({
                "id": ip_node_id,
                "name": f"IP: {s.ip_address}",
                "val": 5,
                "color": "#8B5CF6", # Purple
                "type": "IP"
            })
            
            # Link IP to the device used in that session
            links.append({
                "source": f"dev_{s.device_id}",
                "target": ip_node_id,
                "color": "rgba(255,255,255,0.1)"
            })
            
    return {"nodes": nodes, "links": links}
