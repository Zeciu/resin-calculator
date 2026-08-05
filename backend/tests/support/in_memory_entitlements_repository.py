"""In-memory EntitlementsRepository test double.

Production entitlement storage is DynamoDB-only (see
content.repositories.entitlements.DynamoDbEntitlementsRepository); there is no
filesystem fallback. Tests that previously constructed a filesystem-backed
repository as a lightweight fixture use this in-memory implementation of the
same EntitlementsRepository contract instead.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from content.repositories.entitlements import (
    EntitlementsRepository,
    VALID_STORED_ACCESS_TIERS,
    empty_entitlement_record,
    normalize_entitlement_record,
)


class InMemoryEntitlementsRepository(EntitlementsRepository):
    """Keeps entitlement records in a plain dict for the lifetime of a test."""

    def __init__(self, *_args: Any, **_kwargs: Any) -> None:
        # Accepts and ignores a positional argument (e.g. tmp_path) so it can
        # be dropped into fixtures that used to construct a filesystem-backed
        # repository with a directory path.
        self._records: dict[str, dict[str, Any]] = {}

    def get_record(self, user_id: str) -> dict[str, Any]:
        record = self._records.get(user_id)
        return deepcopy(record) if record is not None else empty_entitlement_record()

    def save_record(self, user_id: str, record: dict[str, Any]) -> dict[str, Any]:
        normalized = normalize_entitlement_record(record)
        if normalized["accessTier"] not in VALID_STORED_ACCESS_TIERS:
            raise ValueError(f"Unsupported access tier: {normalized['accessTier']}")
        self._records[user_id] = deepcopy(normalized)
        return deepcopy(normalized)

    def get_access_tier(self, user_id: str) -> str | None:
        record = self._records.get(user_id)
        if record is None:
            return None
        tier = record.get("accessTier")
        return tier if tier in VALID_STORED_ACCESS_TIERS else None

    def save_access_tier(self, user_id: str, access_tier: str) -> str:
        if access_tier not in VALID_STORED_ACCESS_TIERS:
            raise ValueError(f"Unsupported access tier: {access_tier}")
        record = self.get_record(user_id)
        record["accessTier"] = access_tier
        saved = self.save_record(user_id, record)
        return saved["accessTier"]

    def find_user_id_by_stripe_customer_id(self, stripe_customer_id: str) -> str | None:
        if not isinstance(stripe_customer_id, str) or not stripe_customer_id.strip():
            return None
        customer_id = stripe_customer_id.strip()
        for user_id, record in self._records.items():
            if record.get("stripeCustomerId") == customer_id:
                return user_id
        return None
