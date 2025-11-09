# Quick Start Guide - Employee Tracking System

## Prerequisites

1. Python 3.8+ installed
2. Nexa services set up (`/Nexa/services/`)
3. Dependencies installed

## Step 1: Install Dependencies

```bash
cd /Users/raja/Desktop/nex/backend
pip install -r requirements.txt
```

## Step 2: Start the Server

### Option A: Using the run script
```bash
./run.sh
```

### Option B: Direct Python
```bash
python main.py
```

### Option C: Using Uvicorn
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on: **http://localhost:8000**

## Step 3: Test the API

### Open API Documentation
Visit: http://localhost:8000/docs

### Test Basic Endpoints

```bash
# Health check
curl http://localhost:8000/api/health

# Root
curl http://localhost:8000/
```

## Step 4: Create Your First User

### Register an Employee

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123",
    "name": "John Doe",
    "role": "employee"
  }'
```

Response will include a `session_token`. Save this!

### Register a Team Leader

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane_manager",
    "password": "manager123",
    "name": "Jane Manager",
    "role": "team_leader"
  }'
```

## Step 5: Login

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123"
  }'
```

Save the `session_token` from the response.

## Step 6: Create a Daily Session

```bash
export TOKEN="your_session_token_here"

curl -X POST "http://localhost:8000/api/sessions/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-08",
    "github_username": "yourusername",
    "github_repo": "yourrepo"
  }'
```

## Step 7: Upload Data

### Upload a Transcript

```bash
curl -X POST "http://localhost:8000/api/sessions/upload-transcript" \
  -H "Authorization: Bearer $TOKEN" \
  -F "session_date=2025-11-08" \
  -F "upload_type=morning" \
  -F "file=@/path/to/meeting_notes.txt"
```

### Upload a Video

```bash
curl -X POST "http://localhost:8000/api/sessions/upload-video" \
  -H "Authorization: Bearer $TOKEN" \
  -F "session_date=2025-11-08" \
  -F "interval_seconds=30" \
  -F "file=@/path/to/screen_recording.mp4"
```

### Capture a Screenshot

```bash
curl -X POST "http://localhost:8000/api/sessions/capture-screenshot" \
  -H "Authorization: Bearer $TOKEN" \
  -F "session_date=2025-11-08"
```

### Start Automated Screenshot Capture

```bash
curl -X POST "http://localhost:8000/api/sessions/start-screenshot-schedule" \
  -H "Authorization: Bearer $TOKEN" \
  -F "session_date=2025-11-08" \
  -F "interval_minutes=5" \
  -F "duration_minutes=60"
```

## Step 8: Submit Session

```bash
curl -X POST "http://localhost:8000/api/sessions/submit/2025-11-08" \
  -H "Authorization: Bearer $TOKEN"
```

## Step 9: Process Session with LLM

```bash
curl -X POST "http://localhost:8000/api/tasks/process-session" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": 1,
    "custom_instructions": "Generate tasks based on the uploaded data"
  }'
```

This will generate tasks using AI!

## Step 10: View Tasks

### Get Today's Tasks
```bash
curl "http://localhost:8000/api/tasks/today" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Calendar View
```bash
curl "http://localhost:8000/api/tasks/calendar?view=week&target_date=2025-11-08" \
  -H "Authorization: Bearer $TOKEN"
```

### List All Tasks
```bash
curl "http://localhost:8000/api/tasks/list" \
  -H "Authorization: Bearer $TOKEN"
```

## Step 11: Use the Chat

```bash
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How can I prioritize my tasks today?",
    "session_id": "default"
  }'
```

## Step 12: Update Settings

```bash
curl -X PATCH "http://localhost:8000/api/settings/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "work_hours": "09:00-18:00",
    "comments": "Prefer morning meetings"
  }'
```

## Team Leader Actions

### View Team Overview

```bash
curl "http://localhost:8000/api/team/overview?target_date=2025-11-08" \
  -H "Authorization: Bearer $TEAM_LEADER_TOKEN"
```

### View Member Tasks

```bash
curl "http://localhost:8000/api/team/member/1/tasks" \
  -H "Authorization: Bearer $TEAM_LEADER_TOKEN"
```

### View Member Session Details

```bash
curl "http://localhost:8000/api/team/member/1/session/2025-11-08" \
  -H "Authorization: Bearer $TEAM_LEADER_TOKEN"
```

## Complete Workflow Example

```bash
#!/bin/bash

# 1. Register and login
TOKEN=$(curl -s -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","password":"test123","name":"Test User","role":"employee"}' \
  | jq -r '.session_token')

echo "Token: $TOKEN"

# 2. Create session
curl -s -X POST "http://localhost:8000/api/sessions/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-11-08"}' | jq

# 3. Upload a file (create test file first)
echo "Meeting notes: Discussed project timeline and deliverables" > test_notes.txt
curl -s -X POST "http://localhost:8000/api/sessions/upload-transcript" \
  -H "Authorization: Bearer $TOKEN" \
  -F "session_date=2025-11-08" \
  -F "upload_type=morning" \
  -F "file=@test_notes.txt" | jq

# 4. Submit session
curl -s -X POST "http://localhost:8000/api/sessions/submit/2025-11-08" \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Process with LLM
curl -s -X POST "http://localhost:8000/api/tasks/process-session" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_id":1}' | jq

# 6. Get tasks
curl -s "http://localhost:8000/api/tasks/today" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "✅ Workflow complete!"
```

## Troubleshooting

### Server won't start
- Check if port 8000 is already in use
- Verify Python version (3.8+)
- Check for missing dependencies

### Import errors
- Make sure you're in the correct directory
- Verify Nexa services are accessible
- Check sys.path modifications in code

### Authentication errors
- Verify session token is included in headers
- Check token hasn't expired (7 days)
- Try logging in again

### File upload errors
- Check file permissions
- Verify uploads directory exists
- Check file size limits

### LLM processing errors
- Verify Ollama or LLM service is running
- Check NEXA_DEFAULT_MODEL environment variable
- Review logs for specific errors

## Frontend Integration Example

```typescript
// TypeScript/JavaScript example for frontend

class EmployeeTrackingAPI {
  private baseUrl = 'http://localhost:8000';
  private token: string | null = null;

  async register(username: string, password: string, name: string, role: 'employee' | 'team_leader') {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, role })
    });
    const data = await response.json();
    this.token = data.session_token;
    return data;
  }

  async login(username: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    this.token = data.session_token;
    return data;
  }

  async getTodayTasks() {
    const response = await fetch(`${this.baseUrl}/api/tasks/today`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async uploadTranscript(date: string, file: File, type: string = 'general') {
    const formData = new FormData();
    formData.append('session_date', date);
    formData.append('upload_type', type);
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/sessions/upload-transcript`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    });
    return response.json();
  }

  async chatMessage(message: string, sessionId: string = 'default') {
    const response = await fetch(`${this.baseUrl}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, session_id: sessionId })
    });
    return response.json();
  }
}

// Usage
const api = new EmployeeTrackingAPI();
await api.login('john_doe', 'password123');
const tasks = await api.getTodayTasks();
console.log(tasks);
```

## Next Steps

1. **Test all endpoints** using the Swagger UI at http://localhost:8000/docs
2. **Integrate with frontend** using the provided examples
3. **Configure LLM** settings for task generation
4. **Set up GitHub integration** with proper tokens
5. **Customize** system prompts in `/Nexa/services/llm/assets/`
6. **Monitor** audit logs in the database
7. **Scale** by adding more workers in production

## Support

- API Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc
- Check logs for detailed error messages
- Review database schema in `/backend/models/database.py`
