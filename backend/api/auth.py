"""
Authentication API routes.
"""
from fastapi import APIRouter, HTTPException, Request
from models.schemas import UserRegister, UserLogin, LoginResponse, UserResponse
from models.database import db
from services.auth_service import AuthService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
auth_service = AuthService(db)


@router.post("/register", response_model=LoginResponse)
async def register(user: UserRegister, request: Request):
    """Register a new user (employee or team leader)."""
    success, message, user_id = auth_service.register_user(
        username=user.username,
        password=user.password,
        name=user.name,
        role=user.role.value
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    # Auto-login after registration
    _, _, user_dict, session_token = auth_service.login_user(
        username=user.username,
        password=user.password,
        ip_address=request.client.host if request.client else None
    )
    
    return LoginResponse(
        success=True,
        message="Registration successful",
        user=UserResponse(**user_dict),
        session_token=session_token
    )


@router.post("/login", response_model=LoginResponse)
async def login(credentials: UserLogin, request: Request):
    """Login user and create session."""
    logger.info(f"Login API called with username: {credentials.username}")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Client IP: {request.client.host if request.client else 'unknown'}")
    
    success, message, user_dict, session_token = auth_service.login_user(
        username=credentials.username,
        password=credentials.password,
        ip_address=request.client.host if request.client else None
    )
    
    if not success:
        raise HTTPException(status_code=401, detail=message)
    
    return LoginResponse(
        success=True,
        message=message,
        user=UserResponse(**user_dict),
        session_token=session_token
    )


@router.post("/logout")
async def logout(authorization: str):
    """Logout user by invalidating session."""
    try:
        _, token = authorization.split()
        auth_service.logout_user(token)
        return {"success": True, "message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(authorization: str):
    """Get current user information."""
    try:
        _, token = authorization.split()
        user = auth_service.verify_session(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid session")
        return UserResponse(**user)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid session")
