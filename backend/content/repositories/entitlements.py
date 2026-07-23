from __future__ import annotations

from abc import ABC, abstractmethod
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import json
import re

from content.repositories.filesystem import atomic_write_json, commercial_data_root

VALID_STORED_ACCESS_TIERS = frozenset({"free", "subscriber"})
VALID_COMMERCIAL_STATUSES = frozenset(
    {"none", "active", "past_due", "canceled", "incomplete"}
)
PROCESSED_EVENT_ID_LIMIT = 100
HFZWOOD_USER_METADATA_KEY = "hfzwood_user_id"


def _safe_user_id(user_id: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9._-]+", "_", user_id.strip())
    return normalized or "anonymous"


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


class FilesystemEntitlementsRepository(EntitlementsRepository):
    """EFS-backed commercial entitlement storage; one JSON file per authenticated user."""

    def __init__(self, data_dir: Path | None = None) -> None:
        root = Path(data_dir) if data_dir is not None else commercial_data_root()
        self._root = Path(root)
        self._entitlements_dir = self._root / "entitlements"
        self._entitlements_dir.mkdir(parents=True, exist_ok=True)
        self._customer_index_path = self._entitlements_dir / "_stripe_customers.json"

    def _path_for_user(self, user_id: str) -> Path:
        return self._entitlements_dir / f"{_safe_user_id(user_id)}.json"

    def _read_customer_index(self) -> dict[str, str]:
        if not self._customer_index_path.is_file():
            return {}
        try:
            payload = json.loads(self._customer_index_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}
        if not isinstance(payload, dict):
            return {}
        index: dict[str, str] = {}
        for customer_id, mapped_user_id in payload.items():
            if (
                isinstance(customer_id, str)
                and customer_id.strip()
                and isinstance(mapped_user_id, str)
                and mapped_user_id.strip()
            ):
                index[customer_id.strip()] = mapped_user_id.strip()
        return index

    def _write_customer_index(self, index: dict[str, str]) -> None:
        atomic_write_json(self._customer_index_path, dict(sorted(index.items())))

    def _update_customer_index(self, user_id: str, stripe_customer_id: str | None) -> None:
        index = self._read_customer_index()
        changed = False
        for existing_customer_id, mapped_user_id in list(index.items()):
            if mapped_user_id == user_id and existing_customer_id != stripe_customer_id:
                del index[existing_customer_id]
                changed = True
        if stripe_customer_id:
            if index.get(stripe_customer_id) != user_id:
                index[stripe_customer_id] = user_id
                changed = True
        if changed:
            self._write_customer_index(index)

    def get_record(self, user_id: str) -> dict[str, Any]:
        path = self._path_for_user(user_id)
        if not path.is_file():
            return empty_entitlement_record()
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return empty_entitlement_record()
        return normalize_entitlement_record(payload)

    def save_record(self, user_id: str, record: dict[str, Any]) -> dict[str, Any]:
        normalized = normalize_entitlement_record(record)
        if normalized["accessTier"] not in VALID_STORED_ACCESS_TIERS:
            raise ValueError(f"Unsupported access tier: {normalized['accessTier']}")
        normalized["updatedAt"] = _utc_now_iso()
        path = self._path_for_user(user_id)
        atomic_write_json(path, normalized)
        self._update_customer_index(user_id, normalized.get("stripeCustomerId"))
        return deepcopy(normalized)

    def get_access_tier(self, user_id: str) -> str | None:
        path = self._path_for_user(user_id)
        if not path.is_file():
            return None
        record = self.get_record(user_id)
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
        indexed = self._read_customer_index().get(customer_id)
        if indexed:
            return indexed
        # Fallback scan for records written before the index existed.
        for path in self._entitlements_dir.glob("*.json"):
            if path.name.startswith("_"):
                continue
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if isinstance(payload, dict) and payload.get("stripeCustomerId") == customer_id:
                return path.stem
        return None
