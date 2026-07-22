import os
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from content.repositories.filesystem import FilesystemContentRepository
from content.schemas.glossary import PublicGlossaryResponse
from content.schemas.knowledge_base import PublicKnowledgeBaseResponse
from content.schemas.manual import PublicManualResponse
from content.schemas.website import PublicWebsiteResponse
from content.services.glossary_images import GlossaryImageService
from content.services.glossary_public import GlossaryPublicService
from content.services.knowledge_base_images import KnowledgeBaseImageService
from content.services.knowledge_base_public import KnowledgeBasePublicService
from content.services.manual_images import ManualImageService
from content.services.manual_public import ManualPublicService
from content.services.public_languages import PublicLanguagesService
from content.services.website_images import WebsiteImageService
from content.services.website_public import WebsitePublicService
from content.repositories.public_languages import PublicLanguagesRepository

router = APIRouter(prefix="/content", tags=["public-content"])


@lru_cache
def get_repository() -> FilesystemContentRepository:
    return FilesystemContentRepository()


@lru_cache
def get_languages_repository() -> PublicLanguagesRepository:
    return PublicLanguagesRepository()


def get_public_languages_service() -> PublicLanguagesService:
    return PublicLanguagesService(
        languages_repository=get_languages_repository(),
        content_repository=get_repository(),
    )


def get_public_service() -> ManualPublicService:
    return ManualPublicService(get_repository())


def get_glossary_public_service() -> GlossaryPublicService:
    return GlossaryPublicService(get_repository())


def get_image_service() -> ManualImageService:
    return ManualImageService(get_repository())


def get_glossary_image_service() -> GlossaryImageService:
    return GlossaryImageService(get_repository())


def get_kb_public_service() -> KnowledgeBasePublicService:
    return KnowledgeBasePublicService(get_repository())


def get_kb_image_service() -> KnowledgeBaseImageService:
    return KnowledgeBaseImageService(get_repository())


def get_website_public_service() -> WebsitePublicService:
    return WebsitePublicService(get_repository())


def get_website_image_service() -> WebsiteImageService:
    return WebsiteImageService(get_repository())


def _require_active_public_locale(locale: str) -> None:
    get_public_languages_service().require_active_public_locale(locale)


@router.get("/manual", response_model=PublicManualResponse)
def get_published_manual(
    locale: str = "en",
    service: ManualPublicService = Depends(get_public_service),
) -> PublicManualResponse:
    try:
        _require_active_public_locale(locale)
        return service.get_published_manual(locale)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/glossary", response_model=PublicGlossaryResponse)
def get_published_glossary(
    locale: str = "en",
    service: GlossaryPublicService = Depends(get_glossary_public_service),
) -> PublicGlossaryResponse:
    try:
        _require_active_public_locale(locale)
        return service.get_published_glossary(locale)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/knowledge-base", response_model=PublicKnowledgeBaseResponse)
def get_published_knowledge_base(
    locale: str = "en",
    service: KnowledgeBasePublicService = Depends(get_kb_public_service),
) -> PublicKnowledgeBaseResponse:
    try:
        _require_active_public_locale(locale)
        return service.get_published_knowledge_base(locale)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/website/images/{filename}")
def get_website_image(
    filename: str,
    image_service: WebsiteImageService = Depends(get_website_image_service),
) -> FileResponse:
    try:
        image_path, media_type = image_service.resolve_public_image(filename)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Image not found.") from exc
    return FileResponse(image_path, media_type=media_type)


@router.get("/website/{page_key}", response_model=PublicWebsiteResponse)
def get_published_website_page(
    page_key: str,
    locale: str = "en",
    service: WebsitePublicService = Depends(get_website_public_service),
) -> PublicWebsiteResponse:
    try:
        _require_active_public_locale(locale)
        return service.get_published_page(page_key, locale)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Website page not found.") from exc
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


@router.get("/glossary/images/{filename}")
def get_glossary_image(
    filename: str,
    image_service: GlossaryImageService = Depends(get_glossary_image_service),
) -> FileResponse:
    try:
        image_path, media_type = image_service.resolve_public_image(filename)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Image not found.") from exc
    return FileResponse(image_path, media_type=media_type)


@router.get("/knowledge-base/images/{filename}")
def get_kb_image(
    filename: str,
    image_service: KnowledgeBaseImageService = Depends(get_kb_image_service),
) -> FileResponse:
    try:
        image_path, media_type = image_service.resolve_public_image(filename)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Image not found.") from exc
    return FileResponse(image_path, media_type=media_type)


def reset_repository_cache() -> None:
    get_repository.cache_clear()
    get_languages_repository.cache_clear()
    if "CONTENT_DATA_DIR" not in os.environ:
        return
    get_repository()
    get_languages_repository()
