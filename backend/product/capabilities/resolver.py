import os

from auth.dependencies import auth_mode
from content.repositories.entitlements import EntitlementsRepository

from .catalog import catalog_for_tier
from .schema import CATALOG_VERSION, CapabilitiesResponse

COMMERCIAL_ACCESS_TIERS = frozenset({"free", "subscriber"})


def dev_access_tier_override() -> str | None:
    if auth_mode() != "mock":
        return None
    override = os.environ.get("CAPABILITY_DEV_ACCESS_TIER", "").strip().lower()
    if override in COMMERCIAL_ACCESS_TIERS:
        return override
    return None


def normalize_commercial_access_tier(access_tier: str | None) -> str:
    if access_tier in COMMERCIAL_ACCESS_TIERS:
        return access_tier
    return "free"


class CapabilityResolver:
    def __init__(self, entitlements_repository: EntitlementsRepository) -> None:
        self._entitlements = entitlements_repository

    def resolve(
        self,
        user_id: str,
        role: str,
        mock_access_tier: str | None = None,
    ) -> CapabilitiesResponse:
        if role == "administrator":
            access_tier = "administrator_unlimited"
            capabilities = catalog_for_tier(access_tier)
            return CapabilitiesResponse(
                role="administrator",
                accessTier=access_tier,
                catalogVersion=CATALOG_VERSION,
                capabilities=capabilities,
            )

        stored_tier = self._resolve_commercial_tier(user_id, mock_access_tier)
        capabilities = catalog_for_tier(stored_tier)
        return CapabilitiesResponse(
            role="user",
            accessTier=stored_tier,
            catalogVersion=CATALOG_VERSION,
            capabilities=capabilities,
        )

    def _resolve_commercial_tier(self, user_id: str, mock_access_tier: str | None) -> str:
        if mock_access_tier in COMMERCIAL_ACCESS_TIERS:
            return mock_access_tier

        dev_override = dev_access_tier_override()
        if dev_override is not None:
            return dev_override

        stored = self._entitlements.get_access_tier(user_id)
        return normalize_commercial_access_tier(stored)
