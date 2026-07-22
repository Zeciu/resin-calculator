"""Admin bulk translation preview / chunked update routes (Task B)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response

from auth.dependencies import require_administrator
from content.repositories.filesystem import FilesystemContentRepository
from content.schemas.translation_bulk import (
    BulkPreviewResponse,
    BulkTranslationPreviewRequest,
    BulkTranslationRequest,
    BulkUpdateResponse,
)
from content.services.translation_bulk import (
    BulkRunConflictError,
    TranslationBulkService,
)
from content.services.translation_update import TranslationUpdateError
from content.translation.exceptions import TranslationError
from content.services.translation_generation import map_provider_error_to_http

BulkModulePath = Literal["manual", "glossary", "knowledge-base", "website"]

MODULE_MAP = {
    "manual": "manual",
    "glossary": "glossary",
    "knowledge-base": "knowledge_base",
    "website": "website",
}

router = APIRouter(prefix="/admin", tags=["admin-translation-bulk"])


def _repository_for_module(module: BulkModulePath) -> FilesystemContentRepository:
    """
    Use the same process-local repository singleton as single-item Admin routes
    for the selected editorial module (identical draft source of truth).
    """
    if module == "manual":
        from content.routers.admin_manual import get_repository

        return get_repository()
    if module == "glossary":
        from content.routers.admin_glossary import get_repository

        return get_repository()
    if module == "website":
        from content.routers.admin_website import get_repository

        return get_repository()
    from content.routers.admin_knowledge_base import get_repository

    return get_repository()


def get_bulk_service(
    module: BulkModulePath,
) -> TranslationBulkService:
    return TranslationBulkService(_repository_for_module(module))


def reset_repository_cache() -> None:
    """Clear module repository caches used by bulk (shared with single-item routes)."""
    from content.routers import admin_glossary, admin_knowledge_base, admin_manual, admin_website

    admin_manual.reset_repository_cache()
    admin_glossary.reset_repository_cache()
    admin_knowledge_base.reset_repository_cache()
    admin_website.reset_repository_cache()


def _resolve_module(module: BulkModulePath) -> str:
    try:
        return MODULE_MAP[module]
    except KeyError as exc:
        raise HTTPException(status_code=400, detail="Unsupported editorial module.") from exc


def _run_bulk(call):
    try:
        return call()
    except BulkRunConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except TranslationUpdateError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except TranslationError as exc:
        status, detail = map_provider_error_to_http(exc)
        raise HTTPException(status_code=status, detail=detail) from exc


@router.post(
    "/{module}/translations/{locale}/bulk-preview",
    response_model=BulkPreviewResponse,
)
def bulk_preview(
    module: BulkModulePath,
    locale: str,
    response: Response,
    payload: BulkTranslationPreviewRequest | None = None,
    _: dict = Depends(require_administrator),
    service: TranslationBulkService = Depends(get_bulk_service),
) -> dict:
    response.headers["Cache-Control"] = "no-store"
    body = payload or BulkTranslationPreviewRequest()
    resolved = _resolve_module(module)

    def call():
        return service.preview(
            module=resolved,  # type: ignore[arg-type]
            target_locale=locale,
            include_text_outdated=body.includeTextOutdated,
        )

    return _run_bulk(call)


@router.post(
    "/{module}/translations/{locale}/bulk-update",
    response_model=BulkUpdateResponse,
)
def bulk_update(
    module: BulkModulePath,
    locale: str,
    response: Response,
    payload: BulkTranslationRequest | None = None,
    _: dict = Depends(require_administrator),
    service: TranslationBulkService = Depends(get_bulk_service),
) -> dict:
    response.headers["Cache-Control"] = "no-store"
    body = payload or BulkTranslationRequest()
    resolved = _resolve_module(module)

    def call():
        return service.process_chunk(
            module=resolved,  # type: ignore[arg-type]
            target_locale=locale,
            include_text_outdated=body.includeTextOutdated,
            offset=body.offset,
            limit=body.limit,
        )

    return _run_bulk(call)
