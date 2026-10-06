"""Temporary launch promotion: every new user gets 3 months of subscriber access.

On the first authenticated request from a user without an entitlement record,
a record `{accessTier: "subscriber", grantExpiresAt: now + 3 months}` is
created. Existing records are never modified.

To end the promotion, stop wiring PromoGrantService into the CapabilityResolver
(see `capability_resolver_with_promo_grants`) and delete this module.
"""

from __future__ import annotations

from calendar import monthrange
from collections.abc import Callable
from datetime import datetime, timezone

from public.product.entitlements import EntitlementsRepository

PROMO_GRANT_MONTHS = 3
PROMO_ACCESS_TIER = "subscriber"


def add_calendar_months(value: datetime, months: int) -> datetime:
    """Add calendar months, clamping the day to the last day of the target month."""
    if months < 0:
        raise ValueError("months must be non-negative.")
    utc_value = _as_utc(value)
    month_index = utc_value.month - 1 + months
    year = utc_value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(utc_value.day, monthrange(year, month)[1])
    return utc_value.replace(year=year, month=month, day=day)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PromoGrantService:
    def __init__(
        self,
        entitlements: EntitlementsRepository,
        *,
        now: Callable[[], datetime] | None = None,
    ) -> None:
        self._entitlements = entitlements
        self._now = now or _utc_now

    def ensure_for_user(self, user_id: str) -> None:
        if not isinstance(user_id, str) or not user_id.strip():
            return
        if self._entitlements.record_exists(user_id):
            return
        expires_at = int(add_calendar_months(self._now(), PROMO_GRANT_MONTHS).timestamp())
        # Conditional create: a concurrent request or an existing record wins.
        self._entitlements.create_record_if_absent(user_id, PROMO_ACCESS_TIER, expires_at)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
