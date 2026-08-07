import pytest

from private.routers import admin_manual
from tests.support.authenticated_client import AuthenticatedTestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    admin_manual.reset_repository_cache()
    from app import app

    return AuthenticatedTestClient(app)


class TestCapabilitiesApi:
    def test_capabilities_endpoint_returns_payload(self, client):
        response = client.get("/api/me/capabilities")
        assert response.status_code == 200
        payload = response.json()
        assert "capabilities" in payload
        assert payload["accessTier"] == "free"
        assert payload["catalogVersion"] == 1
