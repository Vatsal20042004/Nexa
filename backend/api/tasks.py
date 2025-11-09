"""
Tasks API routes for processing sessions and managing tasks.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import date, datetime, timedelta
import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.models.schemas import *
from backend.models.database import db
from backend.dependencies import get_current_user
from Nexa.services.services import UnifiedService

router = APIRouter()
unified_service = UnifiedService()


def task_row_to_response(task_row) -> dict:
    """Convert database task row to API response format."""
    task_dict = dict(task_row)
    
    # Map status: 'completed' -> 'done' for frontend compatibility
    if task_dict.get('status') == 'completed':
        task_dict['status'] = 'done'
    
    # Ensure start_time and end_time are present
    if not task_dict.get('start_time') and task_dict.get('due_date'):
        # If no start_time, create one from due_date at 9 AM
        task_dict['start_time'] = f"{task_dict['due_date']}T09:00:00"
    
    if not task_dict.get('end_time') and task_dict.get('due_date'):
        # If no end_time, create one from due_date at 5 PM
        task_dict['end_time'] = f"{task_dict['due_date']}T17:00:00"
    
    return task_dict


@router.post("/process-session", response_model=ProcessSessionResponse)
async def process_session_with_llm(
    request: ProcessSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Process a daily session with LLM to generate tasks.
    Combines all data: transcripts, video OCR, screenshots, GitHub activity, files.
    """
    session_id = request.session_id
    
    # Verify session belongs to user
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM daily_sessions 
        WHERE id = ? AND user_id = ?
    """, (session_id, current_user['id']))
    
    session = cursor.fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_dict = dict(session)
    session_date = session_dict['date']
    
    # Collect all context data
    context_parts = [f"Date: {session_date}", f"User: {current_user['name']}"]
    
    # Get transcripts
    cursor.execute("SELECT content, upload_type FROM transcripts WHERE session_id = ?", (session_id,))
    transcripts = cursor.fetchall()
    if transcripts:
        context_parts.append("\n=== TRANSCRIPTS ===")
        for transcript in transcripts:
            t_dict = dict(transcript)
            upload_type = t_dict.get('upload_type', 'general')
            context_parts.append(f"\n[{upload_type.upper()} MEETING]")
            context_parts.append(t_dict.get('content', ''))
    
    # Get video OCR text
    cursor.execute("SELECT extracted_text, filename FROM videos WHERE session_id = ? AND processed = TRUE", (session_id,))
    videos = cursor.fetchall()
    if videos:
        context_parts.append("\n=== VIDEO ANALYSIS ===")
        for video in videos:
            v_dict = dict(video)
            context_parts.append(f"\nVideo: {v_dict.get('filename', 'unknown')}")
            context_parts.append(v_dict.get('extracted_text', ''))
    
    # Get screenshots
    cursor.execute("SELECT extracted_text FROM screenshots WHERE session_id = ?", (session_id,))
    screenshots = cursor.fetchall()
    if screenshots:
        context_parts.append("\n=== SCREENSHOT CAPTURES ===")
        for idx, screenshot in enumerate(screenshots):
            s_dict = dict(screenshot)
            text = s_dict.get('extracted_text', '')
            if text.strip():
                context_parts.append(f"\nScreenshot {idx+1}:")
                context_parts.append(text)
    
    # Get uploaded files
    cursor.execute("SELECT extracted_text, filename FROM uploaded_files WHERE session_id = ?", (session_id,))
    files = cursor.fetchall()
    if files:
        context_parts.append("\n=== UPLOADED FILES ===")
        for file in files:
            f_dict = dict(file)
            if f_dict.get('extracted_text'):
                context_parts.append(f"\nFile: {f_dict.get('filename', 'unknown')}")
                context_parts.append(f_dict['extracted_text'])
    
    # Get GitHub activity if configured
    github_username = session_dict.get('github_username')
    github_repo = session_dict.get('github_repo')
    
    if github_username:
        try:
            context_parts.append("\n=== GITHUB ACTIVITY ===")
            # Fetch GitHub activity for the day
            activity = unified_service.fetch_github_activity(
                username=github_username,
                start_date=session_date,
                end_date=session_date,
                repos=[github_repo] if github_repo else None
            )
            context_parts.append(json.dumps(activity, indent=2))
        except Exception as e:
            context_parts.append(f"[GitHub fetch error: {str(e)}]")
    
    conn.close()
    
    # Combine all context
    full_context = "\n".join(context_parts)
    
    # Add custom instructions if provided
    question = request.custom_instructions or """
    Based on all the data provided (meeting transcripts, video analysis, screenshots, files, and GitHub activity),
    please generate a comprehensive list of tasks for this employee.
    
    For each task, provide:
    - A clear, actionable title
    - Detailed description
    - Priority level (low, medium, high, urgent)
    - Estimated hours to complete
    - Any dependencies
    
    Also provide a brief summary of the day's work and total estimated hours.
    """
    
    # Call LLM agent
    try:
        result = unified_service.run_agentic_query(
            context=full_context,
            question=question
        )
        
        # Parse result - expecting Pydantic model output
        if isinstance(result, dict) and 'error' in result:
            raise HTTPException(status_code=500, detail=f"LLM error: {result['error']}")
        
        # Extract tasks from result
        tasks_data = []
        summary = ""
        
        # Handle different result formats
        if hasattr(result, 'tasks'):
            # Pydantic model
            tasks_data = result.tasks
            summary = getattr(result, 'summary', '')
        elif isinstance(result, dict):
            tasks_data = result.get('tasks', [])
            summary = result.get('summary', '')
        
        # Store tasks in database
        created_tasks = []
        conn = db.get_connection()
        cursor = conn.cursor()
        
        for task_data in tasks_data:
            if hasattr(task_data, 'dict'):
                task_dict = task_data.dict()
            else:
                task_dict = task_data if isinstance(task_data, dict) else {}
            
            title = task_dict.get('title', 'Untitled Task')
            description = task_dict.get('description', '')
            priority = task_dict.get('priority', 'medium')
            
            # Set due date to session date (today)
            cursor.execute("""
                INSERT INTO tasks (session_id, user_id, title, description, priority, due_date, status)
                VALUES (?, ?, ?, ?, ?, ?, 'pending')
            """, (session_id, current_user['id'], title, description, priority, session_date))
            
            task_id = cursor.lastrowid
            
            created_tasks.append(TaskResponse(
                id=task_id,
                title=title,
                description=description,
                priority=priority,
                status='pending',
                due_date=session_date,
                completed=False,
                completed_at=None,
                created_at=datetime.now()
            ))
        
        # Update session status
        cursor.execute("""
            UPDATE daily_sessions 
            SET status = 'processed', processed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (session_id,))
        
        conn.commit()
        conn.close()
        
        db.log_audit(current_user['id'], "SESSION_PROCESSED", "daily_sessions", session_id,
                    f"Generated {len(created_tasks)} tasks from session")
        
        return ProcessSessionResponse(
            success=True,
            message=f"Successfully generated {len(created_tasks)} tasks",
            tasks_generated=len(created_tasks),
            tasks=created_tasks,
            llm_summary=summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task generation failed: {str(e)}")


@router.get("/list", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: dict = Depends(get_current_user)
):
    """List tasks with optional filters."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM tasks WHERE user_id = ?"
    params = [current_user['id']]
    
    if status:
        query += " AND status = ?"
        params.append(status.value)
    
    if priority:
        query += " AND priority = ?"
        params.append(priority.value)
    
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
    
    return [TaskResponse(**task_row_to_response(task)) for task in tasks]


@router.get("/today", response_model=List[TaskResponse])
async def get_today_tasks(current_user: dict = Depends(get_current_user)):
    """Get tasks for today."""
    today = date.today()
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM tasks 
        WHERE user_id = ? AND (due_date = ? OR date(start_time) = ?)
        ORDER BY priority DESC, created_at ASC
    """, (current_user['id'], today, today))
    
    tasks = cursor.fetchall()
    conn.close()
    
    return [TaskResponse(**task_row_to_response(task)) for task in tasks]


