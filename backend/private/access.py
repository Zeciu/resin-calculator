"""Access dependency for source-only local editorial routes."""

from __future__ import annotations

import os

from fastapi import HTTPException, status


def require_local_editorial_access() -> dict[str, str]:
    if os.environ.get("HFZWOOD_LOCAL_EDITORIAL") != "1":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return {"id": "local-editor", "role": "local-editor"}
