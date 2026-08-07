from __future__ import annotations

from abc import ABC, abstractmethod
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
import os


VALID_STORED_ACCESS_TIERS = frozenset({"free", "subscriber"})
VALID_COMMERCIAL_STATUSES = frozenset(
    {"none", "active", "past_due", "canceled", "incomplete"}
)
PROCESSED_EVENT_ID_LIMIT = 100
HFZWOOD_USER_METADATA_KEY = "hfzwood_user_id"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def empty_entitlement_record() -> dict[str, Any]:
    return {
        "accessTier": "free",
        "stripeCustomerId": None,
        "stripeSubscriptionId": None,
        "stripePriceId": None,
        "commercialStatus": "none",
        "currentPeriodEnd": None,
        "cancelAtPeriodEnd": False,
        "lastStripeEventId": None,
        "lastStripeEventCreated": None,
        "processedEventIds": [],
        "updatedAt": _utc_now_iso(),
    }


def normalize_entitlement_record(payload: dict[str, Any] | None) -> dict[str, Any]:
    record = empty_entitlement_record()
    if not isinstance(payload, dict):
        return record

    tier = payload.get("accessTier")
    if tier in VALID_STORED_ACCESS_TIERS:
        record["accessTier"] = tier

    for key in (
        "stripeCustomerId",
        "stripeSubscriptionId",
        "stripePriceId",
        "lastStripeEventId",
    ):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            record[key] = value.strip()

    status = payload.get("commercialStatus")
    if status in VALID_COMMERCIAL_STATUSES:
        record["commercialStatus"] = status

    period_end = payload.get("currentPeriodEnd")
    if isinstance(period_end, int) and period_end >= 0:
        record["currentPeriodEnd"] = period_end
    elif isinstance(period_end, float) and period_end >= 0:
        record["currentPeriodEnd"] = int(period_end)

    record["cancelAtPeriodEnd"] = bool(payload.get("cancelAtPeriodEnd", False))

    created = payload.get("lastStripeEventCreated")
    if isinstance(created, int) and created >= 0:
        record["lastStripeEventCreated"] = created
    elif isinstance(created, float) and created >= 0:
        record["lastStripeEventCreated"] = int(created)

    processed = payload.get("processedEventIds")
    if isinstance(processed, list):
        ids = [item.strip() for item in processed if isinstance(item, str) and item.strip()]
        record["processedEventIds"] = ids[-PROCESSED_EVENT_ID_LIMIT:]

    updated_at = payload.get("updatedAt")
    if isinstance(updated_at, str) and updated_at.strip():
        record["updatedAt"] = updated_at.strip()

    return record


class EntitlementsRepository(ABC):
    @abstractmethod
    def get_access_tier(self, user_id: str) -> str | None:
        raise NotImplementedError

    @abstractmethod
    def save_access_tier(self, user_id: str, access_tier: str) -> str:
        raise NotImplementedError

    @abstractmethod
    def get_record(self, user_id: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def save_record(self, user_id: str, record: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def find_user_id_by_stripe_customer_id(self, stripe_customer_id: str) -> str | None:
        raise NotImplementedError


ENTITLEMENTS_TABLE_NAME_ENV = "ENTITLEMENTS_TABLE_NAME"
STRIPE_CUSTOMER_ID_INDEX_NAME = "stripeCustomerId-index"


class DynamoDbEntitlementsRepository(EntitlementsRepository):
    """Production storage backed by a DynamoDB table keyed by `userId` (partition key).

    Uses the `stripeCustomerId-index` GSI for reverse lookup by Stripe customer id,
    replacing the filesystem-era hand-maintained customer index / fallback scan.
    """

    def __init__(self, table_name: str, resource=None) -> None:
        if not table_name or not table_name.strip():
            raise ValueError("table_name must be a non-empty string.")
        if resource is None:
            import boto3

            resource = boto3.resource("dynamodb")
        self._table = resource.Table(table_name)

    def get_record(self, user_id: str) -> dict[str, Any]:
        response = self._table.get_item(Key={"userId": user_id})
        item = response.get("Item")
        if item is None:
            return empty_entitlement_record()
        payload = {key: value for key, value in item.items() if key != "userId"}
        return normalize_entitlement_record(payload)

    def save_record(self, user_id: str, record: dict[str, Any]) -> dict[str, Any]:
        normalized = normalize_entitlement_record(record)
        if normalized["accessTier"] not in VALID_STORED_ACCESS_TIERS:
            raise ValueError(f"Unsupported access tier: {normalized['accessTier']}")
        normalized["updatedAt"] = _utc_now_iso()
        item = {"userId": user_id, **normalized}
        # DynamoDB rejects empty strings as GSI key attribute values; omit when unset
        # rather than writing None (attributes must be present with a real value or absent).
        if not item.get("stripeCustomerId"):
            item.pop("stripeCustomerId", None)
        self._table.put_item(Item=item)
        return deepcopy(normalized)

    def get_access_tier(self, user_id: str) -> str | None:
        response = self._table.get_item(Key={"userId": user_id})
        item = response.get("Item")
        if item is None:
            return None
        record = normalize_entitlement_record(
            {key: value for key, value in item.items() if key != "userId"}
        )
        tier = record.get("accessTier")
        if tier in VALID_STORED_ACCESS_TIERS:
            return tier
        return None

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
        response = self._table.query(
            IndexName=STRIPE_CUSTOMER_ID_INDEX_NAME,
            KeyConditionExpression="stripeCustomerId = :cid",
            ExpressionAttributeValues={":cid": customer_id},
            Limit=1,
        )
        items = response.get("Items") or []
        if not items:
            return None
        user_id = items[0].get("userId")
        return user_id if isinstance(user_id, str) and user_id.strip() else None


def get_entitlements_repository() -> EntitlementsRepository:
    """Return the required DynamoDB entitlement repository.

    Local and production environments both use DynamoDB. Missing configuration is
    an explicit startup/configuration error; filesystem entitlement persistence is
    intentionally unsupported.
    """
    table_name = os.environ.get(ENTITLEMENTS_TABLE_NAME_ENV, "").strip()
    if not table_name:
        raise RuntimeError(
            f"{ENTITLEMENTS_TABLE_NAME_ENV} must be configured; "
            "filesystem entitlement storage is not supported."
        )
    return DynamoDbEntitlementsRepository(table_name)