# Stage 1: build the public frontend
FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend

ARG VITE_COGNITO_USER_POOL_ID
ARG VITE_COGNITO_CLIENT_ID
ARG VITE_COGNITO_DOMAIN
ARG VITE_COGNITO_REDIRECT_URI

ENV VITE_COGNITO_USER_POOL_ID=$VITE_COGNITO_USER_POOL_ID
ENV VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID
ENV VITE_COGNITO_DOMAIN=$VITE_COGNITO_DOMAIN
ENV VITE_COGNITO_REDIRECT_URI=$VITE_COGNITO_REDIRECT_URI

COPY frontend/package*.json ./
COPY frontend/vite.config.js ./
COPY frontend/public ./public
RUN npm ci
RUN npm run build

# Stage 2: production image (Python only, no Node or editorial source)
FROM python:3.13-slim
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install Python dependencies from the lock file (no venv, no dev deps).
# `uv pip install -r` requires a requirements-style file, so the lock file is
# exported to one first; this keeps installs pinned to uv.lock.
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv export --locked --no-dev -o requirements.txt \
    && uv pip install --system --no-cache -r requirements.txt

# Public runtime only. The whole production import graph lives under
# backend/public; editorial authoring code and content are local-only source
# under backend/private and must never be copied here.
COPY backend/public ./public
COPY --from=frontend-build /app/frontend/dist ./public/static

EXPOSE 5000
CMD ["uvicorn", "public.app:app", "--host", "0.0.0.0", "--port", "5000"]
