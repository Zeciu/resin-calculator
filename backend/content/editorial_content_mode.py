"""Editorial content mode: writable (default) vs release (mutation-blocked)."""

from __future__ import annotations

import os

from fastapi import HTTPException, status

EDITORIAL_CONTENT_MODE_ENV = "EDITORIAL_CONTENT_MODE"
EDITORIAL_CONTENT_MODE_WRITABLE = "writable"
EDITORIAL_CONTENT_MODE_RELEASE = "release"
VALID_EDITORIAL_CONTENT_MODES = frozenset(
    {EDITORIAL_CONTENT_MODE_WRITABLE, EDITORIAL_CONTENT_MODE_RELEASE}
)

RELEASE_MODE_MUTATION_DETAIL = (
    "Editorial mutations are disabled because EDITORIAL_CONTENT_MODE=release. "
    "Edit and publish content locally, then redeploy packaged release content."
)


class InvalidEditorialContentModeError(RuntimeError):
    """Raised when EDITORIAL_CONTENT_MODE is set to an unsupported value."""


def editorial_content_mode() -> str:
    """Return the configured editorial content mode.

    Missing or blank EDITORIAL_CONTENT_MODE defaults to writable.
    Invalid values raise InvalidEditorialContentModeError (fail closed).
    """
    raw = os.environ.get(EDITORIAL_CONTENT_MODE_ENV)
    if raw is None or not str(raw).strip():
        return EDITORIAL_CONTENT_MODE_WRITABLE
    value = str(raw).strip().lower()
    if value not in VALID_EDITORIAL_CONTENT_MODES:
        raise InvalidEditorialContentModeError(
            f"Invalid {EDITORIAL_CONTENT_MODE_ENV}={raw!r}. "
            f"Expected one of: {', '.join(sorted(VALID_EDITORIAL_CONTENT_MODES))}."
        )
    return value


def editorial_writes_allowed() -> bool:
    return editorial_content_mode() == EDITORIAL_CONTENT_MODE_WRITABLE


def require_editorial_writes_allowed() -> None:
    """FastAPI dependency: allow mutations only when EDITORIAL_CONTENT_MODE=writable."""
    try:
        mode = editorial_content_mode()
    except InvalidEditorialContentModeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    if mode == EDITORIAL_CONTENT_MODE_RELEASE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=RELEASE_MODE_MUTATION_DETAIL,
        )
