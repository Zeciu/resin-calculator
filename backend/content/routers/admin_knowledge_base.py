import os
from functools import lru_cache

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from auth.dependencies import require_administrator
from content.repositories.filesystem import FilesystemContentRepository
from content.schemas.knowledge_base import (
    CreateKnowledgeBaseEntryRequest,
    KnowledgeBaseEntryListItem,
    KnowledgeBaseEntryMeta,
    KnowledgeBaseReferenceOption,
    KnowledgeBaseVariantBody,
    KnowledgeBaseVariantResponse,
    PublishKnowledgeBaseVariantResponse,
    SaveKnowledgeBaseVariantRequest,
)
from content.services.knowledge_base_entries import KnowledgeBaseEntryService
from content.services.knowledge_base_images import KnowledgeBaseImageService
from content.services.knowledge_base_publish import KnowledgeBasePublishService

router = APIRouter(prefix="/admin/knowledge-base/entries", tags=["admin-knowledge-base"])


@lru_cache
def get_repository() -> FilesystemContentRepository:
    return FilesystemContentRepository()


def get_entry_service() -> KnowledgeBaseEntryService:
    return KnowledgeBaseEntryService(get_repository())


def get_publish_service() -> KnowledgeBasePublishService:
    return KnowledgeBasePublishService(get_repository())


def get_image_service() -> KnowledgeBaseImageService:
    return KnowledgeBaseImageService(get_repository())


def _entry_not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="Knowledge Base entry not found.")


@router.post("/images", status_code=201)
async def upload_kb_image(
    file: UploadFile = File(...),
    _: dict = Depends(require_administrator),
    image_service: KnowledgeBaseImageService = Depends(get_image_service),
) -> dict[str, str]:
    try:
        url = await image_service.store_upload(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"url": url}


@router.get("/references/search", response_model=list[KnowledgeBaseReferenceOption])
def search_references(
    q: str = "",
    locale: str = "ro",
    _: dict = Depends(require_administrator),
    service: KnowledgeBaseEntryService = Depends(get_entry_service),
) -> list[KnowledgeBaseReferenceOption]:
    try:
        return service.search_references(q, locale)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=list[KnowledgeBaseEntryListItem])
def list_entries(
    locale: str = "ro",
    _: dict = Depends(require_administrator),
    service: KnowledgeBaseEntryService = Depends(get_entry_service),
) -> list[KnowledgeBaseEntryListItem]:
    return service.list_entries(locale)


@router.post("", response_model=KnowledgeBaseEntryMeta, status_code=201)
def create_entry(
    payload: CreateKnowledgeBaseEntryRequest,
    _: dict = Depends(require_administrator),
    service: KnowledgeBaseEntryService = Depends(get_entry_service),
) -> KnowledgeBaseEntryMeta:
    return service.create_entry(payload.title, payload.category, payload.difficulty)


@router.get("/{content_id}", response_model=KnowledgeBaseEntryMeta)
def get_entry(
    content_id: str,
    _: dict = Depends(require_administrator),
    service: KnowledgeBaseEntryService = Depends(get_entry_service),
) -> KnowledgeBaseEntryMeta:
    try:
        return service.get_entry_meta(content_id)
    except KeyError as exc:
        raise _entry_not_found() from exc


@router.delete("/{content_id}", status_code=204)
def delete_entry(
    content_id: str,
    _: dict = Depends(require_administrator),
    service: KnowledgeBaseEntryService = Depends(get_entry_service),
) -> None:
    try:
        service.delete_entry(content_id)
    except KeyError as exc:
        raise _entry_not_found() from exc


@router.get("/{content_id}/variants/{locale}", response_model=KnowledgeBaseVariantResponse)
def get_variant(
    content_id: str,
    locale: str,
    _: dict = Depends(require_administrator),
    service: KnowledgeBaseEntryService = Depends(get_entry_service),
) -> KnowledgeBaseVariantResponse:
    try:
        return service.get_variant(content_id, locale)
    except KeyError as exc:
        raise _entry_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{content_id}/variants/{locale}", response_model=KnowledgeBaseVariantResponse)
def save_variant(
    content_id: str,
    locale: str,
    payload: SaveKnowledgeBaseVariantRequest,
    _: dict = Depends(require_administrator),
    service: KnowledgeBaseEntryService = Depends(get_entry_service),
) -> KnowledgeBaseVariantResponse:
    try:
        return service.save_variant(
            content_id,
            locale,
            payload.category,
            payload.difficulty,
            KnowledgeBaseVariantBody.model_validate(payload.body.model_dump()),
        )
    except KeyError as exc:
        raise _entry_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{content_id}/variants/{locale}/publish", response_model=PublishKnowledgeBaseVariantResponse)
def publish_variant(
    content_id: str,
    locale: str,
    _: dict = Depends(require_administrator),
    publish_service: KnowledgeBasePublishService = Depends(get_publish_service),
) -> PublishKnowledgeBaseVariantResponse:
    try:
        return publish_service.publish_variant(content_id, locale)
    except KeyError as exc:
        raise _entry_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{content_id}/variants/{locale}/unpublish", status_code=204)
def unpublish_variant(
    content_id: str,
    locale: str,
    _: dict = Depends(require_administrator),
    publish_service: KnowledgeBasePublishService = Depends(get_publish_service),
) -> None:
    try:
        publish_service.unpublish_variant(content_id, locale)
    except KeyError as exc:
        raise _entry_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def reset_repository_cache() -> None:
    get_repository.cache_clear()
    if "CONTENT_DATA_DIR" not in os.environ:
        return
    get_repository()
