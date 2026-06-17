# Docker Setup

Run both backend and frontend locally with one command.

## Quick Start

```bash
cd AngelOneDashboard
docker-compose up --build
```

That's it. Access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Health check**: http://localhost:8000/health
- **API docs**: http://localhost:8000/docs (auto-generated Swagger)

## Architecture

```
docker-compose.yml
├── backend (Python FastAPI)
│   ├── Port 8000
│   ├── Hot-reload enabled (--reload)
│   └── Volumes: ./backend → /app/backend
└── frontend (React + Vite)
    ├── Port 5173
    ├── Hot-reload enabled (HMR)
    └── Volumes: ./frontend → /app/frontend
```

## Commands

```bash
# Start both services (foreground, see logs)
docker-compose up --build

# Start in background
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild after requirements.txt changes
docker-compose up --build --force-recreate
```

## Environment Variables

The backend reads from environment or `.env` file:

| Variable | Default | Purpose |
|----------|---------|---------|
| `SMART_SCREENER_CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed frontend origins |

No SmartAPI credentials in env  they're entered via the login form at runtime.

## Data Persistence

Volumes mount your local `backend/data/` directory:
```
backend/data/
├── candles/           # Cached API responses (survives restarts)
├── market_snapshots/  # Daily snapshots (your historical record)
├── instruments/       # Scrip master cache
└── screeners.json     # Saved screener definitions
```

These persist across container restarts. Delete them to start fresh.

## Production Build

For a single-container production build (static frontend + backend):

```bash
docker build -t angel-dashboard .
docker run -p 8000:8000 angel-dashboard
```

This uses the multi-stage `Dockerfile` that builds the React app and bundles it with the Python backend.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'logzero'` | Rebuild: `docker-compose up --build --force-recreate` |
| Port already in use | Stop other services on 8000/5173, or change ports in docker-compose.yml |
| Frontend can't reach backend | Check CORS origins match. Backend must be healthy first. |
| Changes not reflecting | Volume mounts enable hot-reload. If still stuck, restart containers. |
