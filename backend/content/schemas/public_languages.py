"""Public language activation schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


TranslationStatusLabel = Literal["Not generated", "Partial", "Available"]
PublishedContentStatusLabel = Literal["Not published", "Partial", "Available"]
PublicVisibilityLabel = Literal["Active", "Inactive"]


class PublicLanguagesConfigResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    defaultPublicLocale: str
    activePublicLocales: list[str] = Field(default_factory=list)


class PublicLanguageRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    locale: str
    label: str
    translationStatus: TranslationStatusLabel
    publishedContentStatus: PublishedContentStatusLabel
    publicVisibility: PublicVisibilityLabel
    isDefault: bool
    canDeactivate: bool


class AdminPublicLanguagesResponse(PublicLanguagesConfigResponse):
    languages: list[PublicLanguageRow] = Field(default_factory=list)
