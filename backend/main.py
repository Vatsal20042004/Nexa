"""
Main FastAPI application for Employee Tracking System.
"""
from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import date, datetime
import logging
import os
import sys
from contextlib import asynccontextmanager

# Add current directory and parent directory to path for imports
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, backend_dir)
sys.path.insert(0, parent_dir)

from models.database import db, Database
from models.schemas import *
from services.auth_service import AuthService
from api import auth, sessions, tasks, chat, settings, team, projects, announcements, daily_updates, team_leader

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan handler replaces deprecated startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Employee Tracking System API...")

    # Ensure upload directories exist before serving requests
    os.makedirs("backend/uploads/transcripts", exist_ok=True)
    os.makedirs("backend/uploads/videos", exist_ok=True)
    os.makedirs("backend/uploads/screenshots", exist_ok=True)
    os.makedirs("backend/uploads/files", exist_ok=True)
    os.makedirs("backend/uploads/video_frames", exist_ok=True)

    yield

    logger.info("Employee Tracking System API shutdown complete.")


# Initialize FastAPI app
app = FastAPI(
    title="Employee Tracking System API",
    description="Backend API for employee work tracking and task management",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
auth_service = AuthService(db)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Daily Sessions"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(team.router, prefix="/api/team", tags=["Team Leader"])
app.include_router(team_leader.router, prefix="/api/team-leader", tags=["Team Leader Enhanced"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["Announcements"])
app.include_router(daily_updates.router, prefix="/api/daily-updates", tags=["Daily Updates"])
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Employee Tracking System API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    app_path = "backend.main:app" if __package__ else "main:app"
    uvicorn.run(app_path, host="0.0.0.0", port=8000, reload=True)
