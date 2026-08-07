from public.product.entitlements import EntitlementsRepository

from .catalog import catalog_for_tier
from .schema import CATALOG_VERSION, CapabilitiesResponse

COMMERCIAL_ACCESS_TIERS = frozenset({"free", "subscriber"})


def normalize_commercial_access_tier(access_tier: str | None) -> str:
    return access_tier if access_tier in COMMERCIAL_ACCESS_TIERS else "free"


class CapabilityResolver:
    def __init__(self, entitlements_repository: EntitlementsRepository) -> None:
        self._entitlements = entitlements_repository

    def resolve(self, user_id: str, role: str = "user") -> CapabilitiesResponse:
        # `role` is retained as an ignored compatibility argument while callers
        # migrate. Customer capability decisions are entitlement-only.
        access_tier = normalize_commercial_access_tier(
            self._entitlements.get_access_tier(user_id)
        )
        return CapabilitiesResponse(
            role="user",
            accessTier=access_tier,
            catalogVersion=CATALOG_VERSION,
            capabilities=catalog_for_tier(access_tier),
        )
