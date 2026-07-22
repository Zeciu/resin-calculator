import os
from functools import lru_cache

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from auth.dependencies import require_administrator
from content.repositories.filesystem import FilesystemContentRepository
from content.schemas.website import (
    PublishWebsiteVariantResponse,
    SaveWebsiteVariantRequest,
    WebsitePageListItem,
    WebsiteVariantResponse,
)
from content.schemas.glossary import GenerateTranslationRequest
from content.routers.generate_translation import run_generate
from content.services.website_images import WebsiteImageService
from content.services.website_pages import WebsitePageService
from content.services.website_publish import WebsitePublishService

router = APIRouter(prefix="/admin/website/pages", tags=["admin-website"])


@lru_cache
def get_repository() -> FilesystemContentRepository:
    return FilesystemContentRepository()


def get_page_service() -> WebsitePageService:
    return WebsitePageService(get_repository())


def get_publish_service() -> WebsitePublishService:
    return WebsitePublishService(get_repository())


def get_image_service() -> WebsiteImageService:
    return WebsiteImageService(get_repository())


def _page_not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="Website page not found.")


@router.post("/images", status_code=201)
async def upload_website_image(
    file: UploadFile = File(...),
    _: dict = Depends(require_administrator),
    image_service: WebsiteImageService = Depends(get_image_service),
) -> dict[str, str]:
    try:
        url = await image_service.store_upload(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"url": url}


@router.get("", response_model=list[WebsitePageListItem])
def list_pages(
    locale: str = "ro",
    _: dict = Depends(require_administrator),
    service: WebsitePageService = Depends(get_page_service),
) -> list[WebsitePageListItem]:
    try:
        return service.list_pages(locale)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{page_key}/variants/{locale}", response_model=WebsiteVariantResponse)
def get_variant(
    page_key: str,
    locale: str,
    _: dict = Depends(require_administrator),
    service: WebsitePageService = Depends(get_page_service),
) -> WebsiteVariantResponse:
    try:
        return service.get_variant(page_key, locale)
    except KeyError as exc:
        raise _page_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{page_key}/variants/{locale}", response_model=WebsiteVariantResponse)
def save_variant(
    page_key: str,
    locale: str,
    payload: SaveWebsiteVariantRequest,
    _: dict = Depends(require_administrator),
    service: WebsitePageService = Depends(get_page_service),
) -> WebsiteVariantResponse:
    try:
        return service.save_variant(page_key, locale, payload.body.model_dump())
    except KeyError as exc:
        raise _page_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{page_key}/variants/{locale}/publish", response_model=PublishWebsiteVariantResponse)
def publish_variant(
    page_key: str,
    locale: str,
    _: dict = Depends(require_administrator),
    publish_service: WebsitePublishService = Depends(get_publish_service),
) -> PublishWebsiteVariantResponse:
    try:
        return publish_service.publish_variant(page_key, locale)
    except KeyError as exc:
        raise _page_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{page_key}/variants/{locale}/unpublish", status_code=204)
def unpublish_variant(
    page_key: str,
    locale: str,
    _: dict = Depends(require_administrator),
    publish_service: WebsitePublishService = Depends(get_publish_service),
) -> None:
    try:
        publish_service.unpublish_variant(page_key, locale)
    except KeyError as exc:
        raise _page_not_found() from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{page_key}/variants/{locale}/generate-translation", response_model=WebsiteVariantResponse)
def generate_translation(
    page_key: str,
    locale: str,
    payload: GenerateTranslationRequest = GenerateTranslationRequest(),
    _: dict = Depends(require_administrator),
    service: WebsitePageService = Depends(get_page_service),
) -> WebsiteVariantResponse:
    return run_generate(
        lambda: service.generate_translation(
            page_key,
            locale,
            confirm_overwrite=payload.confirmOverwrite,
        )
    )


def reset_repository_cache() -> None:
    get_repository.cache_clear()
    if "CONTENT_DATA_DIR" not in os.environ:
        return
    get_repository()
