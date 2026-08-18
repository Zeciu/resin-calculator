import pytest

from public.product.capabilities.resolver import CapabilityResolver
from public.product.entitlements import EntitlementsServiceUnavailableError
from public.routers import me
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

    def test_entitlement_service_failure_returns_controlled_503(self, client):
        class UnavailableEntitlementsRepository:
            def get_access_tier(self, _user_id):
                raise EntitlementsServiceUnavailableError("DynamoDB is unavailable.")

        from app import app

        app.dependency_overrides[me.get_capability_resolver] = lambda: CapabilityResolver(
            UnavailableEntitlementsRepository()
        )
        try:
            response = client.get("/api/me/capabilities")
        finally:
            app.dependency_overrides.pop(me.get_capability_resolver, None)

        assert response.status_code == 503
        assert response.json() == {
            "detail": "Subscription access is temporarily unavailable. Please retry shortly."
        }
