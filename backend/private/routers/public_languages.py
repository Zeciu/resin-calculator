"""Public read of active/default public languages."""

from __future__ import annotations

import os
from functools import lru_cache

from fastapi import APIRouter

from private.repositories.filesystem import FilesystemContentRepository
from private.repositories.public_languages import (
    PublicLanguagesRepository,
    default_production_languages_root,
)
from private.schemas.public_languages import PublicLanguagesConfigResponse
from private.services.public_languages import PublicLanguagesService

router = APIRouter(prefix="/content", tags=["public-languages"])


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


@router.get("/public-languages", response_model=PublicLanguagesConfigResponse)
def get_public_languages() -> PublicLanguagesConfigResponse:
    return get_public_languages_service().get_config()


def reset_repository_cache() -> None:
    get_content_repository.cache_clear()
    get_languages_repository.cache_clear()
    get_production_languages_repository.cache_clear()
    if "CONTENT_DATA_DIR" not in os.environ:
        return
    get_content_repository()
    get_languages_repository()
    get_production_languages_repository()
