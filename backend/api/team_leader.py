"""
Team Leader API routes for dashboard, chat, and timeline chart features.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, date
import sys
import os
import json
import base64
import uuid
import traceback

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.models.schemas import (
    TeamMemberCreate, TeamMemberResponse, TeamMemberContextCreate,
    TeamLeaderChatRequest, TeamLeaderChatResponse,
    TimelineChartRequest, TimelineChartResponse, Milestone, EmployeeSummary
)
from backend.models.database import db
from backend.dependencies import get_team_leader, get_current_user

# Initialize Nexa UnifiedService
# Add parent directory to path so we can import Nexa as a package
parent_dir = os.path.join(os.path.dirname(__file__), '../..')
sys.path.insert(0, parent_dir)

try:
    from Nexa.services.services import UnifiedService
    unified_service = UnifiedService()
except ImportError as e:
    print(f"Warning: Could not import UnifiedService: {e}")
    unified_service = None

# Gemini API configuration - use Gemini instead of Ollama
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API_KEY = os.environ.get("GOOGLE_API_KEY", "AIzaSyDv1IIfdNbpy9C1cCFYEYmejjjgI2bbvQg")

router = APIRouter()


# ============= Team Member Management =============

@router.get("/members", response_model=List[TeamMemberResponse])
async def get_team_members(current_user: dict = Depends(get_team_leader)):
    """Get all team members for the current team leader."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT tm.id, tm.team_leader_id, tm.member_user_id, tm.role, tm.email, tm.added_at,
               u.name, u.username
        FROM team_members tm
        JOIN users u ON tm.member_user_id = u.id
        WHERE tm.team_leader_id = ?
        ORDER BY tm.added_at DESC
    """, (current_user['id'],))
    
    members = cursor.fetchall()
    conn.close()
    
    return [TeamMemberResponse(
        id=dict(m)['id'],
        team_leader_id=dict(m)['team_leader_id'],
        member_user_id=dict(m)['member_user_id'],
        name=dict(m)['name'],
        username=dict(m)['username'],
        role=dict(m)['role'],
        email=dict(m)['email'],
        added_at=dict(m)['added_at']
    ) for m in members]


@router.post("/members", response_model=TeamMemberResponse)
async def add_team_member(
    member: TeamMemberCreate,
    current_user: dict = Depends(get_team_leader)
):
    """Add a new team member."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id, name, username FROM users WHERE id = ?", (member.member_user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    user_dict = dict(user)
    
    try:
        cursor.execute("""
            INSERT INTO team_members (team_leader_id, member_user_id, role, email)
            VALUES (?, ?, ?, ?)
        """, (current_user['id'], member.member_user_id, member.role, member.email))
        
        member_id = cursor.lastrowid
        conn.commit()
        
        response = TeamMemberResponse(
            id=member_id,
            team_leader_id=current_user['id'],
            member_user_id=member.member_user_id,
            name=user_dict['name'],
            username=user_dict['username'],
            role=member.role,
            email=member.email,
            added_at=datetime.now()
        )
        
        conn.close()
        return response
        
    except Exception as e:
        conn.close()
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail="Team member already added")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/members/{member_id}")
async def remove_team_member(
    member_id: int,
    current_user: dict = Depends(get_team_leader)
):
    """Remove a team member."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        DELETE FROM team_members 
        WHERE id = ? AND team_leader_id = ?
    """, (member_id, current_user['id']))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Team member not found")
    
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Team member removed"}


@router.get("/dashboard")
async def get_team_dashboard(current_user: dict = Depends(get_team_leader)):
    """Get team dashboard overview."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Get team members with their stats
    cursor.execute("""
        SELECT tm.member_user_id, u.name, u.username, u.role as user_role, tm.role as team_role
        FROM team_members tm
        JOIN users u ON tm.member_user_id = u.id
        WHERE tm.team_leader_id = ?
    """, (current_user['id'],))
    
    members = cursor.fetchall()
    dashboard_data = []
    
    for member in members:
        member_dict = dict(member)
        user_id = member_dict['member_user_id']
        
        # Get task stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks
            FROM tasks
            WHERE user_id = ?
        """, (user_id,))
        
        task_stats = dict(cursor.fetchone())
        
        # Get recent activity
        cursor.execute("""
            SELECT date, status
            FROM daily_sessions
            WHERE user_id = ?
            ORDER BY date DESC
            LIMIT 7
        """, (user_id,))
        
        recent_sessions = [dict(s) for s in cursor.fetchall()]
        
        dashboard_data.append({
            "user_id": user_id,
            "name": member_dict['name'],
            "username": member_dict['username'],
            "role": member_dict['team_role'] or member_dict['user_role'],
            "total_tasks": task_stats['total_tasks'] or 0,
            "completed_tasks": task_stats['completed_tasks'] or 0,
            "in_progress_tasks": task_stats['in_progress_tasks'] or 0,
            "recent_sessions": recent_sessions
        })
    
    conn.close()
    
    return {
        "team_members": dashboard_data,
        "total_members": len(dashboard_data)
    }


