from datetime import datetime
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Field, field_validator

from .common import AdminLocaleCode, ContentStatus, LocaleCode, VALID_LOCALES, parse_admin_locale
from .editorial import EditorialVisibility, TranslationMetadataFields
from .editorial_bulk import BulkPublishDraftItemResult, BulkPublishDraftsResponse


class ParagraphBlock(BaseModel):
    type: Literal["paragraph"]
    text: str
    align: Literal["left", "center", "right", "justify"] | None = None


class HeadingBlock(BaseModel):
    type: Literal["heading"]
    text: str
    level: int | None = None
    align: Literal["left", "center", "right", "justify"] | None = None


class ImageBlock(BaseModel):
    type: Literal["image"]
    src: str
    alt: str
    caption: str | None = None


class VideoBlock(BaseModel):
    type: Literal["video"]
    title: str
    embedUrl: str
    caption: str | None = None


class CalloutInnerBlock(BaseModel):
    type: Literal["paragraph", "heading"]
    text: str
    level: int | None = None
    align: Literal["left", "center", "right", "justify"] | None = None


class CalloutBlock(BaseModel):
    type: Literal["callout"]
    variant: Literal["important", "warning", "tip", "note", "quote"]
    blocks: list[CalloutInnerBlock] = Field(default_factory=list)


ManualBlock = Annotated[
    Union[ParagraphBlock, HeadingBlock, ImageBlock, VideoBlock, CalloutBlock],
    Field(discriminator="type"),
]


class ManualSection(BaseModel):
    id: str = Field(min_length=1)
    title: str = ""
    blocks: list[ManualBlock] = Field(default_factory=list)


class ManualVariantBody(BaseModel):
    title: str = ""
    sections: list[ManualSection] = Field(default_factory=list)

    @field_validator("sections")
    @classmethod
    def sections_must_be_unique(cls, sections: list[ManualSection]) -> list[ManualSection]:
        section_ids = [section.id for section in sections]
        if len(section_ids) != len(set(section_ids)):
            raise ValueError("Section ids must be unique within a chapter.")
        return sections


class SaveManualVariantBody(ManualVariantBody):
    @field_validator("title")
    @classmethod
    def title_not_empty_on_save(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Chapter title cannot be empty.")
        return value


class CreateManualChapterRequest(BaseModel):
    title: str
    locale: AdminLocaleCode = "ro"

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Chapter title cannot be empty.")
        return value


class SaveManualVariantRequest(BaseModel):
    body: SaveManualVariantBody


class ReorderManualChaptersRequest(BaseModel):
    chapterIds: list[str] = Field(min_length=0)


class ManualChapterMeta(BaseModel):
    contentId: str
    contentType: Literal["manual_chapter"] = "manual_chapter"
    sortOrder: int
    createdAt: datetime
    updatedAt: datetime


class ManualVariantSummary(BaseModel):
    status: ContentStatus
    updatedAt: datetime | None = None
    publishedAt: datetime | None = None


class ManualChapterListItem(BaseModel):
    contentId: str
    title: str
    sortOrder: int
    variants: dict[str, ManualVariantSummary]


class ManualVariantResponse(TranslationMetadataFields):
    contentId: str
    locale: AdminLocaleCode
    status: ContentStatus
    editorialVisibility: EditorialVisibility
    body: ManualVariantBody
    exists: bool = True
    updatedAt: datetime | None = None
    publishedAt: datetime | None = None


class PublishManualVariantResponse(BaseModel):
    contentId: str
    locale: AdminLocaleCode
    status: ContentStatus
    publishedAt: datetime
    snapshotKey: str


BulkPublishManualItemResult = BulkPublishDraftItemResult
BulkPublishManualDraftsResponse = BulkPublishDraftsResponse


class GenerateTranslationRequest(BaseModel):
    confirmOverwrite: bool = False


class PublicManualSection(BaseModel):
    id: str
    title: str
    blocks: list[dict[str, Any]] = Field(default_factory=list)


class PublicManualResponse(BaseModel):
    locale: LocaleCode
    requestedLocale: LocaleCode
    available: bool
    englishAvailable: bool
    documentTitle: str
    lede: str
    sections: list[PublicManualSection] = Field(default_factory=list)


# Public locale parser (en/ro only). Admin routes use parse_admin_locale.
def parse_locale(locale: str) -> LocaleCode:
    from .common import parse_public_locale

    return parse_public_locale(locale)


__all__ = ["parse_locale", "parse_admin_locale", "VALID_LOCALES"]
