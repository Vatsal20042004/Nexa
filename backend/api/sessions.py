"""
Daily session API routes for handling uploads and data submission.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from typing import Optional, List
from datetime import date, datetime
import os
import shutil
import sys

# Add parent paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.models.schemas import *
from backend.models.database import db
from backend.services.video_processor import VideoProcessor, get_video_duration
from backend.dependencies import get_current_user
from Nexa.services.services import UnifiedService

router = APIRouter()
video_processor = VideoProcessor()
unified_service = UnifiedService()


def get_or_create_daily_session(user_id: int, session_date: date) -> int:
    """Get existing or create new daily session for user and date."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Check if session exists
    cursor.execute("""
        SELECT id FROM daily_sessions 
        WHERE user_id = ? AND date = ?
    """, (user_id, session_date))
    
    row = cursor.fetchone()
    if row:
        session_id = row[0]
    else:
        # Create new session
        cursor.execute("""
            INSERT INTO daily_sessions (user_id, date, status)
            VALUES (?, ?, 'in_progress')
        """, (user_id, session_date))
        session_id = cursor.lastrowid
        conn.commit()
        
        db.log_audit(user_id, "SESSION_CREATED", "daily_sessions", session_id,
                    f"Daily session created for {session_date}")
    
    conn.close()
    return session_id


@router.post("/create")
async def create_daily_session(
    session_data: DailySessionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create or get daily session for a specific date."""
    session_id = get_or_create_daily_session(current_user['id'], session_data.date)
    
    # Update GitHub info if provided
    if session_data.github_username or session_data.github_repo:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE daily_sessions 
            SET github_username = ?, github_repo = ?
            WHERE id = ?
        """, (session_data.github_username, session_data.github_repo, session_id))
        conn.commit()
        conn.close()
    
    return {"session_id": session_id, "date": session_data.date, "status": "in_progress"}


@router.post("/upload-transcript")
async def upload_transcript(
    session_date: date = Form(...),
    upload_type: Optional[UploadType] = Form(UploadType.GENERAL),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload transcript file (meeting notes, etc.)."""
    session_id = get_or_create_daily_session(current_user['id'], session_date)
    
    # Save file
    file_path = f"backend/uploads/transcripts/{current_user['id']}_{session_date}_{file.filename}"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Extract text content
    try:
        content = unified_service.extract_from_file(file_path)
    except Exception as e:
        content = f"[Error extracting content: {str(e)}]"
    
    # Store in database
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO transcripts (session_id, filename, file_path, content, upload_type)
        VALUES (?, ?, ?, ?, ?)
    """, (session_id, file.filename, file_path, content, upload_type.value))
    transcript_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    db.log_audit(current_user['id'], "TRANSCRIPT_UPLOADED", "transcripts", transcript_id,
                f"Uploaded transcript: {file.filename}")
    
    return TranscriptUploadResponse(
        id=transcript_id,
        filename=file.filename,
        upload_type=upload_type.value,
        content_preview=content[:200] + "..." if len(content) > 200 else content,
        uploaded_at=datetime.now()
    )


@router.post("/upload-video")
async def upload_video(
    session_date: date = Form(...),
    interval_seconds: int = Form(30),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload video file and extract frames with OCR."""
    session_id = get_or_create_daily_session(current_user['id'], session_date)
    
    # Save video file
    file_path = f"backend/uploads/videos/{current_user['id']}_{session_date}_{file.filename}"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Get video duration
    duration = get_video_duration(file_path)
    
    # Store in database (mark as not processed yet)
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO videos (session_id, filename, file_path, duration_seconds, processed)
        VALUES (?, ?, ?, ?, FALSE)
    """, (session_id, file.filename, file_path, int(duration)))
    video_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Process video in background
    output_dir = f"backend/uploads/video_frames/{video_id}"
    result = video_processor.process_video_with_ocr(file_path, output_dir, interval_seconds, store=True)
    
    # Update with extracted text
    if 'combined_text' in result:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE videos 
            SET extracted_text = ?, processed = TRUE, processed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (result['combined_text'], video_id))
        conn.commit()
        conn.close()
    
    db.log_audit(current_user['id'], "VIDEO_UPLOADED", "videos", video_id,
                f"Uploaded and processed video: {file.filename}")
    
    return VideoUploadResponse(
        id=video_id,
        filename=file.filename,
        duration_seconds=duration,
        uploaded_at=datetime.now()
    )


