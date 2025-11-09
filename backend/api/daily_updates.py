"""
Daily Updates API endpoints.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Header, Body
from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel
import os
import shutil
import logging
import requests
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from models.database import db
from dependencies import get_current_user
from Nexa.services.services import UnifiedService

router = APIRouter()
logger = logging.getLogger(__name__)
unified_service = UnifiedService()

# Upload directory for daily update files
UPLOAD_DIR = "backend/uploads/daily_updates"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def validate_github_repo(username: str, repo: str) -> bool:
    """Validate if a GitHub repository exists."""
    try:
        url = f"https://api.github.com/repos/{username}/{repo}"
        response = requests.get(url, timeout=5)
        return response.status_code == 200
    except Exception as e:
        logger.error(f"GitHub validation error: {e}")
        return False


def validate_text_content(content: str) -> bool:
    """Validate text content is not empty or just whitespace."""
    return content and content.strip() and len(content.strip()) > 0


class DailyUpdateCreate(BaseModel):
    type: str
    title: str
    date: str
    description: Optional[str] = None
    content: Optional[str] = None
    userId: Optional[str] = None
    # File upload fields
    fileName: Optional[str] = None
    fileSize: Optional[str] = None
    # Recording fields
    recordingDuration: Optional[str] = None
    recordingInterval: Optional[str] = None
    # GitHub fields
    githubUsername: Optional[str] = None
    githubRepo: Optional[str] = None
    githubCommits: Optional[str] = None
    # Transcript fields
    transcriptContent: Optional[str] = None


@router.get("")
async def get_daily_updates(
    date: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """Get daily updates for a specific date or all updates."""
    try:
        # Get current user from auth
        current_user = await get_current_user(authorization)
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        if date:
            cursor.execute(
                """
                SELECT * FROM daily_updates 
                WHERE user_id = ? AND date = ?
                ORDER BY created_at DESC
                """,
                (current_user['id'], date)
            )
        else:
            cursor.execute(
                """
                SELECT * FROM daily_updates 
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 50
                """,
                (current_user['id'],)
            )
        
        updates = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": row[0],
                "userId": row[1],
                "date": row[2],
                "type": row[3],
                "title": row[4],
                "description": row[5],
                "content": row[6],
                "filePath": row[7],
                "createdAt": row[8],
            }
            for row in updates
        ]
    except Exception as e:
        logger.error(f"Failed to fetch daily updates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_daily_update(
    update_data: DailyUpdateCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new daily update."""
    try:
        # Get current user from auth
        current_user = await get_current_user(authorization)
        
        # Validation based on update type - ONLY validate specific required fields
        if update_data.type == "github_update":
            # Validate GitHub repository exists
            if not update_data.githubUsername or not update_data.githubRepo:
                raise HTTPException(
                    status_code=400, 
                    detail="GitHub username and repository are required for GitHub updates"
                )
            
            if not validate_github_repo(update_data.githubUsername, update_data.githubRepo):
                raise HTTPException(
                    status_code=400,
                    detail=f"GitHub repository '{update_data.githubUsername}/{update_data.githubRepo}' not found or is private"
                )
        
        elif update_data.type == "text_note":
            # Validate text content is not empty ONLY for text notes
            if not update_data.content or not validate_text_content(update_data.content):
                raise HTTPException(
                    status_code=400,
                    detail="Text content is required and cannot be empty for text notes"
                )
        
        elif update_data.type == "project_transcript":
            # Validate transcript content
            if not update_data.transcriptContent or not validate_text_content(update_data.transcriptContent):
                raise HTTPException(
                    status_code=400,
                    detail="Transcript content is required and cannot be empty"
                )
        
        # NOTE: file_upload and screen_recording don't require content validation
        
        # Build content from various fields
        content_parts = []
        if update_data.content:
            content_parts.append(update_data.content)
        if update_data.description:
            content_parts.append(f"Description: {update_data.description}")
        if update_data.transcriptContent:
            content_parts.append(f"Transcript: {update_data.transcriptContent}")
        if update_data.githubUsername:
            content_parts.append(f"GitHub: {update_data.githubUsername}")
            if update_data.githubRepo:
                content_parts.append(f"Repo: {update_data.githubRepo}")
            if update_data.githubCommits:
                content_parts.append(f"Commits: {update_data.githubCommits}")
        
        update_content = "\n".join(content_parts) if content_parts else ""
        
        # Insert into database
        created_at = datetime.now().isoformat()
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO daily_updates 
            (user_id, date, type, title, description, content, file_path, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (current_user['id'], update_data.date, update_data.type, update_data.title, 
             update_data.description, update_content, None, created_at)
        )
        conn.commit()
        
        # Get the inserted record
        cursor.execute(
            "SELECT * FROM daily_updates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            (current_user['id'],)
        )
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                "id": result[0],
                "userId": result[1],
                "date": result[2],
                "type": result[3],
                "title": result[4],
                "description": result[5],
                "content": result[6],
                "filePath": result[7],
                "createdAt": result[8],
                "message": "Daily update created successfully"
            }
        
        raise HTTPException(status_code=500, detail="Failed to retrieve created update")
        
    except Exception as e:
        logger.error(f"Failed to create daily update: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{update_id}")
