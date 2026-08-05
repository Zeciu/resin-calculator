import pytest
from fastapi import HTTPException
from starlette.requests import Request

from public.auth.cognito import user_id_from_claims
from public.auth.dependencies import get_current_user


def _request_with_claims(claims):
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/me",
        "headers": [],
    }
    request = Request(scope)
    request.state.jwt_claims = claims
    return request


class TestUserIdFromClaims:
    def test_returns_trimmed_sub(self):
        assert user_id_from_claims({"sub": "  cognito-sub-123  "}) == "cognito-sub-123"

    def test_rejects_missing_sub(self):
        with pytest.raises(ValueError, match="Missing Cognito sub claim"):
            user_id_from_claims({})

    def test_rejects_empty_sub(self):
        with pytest.raises(ValueError, match="Missing Cognito sub claim"):
            user_id_from_claims({"sub": "   "})


class TestGetCurrentUserCognitoMode:
    def test_returns_sub_as_user_id(self, monkeypatch):
        monkeypatch.setenv("AUTH_MODE", "cognito")
        request = _request_with_claims(
            {
                "sub": "cognito-sub-123",
                "cognito:groups": ["users"],
            }
        )

        user = get_current_user(request)

        assert user["id"] == "cognito-sub-123"
        assert user["role"] == "user"

    def test_all_authenticated_identities_are_role_user(self, monkeypatch):
        # The public application has no administrator role or entitlement bypass;
        # every authenticated Cognito identity resolves to "user" regardless of
        # any cognito:groups claim.
        monkeypatch.setenv("AUTH_MODE", "cognito")
        request = _request_with_claims(
            {
                "sub": "admin-sub",
                "cognito:groups": ["administrators"],
            }
        )

        user = get_current_user(request)

        assert user["id"] == "admin-sub"
        assert user["role"] == "user"

    def test_rejects_missing_sub_claim(self, monkeypatch):
        monkeypatch.setenv("AUTH_MODE", "cognito")
        request = _request_with_claims({"cognito:groups": ["users"]})

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(request)

        assert exc_info.value.status_code == 401

    def test_rejects_empty_sub_claim(self, monkeypatch):
        monkeypatch.setenv("AUTH_MODE", "cognito")
        request = _request_with_claims({"sub": "   "})

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(request)

        assert exc_info.value.status_code == 401

    def test_rejects_missing_jwt_claims(self, monkeypatch):
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
