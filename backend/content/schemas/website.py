from datetime import datetime
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field, field_validator

from .common import AdminLocaleCode, ContentStatus, parse_admin_locale, parse_locale
from .editorial import EditorialVisibility, TranslationMetadataFields
from .manual import HeadingBlock, ParagraphBlock

WebsitePageKind = Literal["home", "about", "pricing", "privacy", "terms", "contact"]
WebsiteSectionBlock = ParagraphBlock | HeadingBlock


class WebsiteOptionalImage(BaseModel):
    src: str = ""
    alt: str = ""
    visible: bool = False


class WebsiteOptionalVideo(BaseModel):
    url: str = ""
    visible: bool = False


class WebsiteOptionalCta(BaseModel):
    label: str = ""
    destination: str = ""
    visible: bool = False


class WebsiteSection(BaseModel):
    id: str = Field(min_length=1)
    title: str = ""
    blocks: list[WebsiteSectionBlock] = Field(default_factory=list)


class WebsiteSectionImage(BaseModel):
    src: str = ""
    alt: str = ""


class AboutWebsiteSection(BaseModel):
    id: str = Field(min_length=1)
    title: str = ""
    blocks: list[WebsiteSectionBlock] = Field(default_factory=list)
    image: WebsiteSectionImage = Field(default_factory=WebsiteSectionImage)


class WebsitePricingOffer(BaseModel):
    id: str = Field(min_length=1)
    title: str = ""
    displayedPriceText: str = ""
    benefits: list[str] = Field(default_factory=list)
    ctaLabel: str = ""
    ctaDestination: str = ""
    visible: bool = True


class WebsiteContactLink(BaseModel):
    label: str = ""
    url: str = ""
    visible: bool = True


class WebsiteOfficialLinks(BaseModel):
    """Optional official social/community destination URLs for Contact."""

    website: str = ""
    youtube: str = ""
    facebook: str = ""
    instagram: str = ""
    tiktok: str = ""
    linkedin: str = ""


class HomeWebsiteBody(BaseModel):
    pageKind: Literal["home"] = "home"
    publicTitle: str = ""
    subtitle: str = ""
    description: str = ""
    image: WebsiteOptionalImage = Field(default_factory=WebsiteOptionalImage)
    video: WebsiteOptionalVideo = Field(default_factory=WebsiteOptionalVideo)
    cta: WebsiteOptionalCta = Field(default_factory=WebsiteOptionalCta)


class AboutWebsiteBody(BaseModel):
    pageKind: Literal["about"] = "about"
    publicTitle: str = ""
    sections: list[AboutWebsiteSection] = Field(default_factory=list)


class PricingWebsiteBody(BaseModel):
    pageKind: Literal["pricing"] = "pricing"
    publicTitle: str = ""
    intro: str = ""
    offers: list[WebsitePricingOffer] = Field(default_factory=list)
    footnote: str = ""


class PrivacyWebsiteBody(BaseModel):
    pageKind: Literal["privacy"] = "privacy"
    publicTitle: str = ""
    sections: list[WebsiteSection] = Field(default_factory=list)


class TermsWebsiteBody(BaseModel):
    pageKind: Literal["terms"] = "terms"
    publicTitle: str = ""
    sections: list[WebsiteSection] = Field(default_factory=list)


class ContactWebsiteBody(BaseModel):
    pageKind: Literal["contact"] = "contact"
    publicTitle: str = ""
    intro: str = ""
    supportEmail: str = ""
    links: list[WebsiteContactLink] = Field(default_factory=list)
    showManualLink: bool = True
    showKnowledgeBaseLink: bool = True
    manualLinkLabel: str = "Manual și tutoriale"
    knowledgeBaseLinkLabel: str = "Baza de cunoștințe"
    officialLinks: WebsiteOfficialLinks = Field(default_factory=WebsiteOfficialLinks)


