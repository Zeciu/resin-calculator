import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from content.repositories.entitlements import FilesystemEntitlementsRepository
from content.routers.me import get_entitlements_repository, get_capability_resolver, router as me_router
from product.capabilities.catalog import CAPABILITY_CATALOG, validate_catalog
from product.capabilities.resolver import CapabilityResolver
from product.capabilities.schema import CAPABILITY_KEYS


@pytest.fixture
def capabilities_client(tmp_path, monkeypatch):
    monkeypatch.setenv("AUTH_MODE", "mock")
    monkeypatch.delenv("CAPABILITY_DEV_ACCESS_TIER", raising=False)
    repository = FilesystemEntitlementsRepository(tmp_path)
    resolver = CapabilityResolver(repository)
    app = FastAPI()
    app.include_router(me_router, prefix="/api")
    app.dependency_overrides[get_entitlements_repository] = lambda: repository
    app.dependency_overrides[get_capability_resolver] = lambda: resolver
    with TestClient(app) as client:
        yield client, repository, resolver


def user_headers(user_id: str = "user-a", role: str = "user", access_tier: str | None = None) -> dict[str, str]:
    headers = {"X-Mock-User-Id": user_id, "X-Mock-Role": role}
    if access_tier is not None:
        headers["X-Mock-Access-Tier"] = access_tier
    return headers


class TestCapabilityCatalog:
    def test_catalog_validates_all_tiers(self):
        validate_catalog()

    def test_all_tiers_define_every_registered_key(self):
        for tier in ("free", "subscriber", "administrator_unlimited"):
            assert set(CAPABILITY_CATALOG[tier].keys()) == set(CAPABILITY_KEYS)


class TestCapabilityResolver:
    def test_free_tier_resolves_correctly(self, capabilities_client):
        client, _repository, _resolver = capabilities_client
        response = client.get("/api/me/capabilities", headers=user_headers(access_tier="free"))
        assert response.status_code == 200
        payload = response.json()
        assert payload["role"] == "user"
        assert payload["accessTier"] == "free"
        assert payload["capabilities"]["calculator.maxPolygonPoints"] == 4
        assert payload["capabilities"]["calculator.pdfExport"] is False
        assert payload["capabilities"]["calculator.exportFormat"] == "none"
        assert payload["capabilities"]["calculator.formworkMode"] == "rectangle"
        assert payload["capabilities"]["projects.maxSavedProjects"] == 3
        assert payload["capabilities"]["ai.maxRequestsPerDay"] == 0

    def test_subscriber_tier_resolves_correctly(self, capabilities_client):
        client, _repository, _resolver = capabilities_client
        response = client.get("/api/me/capabilities", headers=user_headers(access_tier="subscriber"))
        assert response.status_code == 200
        payload = response.json()
        assert payload["accessTier"] == "subscriber"
        assert payload["capabilities"]["calculator.maxPolygonPoints"] is None
        assert payload["capabilities"]["calculator.pdfExport"] is True
        assert payload["capabilities"]["calculator.exportFormat"] == "pdf_and_csv"
        assert payload["capabilities"]["calculator.formworkMode"] == "advanced"
        assert payload["capabilities"]["projects.maxSavedProjects"] is None
        assert payload["capabilities"]["ai.maxRequestsPerDay"] == 50

    def test_administrator_role_resolves_to_administrator_unlimited(self, capabilities_client):
        client, _repository, _resolver = capabilities_client
        response = client.get(
            "/api/me/capabilities",
            headers=user_headers(role="administrator", access_tier="free"),
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["role"] == "administrator"
        assert payload["accessTier"] == "administrator_unlimited"
        assert payload["capabilities"]["calculator.maxPolygonPoints"] is None
        assert payload["capabilities"]["ai.maxRequestsPerDay"] is None

    def test_unknown_tier_fails_safely_to_free(self, capabilities_client):
        client, repository, _resolver = capabilities_client
        repository.save_access_tier("stored-user", "free")
        repository._path_for_user("stored-user").write_text('{"accessTier": "legacy-premium"}', encoding="utf-8")
        response = client.get("/api/me/capabilities", headers=user_headers(user_id="stored-user"))
        assert response.status_code == 200
        assert response.json()["accessTier"] == "free"

    def test_stored_subscriber_tier_is_used(self, capabilities_client):
        client, repository, _resolver = capabilities_client
        repository.save_access_tier("subscriber-user", "subscriber")
        response = client.get("/api/me/capabilities", headers=user_headers(user_id="subscriber-user"))
        assert response.status_code == 200
        assert response.json()["accessTier"] == "subscriber"

    def test_enum_capabilities_validate(self):
        validate_catalog()
        assert CAPABILITY_CATALOG["free"]["calculator.formworkMode"] in {"rectangle", "advanced"}
        assert CAPABILITY_CATALOG["subscriber"]["calculator.exportFormat"] in {"none", "pdf", "pdf_and_csv"}

    def test_numeric_unlimited_values_validate(self):
        validate_catalog()
        assert CAPABILITY_CATALOG["subscriber"]["projects.maxSavedProjects"] is None
        assert CAPABILITY_CATALOG["administrator_unlimited"]["ai.maxRequestsPerDay"] is None


class TestCognitoRoleResolution:
    def test_administrators_group_maps_to_administrator_role(self):
        from auth.cognito import role_from_claims

        assert role_from_claims({"sub": "abc", "cognito:groups": ["administrators"]}) == "administrator"
        assert role_from_claims({"sub": "abc", "cognito:groups": ["users"]}) == "user"
        assert role_from_claims({"sub": "abc"}) == "user"
