from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, admin, graph
from models.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TrustNet API",
    description="AI-Powered Digital Identity & Fraud Intelligence Platform",
    version="1.0.0"
)

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(graph.router, prefix="/api/v1/graph", tags=["Graph"])

@app.get("/")
def read_root():
    return {"message": "Welcome to TrustNet API. Don't just verify identity. Continuously evaluate digital trust."}