# ============= Team Leader Chat =============

@router.post("/chat", response_model=TeamLeaderChatResponse)
async def team_leader_chat(
    request: TeamLeaderChatRequest,
    current_user: dict = Depends(get_team_leader)
):
    """Handle team leader chat with AI assistant."""
    if not unified_service:
        raise HTTPException(status_code=500, detail="AI service not available")
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Get ALL team members for this team leader
    cursor.execute("""
        SELECT tm.member_user_id, u.name, u.username, u.role, u.work_hours, u.comments
        FROM team_members tm
        JOIN users u ON tm.member_user_id = u.id
        WHERE tm.team_leader_id = ?
        ORDER BY u.name
    """, (current_user['id'],))
    
    all_members = cursor.fetchall()
    
    # Build comprehensive context
    context_parts = []
    context_parts.append("# TEAM OVERVIEW")
    context_parts.append(f"Total Team Members: {len(all_members)}")
    context_parts.append("")
    
    # Process each team member
    for member_row in all_members:
        member = dict(member_row)
        member_id = member['member_user_id']
        
        # Check if this member is specifically mentioned
        is_mentioned = member_id in (request.mentioned_members or [])
        
        context_parts.append(f"\n{'='*60}")
        context_parts.append(f"## Team Member: {member['name']} (@{member['username']})")
        if is_mentioned:
            context_parts.append("**[MENTIONED IN CURRENT QUERY]**")
        context_parts.append(f"Role: {member['role']}")
        context_parts.append(f"Work Hours: {member['work_hours']}")
        if member['comments']:
            context_parts.append(f"Notes: {member['comments']}")
        
        # Get tasks
        cursor.execute("""
            SELECT title, description, status, priority, due_date, created_at
            FROM tasks
            WHERE user_id = ?
            ORDER BY 
                CASE status 
                    WHEN 'in_progress' THEN 1
                    WHEN 'pending' THEN 2
                    WHEN 'completed' THEN 3
                    ELSE 4
                END,
                due_date ASC
            LIMIT 15
        """, (member_id,))
        
        tasks = cursor.fetchall()
        if tasks:
            context_parts.append("\n### Tasks:")
            
            # Group by status
            pending_tasks = []
            in_progress_tasks = []
            completed_tasks = []
            
            for task in tasks:
                task_dict = dict(task)
                task_line = (
                    f"- [{task_dict['status'].upper()}] {task_dict['title']} "
                    f"(Priority: {task_dict['priority']}, Due: {task_dict['due_date']})"
                )
                if task_dict.get('description'):
                    task_line += f"\n  Description: {task_dict['description'][:200]}"
                
                if task_dict['status'] == 'in_progress':
                    in_progress_tasks.append(task_line)
                elif task_dict['status'] == 'pending':
                    pending_tasks.append(task_line)
                elif task_dict['status'] == 'completed':
                    completed_tasks.append(task_line)
            
            if in_progress_tasks:
                context_parts.append("\n#### In Progress:")
                context_parts.extend(in_progress_tasks)
            
            if pending_tasks:
                context_parts.append("\n#### Pending:")
                context_parts.extend(pending_tasks)
            
            if completed_tasks:
                context_parts.append("\n#### Recently Completed:")
                context_parts.extend(completed_tasks[:5])  # Limit completed tasks
        else:
            context_parts.append("\n### Tasks: No tasks found")
        
        # Get daily sessions
        cursor.execute("""
            SELECT date, status, github_username, github_repo, submitted_at
            FROM daily_sessions
            WHERE user_id = ?
            ORDER BY date DESC
            LIMIT 7
        """, (member_id,))
        
        sessions = cursor.fetchall()
        if sessions:
            context_parts.append("\n### Recent Work Sessions:")
            for session in sessions:
                session_dict = dict(session)
                session_line = f"- {session_dict['date']}: {session_dict['status'].upper()}"
                if session_dict.get('github_username'):
                    session_line += f" (GitHub: {session_dict['github_username']}"
                    if session_dict.get('github_repo'):
                        session_line += f"/{session_dict['github_repo']}"
                    session_line += ")"
                if session_dict.get('submitted_at'):
                    session_line += f" [Submitted: {session_dict['submitted_at']}]"
                context_parts.append(session_line)
        
        # Get uploaded files/transcripts for recent sessions
        cursor.execute("""
            SELECT ds.date, t.filename, t.upload_type, t.content
            FROM transcripts t
            JOIN daily_sessions ds ON t.session_id = ds.id
            WHERE ds.user_id = ?
            ORDER BY t.uploaded_at DESC
            LIMIT 5
        """, (member_id,))
        
        transcripts = cursor.fetchall()
        if transcripts:
            context_parts.append("\n### Recent Transcripts/Documents:")
            for transcript in transcripts:
                trans_dict = dict(transcript)
                trans_line = f"- {trans_dict['date']}: {trans_dict['filename']} ({trans_dict.get('upload_type', 'general')})"
                if trans_dict.get('content'):
                    # Show preview of content
                    content_preview = trans_dict['content'][:300].replace('\n', ' ')
                    trans_line += f"\n  Preview: {content_preview}..."
                context_parts.append(trans_line)
        
        # Get additional contexts (PDFs, meetings, etc.) if mentioned
        if is_mentioned:
            cursor.execute("""
                SELECT context_type, title, content, created_at
                FROM team_member_contexts
                WHERE member_user_id = ?
                ORDER BY created_at DESC
                LIMIT 5
            """, (member_id,))
            
            contexts = cursor.fetchall()
            if contexts:
                context_parts.append("\n### Additional Context (Documents/Notes):")
                for ctx in contexts:
                    ctx_dict = dict(ctx)
                    ctx_line = f"- [{ctx_dict['context_type']}] {ctx_dict['title']} ({ctx_dict['created_at']})"
                    if ctx_dict.get('content'):
                        # Limit content preview
                        content_preview = ctx_dict['content'][:500].replace('\n', ' ')
                        ctx_line += f"\n  {content_preview}..."
                    context_parts.append(ctx_line)
    
    # Add team-wide statistics
    context_parts.append(f"\n{'='*60}")
    context_parts.append("# TEAM STATISTICS")
    
    cursor.execute("""
        SELECT 
            COUNT(DISTINCT t.id) as total_tasks,
            SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
            SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
            SUM(CASE WHEN t.priority = 'urgent' THEN 1 ELSE 0 END) as urgent_tasks
        FROM tasks t
        JOIN team_members tm ON t.user_id = tm.member_user_id
        WHERE tm.team_leader_id = ?
    """, (current_user['id'],))
    
    stats = dict(cursor.fetchone())
    context_parts.append(f"Total Tasks: {stats['total_tasks']}")
    context_parts.append(f"Completed: {stats['completed_tasks']}")
    context_parts.append(f"In Progress: {stats['in_progress_tasks']}")
    context_parts.append(f"Pending: {stats['pending_tasks']}")
    context_parts.append(f"Urgent: {stats['urgent_tasks']}")
    
    context = "\n".join(context_parts)
    
    # Get session ID or create new one
    session_id = request.session_id or f"tl_chat_{current_user['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Read system instruction
    system_instruction_path = os.path.join(
        os.path.dirname(__file__),
        '../../Nexa/services/llm/assets/system_instructions_team_leader.md'
    )
    
    try:
        with open(system_instruction_path, 'r', encoding='utf-8') as f:
            system_instruction = f.read()
    except:
        system_instruction = "You are a helpful team leader assistant."
    
    # Use UnifiedService chat method with Gemini
    try:
        # Combine system instruction with context
        full_context = f"{system_instruction}\n\n## Current Team Context:\n{context}"
        
        response = unified_service.chat(
            session_id=session_id,
            user_message=request.message,
            system_prompt_file=None,  # We'll pass the prompt directly
            model_name=GEMINI_MODEL,
            api_key=GEMINI_API_KEY,
            history_limit=20
        )
        
        # Store chat message in database
        cursor.execute("""
            INSERT INTO chat_messages (user_id, session_id, role, message)
            VALUES (?, ?, 'user', ?)
        """, (current_user['id'], session_id, request.message))
        
        cursor.execute("""
            INSERT INTO chat_messages (user_id, session_id, role, message)
            VALUES (?, ?, 'assistant', ?)
        """, (current_user['id'], session_id, response))
        
        conn.commit()
        conn.close()
        
        return TeamLeaderChatResponse(
            response=response,
            session_id=session_id,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


# ============= Timeline Chart Generation =============

@router.post("/timeline/upload-documents")
async def upload_timeline_documents(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_team_leader)
):
    """Upload documents for timeline chart generation."""
    upload_dir = "backend/uploads/timeline_docs"
    os.makedirs(upload_dir, exist_ok=True)
    
    uploaded_files = []
    
    for file in files:
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{current_user['id']}_{timestamp}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Extract text if possible
        extracted_text = ""
        if unified_service:
            try:
                extracted_text = unified_service.extract_from_file(file_path)
            except:
                pass
        
        uploaded_files.append({
            "filename": file.filename,
            "path": file_path,
            "extracted_text": extracted_text[:500] if extracted_text else ""
        })
    
    return {
        "success": True,
        "files": uploaded_files
    }


