"""Admin API schemas for Phase 1 locale readiness (read-only display)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from private.schemas.common import PUBLIC_LANGUAGE_LABELS
from private.services.locale_readiness import (
    LayerReadiness,
    LocaleReadiness,
    StoreDiagnostics,
    StoreVariantDiagnostic,
)

LayerStatusValue = Literal["complete", "incomplete", "missing"]


class LayerReadinessResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: LayerStatusValue
    required_count: int
    present_count: int
    missing: list[str] = Field(default_factory=list)
    extra: list[str] = Field(default_factory=list)


class StoreVariantDiagnosticResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    canonical_count: int
    published_count: int
    draft_count: int
    no_variant_count: int
    draft_ids: list[str] = Field(default_factory=list)
    no_variant_ids: list[str] = Field(default_factory=list)


class StoreDiagnosticsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    manual: StoreVariantDiagnosticResponse
    glossary: StoreVariantDiagnosticResponse
    knowledge_base: StoreVariantDiagnosticResponse


class LocaleReadinessRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    locale: str
    label: str
    ui: LayerReadinessResponse
    website_preview: LayerReadinessResponse
    website_production: LayerReadinessResponse
    manual_preview: LayerReadinessResponse
    manual_production: LayerReadinessResponse
    glossary_preview: LayerReadinessResponse
    glossary_production: LayerReadinessResponse
    knowledge_base_preview: LayerReadinessResponse
    knowledge_base_production: LayerReadinessResponse
    preview_ready: bool
    production_ready: bool
    store: StoreDiagnosticsResponse


class AdminLocaleReadinessResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    locales: list[LocaleReadinessRow] = Field(default_factory=list)


def layer_to_response(layer: LayerReadiness) -> LayerReadinessResponse:
    return LayerReadinessResponse(
        status=layer.status.value,  # type: ignore[arg-type]
        required_count=layer.required_count,
        present_count=layer.present_count,
        missing=list(layer.missing),
        extra=list(layer.extra),
    )


def store_variant_to_response(
    diagnostic: StoreVariantDiagnostic,
) -> StoreVariantDiagnosticResponse:
    return StoreVariantDiagnosticResponse(
        canonical_count=diagnostic.canonical_count,
        published_count=diagnostic.published_count,
        draft_count=diagnostic.draft_count,
        no_variant_count=diagnostic.no_variant_count,
        draft_ids=list(diagnostic.draft_ids),
        no_variant_ids=list(diagnostic.no_variant_ids),
    )


def store_to_response(store: StoreDiagnostics) -> StoreDiagnosticsResponse:
    return StoreDiagnosticsResponse(
        manual=store_variant_to_response(store.manual),
        glossary=store_variant_to_response(store.glossary),
        knowledge_base=store_variant_to_response(store.knowledge_base),
    )


def locale_readiness_to_row(result: LocaleReadiness) -> LocaleReadinessRow:
    return LocaleReadinessRow(
        locale=result.locale,
        label=PUBLIC_LANGUAGE_LABELS.get(result.locale, result.locale),
        ui=layer_to_response(result.ui),
        website_preview=layer_to_response(result.website_preview),
        website_production=layer_to_response(result.website_production),
        manual_preview=layer_to_response(result.manual_preview),
        manual_production=layer_to_response(result.manual_production),
        glossary_preview=layer_to_response(result.glossary_preview),
        glossary_production=layer_to_response(result.glossary_production),
        knowledge_base_preview=layer_to_response(result.knowledge_base_preview),
        knowledge_base_production=layer_to_response(result.knowledge_base_production),
        preview_ready=result.preview_ready,
        production_ready=result.production_ready,
        store=store_to_response(result.store),
    )


def readiness_results_to_response(
    results: tuple[LocaleReadiness, ...],
) -> AdminLocaleReadinessResponse:
    return AdminLocaleReadinessResponse(
        locales=[locale_readiness_to_row(result) for result in results]
    )