@router.get("/calendar", response_model=CalendarResponse)
async def get_calendar_view(
    view: CalendarView,
    target_date: date,
    current_user: dict = Depends(get_current_user)
):
    """Get tasks in calendar view (day/week/month)."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    if view == CalendarView.DAY:
        start_date = target_date
        end_date = target_date
    elif view == CalendarView.WEEK:
        # Get week start (Monday)
        start_date = target_date - timedelta(days=target_date.weekday())
        end_date = start_date + timedelta(days=6)
    else:  # MONTH
        # Get month start and end
        start_date = target_date.replace(day=1)
        if target_date.month == 12:
            end_date = target_date.replace(year=target_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = target_date.replace(month=target_date.month + 1, day=1) - timedelta(days=1)
    
    cursor.execute("""
        SELECT * FROM tasks 
        WHERE user_id = ? AND due_date >= ? AND due_date <= ?
        ORDER BY due_date ASC, priority DESC
    """, (current_user['id'], start_date, end_date))
    
    tasks = cursor.fetchall()
    conn.close()
    
    return CalendarResponse(
        view=view.value,
        start_date=start_date,
        end_date=end_date,
        tasks=[TaskResponse(**task_row_to_response(task)) for task in tasks]
    )


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    update_data: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a task."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Verify task belongs to user
    cursor.execute("SELECT * FROM tasks WHERE id = ? AND user_id = ?", (task_id, current_user['id']))
    task = cursor.fetchone()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Build update query
    updates = []
    params = []
    
    if update_data.title is not None:
        updates.append("title = ?")
        params.append(update_data.title)
    
    if update_data.description is not None:
        updates.append("description = ?")
        params.append(update_data.description)
    
    if update_data.priority is not None:
        updates.append("priority = ?")
        params.append(update_data.priority.value)
    
    if update_data.status is not None:
        updates.append("status = ?")
        params.append(update_data.status.value)
    
    if update_data.completed is not None:
        updates.append("completed = ?")
        params.append(update_data.completed)
        if update_data.completed:
            updates.append("completed_at = CURRENT_TIMESTAMP")
        else:
            updates.append("completed_at = NULL")
    
    if update_data.due_date is not None:
        updates.append("due_date = ?")
        params.append(update_data.due_date)
    
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(task_id)
        
        query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()
    
    # Get updated task
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    updated_task = cursor.fetchone()
    conn.close()
    
    db.log_audit(current_user['id'], "TASK_UPDATED", "tasks", task_id, f"Task updated")
    
    return TaskResponse(**dict(updated_task))


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a task."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, current_user['id']))
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    conn.commit()
    conn.close()
    
    db.log_audit(current_user['id'], "TASK_DELETED", "tasks", task_id, "Task deleted")
    
    return {"success": True, "message": "Task deleted"}
