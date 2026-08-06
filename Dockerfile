# Stage 1: build the public frontend
FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend

ARG VITE_COGNITO_USER_POOL_ID
ARG VITE_COGNITO_CLIENT_ID
ARG VITE_COGNITO_DOMAIN
ARG VITE_COGNITO_REDIRECT_URI
ARG VITE_AUTH_MODE=cognito

ENV VITE_COGNITO_USER_POOL_ID=$VITE_COGNITO_USER_POOL_ID
ENV VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID
ENV VITE_COGNITO_DOMAIN=$VITE_COGNITO_DOMAIN
ENV VITE_COGNITO_REDIRECT_URI=$VITE_COGNITO_REDIRECT_URI
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE

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

# Public runtime plus the minimal shared commercial modules it imports. Do not
# broaden this allowlist: editorial authoring code is local-only source.
COPY backend/public ./public
COPY backend/content/__init__.py ./content/__init__.py
COPY backend/content/repositories/__init__.py ./content/repositories/__init__.py
COPY backend/content/repositories/entitlements.py ./content/repositories/entitlements.py
COPY backend/content/routers/__init__.py ./content/routers/__init__.py
COPY backend/content/routers/billing.py ./content/routers/billing.py
COPY backend/content/routers/me.py ./content/routers/me.py
COPY --from=frontend-build /app/frontend/dist ./public/static

EXPOSE 5000
CMD ["uvicorn", "public.app:app", "--host", "0.0.0.0", "--port", "5000"]
