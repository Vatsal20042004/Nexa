# Employee Tracking System - Backend API

FastAPI-based backend for employee work tracking, task management, and team oversight.

## Features

### Authentication
- Simple username/password authentication for employees and team leaders
- Session-based auth with token management
- Role-based access control

### Daily Work Sessions
- Create daily work sessions
- Upload meeting transcripts (morning/evening meetings)
- Upload and process videos with OCR frame extraction
- Automated screenshot capture with configurable intervals
- Upload additional files (PDF, DOCX, CSV, JSON, etc.)
- GitHub activity integration

### AI-Powered Task Generation
- Process daily sessions with LLM
- Combine all data sources (transcripts, videos, screenshots, files, GitHub)
- Generate structured tasks with priorities
- Automatic task assignment to dates

### Task Management
- View tasks (today, week, month)
- Calendar view with day/week/month filters
- Update task status and completion
- Priority management
- Task CRUD operations

### Chat Assistant
- AI chat interface for employee assistance
- Session-based conversation history
- Uses custom system prompts

### Team Leader Features
- View all team members' activities
- Monitor daily session submissions
- Review team member tasks
- Access detailed session information
- Team statistics and analytics

### Settings
- User profile management
- Work hours configuration
- Personal comments/notes

## Installation

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Ensure Nexa Services Are Available

The backend depends on the Nexa services in the parent directory. Make sure:
- `/Nexa/services/services.py` exists with UnifiedService class
- All required Nexa dependencies are installed

### 3. Initialize Database

The database will be automatically initialized on first run. It creates:
- `backend/employee_tracker.db` - SQLite database

### 4. Create Upload Directories

Directories are auto-created on startup, but you can manually create them:

```bash
mkdir -p backend/uploads/{transcripts,videos,screenshots,files,video_frames}
```

## Running the Server

### Development Mode

```bash
cd backend
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at: `http://localhost:8000`

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /me` - Get current user info

### Daily Sessions (`/api/sessions`)
- `POST /create` - Create/get daily session
- `POST /upload-transcript` - Upload meeting transcript
- `POST /upload-video` - Upload video for processing
- `POST /start-screenshot-schedule` - Start automated screenshots
- `POST /capture-screenshot` - Capture single screenshot
- `POST /stop-screenshot-schedule/{id}` - Stop screenshot capture
- `POST /upload-file` - Upload additional file
- `GET /session/{date}` - Get session details
- `POST /submit/{date}` - Submit session for processing

### Tasks (`/api/tasks`)
- `POST /process-session` - Process session with LLM and generate tasks
- `GET /list` - List tasks with filters
- `GET /today` - Get today's tasks
- `GET /calendar` - Get calendar view
- `PATCH /{task_id}` - Update task
- `DELETE /{task_id}` - Delete task

### Chat (`/api/chat`)
- `POST /message` - Send chat message
- `GET /history/{session_id}` - Get chat history
- `DELETE /session/{session_id}` - Delete chat session
- `GET /sessions` - List all chat sessions

### Settings (`/api/settings`)
- `GET /profile` - Get user profile
- `PATCH /profile` - Update profile
- `GET /work-hours` - Get work hours
- `PATCH /work-hours` - Update work hours
- `GET /comments` - Get comments
- `PATCH /comments` - Update comments

### Team Leader (`/api/team`)
- `GET /overview` - Get team overview
- `GET /member/{id}/tasks` - Get member tasks
- `GET /member/{id}/session/{date}` - Get member session details
- `GET /members` - List team members
- `GET /stats/{id}` - Get member statistics

## Architecture

### Database Schema

**Users**
- User authentication and profile
- Roles: employee, team_leader

**Daily Sessions**
- Tracks each day's work session
- Links to all uploads and tasks

**Transcripts, Videos, Screenshots, Files**
- Stores uploaded content and extracted text

**Tasks**
- Generated from LLM processing
- Assigned to users and dates

**Chat Messages**
- Conversation history per user/session

**Audit Logs**
- Track all user actions

### Services Integration

The backend integrates with:

1. **UnifiedService** (`Nexa/services/services.py`)
   - File extraction
   - Screenshot capture
   - Video processing
   - LLM queries
   - Chat functionality
   - GitHub activity tracking

2. **VideoProcessor** (`backend/services/video_processor.py`)
   - Video frame extraction
   - OCR on video frames

3. **AuthService** (`backend/services/auth_service.py`)
   - User authentication
   - Session management

## Workflow

### Daily Employee Workflow

1. **Login** - Employee logs in
2. **Create Session** - Create/get today's session
3. **Upload Data** - Upload transcripts, videos, or start screenshot capture
4. **Add Files** - Upload any additional files
5. **Submit** - Mark session as submitted
6. **Process** - System processes with LLM and generates tasks
7. **View Tasks** - See generated tasks in calendar view
8. **Chat** - Use AI assistant for help
9. **Update Settings** - Adjust work hours, add comments

### Team Leader Workflow

1. **Login** - Team leader logs in
2. **View Overview** - See all team members' status
3. **Review Sessions** - Check individual member submissions
4. **Monitor Tasks** - View team member tasks
5. **Analytics** - Review statistics

## Configuration

### Environment Variables

- `NEXA_DEFAULT_MODEL` - Default LLM model (e.g., "ollama", "gemini")
- `GITHUB_TOKEN` - GitHub API token for activity tracking
- Database path is hardcoded to `backend/employee_tracker.db`

## Frontend Integration

The API supports CORS for frontend integration. Response format is JSON-based REST API.

### Authentication Flow
1. POST `/api/auth/login` with credentials
2. Receive session token in response
3. Include token in subsequent requests: `Authorization: Bearer <token>`

### TypeScript Example

```typescript
// Login
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'user', password: 'pass' })
});

const { session_token } = await response.json();

// Authenticated request
const tasks = await fetch('http://localhost:8000/api/tasks/today', {
  headers: { 'Authorization': `Bearer ${session_token}` }
});
```

## Development Notes

- Database uses SQLite3 (built into Python)
- File uploads stored in `backend/uploads/`
- Video processing may be CPU-intensive
- Screenshot capture requires display environment
- LLM processing may take time depending on model

## Troubleshooting

### Import Errors
- Ensure you're running from the project root
- Check that Nexa services are installed

### Video Processing Fails
- Install opencv-python: `pip install opencv-python`
- Check video file format compatibility

### Screenshot Capture Fails
- Ensure display environment is available
- May not work in headless environments

### LLM Errors
- Check NEXA_DEFAULT_MODEL configuration
- Verify LLM service (Ollama) is running
- Check API keys for hosted models

## Security Notes

⚠️ **This is a development setup. For production:**
- Use proper password hashing (bcrypt)
- Implement JWT tokens with expiration
- Add rate limiting
- Enable HTTPS
- Restrict CORS origins
- Implement file upload validation
- Add input sanitization
- Set up proper logging

## License

Part of the Nexa project.