WebsiteVariantBody = Annotated[
    Union[
        HomeWebsiteBody,
        AboutWebsiteBody,
        PricingWebsiteBody,
        PrivacyWebsiteBody,
        TermsWebsiteBody,
        ContactWebsiteBody,
    ],
    Field(discriminator="pageKind"),
]


class SaveWebsiteVariantBody(BaseModel):
    pageKind: WebsitePageKind
    publicTitle: str = ""

    @field_validator("publicTitle")
    @classmethod
    def public_title_not_empty_on_save(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Public title cannot be empty.")
        return value


class SaveHomeWebsiteBody(SaveWebsiteVariantBody, HomeWebsiteBody):
    pageKind: Literal["home"] = "home"


class SaveAboutWebsiteBody(SaveWebsiteVariantBody, AboutWebsiteBody):
    pageKind: Literal["about"] = "about"


class SavePricingWebsiteBody(SaveWebsiteVariantBody, PricingWebsiteBody):
    pageKind: Literal["pricing"] = "pricing"

    @field_validator("offers")
    @classmethod
    def offers_must_include_approved_ids(
        cls, offers: list[WebsitePricingOffer]
    ) -> list[WebsitePricingOffer]:
        offer_ids = {offer.id for offer in offers}
        required = {"free", "subscriber", "lifetime"}
        if not required.issubset(offer_ids):
            raise ValueError("Pricing offers must include free, subscriber, and lifetime cards.")
        return offers


class SavePrivacyWebsiteBody(SaveWebsiteVariantBody, PrivacyWebsiteBody):
    pageKind: Literal["privacy"] = "privacy"


class SaveTermsWebsiteBody(SaveWebsiteVariantBody, TermsWebsiteBody):
    pageKind: Literal["terms"] = "terms"


class SaveContactWebsiteBody(SaveWebsiteVariantBody, ContactWebsiteBody):
    pageKind: Literal["contact"] = "contact"


SaveWebsiteVariantBodyUnion = Annotated[
    Union[
        SaveHomeWebsiteBody,
        SaveAboutWebsiteBody,
        SavePricingWebsiteBody,
        SavePrivacyWebsiteBody,
        SaveTermsWebsiteBody,
        SaveContactWebsiteBody,
    ],
    Field(discriminator="pageKind"),
]


class SaveWebsiteVariantRequest(BaseModel):
    body: SaveWebsiteVariantBodyUnion


class WebsitePageMeta(BaseModel):
    contentId: str
    contentType: Literal["website_page"] = "website_page"
    pageKey: str
    slug: str
    adminLabel: str
    pageKind: WebsitePageKind
    sortOrder: int
    createdAt: datetime
    updatedAt: datetime


class WebsiteVariantSummary(BaseModel):
    status: ContentStatus
    updatedAt: datetime | None = None
    publishedAt: datetime | None = None


class WebsitePageListItem(BaseModel):
    pageKey: str
    slug: str
    adminLabel: str
    pageKind: WebsitePageKind
    sortOrder: int
    publicTitle: str = ""
    variants: dict[str, WebsiteVariantSummary]


class WebsiteVariantResponse(TranslationMetadataFields):
    pageKey: str
    locale: AdminLocaleCode
    pageKind: WebsitePageKind
    status: ContentStatus
    editorialVisibility: EditorialVisibility
    body: WebsiteVariantBody
    exists: bool = True
    updatedAt: datetime | None = None
    publishedAt: datetime | None = None


class PublishWebsiteVariantResponse(BaseModel):
    pageKey: str
    locale: AdminLocaleCode
    status: ContentStatus
    publishedAt: datetime
    snapshotKey: str


class PublicWebsitePage(BaseModel):
    pageKey: str
    slug: str
    pageKind: WebsitePageKind
    body: WebsiteVariantBody


class PublicWebsiteResponse(BaseModel):
    locale: str
    requestedLocale: str
    page: PublicWebsitePage | None = None
    available: bool = False
    englishAvailable: bool = False
