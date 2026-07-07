import os
from typing import Any

from fastapi import HTTPException, Request

VALID_ROLES = frozenset({"administrator", "user"})


def auth_mode() -> str:
    return os.environ.get("AUTH_MODE", "mock").strip().lower()


def get_current_user(request: Request) -> dict[str, Any]:
    mode = auth_mode()
    if mode == "mock":
        role = request.headers.get("X-Mock-Role", "user")
        user_id = request.headers.get("X-Mock-User-Id", "stub-user")
        if role not in VALID_ROLES:
            role = "user"
        return {"id": user_id, "role": role}

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Cognito group mapping is completed in Task 64. Until then, authenticated users
    # may access admin routes only when mock headers are used in local development.
    return {"id": "cognito-user", "role": "user"}


def require_administrator(request: Request) -> dict[str, Any]:
    user = get_current_user(request)
    if user["role"] != "administrator":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user
