from abc import ABC, abstractmethod
from pathlib import Path

import json
import re

from content.repositories.filesystem import commercial_data_root
from content.schemas.preferences import UserPreferences


class PreferencesRepository(ABC):
    @abstractmethod
    def get_preferences(self, user_id: str) -> UserPreferences | None:
        raise NotImplementedError

    @abstractmethod
    def save_preferences(self, user_id: str, preferences: UserPreferences) -> UserPreferences:
        raise NotImplementedError


def _safe_user_id(user_id: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9._-]+", "_", user_id.strip())
    return normalized or "anonymous"


class FilesystemPreferencesRepository(PreferencesRepository):
    """Local development storage compatible with future DynamoDB keying by user id."""

    def __init__(self, data_dir: Path | None = None) -> None:
        root = Path(data_dir) if data_dir is not None else commercial_data_root()
        self._preferences_dir = root / "preferences"
        self._preferences_dir.mkdir(parents=True, exist_ok=True)

    def _path_for_user(self, user_id: str) -> Path:
        return self._preferences_dir / f"{_safe_user_id(user_id)}.json"

    def get_preferences(self, user_id: str) -> UserPreferences | None:
        path = self._path_for_user(user_id)
        if not path.is_file():
            return None
        payload = json.loads(path.read_text(encoding="utf-8"))
        return UserPreferences.model_validate(payload)

    def save_preferences(self, user_id: str, preferences: UserPreferences) -> UserPreferences:
        path = self._path_for_user(user_id)
        path.write_text(
            json.dumps(preferences.model_dump(), indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        return preferences
