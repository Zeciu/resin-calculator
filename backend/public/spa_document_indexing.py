"""Indexing policy for SPA HTML document responses.

Frontend `documentMetadata.js` keeps a parallel allowlist of the same six
public marketing paths. Tests assert the two lists stay aligned.

`KNOWN_SPA_DOCUMENT_PATHS` mirrors every route in the production frontend
(`frontend/public/src/workspace/routes.js`). Extensionless paths outside it
are answered with the SPA shell and HTTP 404, so the browser still renders
the Not Found page while crawlers see a real 404 instead of a soft 404.
"""

from __future__ import annotations

from pathlib import Path

PUBLIC_SPA_DOCUMENT_PATHS = frozenset(
    {
        "/",
        "/about",
        "/pricing",
        "/privacy",
        "/terms",
        "/contact",
    }
)

X_ROBOTS_TAG_HEADER = "x-robots-tag"
X_ROBOTS_TAG_NOINDEX = "noindex, nofollow"

# Production SPA routes that are not public marketing pages. Admin routes are
# deliberately absent: production builds contain no /admin route tree.
_PRIVATE_SPA_DOCUMENT_PATHS = frozenset(
    {
        "/login",
        "/register",
        "/password-recovery",
        "/callback",
        "/account",
        "/account/preferences",
        "/projects",
        "/manual",
        "/glossary",
        "/knowledge-base",
        "/new-project",
        "/demo",
        "/knowledge-preview",
        "/knowledge-preview/manual",
        "/knowledge-preview/knowledge-base",
        "/knowledge-preview/glossary",
    }
)

KNOWN_SPA_DOCUMENT_PATHS = PUBLIC_SPA_DOCUMENT_PATHS | _PRIVATE_SPA_DOCUMENT_PATHS


def normalize_spa_request_path(request_path: str) -> str:
    raw = (request_path or "").split("?", 1)[0].split("#", 1)[0].strip()
    if not raw or raw == "/":
        return "/"
    path = raw if raw.startswith("/") else f"/{raw}"
    if path != "/":
        path = path.rstrip("/") or "/"
    return path


def is_public_spa_document_path(request_path: str) -> bool:
    return normalize_spa_request_path(request_path) in PUBLIC_SPA_DOCUMENT_PATHS


def is_known_spa_document_path(request_path: str) -> bool:
    # React Router matches paths case-insensitively, so /About renders About.
    return normalize_spa_request_path(request_path).lower() in KNOWN_SPA_DOCUMENT_PATHS


def is_extensionless_spa_path(request_path: str) -> bool:
    name = normalize_spa_request_path(request_path).rsplit("/", 1)[-1]
    return name == "" or not Path(name).suffix


def apply_spa_document_robots_header(response, request_path: str):
    """Add X-Robots-Tag on non-public SPA HTML documents only."""
    if not is_public_spa_document_path(request_path):
        response.headers[X_ROBOTS_TAG_HEADER] = X_ROBOTS_TAG_NOINDEX
    return response