@router.post("/timeline/generate", response_model=TimelineChartResponse)
async def generate_timeline_chart(
    project_name: str = Form(...),
    selected_member_ids: str = Form(...),  # JSON array as string
    text_input: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    current_user: dict = Depends(get_team_leader)
):
    """Generate timeline chart from documents and member data."""
    if not unified_service:
        raise HTTPException(status_code=500, detail="AI service not available")
    
    # Parse selected members
    try:
        member_ids = json.loads(selected_member_ids)
    except:
        member_ids = []
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Collect document content
    document_contents = []
    
    # Add text input
    if text_input:
        document_contents.append(f"## Text Input\n{text_input}")
    
    # Process uploaded files
    if files:
        upload_dir = "backend/uploads/timeline_docs"
        os.makedirs(upload_dir, exist_ok=True)
        
        for file in files:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{current_user['id']}_{timestamp}_{file.filename}"
            file_path = os.path.join(upload_dir, filename)
            
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Extract text
            try:
                extracted_text = unified_service.extract_from_file(file_path)
                document_contents.append(f"## Document: {file.filename}\n{extracted_text}")
            except Exception as e:
                document_contents.append(f"## Document: {file.filename}\n[Could not extract text: {str(e)}]")
    
    # Get member information
    member_data = []
    for member_id in member_ids:
        cursor.execute("""
            SELECT u.name, u.username, u.role
            FROM users u
            WHERE u.id = ?
        """, (member_id,))
        
        member = cursor.fetchone()
        if member:
            member_dict = dict(member)
            member_data.append({
                "name": member_dict['name'],
                "role": member_dict['role']
            })
    
    # Combine all content
    full_context = "\n\n".join(document_contents)
    full_context += "\n\n## Team Members:\n"
    full_context += json.dumps(member_data, indent=2)
    
    # Read system instruction for timeline
    system_instruction_path = os.path.join(
        os.path.dirname(__file__),
        '../../Nexa/services/llm/assets/system_instructions_timeLine.md'
    )
    
    try:
        with open(system_instruction_path, 'r', encoding='utf-8') as f:
            system_instruction = f.read()
    except:
        system_instruction = "Generate a timeline chart with milestones and employee summaries."
    
    # Create prompt for timeline generation with structured output
    prompt = f"""Based on the following project documents and team member information, generate:

1. A structured analysis with:
   - Project milestones with dates, assignments, and status
   - Employee summaries with strengths, weaknesses, and critical comments

2. Python code using matplotlib to create a professional timeline chart showing the milestones

## Documents and Context:
{full_context}

Output Format:
First, provide the structured data in JSON format matching this schema:
{{
    "project_name": "string",
    "milestones": [
        {{
            "title": "string",
            "due_date": "YYYY-MM-DD",
            "assigned_to": "string",
            "status": "string",
            "critical_comment": "string or null"
        }}
    ],
    "employee_summaries": [
        {{
            "name": "string",
            "role": "string",
            "strengths": ["string"],
            "weaknesses": ["string"],
            "critical_comment": "string or null",
            "last_milestone": "string or null",
            "comments": "string or null"
        }}
    ]
}}

Then, provide Python code to generate a matplotlib timeline chart. The code should:
- Import matplotlib.pyplot as plt and matplotlib.dates as mdates
- Create a professional-looking Gantt-style timeline
- Use colors to distinguish between completed, in-progress, and pending tasks
- Include milestone markers and employee names
- Save the chart as 'image.png'

Wrap the Python code in ```python ``` code blocks.
"""
    
    try:
        # Use Gemini to get the response with structured data and code
        session_id = f"timeline_{current_user['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Import LLM utilities
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
        from Nexa.services.llm.agent_logic import get_llm
        from langchain_core.prompts import ChatPromptTemplate
        
        # Create LLM instance
        llm = get_llm(model_name=GEMINI_MODEL, api_key=GEMINI_API_KEY)
        
        # Get response from Gemini
        response = llm.invoke(prompt)
        
        # Extract content
        if hasattr(response, "content"):
            response_text = response.content if not callable(response.content) else response.content()
        else:
            response_text = str(response)
        
        print(f"Timeline generation response received: {len(response_text)} chars")
        
        # Extract JSON data
        milestones = []
        employee_summaries = []
        
        # Try to parse JSON from response
        try:
            # Find JSON block
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                structured_data = json.loads(json_str)
                milestones = structured_data.get('milestones', [])
                employee_summaries = structured_data.get('employee_summaries', [])
                print(f"Parsed {len(milestones)} milestones and {len(employee_summaries)} employee summaries")
        except Exception as e:
            print(f"Error parsing JSON from response: {e}")
            print(f"Response text: {response_text[:500]}...")
        
        # Extract and execute Python code
        image_path = None
        if "```python" in response_text:
            try:
                # Extract Python code
                code_start = response_text.find("```python") + 9
                code_end = response_text.find("```", code_start)
                python_code = response_text[code_start:code_end].strip()
                
                print(f"Extracted Python code: {len(python_code)} chars")
                
                # Create output directory
                output_dir = "backend/uploads/timeline_charts"
                os.makedirs(output_dir, exist_ok=True)
                
                # Generate unique filename
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                image_filename = f"timeline_{current_user['id']}_{timestamp}.png"
                image_path = os.path.join(output_dir, image_filename)
                
                # Replace image.png with actual path
                python_code = python_code.replace("'image.png'", f"'{image_path}'")
                python_code = python_code.replace('"image.png"', f'"{image_path}"')
                python_code = python_code.replace("image.png", image_path)
                
                # Ensure matplotlib is imported and use Agg backend
                if "import matplotlib" not in python_code:
                    python_code = "import matplotlib\nmatplotlib.use('Agg')\nimport matplotlib.pyplot as plt\nimport matplotlib.dates as mdates\nfrom datetime import datetime, date\n" + python_code
                else:
                    python_code = "import matplotlib\nmatplotlib.use('Agg')\n" + python_code
                
                print(f"Executing Python code to generate chart...")
                
                # Execute the code in a clean namespace
                exec_globals = {}
                exec(python_code, exec_globals)
                
                # Verify image was created
                if os.path.exists(image_path):
                    print(f"Timeline chart generated successfully: {image_path}")
                else:
                    print(f"Warning: Image file not found after execution: {image_path}")
                    image_path = None
                    
            except Exception as e:
                print(f"Error executing Python code: {e}")
                print(f"Traceback: {traceback.format_exc()}")
                image_path = None
        else:
            print("No Python code found in response")
        
        # Store in database
        cursor.execute("""
            INSERT INTO timeline_charts (team_leader_id, project_name, summary_text, image_path, milestones_data, employee_summaries_data)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            current_user['id'],
            project_name,
            response_text,
            image_path or "",
            json.dumps(milestones),
            json.dumps(employee_summaries)
        ))
        
        chart_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Encode image as base64 if exists
        image_base64 = None
        if image_path and os.path.exists(image_path):
            with open(image_path, "rb") as img_file:
                image_base64 = base64.b64encode(img_file.read()).decode()
        
        return TimelineChartResponse(
            project_name=project_name,
            image_path=image_path or "",
            image_base64=image_base64,
            summary_text=response,
            milestones=milestones,
            employee_summaries=employee_summaries,
            created_at=datetime.now()
        )
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Timeline generation error: {str(e)}")


@router.get("/timeline/charts")
async def get_timeline_charts(current_user: dict = Depends(get_team_leader)):
    """Get all timeline charts created by the team leader."""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, project_name, summary_text, image_path, created_at
        FROM timeline_charts
        WHERE team_leader_id = ?
        ORDER BY created_at DESC
    """, (current_user['id'],))
    
    charts = cursor.fetchall()
    conn.close()
    
    result = []
    for chart in charts:
        chart_dict = dict(chart)
        
        # Encode image as base64
        image_base64 = None
        if chart_dict['image_path'] and os.path.exists(chart_dict['image_path']):
            try:
                with open(chart_dict['image_path'], "rb") as img_file:
                    image_base64 = base64.b64encode(img_file.read()).decode()
            except:
                pass
        
        result.append({
            "id": chart_dict['id'],
            "project_name": chart_dict['project_name'],
            "summary_text": chart_dict['summary_text'][:200] if chart_dict['summary_text'] else "",
            "image_path": chart_dict['image_path'],
            "image_base64": image_base64,
            "created_at": chart_dict['created_at']
        })
    
    return result
