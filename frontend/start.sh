#!/bin/bash

echo "🚀 Starting Frontend Server..."
cd /Users/raja/Desktop/nex/frontend

echo "📂 Working Directory: $(pwd)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Starting Vite Dev Server"
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 Backend Proxy: /api → http://localhost:8000"
echo ""

npm run dev


