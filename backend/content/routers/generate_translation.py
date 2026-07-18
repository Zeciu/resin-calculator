"""Shared Admin Generate Translation HTTP helpers."""

from __future__ import annotations

from fastapi import HTTPException

from content.services.translation_generation import (
    MissingRomanianSourceError,
    NothingToTranslateError,
    OverwriteConfirmationRequired,
    TranslationGenerationError,
    map_provider_error_to_http,
)
from content.translation.exceptions import TranslationError


def run_generate(call) :
    """Execute a generate_translation call and map domain errors to HTTPException."""
    try:
        return call()
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Content not found.") from exc
    except OverwriteConfirmationRequired as exc:
        raise HTTPException(status_code=409, detail=exc.message) from exc
    except (MissingRomanianSourceError, NothingToTranslateError, TranslationGenerationError) as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except TranslationError as exc:
        status, detail = map_provider_error_to_http(exc)
        raise HTTPException(status_code=status, detail=detail) from exc
