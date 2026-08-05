"""Helper for exercising routes behind public.app's Cognito auth middleware in tests.

public.app has no mock-auth fallback: cognito_auth_middleware verifies a real
Bearer token against Cognito's JWKS on every protected path. Tests that need an
authenticated request patch the same two seams
tests/auth/test_auth_mode_activation.py already relies on (``_get_jwks`` and
``jose.jwt.decode``) so the actual middleware logic runs end-to-end against a
fake-but-well-formed token, instead of bypassing auth entirely or relying on
dead mock headers (``X-Mock-Role`` / ``X-Mock-User-Id``, which public.app never
reads).
"""

from __future__ import annotations

from contextlib import ExitStack, contextmanager
from types import ModuleType
from typing import Iterator
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

AUTHORIZED_HEADERS = {"Authorization": "Bearer test-token"}


def _resolve_public_app_module(app_module: ModuleType | None) -> ModuleType:
    """Resolve the real ``public.app`` module.

    The top-level ``app`` compatibility shim (``import app``) re-exports
    public.app's public names via ``from public.app import *``, but that does
    not re-export underscore-prefixed internals such as ``_get_jwks``. Any
    module produced by loading ``backend/app.py`` (directly, or via
    ``importlib`` under a different module name) needs the same treatment, so
    callers may pass such a module explicitly; it is used only to read
    ``_COGNITO_ISSUER``/``_COGNITO_CLIENT_ID`` if present, and patches always
    target the shared ``public.app`` module since that is where the actual
    middleware closures/state live for the process-wide FastAPI ``app``
    instance most tests import.
    """
    import public.app as public_app_module

    return app_module if app_module is not None and hasattr(app_module, "_get_jwks") else public_app_module


@contextmanager
def authenticated_app(app_module: ModuleType | None = None, *, sub: str = "test-user") -> Iterator[None]:
    """Make public.app's Cognito auth middleware accept AUTHORIZED_HEADERS.

    ``app_module`` is optional. Pass it when a test loaded its own copy of
    ``public.app`` (for example via ``importlib.util.spec_from_file_location``)
    so patches target that specific module instance rather than the shared
    ``public.app`` singleton. Patches are scoped to the ``with`` block.
    """
    target = _resolve_public_app_module(app_module)
    claims = {
        "sub": sub,
        "iss": target._COGNITO_ISSUER,
        "token_use": "access",
        "client_id": target._COGNITO_CLIENT_ID,
    }
    with ExitStack() as stack:
        stack.enter_context(patch.object(target, "_AUTH_ENABLED", True))
        stack.enter_context(
            patch.object(
                target,
                "_get_jwks",
                AsyncMock(return_value={"keys": [{"kty": "RSA", "kid": "test-key"}]}),
            )
        )
        stack.enter_context(patch.object(target.jwt, "decode", return_value=claims))
        yield


class AuthenticatedTestClient(TestClient):
    """A TestClient that keeps public.app's Cognito middleware patched open.

    Use this in place of ``TestClient(app)`` wherever a test fixture previously
    built an unauthenticated client against the real app. The patches applied
    by :func:`authenticated_app` are entered on construction and exited when
    the client is closed (directly, or via ``with``/fixture teardown), so
    every request made through this client is treated as authenticated
    without each call site needing to pass a bearer token or manage patches.
    """

    def __init__(self, app, *args, app_module: ModuleType | None = None, sub: str = "test-user", **kwargs):
        super().__init__(app, *args, **kwargs)
        self.headers.update(AUTHORIZED_HEADERS)
        self._auth_patch_stack = ExitStack()
        self._auth_patch_stack.enter_context(authenticated_app(app_module, sub=sub))

    def close(self) -> None:
        self._auth_patch_stack.close()
        super().close()
