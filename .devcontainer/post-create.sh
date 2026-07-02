#!/bin/bash

echo "🚀 Setting up AngelOne Dashboard development environment..."

# Backend setup
echo "📦 Setting up backend..."
cd /workspace/backend
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install black flake8 pytest pytest-asyncio ipython

# Frontend setup
echo "📦 Setting up frontend..."
cd /workspace/frontend
npm ci
npm install

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p /workspace/backend/logs
mkdir -p /workspace/backend/data/candles
mkdir -p /workspace/backend/data/market_snapshots
mkdir -p /workspace/backend/data/instruments

echo "✅ Development environment setup complete!"
echo ""
echo "📝 Quick Start:"
echo "  Backend:  cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
echo ""
