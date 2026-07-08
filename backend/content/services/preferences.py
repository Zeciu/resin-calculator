from content.repositories.preferences import PreferencesRepository
from content.schemas.preferences import (
    DEFAULT_INTERFACE_LANGUAGE,
    DEFAULT_LENGTH_UNIT,
    DEFAULT_VOLUME_UNIT,
    UpdateUserPreferencesRequest,
    UserPreferences,
    UserPreferencesResponse,
)


class PreferencesService:
    def __init__(self, repository: PreferencesRepository) -> None:
        self._repository = repository

    def get_preferences(self, user_id: str) -> UserPreferencesResponse:
        stored = self._repository.get_preferences(user_id)
        if stored is None:
            return UserPreferencesResponse(
                interfaceLanguage=DEFAULT_INTERFACE_LANGUAGE,
                lengthUnit=DEFAULT_LENGTH_UNIT,
                volumeUnit=DEFAULT_VOLUME_UNIT,
                exists=False,
            )
        return UserPreferencesResponse(**stored.model_dump(), exists=True)

    def update_preferences(self, user_id: str, request: UpdateUserPreferencesRequest) -> UserPreferencesResponse:
        current = self._repository.get_preferences(user_id) or UserPreferences()
        updated = request.apply_to(current)
        saved = self._repository.save_preferences(user_id, updated)
        return UserPreferencesResponse(**saved.model_dump(), exists=True)
