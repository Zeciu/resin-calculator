def user_id_from_claims(claims: dict) -> str:
    sub = claims.get("sub")
    if not isinstance(sub, str) or not sub.strip():
        raise ValueError("Missing Cognito sub claim.")
    return sub.strip()


def username_from_claims(claims: dict) -> str | None:
    for key in ("username", "cognito:username"):
        value = claims.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None
