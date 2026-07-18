import os
from functools import lru_cache

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from auth.dependencies import require_administrator
from content.repositories.filesystem import FilesystemContentRepository
from content.schemas.glossary import (
    CreateGlossaryEntryRequest,
    GenerateTranslationRequest,
    GlossaryEntryListItem,
    GlossaryEntryMeta,
    GlossaryReferenceOption,
    GlossaryVariantBody,
    GlossaryVariantResponse,
    PublishGlossaryVariantResponse,
    SaveGlossaryVariantRequest,
)
from content.services.glossary_entries import GlossaryEntryService
from content.services.glossary_images import GlossaryImageService
from content.services.glossary_publish import GlossaryPublishService
from content.routers.generate_translation import run_generate

router = APIRouter(prefix="/admin/glossary/entries", tags=["admin-glossary"])


@lru_cache
def get_repository() -> FilesystemContentRepository:
    return FilesystemContentRepository()


def get_entry_service() -> GlossaryEntryService:
    return GlossaryEntryService(get_repository())


def get_publish_service() -> GlossaryPublishService:
    return GlossaryPublishService(get_repository())


def get_image_service() -> GlossaryImageService:
    return GlossaryImageService(get_repository())


def _entry_not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="Glossary entry not found.")


@router.post("/images", status_code=201)
async def upload_glossary_image(
    file: UploadFile = File(...),
    _: dict = Depends(require_administrator),
    image_service: GlossaryImageService = Depends(get_image_service),
) -> dict[str, str]:
    try:
        url = await image_service.store_upload(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"url": url}


@router.get("/references/search", response_model=list[GlossaryReferenceOption])
def search_references(
    q: str = "",
    locale: str = "ro",
    _: dict = Depends(require_administrator),
    service: GlossaryEntryService = Depends(get_entry_service),
) -> list[GlossaryReferenceOption]:
    try:
        return service.search_references(q, locale)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=list[GlossaryEntryListItem])
def list_entries(
    locale: str = "ro",
    _: dict = Depends(require_administrator),
    service: GlossaryEntryService = Depends(get_entry_service),
) -> list[GlossaryEntryListItem]:
    return service.list_entries(locale)


@router.post("", response_model=GlossaryEntryMeta, status_code=201)
def create_entry(
    payload: CreateGlossaryEntryRequest,
    _: dict = Depends(require_administrator),
    service: GlossaryEntryService = Depends(get_entry_service),
) -> GlossaryEntryMeta:
    return service.create_entry(payload.term)


@router.get("/{content_id}", response_model=GlossaryEntryMeta)
def get_entry(
    content_id: str,
    _: dict = Depends(require_administrator),
    service: GlossaryEntryService = Depends(get_entry_service),
) -> GlossaryEntryMeta:
    try:
        return service.get_entry_meta(content_id)
    except KeyError as exc:
        raise _entry_not_found() from exc


@router.delete("/{content_id}", status_code=204)
def delete_entry(
    content_id: str,
    _: dict = Depends(require_administrator),
    service: GlossaryEntryService = Depends(get_entry_service),
) -> None:
    try:
        service.delete_entry(content_id)
    except KeyError as exc:
        raise _entry_not_found() from exc


@router.delete("/{content_id}/variants/{locale}", status_code=204)
def delete_variant(
    content_id: str,
    locale: str,
    _: dict = Depends(require_administrator),
    service: GlossaryEntryService = Depends(get_entry_service),
) -> None:
    try:
        service.delete_variant(content_id, locale)
    except KeyError as exc:
        raise _entry_not_found() from exc
    except ValueError as exc:
        detail = str(exc)
        status = 409 if "canonical Romanian" in detail else 400
        raise HTTPException(status_code=status, detail=detail) from exc


@router.get("/{content_id}/variants/{locale}", response_model=GlossaryVariantResponse)
def get_variant(
    content_id: str,
    locale: str,
    _: dict = Depends(require_administrator),
    service: GlossaryEntryService = Depends(get_entry_service),
) -> GlossaryVariantResponse:
    try:
        return service.get_variant(content_id, locale)
    except KeyError as exc:
        raise _entry_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{content_id}/variants/{locale}", response_model=GlossaryVariantResponse)
def save_variant(
    content_id: str,
    locale: str,
    payload: SaveGlossaryVariantRequest,
    _: dict = Depends(require_administrator),
    service: GlossaryEntryService = Depends(get_entry_service),
) -> GlossaryVariantResponse:
    try:
        return service.save_variant(content_id, locale, GlossaryVariantBody.model_validate(payload.body.model_dump()))
    except KeyError as exc:
        raise _entry_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{content_id}/variants/{locale}/publish", response_model=PublishGlossaryVariantResponse)
def publish_variant(
    content_id: str,
    locale: str,
    _: dict = Depends(require_administrator),
    publish_service: GlossaryPublishService = Depends(get_publish_service),
) -> PublishGlossaryVariantResponse:
    try:
        return publish_service.publish_variant(content_id, locale)
    except KeyError as exc:
        raise _entry_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{content_id}/variants/{locale}/generate-translation", response_model=GlossaryVariantResponse)
def generate_translation(
    content_id: str,
    locale: str,
    payload: GenerateTranslationRequest = GenerateTranslationRequest(),
    _: dict = Depends(require_administrator),
    service: GlossaryEntryService = Depends(get_entry_service),
) -> GlossaryVariantResponse:
    return run_generate(
        lambda: service.generate_translation(
            content_id,
            locale,
            confirm_overwrite=payload.confirmOverwrite,
        )
    )


@router.post("/{content_id}/variants/{locale}/unpublish", status_code=204)
def unpublish_variant(
    content_id: str,
    locale: str,
    _: dict = Depends(require_administrator),
    publish_service: GlossaryPublishService = Depends(get_publish_service),
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
