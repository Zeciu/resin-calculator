from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from .common import AdminLocaleCode, ContentStatus, LocaleCode, VALID_LOCALES
from .editorial import EditorialVisibility, TranslationMetadataFields
from .manual import ImageBlock, ManualBlock, VideoBlock, parse_admin_locale, parse_locale

GlossaryMediaBlock = ImageBlock | VideoBlock
SeeAlsoTargetType = Literal["glossary_entry", "manual_chapter", "kb_entry"]


class SeeAlsoReference(BaseModel):
    targetContentId: str = Field(min_length=1)
    targetType: SeeAlsoTargetType
    label: str = ""


class GlossaryVariantBody(BaseModel):
    term: str = ""
    definitionBlocks: list[ManualBlock] = Field(default_factory=list)
    media: list[GlossaryMediaBlock] = Field(default_factory=list)
    relatedTermIds: list[str] = Field(default_factory=list)
    synonymTermIds: list[str] = Field(default_factory=list)
    seeAlso: list[SeeAlsoReference] = Field(default_factory=list)


class SaveGlossaryVariantBody(GlossaryVariantBody):
    @field_validator("term")
    @classmethod
    def term_not_empty_on_save(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Glossary term cannot be empty.")
        return value


class CreateGlossaryEntryRequest(BaseModel):
    term: str

    @field_validator("term")
    @classmethod
    def term_not_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Glossary term cannot be empty.")
        return value


class SaveGlossaryVariantRequest(BaseModel):
    body: SaveGlossaryVariantBody


class GlossaryEntryMeta(BaseModel):
    contentId: str
    contentType: Literal["glossary_entry"] = "glossary_entry"
    sortOrder: int
    createdAt: datetime
    updatedAt: datetime


class GlossaryVariantSummary(BaseModel):
    status: ContentStatus
    updatedAt: datetime | None = None
    publishedAt: datetime | None = None


class GlossaryEntryListItem(BaseModel):
    contentId: str
    term: str
    sortOrder: int
    variants: dict[str, GlossaryVariantSummary]


class GlossaryVariantResponse(TranslationMetadataFields):
    contentId: str
    locale: AdminLocaleCode
    status: ContentStatus
    editorialVisibility: EditorialVisibility
    body: GlossaryVariantBody
    exists: bool = True
    updatedAt: datetime | None = None
    publishedAt: datetime | None = None


class PublishGlossaryVariantResponse(BaseModel):
    contentId: str
    locale: AdminLocaleCode
    status: ContentStatus
    publishedAt: datetime
    snapshotKey: str


class GenerateTranslationRequest(BaseModel):
    confirmOverwrite: bool = False


class PublicGlossaryRelationship(BaseModel):
    id: str
    term: str


class PublicSeeAlsoReference(BaseModel):
    targetType: SeeAlsoTargetType
    targetId: str
    label: str
    href: str


class PublicGlossaryEntry(BaseModel):
    id: str
    term: str
    definition: list[str] = Field(default_factory=list)
    media: list[dict] = Field(default_factory=list)
    relatedTerms: list[PublicGlossaryRelationship] = Field(default_factory=list)
    synonyms: list[PublicGlossaryRelationship] = Field(default_factory=list)
    seeAlso: list[PublicSeeAlsoReference] = Field(default_factory=list)


class PublicGlossaryResponse(BaseModel):
    locale: LocaleCode
    requestedLocale: LocaleCode
    available: bool
    englishAvailable: bool
    documentTitle: str
    lede: str
    entries: list[PublicGlossaryEntry] = Field(default_factory=list)


class GlossaryReferenceOption(BaseModel):
    contentId: str
    contentType: str
    label: str
    detail: str = ""


__all__ = ["parse_locale", "parse_admin_locale", "VALID_LOCALES"]
