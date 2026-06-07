# Docker & Dev Container Setup

This guide explains how to run the Angel One Dashboard using Docker and VS Code Dev Containers.

## Quick Start

### Option 1: VS Code Dev Container (Recommended)

1. **Install Prerequisites:**
   - [VS Code](https://code.visualstudio.com/)
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - [Remote - Containers Extension](vscode:extension/ms-vscode-remote.remote-containers)

2. **Open in Dev Container:**
   - Open the project folder in VS Code
   - Press `Ctrl+Shift+P` and select "Dev Containers: Reopen in Container"
   - Wait for the container to build and start

3. **VS Code will automatically:**
   - Install recommended extensions
   - Set up Python and Node.js environments
   - Configure debugging
   - Forward ports 8000 (backend) and 5173 (frontend)

### Option 2: Local Docker Build

```bash
# Build the production image
docker build -t angel-dashboard:latest .

# Run the container
docker run -p 8000:8000 angel-dashboard:latest
```

Visit: http://localhost:8000

### Option 3: Docker Compose (Development)

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop environment
docker-compose down
```

## Available VS Code Tasks

Open Command Palette (`Ctrl+Shift+P`) and search for "Run Task":

### Backend
- **Backend: Install Dependencies** - Install Python packages
- **Backend: Run Server** - Start FastAPI with auto-reload
- **Backend: Run Tests** - Run pytest

### Frontend
- **Frontend: Install Dependencies** - Install npm packages
- **Frontend: Dev Server** - Start Vite dev server
- **Frontend: Build** - Build for production

### Docker
- **Docker: Build Production Image** - Build Docker image
- **Docker: Run Production Container** - Run production container
- **Docker Compose: Start Dev Environment** - Start docker-compose services
- **Docker Compose: Stop Dev Environment** - Stop docker-compose services

### Full Stack
- **Full Stack: Install All Dependencies** - Install all dependencies

## Debugging

### Python Backend Debugging

1. Set a breakpoint in Python code
2. Press `F5` or go to Run → Start Debugging
3. Select "Python: FastAPI Backend"
4. The server will start with debugger attached

### Frontend Debugging

1. Select "JavaScript: Debug Frontend" from debug menu
2. This opens Chrome DevTools for the React app

## File Structure

```
.devcontainer/
├── devcontainer.json      # VS Code dev container config
├── Dockerfile             # Dev container image definition
└── post-create.sh         # Runs after container creation
```

## Troubleshooting

### Container Build Issues

```bash
# Clean build (remove old images)
docker system prune -a

# Build with no cache
docker build --no-cache -t angel-dashboard:latest .
```

### Port Conflicts

If ports 8000 or 5173 are already in use:

```bash
# Run on different ports
docker run -p 8001:8000 angel-dashboard:latest

# Or update docker-compose.yml
```

### Permission Issues

```bash
# Ensure docker daemon is running
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
```
