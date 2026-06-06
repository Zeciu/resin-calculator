# Stage 1: build frontend
FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: production image (Python only, no Node)
FROM python:3.13-slim
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install Python dependencies without dev deps and without creating a venv
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv pip install --system --no-cache fastapi uvicorn python-multipart

# Copy backend source and built frontend static files
COPY backend/app.py ./
COPY --from=frontend-build /app/frontend/dist ./static

EXPOSE 5000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
