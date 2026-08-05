from typing import Any

from fastapi import HTTPException, Request, status

from public.auth.cognito import user_id_from_claims


def get_current_user(request: Request) -> dict[str, Any]:
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
    return {"id": user_id, "role": "user"}
