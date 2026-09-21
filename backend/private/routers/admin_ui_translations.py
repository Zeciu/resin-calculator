"""Admin routes for generating missing UI catalog translations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response

from private.access import require_local_editorial_access
from private.editorial_content_mode import require_editorial_writes_allowed
from private.schemas.ui_catalog_translation import (
    UiTranslationGenerateResponse,
    UiTranslationPreviewResponse,
    generate_to_response,
    preview_to_response,
)
from private.services.translation_generation import map_provider_error_to_http
from private.services.ui_catalog_translation import (
    UiCatalogTranslationError,
    UiCatalogTranslationService,
)
from private.translation.exceptions import TranslationError, TranslationUnsupportedLocaleError

router = APIRouter(prefix="/admin/ui-translations", tags=["admin-ui-translations"])


def get_ui_catalog_service() -> UiCatalogTranslationService:
    return UiCatalogTranslationService()


def reset_repository_cache() -> None:
    return None


def _run(call):
    try:
        return call()
    except UiCatalogTranslationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except TranslationUnsupportedLocaleError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except TranslationError as exc:
        status, detail = map_provider_error_to_http(exc)
        raise HTTPException(status_code=status, detail=detail) from exc


@router.get("/{locale}/preview", response_model=UiTranslationPreviewResponse)
def preview_missing_ui_translations(
    locale: str,
    response: Response,
    _: dict = Depends(require_local_editorial_access),
    service: UiCatalogTranslationService = Depends(get_ui_catalog_service),
) -> UiTranslationPreviewResponse:
    response.headers["Cache-Control"] = "no-store"
    return preview_to_response(_run(lambda: service.preview(locale)))


@router.post("/{locale}/generate-missing", response_model=UiTranslationGenerateResponse)
def generate_missing_ui_translations(
    locale: str,
    response: Response,
    _: dict = Depends(require_local_editorial_access),
    _writes: None = Depends(require_editorial_writes_allowed),
    service: UiCatalogTranslationService = Depends(get_ui_catalog_service),
) -> UiTranslationGenerateResponse:
    response.headers["Cache-Control"] = "no-store"
    return generate_to_response(_run(lambda: service.generate_missing(locale)))
