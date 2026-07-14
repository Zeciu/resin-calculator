import os
from typing import Any

from fastapi import HTTPException, Request, status

from auth.cognito import role_from_claims, user_id_from_claims

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

    claims = getattr(request.state, "jwt_claims", None)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    try:
        user_id = user_id_from_claims(claims)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        ) from None
    return {
        "id": user_id,
        "role": role_from_claims(claims),
    }


def require_administrator(request: Request) -> dict[str, Any]:
    user = get_current_user(request)
    if user["role"] != "administrator":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user