async def delete_daily_update(
    update_id: int,
    authorization: Optional[str] = Header(None)
):
    """Delete a daily update."""
    try:
        # Get current user from auth
        current_user = await get_current_user(authorization)
        
        # Get the update to check ownership and file path
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT user_id, file_path FROM daily_updates WHERE id = ?",
            (update_id,)
        )
        update = cursor.fetchone()
        
        if not update:
            conn.close()
            raise HTTPException(status_code=404, detail="Update not found")
        
        user_id, file_path = update[0], update[1]
        
        # Check ownership
        if user_id != current_user['id']:
            conn.close()
            raise HTTPException(status_code=403, detail="Not authorized to delete this update")
        
        # Delete file if exists
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to delete file {file_path}: {e}")
        
        # Delete from database
        cursor.execute(
            "DELETE FROM daily_updates WHERE id = ?",
            (update_id,)
        )
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Daily update deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete daily update: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-all-to-events")
async def update_all_to_events(
    authorization: Optional[str] = Header(None)
):
    """
    Process ALL daily updates for the current user and convert them to calendar events using LLM.
    This aggregates all updates and extracts tasks, meetings, and events from the combined content.
    """
    try:
        # Get current user from auth
        current_user = await get_current_user(authorization)
        
        # Get ALL daily updates for this user
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            SELECT id, user_id, date, type, title, description, content, created_at
            FROM daily_updates 
            WHERE user_id = ?
            ORDER BY date DESC, created_at DESC
            """,
            (current_user['id'],)
        )
        updates = cursor.fetchall()
        
        if not updates:
            conn.close()
            raise HTTPException(status_code=404, detail="No daily updates found for this user")
        
        # Build aggregated context from ALL updates
        logger.info(f"Processing {len(updates)} updates for user {current_user['id']}")
        
        all_updates_context = []
        for update in updates:
            update_dict = {
                "id": update[0],
                "user_id": update[1],
                "date": update[2],
                "type": update[3],
                "title": update[4],
                "description": update[5],
                "content": update[6],
                "created_at": update[7]
            }
            
            # Build context for this update
            context_parts = [
                f"=== Update from {update_dict['date']} ===",
                f"Type: {update_dict['type']}",
                f"Title: {update_dict['title']}",
            ]
            
            if update_dict['description']:
                context_parts.append(f"Description: {update_dict['description']}")
            
            if update_dict['content']:
                context_parts.append(f"Content: {update_dict['content']}")
            
            all_updates_context.append("\n".join(context_parts))
        
        # Combine all updates into one context
        full_context = f"""
User: {current_user['name']}
Total Updates: {len(updates)}

