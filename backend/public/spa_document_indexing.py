"""Indexing policy for SPA HTML document responses.

Frontend `documentMetadata.js` keeps a parallel allowlist of the same six
public marketing paths. Tests assert the two lists stay aligned.
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


def is_extensionless_spa_path(request_path: str) -> bool:
    name = normalize_spa_request_path(request_path).rsplit("/", 1)[-1]
    return name == "" or not Path(name).suffix


def apply_spa_document_robots_header(response, request_path: str):
    """Add X-Robots-Tag on non-public SPA HTML documents only."""
    if not is_public_spa_document_path(request_path):
        response.headers[X_ROBOTS_TAG_HEADER] = X_ROBOTS_TAG_NOINDEX
    return response
