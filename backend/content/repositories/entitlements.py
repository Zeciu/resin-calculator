from abc import ABC, abstractmethod
from pathlib import Path
import json
import os
import re

VALID_STORED_ACCESS_TIERS = frozenset({"free", "subscriber"})


def _safe_user_id(user_id: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9._-]+", "_", user_id.strip())
    return normalized or "anonymous"


class EntitlementsRepository(ABC):
    @abstractmethod
    def get_access_tier(self, user_id: str) -> str | None:
        raise NotImplementedError

    @abstractmethod
    def save_access_tier(self, user_id: str, access_tier: str) -> str:
        raise NotImplementedError


class FilesystemEntitlementsRepository(EntitlementsRepository):
    """Local development storage for commercial access tier; DynamoDB-ready interface."""

    def __init__(self, data_dir: Path | None = None) -> None:
        root = data_dir or Path(os.environ.get("CONTENT_DATA_DIR", Path(__file__).resolve().parents[2] / "data"))
        self._entitlements_dir = root / "entitlements"
        self._entitlements_dir.mkdir(parents=True, exist_ok=True)

    def _path_for_user(self, user_id: str) -> Path:
        return self._entitlements_dir / f"{_safe_user_id(user_id)}.json"

    def get_access_tier(self, user_id: str) -> str | None:
        path = self._path_for_user(user_id)
        if not path.is_file():
            return None
        payload = json.loads(path.read_text(encoding="utf-8"))
        tier = payload.get("accessTier")
        if tier in VALID_STORED_ACCESS_TIERS:
            return tier
        return None

    def save_access_tier(self, user_id: str, access_tier: str) -> str:
        if access_tier not in VALID_STORED_ACCESS_TIERS:
            raise ValueError(f"Unsupported access tier: {access_tier}")
        path = self._path_for_user(user_id)
        path.write_text(
            json.dumps({"accessTier": access_tier}, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        return access_tier
