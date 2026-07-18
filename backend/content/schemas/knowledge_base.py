from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from .common import AdminLocaleCode, ContentStatus, LocaleCode, VALID_LOCALES
from .editorial import EditorialVisibility, TranslationMetadataFields
from .manual import ImageBlock, VideoBlock, parse_admin_locale, parse_locale

KnowledgeBaseCategory = Literal["Epoxy", "Wood", "Finishing", "Application", "Projects", "Calibration"]
KnowledgeBaseDifficulty = Literal["Beginner", "Intermediate", "Professional"]
KnowledgeBaseMediaBlock = ImageBlock | VideoBlock

KB_CATEGORIES: tuple[str, ...] = (
    "Epoxy",
    "Wood",
    "Finishing",
    "Application",
    "Projects",
    "Calibration",
)
KB_DIFFICULTIES: tuple[str, ...] = ("Beginner", "Intermediate", "Professional")


class KnowledgeBaseVariantBody(BaseModel):
    title: str = ""
    problemSummary: str = ""
    symptoms: list[str] = Field(default_factory=list)
    possibleCauses: list[str] = Field(default_factory=list)
    solution: list[str] = Field(default_factory=list)
    prevention: list[str] = Field(default_factory=list)
    tips: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    searchKeywords: list[str] = Field(default_factory=list)
    estimatedRepairTime: str | None = None
    requiredTools: list[str] = Field(default_factory=list)
    requiredMaterials: list[str] = Field(default_factory=list)
    bodyBlocks: list[dict] = Field(default_factory=list)
    media: list[KnowledgeBaseMediaBlock] = Field(default_factory=list)
    relatedKbEntryIds: list[str] = Field(default_factory=list)
    relatedGlossaryEntryIds: list[str] = Field(default_factory=list)
    relatedManualChapterIds: list[str] = Field(default_factory=list)


class SaveKnowledgeBaseVariantBody(KnowledgeBaseVariantBody):
    @field_validator("title")
    @classmethod
    def title_not_empty_on_save(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Knowledge Base title cannot be empty.")
        return value


class CreateKnowledgeBaseEntryRequest(BaseModel):
    title: str
    category: KnowledgeBaseCategory = "Epoxy"
    difficulty: KnowledgeBaseDifficulty = "Beginner"

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Knowledge Base title cannot be empty.")
        return value


class SaveKnowledgeBaseVariantRequest(BaseModel):
    category: KnowledgeBaseCategory
    difficulty: KnowledgeBaseDifficulty
    body: SaveKnowledgeBaseVariantBody


class KnowledgeBaseEntryMeta(BaseModel):
    contentId: str
    contentType: Literal["kb_entry"] = "kb_entry"
    category: KnowledgeBaseCategory
    difficulty: KnowledgeBaseDifficulty
    sortOrder: int
    createdAt: datetime
    updatedAt: datetime


class KnowledgeBaseVariantSummary(BaseModel):
    status: ContentStatus
    updatedAt: datetime | None = None
    publishedAt: datetime | None = None


class KnowledgeBaseEntryListItem(BaseModel):
    contentId: str
    title: str
    category: KnowledgeBaseCategory
    difficulty: KnowledgeBaseDifficulty
    sortOrder: int
    variants: dict[str, KnowledgeBaseVariantSummary]


class KnowledgeBaseVariantResponse(TranslationMetadataFields):
    contentId: str
    locale: AdminLocaleCode
    category: KnowledgeBaseCategory
    difficulty: KnowledgeBaseDifficulty
    status: ContentStatus
    editorialVisibility: EditorialVisibility
    body: KnowledgeBaseVariantBody
    exists: bool = True
    updatedAt: datetime | None = None
    publishedAt: datetime | None = None


class PublishKnowledgeBaseVariantResponse(BaseModel):
    contentId: str
    locale: AdminLocaleCode
    status: ContentStatus
    publishedAt: datetime
    snapshotKey: str


class GenerateTranslationRequest(BaseModel):
    confirmOverwrite: bool = False


class PublicKnowledgeBaseRelationship(BaseModel):
    id: str
    label: str


class PublicKnowledgeBaseEntry(BaseModel):
    id: str
    title: str
    problemSummary: str = ""
    symptoms: list[str] = Field(default_factory=list)
    possibleCauses: list[str] = Field(default_factory=list)
    solution: list[str] = Field(default_factory=list)
    prevention: list[str] = Field(default_factory=list)
    tips: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    searchKeywords: list[str] = Field(default_factory=list)
    estimatedRepairTime: str | None = None
    requiredTools: list[str] = Field(default_factory=list)
    requiredMaterials: list[str] = Field(default_factory=list)
    media: list[dict] = Field(default_factory=list)
    relatedKbArticles: list[PublicKnowledgeBaseRelationship] = Field(default_factory=list)
    relatedGlossaryTerms: list[PublicKnowledgeBaseRelationship] = Field(default_factory=list)
    relatedManualChapters: list[PublicKnowledgeBaseRelationship] = Field(default_factory=list)


class PublicKnowledgeBaseResponse(BaseModel):
    locale: LocaleCode
    requestedLocale: LocaleCode
    available: bool
    englishAvailable: bool
    documentTitle: str
    lede: str
    entries: list[PublicKnowledgeBaseEntry] = Field(default_factory=list)


class KnowledgeBaseReferenceOption(BaseModel):
    contentId: str
    contentType: str
    label: str
    detail: str = ""


__all__ = ["parse_locale", "parse_admin_locale", "VALID_LOCALES", "KB_CATEGORIES", "KB_DIFFICULTIES"]