{chr(10).join(all_updates_context)}
"""
        
        # Create the question for LLM
        question = """
        Based on ALL the daily updates provided above, please extract and generate calendar events.
        
        For each event, provide:
        - title: A clear, concise event title
        - start_time: Start time in HH:MM format (24-hour)
        - end_time: End time in HH:MM format (24-hour)
        - description: Brief description of what this event is about
        - date: The date for this event (YYYY-MM-DD format, use the update date if mentioned)
        - type: One of ('meeting', 'task', 'deadline', 'general')
        - priority: One of ('low', 'medium', 'high', 'urgent')
        
        Return the response as a JSON object with:
        {
            "events": [list of events],
            "summary": "Brief summary of how many events were extracted from how many updates"
        }
        
        If no clear events can be extracted, return an empty events array and explain why in the summary.
        """
        
        # Advanced rule-based event extraction (no LLM needed)
        logger.info(f"Processing {len(updates)} updates to events using smart pattern matching")
        
        import re
        from datetime import datetime, timedelta
        
        events_data = []
        
        for update in updates:
            update_dict = {
                "date": update[2],
                "type": update[3],
                "title": update[4],
                "content": update[6] or ""
            }
            
            full_text = f"{update_dict['title']}\n{update_dict['content']}"
            
            # Extract dates - multiple formats
            date_patterns = [
                r'(?:start date|begin|starts?|from)[\s:]*(?:🕓|🗓️)?[\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})',
                r'(?:end date|deadline|due|until|by)[\s:]*(?:🕔|🗓️)?[\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})',
                r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
                r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
            ]
            
            # Extract times - multiple formats
            time_patterns = [
                r'(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)',
                r'(\d{1,2})\s*(am|pm|AM|PM)',
            ]
            
            # Extract priority
            priority = "medium"
            if re.search(r'priority[\s:]*(?:🔴|high|urgent)', full_text, re.IGNORECASE):
                priority = "high"
            elif re.search(r'priority[\s:]*(?:🟢|low)', full_text, re.IGNORECASE):
                priority = "low"
            
            # Extract status
            status = "pending"
            if re.search(r'status[\s:]*(?:🟢|completed|done)', full_text, re.IGNORECASE):
                status = "completed"
            elif re.search(r'status[\s:]*(?:🟡|in progress|ongoing)', full_text, re.IGNORECASE):
                status = "in_progress"
            
            # Try to find start date
            start_date = None
            start_time = "09:00"
            for pattern in date_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match and 'start' in pattern:
                    try:
                        date_str = match.group(1)
                        # Parse "November 10, 2025" format
                        parsed_date = datetime.strptime(date_str.replace(',', ''), '%B %d %Y')
                        start_date = parsed_date.strftime('%Y-%m-%d')
                        break
                    except:
                        pass
            
            # Try to find start time
            for pattern in time_patterns:
                match = re.search(r'(?:start|begin|from).*?' + pattern, full_text, re.IGNORECASE)
                if match:
                    try:
                        hour = int(match.group(1))
                        minute = int(match.group(2)) if len(match.groups()) > 2 and match.group(2) else 0
                        meridiem = match.group(3 if len(match.groups()) > 2 else 2).lower()
                        
                        if meridiem == 'pm' and hour < 12:
                            hour += 12
                        elif meridiem == 'am' and hour == 12:
                            hour = 0
                        
                        start_time = f"{hour:02d}:{minute:02d}"
                        break
                    except:
                        pass
            
            # Try to find end time
            end_time = "18:00"  # Default 6 PM
            for pattern in time_patterns:
                match = re.search(r'(?:end|deadline|by|until).*?' + pattern, full_text, re.IGNORECASE)
                if match:
                    try:
                        hour = int(match.group(1))
                        minute = int(match.group(2)) if len(match.groups()) > 2 and match.group(2) else 0
                        meridiem = match.group(3 if len(match.groups()) > 2 else 2).lower()
                        
                        if meridiem == 'pm' and hour < 12:
                            hour += 12
                        elif meridiem == 'am' and hour == 12:
                            hour = 0
                        
                        end_time = f"{hour:02d}:{minute:02d}"
                        break
                    except:
                        pass
            
            # If no start date found, use today
            if not start_date:
                start_date = datetime.now().strftime('%Y-%m-%d')
            
            # Create event
            events_data.append({
                "title": update_dict['title'],
                "description": update_dict['content'][:500] if update_dict['content'] else update_dict['title'],
                "start_time": start_time,
                "end_time": end_time,
                "date": start_date,
                "type": "task",
                "priority": priority,
                "status": status
            })
        
        summary = f"Extracted {len(events_data)} detailed events from {len(updates)} daily updates"
        
        # Mock result object to match expected structure
        result = {
            "events": events_data,
            "summary": summary
        }
        
        # Parse result
        if isinstance(result, dict) and 'error' in result:
            raise HTTPException(status_code=500, detail=f"LLM error: {result['error']}")
        
        # Extract events from result
        events_data = []
        summary = ""
        
        if isinstance(result, dict):
            events_data = result.get('events', [])
            summary = result.get('summary', '')
        elif hasattr(result, 'events'):
            events_data = result.events
            summary = getattr(result, 'summary', '')
        
        # Store events in database (tasks table - as they're calendar events)
        created_events = []
        
        for event in events_data:
            event_title = event.get('title') if isinstance(event, dict) else getattr(event, 'title', 'Untitled Event')
            event_desc = event.get('description', '') if isinstance(event, dict) else getattr(event, 'description', '')
            start_time = event.get('start_time', '09:00') if isinstance(event, dict) else getattr(event, 'start_time', '09:00')
            end_time = event.get('end_time', '10:00') if isinstance(event, dict) else getattr(event, 'end_time', '10:00')
            event_date = event.get('date', datetime.now().strftime('%Y-%m-%d')) if isinstance(event, dict) else getattr(event, 'date', datetime.now().strftime('%Y-%m-%d'))
            event_type = event.get('type', 'general') if isinstance(event, dict) else getattr(event, 'type', 'general')
            priority = event.get('priority', 'medium') if isinstance(event, dict) else getattr(event, 'priority', 'medium')
            
            # Calculate duration in hours
            try:
                start_h, start_m = map(int, start_time.split(':'))
                end_h, end_m = map(int, end_time.split(':'))
                duration = ((end_h * 60 + end_m) - (start_h * 60 + start_m)) / 60.0
            except:
                duration = 1.0
            
            # Create full datetime strings for start and end
            start_datetime = f"{event_date}T{start_time}:00"
            end_datetime = f"{event_date}T{end_time}:00"
            
            # Get or create a session for today
            cursor.execute("""
                SELECT id FROM daily_sessions 
                WHERE user_id = ? AND date = date('now')
            """, (current_user['id'],))
            session_row = cursor.fetchone()
            
            if session_row:
                session_id = session_row[0]
            else:
                # Create a new session for today
                cursor.execute("""
                    INSERT INTO daily_sessions (user_id, date, status)
                    VALUES (?, date('now'), 'in_progress')
                """, (current_user['id'],))
                session_id = cursor.lastrowid
            
            # Get default project ID (first project or None)
            cursor.execute("SELECT id FROM projects LIMIT 1")
            project_row = cursor.fetchone()
            project_id = str(project_row[0]) if project_row else None
            
            cursor.execute("""
                INSERT INTO tasks 
                (session_id, user_id, title, description, status, priority, due_date, start_time, end_time, project_id, assignee, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id,
                current_user['id'],
                event_title,
                f"[Auto-generated from Daily Updates]\n{event_desc}\nScheduled: {start_time} - {end_time}",
                'pending',
                priority,
                event_date,
                start_datetime,
                end_datetime,
                project_id,
                current_user['name'],
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
            
            event_id = cursor.lastrowid
            created_events.append({
                "id": event_id,
                "title": event_title,
                "description": event_desc,
                "start_time": start_time,
                "end_time": end_time,
                "type": event_type,
                "priority": priority,
                "date": event_date
            })
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Successfully created {len(created_events)} events from {len(updates)} daily updates",
            "total_updates_processed": len(updates),
            "events_created": len(created_events),
            "events": created_events,
            "summary": summary,
            "llm_response": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to convert all updates to events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

