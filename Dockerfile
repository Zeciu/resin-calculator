# Stage 1: build frontend
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
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 1b: export deterministic editorial seed data
FROM node:24-alpine AS editorial-seed-build
WORKDIR /app
COPY backend/scripts/export_manual_sections.mjs ./backend/scripts/export_manual_sections.mjs
COPY backend/scripts/export_glossary_entries.mjs ./backend/scripts/export_glossary_entries.mjs
COPY backend/scripts/export_knowledge_base_entries.mjs ./backend/scripts/export_knowledge_base_entries.mjs
COPY frontend/src/manual/manualContent.js ./frontend/src/manual/manualContent.js
COPY frontend/src/glossary/glossaryContent.js ./frontend/src/glossary/glossaryContent.js
COPY frontend/src/knowledgeBase/knowledgeBaseContent.js ./frontend/src/knowledgeBase/knowledgeBaseContent.js
RUN mkdir -p /app/seed-data
RUN node ./backend/scripts/export_manual_sections.mjs ./frontend/src/manual/manualContent.js > /app/seed-data/manual-sections.json
RUN node ./backend/scripts/export_glossary_entries.mjs ./frontend/src/glossary/glossaryContent.js > /app/seed-data/glossary-entries.json
RUN node ./backend/scripts/export_knowledge_base_entries.mjs ./frontend/src/knowledgeBase/knowledgeBaseContent.js > /app/seed-data/knowledge-base-entries.json

# Stage 2: production image (Python only, no Node)
FROM python:3.13-slim
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install Python dependencies from lock file (no venv, no dev deps)
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy backend source and built frontend static files
COPY backend/app.py ./
COPY backend/auth ./auth
COPY backend/content ./content
COPY backend/product ./product
COPY --from=editorial-seed-build /app/seed-data ./seed-data
COPY --from=frontend-build /app/frontend/dist ./static

# Packaged editorial release corpus (Git-tracked subset only; not the full backend/data tree).
# Kept for EDITORIAL_CONTENT_MODE=release via CONTENT_DATA_DIR=/app/content (B5 wires production).
# Existing seed-data export remains for writable/strict first-run seeding on durable mounts.
COPY backend/data/editorial/content-store.json /app/content/editorial/content-store.json
COPY backend/data/config/public-languages.json /app/content/config/public-languages.json
COPY backend/data/published/manual/ /app/content/published/manual/
COPY backend/data/published/glossary/ /app/content/published/glossary/
COPY backend/data/published/knowledge-base/ /app/content/published/knowledge-base/
COPY backend/data/published/website/ /app/content/published/website/
COPY backend/data/manual/images/ /app/content/manual/images/
COPY backend/data/glossary/images/ /app/content/glossary/images/
COPY backend/data/knowledge-base/images/ /app/content/knowledge-base/images/
COPY backend/data/website/images/ /app/content/website/images/

EXPOSE 5000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
