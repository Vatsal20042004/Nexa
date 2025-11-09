#!/bin/bash

echo "🚀 Starting Backend Server..."
cd /Users/raja/Desktop/nex/backend

# Use the virtual environment's Python
PYTHON=/Users/raja/Desktop/nex/env/bin/python3

echo "📦 Python: $PYTHON"
echo "📂 Working Directory: $(pwd)"
echo "💾 Database: $(pwd)/employee_tracker.db"
echo ""

# Check if database exists
if [ ! -f "employee_tracker.db" ]; then
    echo "⚠️  Database not found. Creating and seeding..."
    $PYTHON seed_data.py
    echo ""
fi

echo "✅ Starting FastAPI on http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""

# Start with uvicorn
$PYTHON -m uvicorn main:app --reload --host 0.0.0.0 --port 8000


