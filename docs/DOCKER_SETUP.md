# Docker & Dev Container Setup

This guide explains how to run AngelOne Dashboard using Docker and VS Code Dev Containers.

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

### Full Stack Debugging

Select "Full Stack Debug" to debug both simultaneously

## File Structure

```
.devcontainer/
├── devcontainer.json      # VS Code dev container config
├── Dockerfile             # Dev container image definition
├── docker-compose.yml     # Dev container services
├── post-create.sh         # Runs after container creation
└── post-start.sh          # Runs when container starts

.vscode/
├── launch.json            # Debug configurations
├── tasks.json             # Build and run tasks
├── settings.json          # VS Code settings
└── extensions.json        # Recommended extensions

Dockerfile                  # Production image (multi-stage)
docker-compose.yml         # Production services
```

## Environment Variables

Create `.env` file in the backend directory:

```env
SMARTAPI_API_KEY=your_key
SMARTAPI_CLIENT_ID=your_client_id
SMARTAPI_ACCESS_TOKEN=your_token
```

## Troubleshooting

### Container fails to start
```bash
# Clean up and rebuild
docker-compose down --remove-orphans
docker system prune -a
docker-compose up --build
```

### Port already in use
```bash
# Find and stop container using port 8000
docker ps
docker stop <container_id>

# Or use different ports in docker-compose.yml
```

### Debugger not attaching
- Ensure port 5678 is not blocked
- Restart the debugging session
- Check VS Code debug console for errors

### Permission denied errors
- Ensure Docker daemon is running
- On Linux, add user to docker group: `sudo usermod -aG docker $USER`

## Performance Tips

1. **Mount exclusions** - Large directories like `node_modules` are excluded from volume mounts
2. **Use BuildKit** - Set `export DOCKER_BUILDKIT=1` for faster builds
3. **Layer caching** - Production Dockerfile uses multi-stage builds for smaller images

## Testing

```bash
# Run backend tests
docker-compose exec dev pytest backend/ -v

# Run frontend tests
docker-compose exec dev npm --prefix frontend run test
```

## Useful Docker Commands

```bash
# View running containers
docker ps

# View container logs
docker logs <container_id>

# Execute command in container
docker exec -it <container_id> bash

# Remove dangling images
docker image prune

# Full system cleanup
docker system prune -a --volumes
```

## VS Code Extensions (Auto-installed)

- **Python**: ms-python.python, ms-python.vscode-pylance
- **Frontend**: esbenp.prettier-vscode, dbaeumer.vscode-eslint
- **Docker**: ms-azuretools.vscode-docker
- **Git**: eamodio.gitlens
- **API Testing**: humao.rest-client
- **GitHub Copilot**: github.copilot

## Production Deployment

The `Dockerfile` creates an optimized production image:

```bash
# Build
docker build -t angel-dashboard:v1.0 .

# Run
docker run -p 80:8000 \
  -e ENV=production \
  angel-dashboard:v1.0

# Push to registry
docker tag angel-dashboard:v1.0 yourusername/angel-dashboard:v1.0
docker push yourusername/angel-dashboard:v1.0
```

## Resources

- [VS Code Dev Containers](https://code.visualstudio.com/docs/remote/containers)
- [Docker Documentation](https://docs.docker.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Vite](https://vitejs.dev/)
