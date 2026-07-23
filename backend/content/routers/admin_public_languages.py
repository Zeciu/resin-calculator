"""Admin public language activation controls."""

from __future__ import annotations

import os
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException

from auth.dependencies import require_administrator
from content.editorial_content_mode import require_editorial_writes_allowed
from content.repositories.filesystem import FilesystemContentRepository
from content.repositories.public_languages import PublicLanguagesRepository
from content.schemas.public_languages import AdminPublicLanguagesResponse
from content.services.public_languages import PublicLanguagesService

router = APIRouter(prefix="/admin/public-languages", tags=["admin-public-languages"])


@lru_cache
def get_content_repository() -> FilesystemContentRepository:
    return FilesystemContentRepository()


@lru_cache
def get_languages_repository() -> PublicLanguagesRepository:
    return PublicLanguagesRepository()


def get_public_languages_service() -> PublicLanguagesService:
    return PublicLanguagesService(
        languages_repository=get_languages_repository(),
        content_repository=get_content_repository(),
    )


@router.get("", response_model=AdminPublicLanguagesResponse)
def get_admin_public_languages(
    _: dict = Depends(require_administrator),
    service: PublicLanguagesService = Depends(get_public_languages_service),
) -> AdminPublicLanguagesResponse:
    return service.get_admin_overview()


@router.post("/{locale}/activate", response_model=AdminPublicLanguagesResponse)
def activate_public_language(
    locale: str,
    _: dict = Depends(require_administrator),
    _writes: None = Depends(require_editorial_writes_allowed),
    service: PublicLanguagesService = Depends(get_public_languages_service),
) -> AdminPublicLanguagesResponse:
    try:
        return service.activate(locale)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{locale}/deactivate", response_model=AdminPublicLanguagesResponse)
def deactivate_public_language(
    locale: str,
    _: dict = Depends(require_administrator),
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
    if "CONTENT_DATA_DIR" not in os.environ:
        return
    get_content_repository()
    get_languages_repository()
