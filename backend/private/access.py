"""Compatibility dependency for local editorial routes without special authorization."""

from __future__ import annotations


def require_local_editorial_access() -> None:
    """Add no role or entitlement requirement to a local editorial route.

    The public application's normal Cognito middleware still requires an
    authenticated user. Any authenticated local user may use editorial routes.
    """
    return None
