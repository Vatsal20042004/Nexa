"""
Chat API routes using the UnifiedService chat functionality.
"""
from fastapi import APIRouter, Depends, HTTPException
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.models.schemas import ChatRequest, ChatResponse
from backend.models.database import db
from backend.dependencies import get_current_user
from Nexa.services.services import UnifiedService
from datetime import datetime

router = APIRouter()
unified_service = UnifiedService()

# Path to user chat system prompt
USER_CHAT_PROMPT = os.path.join(
    os.path.dirname(__file__), 
    '../../Nexa/services/llm/assets/system_instructions_user_chat.md'
)


@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a chat message and get AI response.
    Uses the chat system prompt for user interactions.
    """
    try:
        # Create session_id that includes user_id for isolation
        full_session_id = f"user_{current_user['id']}_{chat_request.session_id}"
        
        # Call unified service chat
        response_text = unified_service.chat(
            session_id=full_session_id,
            user_message=chat_request.message,
            system_prompt_file=USER_CHAT_PROMPT if os.path.exists(USER_CHAT_PROMPT) else None
        )
        
        db.log_audit(
            current_user['id'], 
            "CHAT_MESSAGE", 
            "chat_messages", 
            None,
            f"Chat session: {chat_request.session_id}"
        )
        
        return ChatResponse(
            response=response_text,
            session_id=chat_request.session_id,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get chat history for a session."""
    try:
        full_session_id = f"user_{current_user['id']}_{session_id}"
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT role, message, created_at 
            FROM chat_messages 
            WHERE user_id = ? AND session_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (current_user['id'], full_session_id, limit))
        
        messages = cursor.fetchall()
        conn.close()
        
        return {
            "session_id": session_id,
            "messages": [
                {
                    "role": msg[0],
                    "message": msg[1],
                    "timestamp": msg[2]
                }
                for msg in reversed(messages)
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


@router.delete("/session/{session_id}")
async def delete_chat_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a chat session (clear history)."""
    try:
        full_session_id = f"user_{current_user['id']}_{session_id}"
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM chat_messages 
            WHERE user_id = ? AND session_id = ?
        """, (current_user['id'], full_session_id))
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        db.log_audit(
            current_user['id'],
            "CHAT_SESSION_DELETED",
            "chat_messages",
            None,
            f"Deleted {deleted_count} messages from session {session_id}"
        )
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} messages",
            "session_id": session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")


@router.get("/sessions")
async def list_chat_sessions(current_user: dict = Depends(get_current_user)):
    """List all chat sessions for the current user."""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT DISTINCT session_id, 
                   COUNT(*) as message_count,
                   MAX(created_at) as last_message_at
            FROM chat_messages 
            WHERE user_id = ?
            GROUP BY session_id
            ORDER BY last_message_at DESC
        """, (current_user['id'],))
        
        sessions = cursor.fetchall()
        conn.close()
        
        # Remove user prefix from session_id for display
        prefix = f"user_{current_user['id']}_"
        
        return {
            "sessions": [
                {
                    "session_id": session[0].replace(prefix, '') if session[0].startswith(prefix) else session[0],
                    "message_count": session[1],
                    "last_message_at": session[2]
                }
                for session in sessions
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sessions: {str(e)}")
