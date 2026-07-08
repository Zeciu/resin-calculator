from fastapi import APIRouter, Depends

from auth.dependencies import get_current_user
from content.repositories.preferences import FilesystemPreferencesRepository, PreferencesRepository
from content.schemas.preferences import UpdateUserPreferencesRequest, UserPreferencesResponse
from content.services.preferences import PreferencesService

router = APIRouter(prefix="/preferences", tags=["preferences"])


def get_preferences_repository() -> PreferencesRepository:
    return FilesystemPreferencesRepository()


def get_preferences_service() -> PreferencesService:
    return PreferencesService(get_preferences_repository())


@router.get("", response_model=UserPreferencesResponse)
def get_user_preferences(
    user: dict = Depends(get_current_user),
    service: PreferencesService = Depends(get_preferences_service),
) -> UserPreferencesResponse:
    return service.get_preferences(user["id"])


@router.put("", response_model=UserPreferencesResponse)
def update_user_preferences(
    request: UpdateUserPreferencesRequest,
    user: dict = Depends(get_current_user),
    service: PreferencesService = Depends(get_preferences_service),
) -> UserPreferencesResponse:
    return service.update_preferences(user["id"], request)
