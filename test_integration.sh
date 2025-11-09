#!/bin/bash

echo "🧪 Testing Frontend-Backend Integration"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test backend health
echo "1️⃣  Testing Backend Health..."
HEALTH=$(curl -s http://localhost:8000/api/health 2>&1)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend not responding${NC}"
    echo "   Please start backend: cd backend && ./start.sh"
    exit 1
fi
echo ""

# Test login
echo "2️⃣  Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sarah_smith","password":"password123"}')

if echo "$LOGIN_RESPONSE" | grep -q "session_token"; then
    echo -e "${GREEN}✅ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['session_token'])" 2>/dev/null)
    echo "   Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test projects
echo "3️⃣  Testing Projects API..."
PROJECTS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/projects)
PROJECT_COUNT=$(echo "$PROJECTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ "$PROJECT_COUNT" -eq "5" ]; then
    echo -e "${GREEN}✅ Projects API working - Found 5 projects${NC}"
else
    echo -e "${YELLOW}⚠️  Projects: $PROJECT_COUNT (expected 5)${NC}"
fi
echo ""

# Test tasks today
echo "4️⃣  Testing Tasks Today API..."
TASKS_TODAY=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/tasks/today)
if echo "$TASKS_TODAY" | grep -q "\["; then
    echo -e "${GREEN}✅ Tasks Today API working${NC}"
else
    echo -e "${RED}❌ Tasks Today API failed${NC}"
fi
echo ""

# Test tasks list
echo "5️⃣  Testing Tasks List API..."
TASKS_LIST=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/tasks/list 2>&1)
if echo "$TASKS_LIST" | grep -q "Internal Server Error"; then
    echo -e "${RED}❌ Tasks List API has errors${NC}"
    echo "   This needs to be fixed"
elif echo "$TASKS_LIST" | grep -q "\["; then
    TASK_COUNT=$(echo "$TASKS_LIST" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    echo -e "${GREEN}✅ Tasks List API working - Found $TASK_COUNT tasks${NC}"
else
    echo -e "${YELLOW}⚠️  Tasks List: Unexpected response${NC}"
fi
echo ""

# Test announcements
echo "6️⃣  Testing Announcements API..."
ANNOUNCEMENTS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/announcements)
ANN_COUNT=$(echo "$ANNOUNCEMENTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ ! -z "$ANN_COUNT" ]; then
    echo -e "${GREEN}✅ Announcements API working - Found $ANN_COUNT announcements${NC}"
else
    echo -e "${YELLOW}⚠️  Announcements API issue${NC}"
fi
echo ""

# Summary
echo "========================================"
echo "📊 Integration Test Summary"
echo "========================================"
echo ""
echo "Backend URL: http://localhost:8000"
echo "Frontend URL: http://localhost:5173"
echo ""
echo "Login Credentials:"
echo "  Username: sarah_smith"
echo "  Password: password123"
echo ""
echo "Next Steps:"
echo "  1. If backend not running: cd backend && ./start.sh"
echo "  2. If frontend not running: cd frontend && ./start.sh"
echo "  3. Open browser: http://localhost:5173/login"
echo ""


