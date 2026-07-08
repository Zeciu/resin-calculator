import pytest
from fastapi.testclient import TestClient

from content.routers import admin_manual


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    monkeypatch.delenv("CAPABILITY_DEV_ACCESS_TIER", raising=False)
    admin_manual.reset_repository_cache()
    from app import app

    return TestClient(app)


def admin_headers(role: str = "administrator") -> dict[str, str]:
    return {
        "X-Mock-Role": role,
        "X-Mock-User-Id": "admin-user",
    }


class TestAdminApiAuthorization:
    def test_non_admin_rejected_from_admin_api(self, client):
        response = client.get("/api/admin/manual/chapters", headers=admin_headers("user"))
        assert response.status_code == 403

    def test_admin_allowed_on_admin_api(self, client):
        response = client.get("/api/admin/manual/chapters", headers=admin_headers("administrator"))
        assert response.status_code == 200


class TestCapabilitiesApi:
    def test_capabilities_endpoint_returns_payload(self, client):
        response = client.get(
            "/api/me/capabilities",
            headers={"X-Mock-User-Id": "user-a", "X-Mock-Role": "user", "X-Mock-Access-Tier": "free"},
        )
        assert response.status_code == 200
        payload = response.json()
        assert "capabilities" in payload
        assert payload["accessTier"] == "free"
        assert payload["catalogVersion"] == 1
