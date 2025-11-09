"""
Team leader API routes for viewing team member activities.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import date
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.models.schemas import TeamMemberActivity, TeamOverviewResponse, TaskResponse
from backend.models.database import db
from backend.dependencies import get_team_leader

router = APIRouter()


@router.get("/overview", response_model=TeamOverviewResponse)
async def get_team_overview(
    target_date: Optional[date] = None,
    current_user: dict = Depends(get_team_leader)
):
    """Get overview of all team members' activities for a specific date."""
    if target_date is None:
        target_date = date.today()
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Get all employees (non-team leaders)
    cursor.execute("""
        SELECT id, username, name FROM users WHERE role = 'employee'
    """)
    
    employees = cursor.fetchall()
    team_activities = []
    
    for employee in employees:
        emp_dict = dict(employee)
        user_id = emp_dict['id']
        
        # Get session status for the date
        cursor.execute("""
            SELECT status FROM daily_sessions 
            WHERE user_id = ? AND date = ?
        """, (user_id, target_date))
        
        session = cursor.fetchone()
        session_status = dict(session)['status'] if session else 'not_started'
        
        # Count tasks for the date
        cursor.execute("""
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
            FROM tasks 
            WHERE user_id = ? AND due_date = ?
        """, (user_id, target_date))
        
        task_counts = cursor.fetchone()
        task_dict = dict(task_counts)
        
        team_activities.append(TeamMemberActivity(
            user_id=user_id,
            username=emp_dict['username'],
            name=emp_dict['name'],
            date=target_date,
            session_status=session_status,
            tasks_count=task_dict.get('total', 0) or 0,
            completed_tasks=task_dict.get('completed', 0) or 0
        ))
    
    conn.close()
    
    return TeamOverviewResponse(
        team_members=team_activities,
        total_members=len(team_activities),
        date=target_date
    )


@router.get("/member/{user_id}/tasks", response_model=List[TaskResponse])
async def get_member_tasks(
    user_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: dict = Depends(get_team_leader)
):
    """Get tasks for a specific team member."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Verify user is an employee
    cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    
    if not user or dict(user)['role'] != 'employee':
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get tasks
    query = "SELECT * FROM tasks WHERE user_id = ?"
    params = [user_id]
    
    if date_from:
        query += " AND due_date >= ?"
        params.append(date_from)
    
    if date_to:
        query += " AND due_date <= ?"
        params.append(date_to)
    
    query += " ORDER BY due_date DESC, priority DESC"
    
    cursor.execute(query, params)
    tasks = cursor.fetchall()
    conn.close()
    
    return [TaskResponse(**dict(task)) for task in tasks]


@router.get("/member/{user_id}/session/{session_date}")
async def get_member_session(
    user_id: int,
    session_date: date,
    current_user: dict = Depends(get_team_leader)
):
    """Get detailed session information for a team member."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Verify user is an employee
    cursor.execute("SELECT role, name FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    
    if not user or dict(user)['role'] != 'employee':
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get session
    cursor.execute("""
        SELECT * FROM daily_sessions 
        WHERE user_id = ? AND date = ?
    """, (user_id, session_date))
    
    session = cursor.fetchone()
    
    if not session:
        conn.close()
        return {
            "message": "No session found for this date",
            "user_id": user_id,
            "date": session_date
        }
    
    session_dict = dict(session)
    session_id = session_dict['id']
    
    # Get transcripts count
    cursor.execute("SELECT COUNT(*) as count FROM transcripts WHERE session_id = ?", (session_id,))
    transcripts_count = dict(cursor.fetchone())['count']
    
    # Get videos count
    cursor.execute("SELECT COUNT(*) as count FROM videos WHERE session_id = ?", (session_id,))
    videos_count = dict(cursor.fetchone())['count']
    
    # Get screenshots count
    cursor.execute("SELECT COUNT(*) as count FROM screenshots WHERE session_id = ?", (session_id,))
    screenshots_count = dict(cursor.fetchone())['count']
    
    # Get files count
    cursor.execute("SELECT COUNT(*) as count FROM uploaded_files WHERE session_id = ?", (session_id,))
    files_count = dict(cursor.fetchone())['count']
    
    # Get tasks
    cursor.execute("SELECT * FROM tasks WHERE session_id = ?", (session_id,))
    tasks = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "user_name": dict(user)['name'],
        "session": session_dict,
        "uploads": {
            "transcripts": transcripts_count,
            "videos": videos_count,
            "screenshots": screenshots_count,
            "files": files_count
        },
        "tasks": tasks
    }


@router.get("/members")
async def list_team_members(current_user: dict = Depends(get_team_leader)):
    """List all team members (employees)."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, username, name, work_hours, created_at
        FROM users 
        WHERE role = 'employee'
        ORDER BY name
    """)
    
    members = cursor.fetchall()
    conn.close()
    
    return {
        "members": [dict(member) for member in members],
        "total": len(members)
    }


@router.get("/stats/{user_id}")
async def get_member_stats(
    user_id: int,
    current_user: dict = Depends(get_team_leader)
):
    """Get statistics for a team member."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Verify user is an employee
    cursor.execute("SELECT role, name FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    
    if not user or dict(user)['role'] != 'employee':
        raise HTTPException(status_code=404, detail="Employee not found")
    
    user_dict = dict(user)
    
    # Total sessions
    cursor.execute("SELECT COUNT(*) as count FROM daily_sessions WHERE user_id = ?", (user_id,))
    total_sessions = dict(cursor.fetchone())['count']
    
    # Total tasks
    cursor.execute("SELECT COUNT(*) as count FROM tasks WHERE user_id = ?", (user_id,))
    total_tasks = dict(cursor.fetchone())['count']
    
    # Completed tasks
    cursor.execute("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed = 1", (user_id,))
    completed_tasks = dict(cursor.fetchone())['count']
    
    # Tasks by priority
    cursor.execute("""
        SELECT priority, COUNT(*) as count 
        FROM tasks 
        WHERE user_id = ? 
        GROUP BY priority
    """, (user_id,))
    tasks_by_priority = {row[0]: row[1] for row in cursor.fetchall()}
    
    # Recent activity
    cursor.execute("""
        SELECT date, status 
        FROM daily_sessions 
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT 7
    """, (user_id,))
    recent_sessions = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "user_id": user_id,
        "name": user_dict['name'],
        "stats": {
            "total_sessions": total_sessions,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            "tasks_by_priority": tasks_by_priority
        },
        "recent_activity": recent_sessions
    }
