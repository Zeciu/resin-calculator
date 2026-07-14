ADMIN_COGNITO_GROUP = "administrators"


def role_from_claims(claims: dict) -> str:
    groups = claims.get("cognito:groups") or []
    if ADMIN_COGNITO_GROUP in groups:
        return "administrator"
    return "user"


def user_id_from_claims(claims: dict) -> str:
    sub = claims.get("sub")
    if not isinstance(sub, str) or not sub.strip():
        raise ValueError("Missing Cognito sub claim.")
    return sub.strip()