@router.post("/start-screenshot-schedule")
async def start_screenshot_schedule(
    session_date: date = Form(...),
    schedule: ScreenshotScheduleCreate = Depends(),
    current_user: dict = Depends(get_current_user)
):
    """Start automated screenshot capture schedule."""
    session_id = get_or_create_daily_session(current_user['id'], session_date)
    
    # Create schedule record
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO screenshot_schedules 
        (session_id, user_id, interval_minutes, duration_minutes, status)
        VALUES (?, ?, ?, ?, 'active')
    """, (session_id, current_user['id'], schedule.interval_minutes, schedule.duration_minutes))
    schedule_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    db.log_audit(current_user['id'], "SCREENSHOT_SCHEDULE_STARTED", "screenshot_schedules", schedule_id,
                f"Started screenshot capture: {schedule.interval_minutes}min interval for {schedule.duration_minutes}min")
    
    return {
        "schedule_id": schedule_id,
        "status": "active",
        "message": f"Screenshot capture started: every {schedule.interval_minutes} minutes for {schedule.duration_minutes} minutes"
    }


@router.post("/capture-screenshot")
async def capture_screenshot(
    session_date: date = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Manually capture a single screenshot."""
    session_id = get_or_create_daily_session(current_user['id'], session_date)
    
    # Capture screenshot using unified service
    result = unified_service.capture_and_process_screen(store=False)
    
    if 'error' in result:
        raise HTTPException(status_code=500, detail=result['error'])
    
    # Save screenshot
    screenshot_path = f"backend/uploads/screenshots/{current_user['id']}_{session_date}_{datetime.now().strftime('%H%M%S')}.png"
    if result.get('image_path'):
        shutil.move(result['image_path'], screenshot_path)
    
    # Store in database
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO screenshots (session_id, file_path, extracted_text, capture_mode)
        VALUES (?, ?, ?, 'manual')
    """, (session_id, screenshot_path, result.get('text', '')))
    screenshot_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    db.log_audit(current_user['id'], "SCREENSHOT_CAPTURED", "screenshots", screenshot_id,
                "Manual screenshot captured")
    
    return {
        "screenshot_id": screenshot_id,
        "text_preview": result.get('text', '')[:200],
        "captured_at": datetime.now()
    }


@router.post("/stop-screenshot-schedule/{schedule_id}")
async def stop_screenshot_schedule(
    schedule_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Stop an active screenshot schedule."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE screenshot_schedules 
        SET status = 'stopped', stopped_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    """, (schedule_id, current_user['id']))
    
    conn.commit()
    conn.close()
    
    db.log_audit(current_user['id'], "SCREENSHOT_SCHEDULE_STOPPED", "screenshot_schedules", schedule_id,
                "Screenshot schedule stopped")
    
    return {"success": True, "message": "Screenshot schedule stopped"}


@router.post("/upload-file")
async def upload_file(
    session_date: date = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload any additional file."""
    session_id = get_or_create_daily_session(current_user['id'], session_date)
    
    # Save file
    file_ext = os.path.splitext(file.filename)[1].lower()
    file_path = f"backend/uploads/files/{current_user['id']}_{session_date}_{file.filename}"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Try to extract text
    extracted_text = ""
    try:
        extracted_text = unified_service.extract_from_file(file_path)
    except:
        pass
    
    # Store in database
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO uploaded_files (session_id, filename, file_path, file_type, extracted_text)
        VALUES (?, ?, ?, ?, ?)
    """, (session_id, file.filename, file_path, file_ext, extracted_text))
    file_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    db.log_audit(current_user['id'], "FILE_UPLOADED", "uploaded_files", file_id,
                f"Uploaded file: {file.filename}")
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "uploaded_at": datetime.now()
    }


@router.get("/session/{session_date}")
async def get_session_details(
    session_date: date,
    current_user: dict = Depends(get_current_user)
):
    """Get details of a daily session including all uploads."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Get session
    cursor.execute("""
        SELECT * FROM daily_sessions 
        WHERE user_id = ? AND date = ?
    """, (current_user['id'], session_date))
    session = cursor.fetchone()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_dict = dict(session)
    session_id = session_dict['id']
    
    # Get transcripts
    cursor.execute("SELECT * FROM transcripts WHERE session_id = ?", (session_id,))
    transcripts = [dict(row) for row in cursor.fetchall()]
    
    # Get videos
    cursor.execute("SELECT * FROM videos WHERE session_id = ?", (session_id,))
    videos = [dict(row) for row in cursor.fetchall()]
    
    # Get screenshots
    cursor.execute("SELECT * FROM screenshots WHERE session_id = ?", (session_id,))
    screenshots = [dict(row) for row in cursor.fetchall()]
    
    # Get files
    cursor.execute("SELECT * FROM uploaded_files WHERE session_id = ?", (session_id,))
    files = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "session": session_dict,
        "transcripts": transcripts,
        "videos": videos,
        "screenshots": screenshots,
        "files": files
    }


@router.post("/submit/{session_date}")
async def submit_daily_session(
    session_date: date,
    current_user: dict = Depends(get_current_user)
):
    """Mark daily session as submitted and ready for processing."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE daily_sessions 
        SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND date = ?
    """, (current_user['id'], session_date))
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    conn.commit()
    conn.close()
    
    db.log_audit(current_user['id'], "SESSION_SUBMITTED", "daily_sessions", None,
                f"Daily session submitted for {session_date}")
    
    return {
        "success": True,
        "message": "Session submitted successfully",
        "date": session_date
    }
