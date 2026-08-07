from enum import Enum
from datetime import datetime

from pydantic import BaseModel


class EditorialVisibility(str, Enum):
    EMPTY = "empty"
    DRAFT = "draft"
    LIVE = "live"
    STALE = "stale"


class EditorialReferenceOption(BaseModel):
    contentId: str
    contentType: str
    label: str
    detail: str = ""


class TranslationMetadataFields(BaseModel):
    """Optional translation metadata exposed on Admin variant responses."""

    sourceRevision: int | None = None
    sourceTextRevision: int | None = None
    generatedFromSourceRevision: int | None = None
    generatedFromSourceTextRevision: int | None = None
    translationProvider: str | None = None
    generatedAt: datetime | None = None
    # Ephemeral classification from Generate Translation / update engine (not persisted).
    translationUpdateState: str | None = None
    translationUpdateAction: str | None = None
