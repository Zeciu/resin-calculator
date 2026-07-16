import os
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException
from starlette.requests import Request
from unittest.mock import patch, AsyncMock

from auth.dependencies import get_current_user

BACKEND_DIR = Path(__file__).resolve().parents[2]
CALCULATE_BODY = (
    '{"polygonPoints": [], "referenceMeasurements": [], "depthMm": 10}'
)


def _env(**updates) -> dict[str, str]:
    env = os.environ.copy()
    for key in (
        "AUTH_MODE",
        "COGNITO_USER_POOL_ID",
        "COGNITO_REGION",
        "COGNITO_CLIENT_ID",
    ):
        env.pop(key, None)
    for key, value in updates.items():
        if value is None:
            env.pop(key, None)
        else:
            env[key] = value
    env.setdefault("AUTH_MODE", "mock")
    env["PYTHONPATH"] = str(BACKEND_DIR)
    return env


def _run_backend_script(script: str, env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-c", script],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


MOCK_CALCULATOR_SCRIPT = f"""
from fastapi.testclient import TestClient
import app

client = TestClient(app.app)
response = client.post(
    "/calculate",
    content={CALCULATE_BODY!r},
    headers={{"Content-Type": "application/json"}},
)
print(response.status_code)
"""

COGNITO_STARTUP_SCRIPT = """
try:
    import app  # noqa: F401
except RuntimeError as exc:
    print(f"STARTUP_FAILED:{exc}")
else:
    print(f"STARTUP_OK:AUTH_ENABLED={app._AUTH_ENABLED}")
"""

COGNITO_MIDDLEWARE_SCRIPT = """
from fastapi.testclient import TestClient
import app

client = TestClient(app.app)
calc = client.post(
    "/calculate",
    content='{"polygonPoints": [], "referenceMeasurements": [], "depthMm": 10}',
    headers={"Content-Type": "application/json"},
)
me = client.get(
    "/api/me",
    headers={
        "X-Mock-User-Id": "stub-user",
        "X-Mock-Role": "administrator",
    },
)
print(f"CALC={calc.status_code}")
print(f"ME={me.status_code}")
print(f"AUTH_ENABLED={app._AUTH_ENABLED}")
"""


class TestAuthModeActivation:
    def test_mock_mode_without_cognito_variables(self):
        result = _run_backend_script(
            MOCK_CALCULATOR_SCRIPT,
            _env(AUTH_MODE="mock"),
        )

        assert result.returncode == 0, result.stderr
        assert result.stdout.strip() == "400"

    def test_mock_mode_with_cognito_variables_present(self):
        result = _run_backend_script(
            MOCK_CALCULATOR_SCRIPT,
            _env(
                AUTH_MODE="mock",
                COGNITO_USER_POOL_ID="eu-central-1_test",
                COGNITO_REGION="eu-central-1",
                COGNITO_CLIENT_ID="test-client",
            ),
        )

        assert result.returncode == 0, result.stderr
        assert result.stdout.strip() == "400"

    def test_cognito_mode_with_complete_configuration_activates_middleware(self):
        result = _run_backend_script(
            COGNITO_MIDDLEWARE_SCRIPT,
            _env(
                AUTH_MODE="cognito",
                COGNITO_USER_POOL_ID="eu-central-1_test",
                COGNITO_REGION="eu-central-1",
                COGNITO_CLIENT_ID="test-client",
            ),
        )

        assert result.returncode == 0, result.stderr
        assert "AUTH_ENABLED=True" in result.stdout
        assert "CALC=401" in result.stdout
        assert "ME=401" in result.stdout

    def test_cognito_mode_with_incomplete_configuration_fails_startup(self):
        result = _run_backend_script(
            COGNITO_STARTUP_SCRIPT,
            _env(
                AUTH_MODE="cognito",
                COGNITO_REGION="eu-central-1",
            ),
        )

        assert result.returncode == 0, result.stderr
        assert "STARTUP_FAILED:" in result.stdout
        assert "COGNITO_USER_POOL_ID" in result.stdout

    def test_cognito_mode_without_client_id_fails_startup(self):
        result = _run_backend_script(
            COGNITO_STARTUP_SCRIPT,
            _env(
                AUTH_MODE="cognito",
                COGNITO_USER_POOL_ID="eu-central-1_test",
                COGNITO_REGION="eu-central-1",
            ),
        )

        assert result.returncode == 0, result.stderr
        assert "STARTUP_FAILED:" in result.stdout
        assert "COGNITO_CLIENT_ID" in result.stdout


class TestCognitoModeIdentityGuards:
    def test_mock_headers_cannot_authenticate_in_cognito_mode(self, monkeypatch):
        monkeypatch.setenv("AUTH_MODE", "cognito")
        scope = {
            "type": "http",
            "method": "GET",
            "path": "/api/me",
            "headers": [
                (b"x-mock-user-id", b"stub-user"),
                (b"x-mock-role", b"administrator"),
            ],
        }
        request = Request(scope)

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(request)

        assert exc_info.value.status_code == 401

    def test_missing_bearer_token_rejected_when_middleware_enabled(self):
        from app import app
        from fastapi.testclient import TestClient

        client = TestClient(app)
        with patch("app._AUTH_ENABLED", True):
            response = client.post(
                "/calculate",
                json={
                    "polygonPoints": [],
                    "referenceMeasurements": [],
                    "depthMm": 10,
                },
            )

        assert response.status_code == 401

    def test_valid_bearer_token_passes_middleware_when_enabled(self):
        from app import app
        from fastapi.testclient import TestClient

        client = TestClient(app)
        with patch("app._AUTH_ENABLED", True), patch(
            "app._COGNITO_CLIENT_ID", "test-client"
        ), patch(
            "app._get_jwks",
            AsyncMock(return_value={"keys": [{"kty": "RSA", "kid": "test-key"}]}),
        ), patch(
            "app.jwt.decode",
            return_value={
                "sub": "user-123",
                "iss": "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_test",
                "token_use": "access",
                "client_id": "test-client",
            },
        ):
            response = client.post(
                "/calculate",
                json={
                    "polygonPoints": [],
                    "referenceMeasurements": [],
                    "depthMm": 10,
                },
                headers={"Authorization": "Bearer valid.token.here"},
            )

        assert response.status_code == 400
