import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from public.routers.me import get_entitlements_repository, get_capability_resolver, router as me_router
from public.auth.dependencies import get_current_user
from public.product.capabilities.catalog import CAPABILITY_CATALOG, validate_catalog
from public.product.capabilities.resolver import CapabilityResolver
from public.product.capabilities.schema import CAPABILITY_KEYS
from tests.support.in_memory_entitlements_repository import InMemoryEntitlementsRepository


@pytest.fixture
def capabilities_client():
    repository = InMemoryEntitlementsRepository()
    resolver = CapabilityResolver(repository)
    app = FastAPI()
    app.include_router(me_router, prefix="/api")
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-a", "role": "user"}
    app.dependency_overrides[get_entitlements_repository] = lambda: repository
    app.dependency_overrides[get_capability_resolver] = lambda: resolver
    with TestClient(app) as client:
        yield client, repository, resolver


def user_headers(user_id: str = "user-a") -> dict[str, str]:
    # The public application has no administrator role or entitlement bypass;
    # identity is overridden via app.dependency_overrides[get_current_user] in
    # this fixture rather than via headers, matching the real Cognito-only
    # get_current_user contract.
    return {}


class TestCapabilityCatalog:
    def test_catalog_validates_all_tiers(self):
        validate_catalog()

    def test_all_tiers_define_every_registered_key(self):
        for tier in ("free", "subscriber"):
            assert set(CAPABILITY_CATALOG[tier].keys()) == set(CAPABILITY_KEYS)


class TestCapabilityResolver:
    def test_free_tier_resolves_correctly(self, capabilities_client):
        client, repository, _resolver = capabilities_client
        repository.save_access_tier("user-a", "free")
        response = client.get("/api/me/capabilities", headers=user_headers())
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
        client, repository, _resolver = capabilities_client
        repository.save_access_tier("user-a", "subscriber")
        response = client.get("/api/me/capabilities", headers=user_headers())
        assert response.status_code == 200
        payload = response.json()
        assert payload["accessTier"] == "subscriber"
        assert payload["capabilities"]["calculator.maxPolygonPoints"] is None
        assert payload["capabilities"]["calculator.pdfExport"] is True
        assert payload["capabilities"]["calculator.exportFormat"] == "pdf_and_csv"
        assert payload["capabilities"]["calculator.formworkMode"] == "advanced"
        assert payload["capabilities"]["projects.maxSavedProjects"] is None
        assert payload["capabilities"]["ai.maxRequestsPerDay"] == 50

    def test_unknown_tier_fails_safely_to_free(self, capabilities_client):
        client, repository, _resolver = capabilities_client
        repository.save_record("user-a", {"accessTier": "legacy-premium"})
        response = client.get("/api/me/capabilities", headers=user_headers())
        assert response.status_code == 200
        assert response.json()["accessTier"] == "free"

    def test_knowledge_base_entry_limit_supports_free_and_unlimited_tiers(self):
        from public.product.capabilities.knowledge_base import limit_knowledge_base_entries

        entries = ["one", "two", "three"]
        assert limit_knowledge_base_entries(entries, 2) == ["one", "two"]
        assert limit_knowledge_base_entries(entries, None) == entries
