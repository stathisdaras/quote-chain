#!/bin/bash

# Quick start script for Quote Chain
# Starts backend first, then frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "🚀 Starting Quote Chain..."
echo ""

# ============================================
# BACKEND SETUP AND START
# ============================================
echo "📦 Setting up backend..."
cd "$BACKEND_DIR"

# Detect Python command
PYTHON_CMD=""
if command -v python3.12 &> /dev/null; then
    PYTHON_CMD="python3.12"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python not found. Please install Python 3.9 or higher."
    exit 1
fi

echo "🐍 Using: $PYTHON_CMD ($($PYTHON_CMD --version))"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "📥 Installing backend dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please edit it and add your OPENAI_API_KEY"
        echo "   Edit: backend/.env"
        echo "   Or run: export OPENAI_API_KEY='sk-your-key'"
        exit 1
    else
        echo "⚠️  Warning: .env.example not found. Continuing anyway..."
        echo "   Make sure OPENAI_API_KEY is set in environment or .env file"
    fi
fi

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    # Try to load from .env file
    if [ -f ".env" ] && grep -q "OPENAI_API_KEY=sk-" .env 2>/dev/null; then
        echo "✅ Found OPENAI_API_KEY in .env file"
        export $(grep -v '^#' .env | xargs)
    else
        echo "⚠️  Warning: OPENAI_API_KEY not set"
        echo "   Please set it in backend/.env or export OPENAI_API_KEY='sk-your-key'"
    fi
fi

# Start backend in background
echo "🌟 Starting FastAPI backend server..."
echo "📖 API docs will be available at: http://localhost:8000/docs"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit
}

trap cleanup SIGINT SIGTERM EXIT

# Start backend
python main.py &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Error: Backend failed to start"
    exit 1
fi

# Wait a bit more for the server to be fully ready
for i in {1..10}; do
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
done

# ============================================
# FRONTEND SETUP AND START
# ============================================
echo ""
echo "📦 Setting up frontend..."
cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo "🌟 Starting Angular frontend..."
echo "🌐 Frontend will be available at: http://localhost:4200"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

