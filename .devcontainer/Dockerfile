# Development container with hot-reload capabilities
FROM python:3.11-slim

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser

WORKDIR /workspace

# Install Python development dependencies
RUN pip install --no-cache-dir \
    black \
    flake8 \
    pytest \
    pytest-asyncio \
    ipython

# Copy and install Python requirements
COPY backend/requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy and install Node dependencies
COPY frontend/package*.json /tmp/frontend/
WORKDIR /tmp/frontend
RUN npm ci

# Set working directory back to workspace
WORKDIR /workspace

# Change ownership
RUN chown -R appuser:appuser /workspace

USER appuser

# Shell
CMD ["/bin/bash"]
