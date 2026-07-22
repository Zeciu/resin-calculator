from __future__ import annotations

from ..repositories.filesystem import FilesystemContentRepository
from ..schemas.website import PublicWebsitePage, PublicWebsiteResponse, parse_admin_locale, parse_locale
from ..website_pages import WEBSITE_PAGE_KEYS


class WebsitePublicService:
    def __init__(self, repository: FilesystemContentRepository):
        self._repository = repository

    def build_admin_snapshot(self, locale: str) -> dict:
        parsed_locale = parse_admin_locale(locale)
        pages: dict[str, dict] = {}
        for page_key in self._repository.list_website_page_ids():
            meta = self._repository.get_website_page_meta(page_key)
            variant = self._repository.get_website_variant(page_key, parsed_locale)
            if not meta or not variant or variant.get("status") != "published":
                continue
            pages[page_key] = {
                "pageKey": page_key,
                "slug": meta["slug"],
                "pageKind": meta["pageKind"],
                "body": variant["draftBody"],
            }
        return {"locale": parsed_locale, "pages": pages}

    def _page_from_snapshot(self, page_key: str, locale: str) -> PublicWebsitePage | None:
        snapshot = self._repository.read_website_snapshot(locale)
        if not snapshot:
            return None
        page_data = (snapshot.get("pages") or {}).get(page_key)
        if not page_data:
            return None
        return PublicWebsitePage.model_validate(page_data)

    def get_published_page(self, page_key: str, locale: str) -> PublicWebsiteResponse:
        if page_key not in WEBSITE_PAGE_KEYS:
            raise KeyError(page_key)

        requested_locale = parse_locale(locale)
        page = self._page_from_snapshot(page_key, requested_locale)
        english_page = self._page_from_snapshot(page_key, "en")

        return PublicWebsiteResponse(
            locale=requested_locale,
            requestedLocale=requested_locale,
            available=page is not None,
            englishAvailable=english_page is not None,
            page=page,
        )