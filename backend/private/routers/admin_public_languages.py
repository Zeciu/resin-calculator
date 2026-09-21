"""Admin public language activation controls."""

from __future__ import annotations

import os
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException

from private.access import require_local_editorial_access
from private.editorial_content_mode import require_editorial_writes_allowed
from private.repositories.filesystem import FilesystemContentRepository
from private.repositories.public_languages import (
    PublicLanguagesRepository,
    default_production_languages_root,
)
from private.schemas.locale_readiness import AdminLocaleReadinessResponse, PrepareProductionResponse
from private.schemas.public_languages import AdminPublicLanguagesResponse
from private.services.admin_locale_readiness import get_admin_locale_readiness
from private.services.admin_prepare_production import (
    PreviewNotReadyError,
    ProductionPrepareError,
    prepare_locale_production,
)
from private.services.public_languages import ProductionNotReadyError, PublicLanguagesService

router = APIRouter(prefix="/admin/public-languages", tags=["admin-public-languages"])


@lru_cache
def get_content_repository() -> FilesystemContentRepository:
    return FilesystemContentRepository()


@lru_cache
def get_languages_repository() -> PublicLanguagesRepository:
    return PublicLanguagesRepository()


@lru_cache
def get_production_languages_repository() -> PublicLanguagesRepository:
    return PublicLanguagesRepository(default_production_languages_root())


def get_public_languages_service() -> PublicLanguagesService:
    return PublicLanguagesService(
        languages_repository=get_languages_repository(),
        content_repository=get_content_repository(),
        production_repository=get_production_languages_repository(),
    )


@router.get("", response_model=AdminPublicLanguagesResponse)
def get_admin_public_languages(
    _: dict = Depends(require_local_editorial_access),
    service: PublicLanguagesService = Depends(get_public_languages_service),
) -> AdminPublicLanguagesResponse:
    return service.get_admin_overview()


@router.get("/readiness", response_model=AdminLocaleReadinessResponse)
def get_admin_locale_readiness_overview(
    _: dict = Depends(require_local_editorial_access),
) -> AdminLocaleReadinessResponse:
    """Read-only locale readiness. Does not activate, publish, or package."""
    return get_admin_locale_readiness()


@router.post("/{locale}/prepare-production", response_model=PrepareProductionResponse)
def prepare_public_language_production(
    locale: str,
    _: dict = Depends(require_local_editorial_access),
    _writes: None = Depends(require_editorial_writes_allowed),
) -> PrepareProductionResponse:
    """Prepare Manual/Glossary/KB production for one locale. Does not activate."""
    try:
        return prepare_locale_production(locale)
    except PreviewNotReadyError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ProductionPrepareError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{locale}/activate", response_model=AdminPublicLanguagesResponse)
def activate_public_language(
    locale: str,
    _: dict = Depends(require_local_editorial_access),
    _writes: None = Depends(require_editorial_writes_allowed),
    service: PublicLanguagesService = Depends(get_public_languages_service),
) -> AdminPublicLanguagesResponse:
    try:
        return service.activate(locale)
    except ProductionNotReadyError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{locale}/deactivate", response_model=AdminPublicLanguagesResponse)
def deactivate_public_language(
    locale: str,
    _: dict = Depends(require_local_editorial_access),
    _writes: None = Depends(require_editorial_writes_allowed),
    service: PublicLanguagesService = Depends(get_public_languages_service),
) -> AdminPublicLanguagesResponse:
    try:
        return service.deactivate(locale)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def reset_repository_cache() -> None:
    get_content_repository.cache_clear()
    get_languages_repository.cache_clear()
    get_production_languages_repository.cache_clear()
    if "CONTENT_DATA_DIR" not in os.environ:
        return
    get_content_repository()
    get_languages_repository()
    get_production_languages_repository()
