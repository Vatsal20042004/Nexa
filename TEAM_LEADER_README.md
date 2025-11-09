# 🚀 Team Leader Features - Getting Started

## Quick Login

### Team Leader Account
```
URL:      http://localhost:5000/login
Username: team_leader
Password: leader123
```

After logging in, access Team Leader features from the sidebar:
- 👥 **Team Dashboard** - View team stats and progress
- 💬 **Team Chat** - AI-powered team management assistant
- 📊 **Timeline Chart** - Generate project timelines

---

## Setup (First Time Only)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
pip install fastapi uvicorn sqlalchemy pydantic matplotlib pillow pytesseract
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Create Demo Users

```bash
cd backend
python seed_data.py
```

This creates:
- ✅ 1 Team Leader: `team_leader` / `leader123`
- ✅ 5 Team Members with realistic roles
- ✅ Team relationships pre-configured

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```
Backend will run on: `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on: `http://localhost:5000`

### 4. Login & Test

1. Open `http://localhost:5000/login`
2. Login with: `team_leader` / `leader123`
3. Explore the Team Leader section in the sidebar!

---

## All Demo Accounts

| Username | Password | Role | Name |
|----------|----------|------|------|
| **team_leader** | **leader123** | **Team Leader** | **John Leader** |
| alice_dev | password123 | Senior Developer | Alice Johnson |
| bob_dev | password123 | Backend Developer | Bob Smith |
| carol_designer | password123 | UI/UX Designer | Carol Williams |
| dave_qa | password123 | QA Engineer | Dave Brown |
| eve_frontend | password123 | Frontend Developer | Eve Davis |

---

## Features Overview

### 1️⃣ Team Dashboard (`/team-leader-dashboard`)
- Real-time team statistics
- Task completion metrics
- Team member overview
- Quick access to other features

### 2️⃣ Team Chat (`/team-leader-chat`)
- AI-powered conversational assistant
- Select team members for context-aware responses
- Voice input support
- Pulls context from tasks, documents, and meetings

**Try asking:**
- "Show me today's team summary"
- "Who's falling behind this week?"
- "What are the top risks?"
- "Suggest workload rebalancing"

### 3️⃣ Timeline Chart (`/timeline-chart`)
- Upload project documents (SRS, requirements)
- AI generates visual timeline with milestones
- Employee summaries and assignments
- Matplotlib chart visualization

**Workflow:**
1. Upload documents or paste text
2. Select team members
3. Generate timeline
4. View chart and analysis

---

## Architecture

```
Frontend (React + TypeScript)
    ↓
Backend API (FastAPI + Python)
    ↓
Nexa Services (UnifiedService)
    ↓
AI Models + Document Processing
```

### Key Files
- **Frontend Pages**: `frontend/client/src/pages/team-leader-*.tsx`
- **Backend API**: `backend/api/team_leader.py`
- **Database**: `backend/employee_tracker.db`
- **Nexa Services**: `Nexa/services/services.py`

---

## Documentation

📚 **Complete Guides:**
- `TEAM_LEADER_IMPLEMENTATION.md` - Technical implementation details
- `TEAM_LEADER_QUICKSTART.md` - Detailed usage instructions
- `TEAM_LEADER_CHECKLIST.md` - Setup verification checklist

---

## Troubleshooting

### "Failed to fetch team members"
- Ensure backend is running on port 8000
- Check you're logged in as `team_leader`
- Run `python seed_data.py` to create demo data

### Chat not responding
- Check backend logs for errors
- Verify Nexa UnifiedService is configured
- Ensure AI model access is working

### Timeline chart not generating
- Install matplotlib: `pip install matplotlib`
- Check document upload formats (PDF, DOCX, TXT, MD)
- Review backend logs for Python execution errors

---

## Next Steps

1. ✅ Login with `team_leader` / `leader123`
2. ✅ Explore the Team Dashboard
3. ✅ Try the AI Chat with team member selection
4. ✅ Generate a timeline chart with sample documents
5. 📖 Read the full documentation for advanced features

---

## Support

- **Issues**: Check backend logs and browser console
- **Database**: Located at `backend/employee_tracker.db`
- **Reset Data**: Delete database and run `python seed_data.py` again

---

**Happy Team Leading! 🎉**
