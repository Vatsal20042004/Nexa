"""
Database models and schema for the employee tracking system.
"""
import sqlite3
from datetime import datetime
from typing import Optional, List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)


class Database:
    def __init__(self, db_path: str = "employee_tracker.db"):
        self.db_path = db_path
        self.init_database()

    def get_connection(self):
        """Get a database connection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_database(self):
        """Initialize all database tables."""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Users table (employees and team leaders)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('employee', 'team_leader')),
                work_hours TEXT DEFAULT '09:00-17:00',
                comments TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Daily sessions table (tracks each day's work session)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'submitted', 'processed')),
                github_username TEXT,
                github_repo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                submitted_at TIMESTAMP,
                processed_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(user_id, date)
            )
        """)

        # Transcripts table (uploaded transcript files)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transcripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                content TEXT,
                upload_type TEXT CHECK(upload_type IN ('morning', 'evening', 'general')),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES daily_sessions(id)
            )
        """)

        # Videos table (uploaded video files)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                duration_seconds INTEGER,
                processed BOOLEAN DEFAULT FALSE,
                extracted_text TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES daily_sessions(id)
            )
        """)

        # Screenshots table (automated screenshot captures)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS screenshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                extracted_text TEXT,
                capture_mode TEXT CHECK(capture_mode IN ('manual', 'scheduled')),
                captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES daily_sessions(id)
            )
        """)

        # Screenshot schedules table (active screenshot capture sessions)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS screenshot_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                interval_minutes INTEGER NOT NULL,
                duration_minutes INTEGER NOT NULL,
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'stopped', 'completed')),
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                stopped_at TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES daily_sessions(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Uploaded files table (any additional files)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS uploaded_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT,
                extracted_text TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES daily_sessions(id)
            )
        """)

        # Tasks table (generated from LLM)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
                due_date DATE,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                project_id TEXT,
                assignee TEXT,
                completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES daily_sessions(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Add columns to existing tasks table if they don't exist
        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN start_time TIMESTAMP")
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN end_time TIMESTAMP")
        except sqlite3.OperationalError:
            pass  # Column already exists
            
        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN project_id TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists
            
        try:
            cursor.execute("ALTER TABLE tasks ADD COLUMN assignee TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists

        # Chat messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Audit logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                resource_type TEXT,
                resource_id INTEGER,
                details TEXT,
                ip_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Sessions table (for simple auth tracking)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Projects table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                lead_user_id INTEGER,
                deadline DATE,
                color TEXT DEFAULT '#3B82F6',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_user_id) REFERENCES users(id)
            )
        """)

        # Announcements table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                from_user_id INTEGER NOT NULL,
                type TEXT DEFAULT 'general' CHECK(type IN ('task_assigned', 'general')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (from_user_id) REFERENCES users(id)
            )
        """)

        # Daily updates table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date DATE NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('file_upload', 'screen_recording', 'github_update', 'project_transcript', 'text_note')),
                title TEXT NOT NULL,
                description TEXT,
                content TEXT,
                file_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Team members table (for team leader to manage team)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS team_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_leader_id INTEGER NOT NULL,
                member_user_id INTEGER NOT NULL,
                role TEXT,
                email TEXT,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (team_leader_id) REFERENCES users(id),
                FOREIGN KEY (member_user_id) REFERENCES users(id),
                UNIQUE(team_leader_id, member_user_id)
            )
        """)

        # Team member contexts table (for storing PDFs, meetings, tasks context)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS team_member_contexts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_user_id INTEGER NOT NULL,
                context_type TEXT NOT NULL CHECK(context_type IN ('pdf', 'document', 'meeting', 'task', 'code', 'other')),
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                file_path TEXT,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (member_user_id) REFERENCES users(id)
            )
        """)

        # Timeline charts table (for storing generated timeline charts)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS timeline_charts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_leader_id INTEGER NOT NULL,
                project_name TEXT NOT NULL,
                summary_text TEXT,
                image_path TEXT NOT NULL,
                milestones_data TEXT,
                employee_summaries_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (team_leader_id) REFERENCES users(id)
            )
        """)

        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")

    def log_audit(self, user_id: Optional[int], action: str, resource_type: Optional[str] = None,
                  resource_id: Optional[int] = None, details: Optional[str] = None, ip_address: Optional[str] = None):
        """Log an audit entry."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, action, resource_type, resource_id, details, ip_address))
        conn.commit()
        conn.close()


# Initialize database instance
db = Database()
