def user_id_from_claims(claims: dict) -> str:
    sub = claims.get("sub")
    if not isinstance(sub, str) or not sub.strip():
        raise ValueError("Missing Cognito sub claim.")
    return sub.strip()
