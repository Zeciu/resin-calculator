from collections.abc import Callable
from typing import Any
import time

from public.product.entitlements import EntitlementsRepository
from public.product.promo_grant import PromoGrantService

from .catalog import catalog_for_tier
from .schema import CATALOG_VERSION, CapabilitiesResponse

COMMERCIAL_ACCESS_TIERS = frozenset({"free", "subscriber"})


def unix_now() -> int:
    return int(time.time())


def normalize_commercial_access_tier(access_tier: str | None) -> str:
    return access_tier if access_tier in COMMERCIAL_ACCESS_TIERS else "free"


def resolve_effective_access_tier(record: dict[str, Any], *, now: int) -> str:
    """The stored accessTier, valid until grantExpiresAt (forever when absent)."""
    expires_at = record.get("grantExpiresAt")
    if isinstance(expires_at, int) and not isinstance(expires_at, bool) and expires_at <= now:
        return "free"
    return normalize_commercial_access_tier(record.get("accessTier"))


class CapabilityResolver:
    def __init__(
        self,
        entitlements_repository: EntitlementsRepository,
        *,
        now: Callable[[], int] | None = None,
        promo_grants: PromoGrantService | None = None,
    ) -> None:
        self._entitlements = entitlements_repository
        self._now = now or unix_now
        self._promo_grants = promo_grants

    def resolve(
        self,
        user_id: str,
        role: str = "user",
        *,
        username: str | None = None,
    ) -> CapabilitiesResponse:
        # `role` is retained as an ignored compatibility argument while callers
        # migrate. Customer capability decisions are entitlement-only.
        if self._promo_grants is not None:
            self._promo_grants.ensure_for_user(user_id)
        record = self._entitlements.get_record(user_id)
        access_tier = resolve_effective_access_tier(record, now=int(self._now()))
        return CapabilitiesResponse(
            role="user",
            accessTier=access_tier,
            catalogVersion=CATALOG_VERSION,
            capabilities=catalog_for_tier(access_tier),
        )


def capability_resolver_with_promo_grants(
    entitlements_repository: EntitlementsRepository,
    *,
    now: Callable[[], int] | None = None,
) -> CapabilityResolver:
    return CapabilityResolver(
        entitlements_repository,
        now=now,
        promo_grants=PromoGrantService(entitlements_repository),
    )
