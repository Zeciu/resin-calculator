"""Admin API schemas for missing UI catalog translation."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from private.services.ui_catalog_translation import (
    UiMissingGenerateResult,
    UiMissingPreview,
)


class UiFailedKeyResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    reason: str


class UiTranslationPreviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    locale: str
    required_count: int
    present_count: int
    missing_count: int
    missing_keys: list[str] = Field(default_factory=list)


class UiTranslationGenerateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    locale: str
    required_count: int
    present_count_before: int
    present_count_after: int
    generated_count: int
    preserved_count: int
    failed: list[UiFailedKeyResponse] = Field(default_factory=list)
    provider_called: bool


def preview_to_response(preview: UiMissingPreview) -> UiTranslationPreviewResponse:
    return UiTranslationPreviewResponse(
        locale=preview.locale,
        required_count=preview.required_count,
        present_count=preview.present_count,
        missing_count=preview.missing_count,
        missing_keys=list(preview.missing_keys),
    )


def generate_to_response(result: UiMissingGenerateResult) -> UiTranslationGenerateResponse:
    return UiTranslationGenerateResponse(
        locale=result.locale,
        required_count=result.required_count,
        present_count_before=result.present_count_before,
        present_count_after=result.present_count_after,
        generated_count=result.generated_count,
        preserved_count=result.preserved_count,
        failed=[UiFailedKeyResponse(key=item.key, reason=item.reason) for item in result.failed],
        provider_called=result.provider_called,
    )
