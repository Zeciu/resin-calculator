import os
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from content.repositories.filesystem import FilesystemContentRepository
from content.schemas.manual import PublicManualResponse
from content.services.manual_images import ManualImageService
from content.services.manual_public import ManualPublicService

router = APIRouter(prefix="/content", tags=["public-content"])


@lru_cache
def get_repository() -> FilesystemContentRepository:
    return FilesystemContentRepository()


def get_public_service() -> ManualPublicService:
    return ManualPublicService(get_repository())


def get_image_service() -> ManualImageService:
    return ManualImageService(get_repository())


@router.get("/manual", response_model=PublicManualResponse)
def get_published_manual(
    locale: str = "en",
    service: ManualPublicService = Depends(get_public_service),
) -> PublicManualResponse:
    try:
        return service.get_published_manual(locale)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/manual/images/{filename}")
def get_manual_image(
    filename: str,
    image_service: ManualImageService = Depends(get_image_service),
) -> FileResponse:
    try:
        image_path, media_type = image_service.resolve_public_image(filename)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Image not found.") from exc
    return FileResponse(image_path, media_type=media_type)


def reset_repository_cache() -> None:
    get_repository.cache_clear()
    if "CONTENT_DATA_DIR" not in os.environ:
        return
    get_repository()
