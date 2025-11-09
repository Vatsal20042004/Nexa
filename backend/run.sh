#!/bin/bash

# Start the Employee Tracking System Backend

echo "🚀 Starting Employee Tracking System Backend..."
echo ""

# Check if we're in the backend directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: main.py not found. Please run this script from the backend directory."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "../Nexa/env" ]; then
    echo "⚠️  Warning: Virtual environment not found at ../Nexa/env"
    echo "Please ensure Python dependencies are installed."
    echo ""
fi

# Install/check dependencies
echo "📦 Checking dependencies..."
pip install -q -r requirements.txt 2>/dev/null || echo "⚠️  Could not install requirements. Please run: pip install -r requirements.txt"
echo ""

# Start the server
echo "✅ Starting FastAPI server on http://localhost:8000"
echo "📖 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py
