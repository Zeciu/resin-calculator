"""Shared editorial bulk-publish response models (Manual / Glossary / KB)."""

from pydantic import BaseModel, Field

from .common import AdminLocaleCode


class BulkPublishDraftItemResult(BaseModel):
    contentId: str
    term: str = ""  # Display label (glossary term, chapter title, or article title).
    reason: str | None = None


class BulkPublishDraftsResponse(BaseModel):
    locale: AdminLocaleCode
    publishedCount: int
    failedCount: int
    skippedCount: int
    published: list[BulkPublishDraftItemResult] = Field(default_factory=list)
    failed: list[BulkPublishDraftItemResult] = Field(default_factory=list)
    skipped: list[BulkPublishDraftItemResult] = Field(default_factory=list)
    snapshotKey: str = ""
