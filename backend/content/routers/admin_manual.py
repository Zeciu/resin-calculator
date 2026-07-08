import os
from functools import lru_cache

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from auth.dependencies import require_administrator
from content.repositories.filesystem import FilesystemContentRepository
from content.schemas.manual import (
    CreateManualChapterRequest,
    ManualChapterListItem,
    ManualChapterMeta,
    ManualVariantBody,
    ManualVariantResponse,
    PublishManualVariantResponse,
    ReorderManualChaptersRequest,
    SaveManualVariantRequest,
)
from content.services.manual_chapters import ManualChapterService
from content.services.manual_images import ManualImageService
from content.services.manual_publish import ManualPublishService

router = APIRouter(prefix="/admin/manual/chapters", tags=["admin-manual"])


@lru_cache
def get_repository() -> FilesystemContentRepository:
    return FilesystemContentRepository()


def get_chapter_service() -> ManualChapterService:
    return ManualChapterService(get_repository())


def get_publish_service() -> ManualPublishService:
    return ManualPublishService(get_repository())


def get_image_service() -> ManualImageService:
    return ManualImageService(get_repository())


def _chapter_not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="Chapter not found.")


@router.post("/images", status_code=201)
async def upload_manual_image(
    file: UploadFile = File(...),
    _: dict = Depends(require_administrator),
    image_service: ManualImageService = Depends(get_image_service),
) -> dict[str, str]:
    try:
        url = await image_service.store_upload(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"url": url}


@router.get("", response_model=list[ManualChapterListItem])
def list_chapters(
    locale: str = "en",
    _: dict = Depends(require_administrator),
    service: ManualChapterService = Depends(get_chapter_service),
) -> list[ManualChapterListItem]:
    return service.list_chapters(locale)


@router.post("", response_model=ManualChapterMeta, status_code=201)
def create_chapter(
    payload: CreateManualChapterRequest,
    _: dict = Depends(require_administrator),
    service: ManualChapterService = Depends(get_chapter_service),
) -> ManualChapterMeta:
    return service.create_chapter(payload.title, payload.locale)


@router.post("/reorder", status_code=204)
def reorder_chapters(
    payload: ReorderManualChaptersRequest,
    _: dict = Depends(require_administrator),
    service: ManualChapterService = Depends(get_chapter_service),
) -> None:
    try:
        service.reorder_chapters(payload.chapterIds)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{content_id}", response_model=ManualChapterMeta)
def get_chapter(
    content_id: str,
    _: dict = Depends(require_administrator),
    service: ManualChapterService = Depends(get_chapter_service),
) -> ManualChapterMeta:
    try:
        return service.get_chapter_meta(content_id)
    except KeyError as exc:
        raise _chapter_not_found() from exc


@router.delete("/{content_id}", status_code=204)
def delete_chapter(
    content_id: str,
    _: dict = Depends(require_administrator),
    service: ManualChapterService = Depends(get_chapter_service),
) -> None:
    try:
        service.delete_chapter(content_id)
    except KeyError as exc:
        raise _chapter_not_found() from exc


@router.get("/{content_id}/variants/{locale}", response_model=ManualVariantResponse)
def get_variant(
    content_id: str,
    locale: str,
    _: dict = Depends(require_administrator),
    service: ManualChapterService = Depends(get_chapter_service),
) -> ManualVariantResponse:
    try:
        return service.get_variant(content_id, locale)
    except KeyError as exc:
        raise _chapter_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{content_id}/variants/{locale}", response_model=ManualVariantResponse)
def save_variant(
    content_id: str,
    locale: str,
    payload: SaveManualVariantRequest,
    _: dict = Depends(require_administrator),
    service: ManualChapterService = Depends(get_chapter_service),
) -> ManualVariantResponse:
    try:
        return service.save_variant(content_id, locale, ManualVariantBody.model_validate(payload.body.model_dump()))
    except KeyError as exc:
        raise _chapter_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{content_id}/variants/{locale}/publish", response_model=PublishManualVariantResponse)
def publish_variant(
    content_id: str,
    locale: str,
    _: dict = Depends(require_administrator),
    publish_service: ManualPublishService = Depends(get_publish_service),
) -> PublishManualVariantResponse:
    try:
        return publish_service.publish_variant(content_id, locale)
    except KeyError as exc:
        raise _chapter_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{content_id}/variants/{locale}/unpublish", status_code=204)
def unpublish_variant(
    content_id: str,
    locale: str,
    _: dict = Depends(require_administrator),
    publish_service: ManualPublishService = Depends(get_publish_service),
) -> None:
    try:
        publish_service.unpublish_variant(content_id, locale)
    except KeyError as exc:
        raise _chapter_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def reset_repository_cache() -> None:
    get_repository.cache_clear()
    if "CONTENT_DATA_DIR" not in os.environ:
        return
    get_repository()
