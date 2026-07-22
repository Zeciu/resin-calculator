"""Schemas for Task B bulk translation preview / chunked update."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


BulkModule = Literal["manual", "glossary", "knowledge_base", "website"]


class BulkTranslationRequest(BaseModel):
    includeTextOutdated: bool = False
    offset: int = Field(default=0, ge=0)
    limit: int = Field(default=5, ge=1, le=20)


class BulkTranslationPreviewRequest(BaseModel):
    includeTextOutdated: bool = False


class BulkCountsModel(BaseModel):
    missing: int
    current: int
    mediaOnlyOutdated: int
    textOutdated: int
    manualUntracked: int
    invalid: int


class BulkPlanItemModel(BaseModel):
    contentId: str
    label: str
    state: str
    plannedAction: str


class BulkPreviewResponse(BaseModel):
    module: BulkModule
    locale: str
    includeTextOutdated: bool
    total: int
    counts: BulkCountsModel
    items: list[BulkPlanItemModel]


class BulkItemResultModel(BaseModel):
    contentId: str
    label: str
    initialState: str
    action: str
    finalState: str | None
    status: str
    providerCalled: bool
    error: str | None = None


class BulkChunkSummaryModel(BaseModel):
    total: int
    generated: int
    mediaSynced: int
    skippedCurrent: int
    skippedTextOutdated: int
    skippedManualUntracked: int
    skippedInvalid: int
    failed: int
    providerCallItems: int


class BulkUpdateResponse(BaseModel):
    module: BulkModule
    locale: str
    includeTextOutdated: bool
    offset: int
    limit: int
    total: int
    nextOffset: int | None
    done: bool
    chunkSummary: BulkChunkSummaryModel
    items: list[BulkItemResultModel]
