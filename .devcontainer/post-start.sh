#!/bin/bash

echo "🔄 Starting AngelOne Dashboard development environment..."

# Check and activate backend venv
if [ -d "/workspace/backend/.venv" ]; then
    echo "✓ Backend virtual environment found"
else
    echo "⚠️  Backend virtual environment not found, creating..."
    cd /workspace/backend
    python -m venv .venv
fi

# Check frontend node_modules
if [ -d "/workspace/frontend/node_modules" ]; then
    echo "✓ Frontend dependencies found"
else
    echo "⚠️  Frontend dependencies not found, installing..."
    cd /workspace/frontend
    npm ci
fi

echo "✅ Environment ready!"
echo ""
echo "📚 Available commands in .vscode/tasks.json:"
echo "  • Backend: Run Server"
echo "  • Frontend: Dev Server"
echo "  • Backend: Run Tests"
echo "  • Full Stack: Install All Dependencies"
echo ""
echo "🐛 Debugging:"
echo "  • Python: FastAPI Backend"
echo "  • JavaScript: Debug Frontend"
echo "  • Full Stack Debug (both combined)"
