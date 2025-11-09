"""
Shared dependencies for FastAPI routes.
This module avoids circular imports by separating dependencies from main.py
"""
from fastapi import HTTPException, Header
from typing import Optional

# Import will be done at runtime to avoid circular import
_auth_service = None

def get_auth_service():
    """Lazy load auth service to avoid circular imports."""
    global _auth_service
    if _auth_service is None:
        from models.database import db
        from services.auth_service import AuthService
        _auth_service = AuthService(db)
    return _auth_service


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Dependency to get current authenticated user from session token.
    
    Expects header: Authorization: Bearer <token>
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    auth_service = get_auth_service()
    user = auth_service.verify_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return user


async def get_team_leader(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency to ensure user is a team leader."""
    current_user = await get_current_user(authorization)
    if current_user['role'] != 'team_leader':
        raise HTTPException(status_code=403, detail="Team leader access required")
    return current_user

