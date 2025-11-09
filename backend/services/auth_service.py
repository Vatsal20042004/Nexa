"""
Authentication service for simple user management.
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple
import sqlite3
import logging

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db):
        self.db = db
        
    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def generate_session_token(self) -> str:
        """Generate a random session token."""
        return secrets.token_urlsafe(32)
    
    def register_user(self, username: str, password: str, name: str, role: str) -> Tuple[bool, str, Optional[int]]:
        """
        Register a new user.
        
        Returns:
            Tuple of (success, message, user_id)
        """
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Check if username exists
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cursor.fetchone():
                return False, "Username already exists", None
            
            # Hash password and insert user
            hashed_password = self.hash_password(password)
            cursor.execute("""
                INSERT INTO users (username, password, name, role)
                VALUES (?, ?, ?, ?)
            """, (username, hashed_password, name, role))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            # Log audit
            self.db.log_audit(user_id, "USER_REGISTERED", "users", user_id, 
                            f"User {username} registered with role {role}")
            
            return True, "User registered successfully", user_id
            
        except Exception as e:
            logger.exception(f"Error registering user: {e}")
            return False, f"Registration failed: {str(e)}", None
    
    def login_user(self, username: str, password: str, ip_address: Optional[str] = None) -> Tuple[bool, str, Optional[dict], Optional[str]]:
        """
        Login user and create session.
        
        Returns:
            Tuple of (success, message, user_dict, session_token)
        """
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Find user
            hashed_password = self.hash_password(password)
            logger.info(f"Login attempt for username: {username}")
            logger.info(f"Hashed password: {hashed_password}")
            logger.info(f"Database path: {self.db.db_path}")
            
            cursor.execute("""
                SELECT id, username, name, role, work_hours, comments, created_at
                FROM users
                WHERE username = ? AND password = ?
            """, (username, hashed_password))
            
            user_row = cursor.fetchone()
            logger.info(f"Database query result: {user_row}")
            
            if not user_row:
                # Debug: check if username exists at all
                cursor.execute("SELECT username, password FROM users WHERE username = ?", (username,))
                existing_user = cursor.fetchone()
                if existing_user:
                    logger.warning(f"Username exists but password mismatch. Stored: {existing_user['password']}, Provided: {hashed_password}")
                else:
                    logger.warning(f"Username {username} not found in database")
                conn.close()
                return False, "Invalid username or password", None, None
            
            user = dict(user_row)
            
            # Create session token
            session_token = self.generate_session_token()
            expires_at = datetime.now() + timedelta(days=7)
            
            cursor.execute("""
                INSERT INTO sessions (user_id, session_token, expires_at)
                VALUES (?, ?, ?)
            """, (user['id'], session_token, expires_at))
            
            conn.commit()
            conn.close()
            
            # Log audit
            self.db.log_audit(user['id'], "USER_LOGIN", "users", user['id'], 
                            f"User {username} logged in", ip_address)
            
            return True, "Login successful", user, session_token
            
        except Exception as e:
            logger.exception(f"Error during login: {e}")
            return False, f"Login failed: {str(e)}", None, None
    
    def verify_session(self, session_token: str) -> Optional[dict]:
        """
        Verify session token and return user info.
        
        Returns:
            User dict if valid, None otherwise
        """
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT u.id, u.username, u.name, u.role, u.work_hours, u.comments, s.expires_at
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_token = ?
            """, (session_token,))
            
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            user = dict(row)
            
            # Check if session expired
            expires_at = datetime.fromisoformat(user['expires_at'])
            if expires_at < datetime.now():
                return None
            
            return user
            
        except Exception as e:
            logger.exception(f"Error verifying session: {e}")
            return None
    
    def logout_user(self, session_token: str) -> bool:
        """Logout user by removing session."""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Get user_id before deleting
            cursor.execute("SELECT user_id FROM sessions WHERE session_token = ?", (session_token,))
            row = cursor.fetchone()
            
            if row:
                user_id = row[0]
                cursor.execute("DELETE FROM sessions WHERE session_token = ?", (session_token,))
                conn.commit()
                
                # Log audit
                self.db.log_audit(user_id, "USER_LOGOUT", "users", user_id, "User logged out")
            
            conn.close()
            return True
            
        except Exception as e:
            logger.exception(f"Error during logout: {e}")
            return False
    
    def get_user_by_id(self, user_id: int) -> Optional[dict]:
        """Get user by ID."""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, username, name, role, work_hours, comments, created_at
                FROM users WHERE id = ?
            """, (user_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            return dict(row) if row else None
            
        except Exception as e:
            logger.exception(f"Error getting user: {e}")
            return None
    
    def update_user_settings(self, user_id: int, work_hours: Optional[str] = None, 
                           comments: Optional[str] = None, name: Optional[str] = None) -> bool:
        """Update user settings."""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            updates = []
            params = []
            
            if work_hours is not None:
                updates.append("work_hours = ?")
                params.append(work_hours)
            
            if comments is not None:
                updates.append("comments = ?")
                params.append(comments)
            
            if name is not None:
                updates.append("name = ?")
                params.append(name)
            
            if not updates:
                return True
            
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(user_id)
            
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, params)
            
            conn.commit()
            conn.close()
            
            # Log audit
            self.db.log_audit(user_id, "USER_SETTINGS_UPDATED", "users", user_id, 
                            f"Settings updated: {updates}")
            
            return True
            
        except Exception as e:
            logger.exception(f"Error updating user settings: {e}")
            return False
