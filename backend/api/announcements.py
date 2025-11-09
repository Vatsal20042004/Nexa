"""
Announcements API routes.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.models.schemas import AnnouncementCreate, AnnouncementResponse
from backend.models.database import db
from backend.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=List[AnnouncementResponse])
async def list_announcements(
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all announcements with optional type filter."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    if type:
        cursor.execute(
            "SELECT * FROM announcements WHERE type = ? ORDER BY created_at DESC",
            (type,)
        )
    else:
        cursor.execute("SELECT * FROM announcements ORDER BY created_at DESC")
    
    announcements = cursor.fetchall()
    conn.close()
    
    return [AnnouncementResponse(**dict(announcement)) for announcement in announcements]


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement(
    announcement_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a single announcement by ID."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM announcements WHERE id = ?", (announcement_id,))
    announcement = cursor.fetchone()
    conn.close()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    return AnnouncementResponse(**dict(announcement))


@router.post("", response_model=AnnouncementResponse)
async def create_announcement(
    announcement: AnnouncementCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new announcement."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO announcements (project_id, title, body, from_user_id, type)
        VALUES (?, ?, ?, ?, ?)
    """, (
        announcement.project_id,
        announcement.title,
        announcement.body,
        current_user['id'],  # Use current user as sender
        announcement.type.value
    ))
    
    announcement_id = cursor.lastrowid
    conn.commit()
    
    # Fetch the created announcement
    cursor.execute("SELECT * FROM announcements WHERE id = ?", (announcement_id,))
    created_announcement = cursor.fetchone()
    conn.close()
    
    db.log_audit(
        current_user['id'],
        "ANNOUNCEMENT_CREATED",
        "announcements",
        announcement_id,
        f"Created announcement: {announcement.title}"
    )
    
    return AnnouncementResponse(**dict(created_announcement))


@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete an announcement."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM announcements WHERE id = ?", (announcement_id,))
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    conn.commit()
    conn.close()
    
    db.log_audit(
        current_user['id'],
        "ANNOUNCEMENT_DELETED",
        "announcements",
        announcement_id,
        "Announcement deleted"
    )
    
    return {"success": True, "message": "Announcement deleted"}

