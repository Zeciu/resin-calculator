"""Fixed Website module page registry and empty draft bodies."""

from __future__ import annotations

from typing import Any, Literal, TypedDict


WebsitePageKind = Literal["home", "about", "pricing", "privacy", "terms", "contact"]


class WebsitePageDefinition(TypedDict):
    pageKey: str
    slug: str
    adminLabel: str
    pageKind: WebsitePageKind
    sortOrder: int


WEBSITE_PAGE_DEFINITIONS: tuple[WebsitePageDefinition, ...] = (
    {
        "pageKey": "home",
        "slug": "/",
        "adminLabel": "Home",
        "pageKind": "home",
        "sortOrder": 100,
    },
    {
        "pageKey": "about",
        "slug": "/about",
        "adminLabel": "About HFZWood",
        "pageKind": "about",
        "sortOrder": 200,
    },
    {
        "pageKey": "pricing",
        "slug": "/pricing",
        "adminLabel": "Pricing",
        "pageKind": "pricing",
        "sortOrder": 300,
    },
    {
        "pageKey": "privacy",
        "slug": "/privacy",
        "adminLabel": "Privacy Policy",
        "pageKind": "privacy",
        "sortOrder": 400,
    },
    {
        "pageKey": "terms",
        "slug": "/terms",
        "adminLabel": "Terms of Service",
        "pageKind": "terms",
        "sortOrder": 500,
    },
    {
        "pageKey": "contact",
        "slug": "/contact",
        "adminLabel": "Contact",
        "pageKind": "contact",
        "sortOrder": 600,
    },
)

WEBSITE_PAGE_KEYS: frozenset[str] = frozenset(page["pageKey"] for page in WEBSITE_PAGE_DEFINITIONS)

DEFAULT_PRICING_OFFER_IDS = ("free", "subscriber", "lifetime")

DEFAULT_MANUAL_LINK_LABEL = "Manual și tutoriale"
DEFAULT_KNOWLEDGE_BASE_LINK_LABEL = "Baza de cunoștințe"


def website_page_definition(page_key: str) -> WebsitePageDefinition:
    for page in WEBSITE_PAGE_DEFINITIONS:
        if page["pageKey"] == page_key:
            return page
    raise KeyError(page_key)


def empty_website_draft_body(page_kind: WebsitePageKind) -> dict[str, Any]:
    if page_kind == "home":
        return {
            "pageKind": "home",
            "publicTitle": "",
            "subtitle": "",
            "description": "",
            "image": {"src": "", "alt": "", "visible": False},
            "video": {"url": "", "visible": False},
            "cta": {"label": "", "destination": "", "visible": False},
        }
    if page_kind == "about":
        return {
            "pageKind": "about",
            "publicTitle": "",
            "sections": [],
        }
    if page_kind == "pricing":
        return {
            "pageKind": "pricing",
            "publicTitle": "",
            "intro": "",
            "offers": [
                {
                    "id": offer_id,
                    "title": "",
                    "displayedPriceText": "",
                    "benefits": [],
                    "ctaLabel": "",
                    "ctaDestination": "",
                    "visible": True,
                }
                for offer_id in DEFAULT_PRICING_OFFER_IDS
            ],
            "footnote": "",
        }
    if page_kind in {"privacy", "terms"}:
        return {
            "pageKind": page_kind,
            "publicTitle": "",
            "sections": [],
        }
    if page_kind == "contact":
        return {
            "pageKind": "contact",
            "publicTitle": "",
            "intro": "",
            "supportEmail": "",
            "links": [],
            "showManualLink": True,
            "showKnowledgeBaseLink": True,
            "manualLinkLabel": DEFAULT_MANUAL_LINK_LABEL,
            "knowledgeBaseLinkLabel": DEFAULT_KNOWLEDGE_BASE_LINK_LABEL,
            "officialLinks": {
                "website": "",
                "youtube": "",
                "facebook": "",
                "instagram": "",
                "tiktok": "",
                "linkedin": "",
            },
        }
    raise ValueError(f"Unsupported website page kind: {page_kind}")


def empty_website_snapshot_document(locale: str) -> dict[str, Any]:
    return {"locale": locale, "pages": {}}
