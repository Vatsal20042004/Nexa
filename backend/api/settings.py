"""
User settings API routes.
"""
from fastapi import APIRouter, Depends, HTTPException
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.models.schemas import UserSettingsUpdate, UserResponse
from backend.models.database import db
from backend.services.auth_service import AuthService
from backend.dependencies import get_current_user

router = APIRouter()
auth_service = AuthService(db)


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    return UserResponse(**current_user)


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    settings: UserSettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user settings."""
    success = auth_service.update_user_settings(
        user_id=current_user['id'],
        work_hours=settings.work_hours,
        comments=settings.comments,
        name=settings.name
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update settings")
    
    # Get updated user
    updated_user = auth_service.get_user_by_id(current_user['id'])
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(**updated_user)


@router.get("/work-hours")
async def get_work_hours(current_user: dict = Depends(get_current_user)):
    """Get user work hours setting."""
    return {
        "work_hours": current_user.get('work_hours', '09:00-17:00')
    }


@router.patch("/work-hours")
async def update_work_hours(
    work_hours: str,
    current_user: dict = Depends(get_current_user)
):
    """Update work hours."""
    success = auth_service.update_user_settings(
        user_id=current_user['id'],
        work_hours=work_hours
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update work hours")
    
    return {"success": True, "work_hours": work_hours}


@router.get("/comments")
async def get_comments(current_user: dict = Depends(get_current_user)):
    """Get user comments."""
    return {
        "comments": current_user.get('comments', '')
    }


@router.patch("/comments")
async def update_comments(
    comments: str,
    current_user: dict = Depends(get_current_user)
):
    """Update user comments."""
    success = auth_service.update_user_settings(
        user_id=current_user['id'],
        comments=comments
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update comments")
    
    return {"success": True, "comments": comments}
