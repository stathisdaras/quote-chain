#!/bin/bash

# Quick start script for Highlights API

echo "🚀 Starting Highlights API..."
echo ""

# Detect Python command (try python3.12, python3, or python)
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
    echo "📥 Installing dependencies..."
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
        echo "   Edit: .env"
        echo "   Or run: export OPENAI_API_KEY='sk-your-key'"
        exit 1
    else
        echo "❌ Error: .env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Check if OPENAI_API_KEY is set (either in .env or environment)
if [ -z "$OPENAI_API_KEY" ]; then
    # Try to load from .env file
    if grep -q "OPENAI_API_KEY=sk-" .env 2>/dev/null; then
        echo "✅ Found OPENAI_API_KEY in .env file"
    else
        echo "⚠️  Warning: OPENAI_API_KEY not set or still has placeholder value"
        echo "   Please edit .env and set your OPENAI_API_KEY"
        echo "   Or run: export OPENAI_API_KEY='sk-your-key'"
    fi
fi

# Start the server
echo "🌟 Starting FastAPI server..."
echo "📖 API docs available at: http://localhost:8000/docs"
echo ""
cd "$(dirname "$0")"
python main.py

