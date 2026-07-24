from __future__ import annotations

from ..repositories.filesystem import DEFAULT_LOCALE, EDITORIAL_LOCALES, parse_iso
from ..schemas.common import ContentStatus
from ..schemas.editorial import EditorialVisibility
from ..schemas.website import (
    SaveAboutWebsiteBody,
    SaveContactWebsiteBody,
    SaveHomeWebsiteBody,
    SavePricingWebsiteBody,
    SavePrivacyWebsiteBody,
    SaveTermsWebsiteBody,
    WebsitePageListItem,
    WebsiteVariantResponse,
    WebsiteVariantSummary,
    parse_admin_locale,
)
from ..website_pages import WEBSITE_PAGE_DEFINITIONS, empty_website_draft_body, website_page_definition
from .editorial_status import compute_editorial_visibility
from .translation_update import classification_fields_for_api
from ..translation_metadata import translation_metadata_for_api


_SAVE_BODY_VALIDATORS = {
    "home": SaveHomeWebsiteBody,
    "about": SaveAboutWebsiteBody,
    "pricing": SavePricingWebsiteBody,
    "privacy": SavePrivacyWebsiteBody,
    "terms": SaveTermsWebsiteBody,
    "contact": SaveContactWebsiteBody,
}


def validate_save_body(page_kind: str, body: dict) -> dict:
    validator = _SAVE_BODY_VALIDATORS.get(page_kind)
    if validator is None:
        raise ValueError(f"Unsupported website page kind: {page_kind}")
    return validator.model_validate(body).model_dump()


def variant_has_publishable_body(body: dict) -> bool:
    return bool(str(body.get("publicTitle", "")).strip())


def resolve_public_title(repository, page_key: str, locale: str) -> str:
    records = repository.read_editorial_records()
    return resolve_public_title_from_store(repository, records, page_key, locale)


def resolve_public_title_from_store(repository, records, page_key: str, locale: str) -> str:
    variant = repository.get_website_variant_from_store(records, page_key, locale)
    if variant and isinstance(variant.get("draftBody"), dict):
        title = str(variant["draftBody"].get("publicTitle", "")).strip()
        if title:
            return title
    if locale != DEFAULT_LOCALE:
        ro_variant = repository.get_website_variant_from_store(records, page_key, DEFAULT_LOCALE)
        if ro_variant and isinstance(ro_variant.get("draftBody"), dict):
            return str(ro_variant["draftBody"].get("publicTitle", "")).strip()
    return ""


class WebsitePageService:
    def __init__(self, repository):
        self._repository = repository

    def list_pages(self, locale: str = DEFAULT_LOCALE) -> list[WebsitePageListItem]:
        parsed_locale = parse_admin_locale(locale)
        # ensure returns the store it loaded — reuse it (one read when pages already exist).
        records = self._repository.ensure_website_pages_exist()
        items: list[WebsitePageListItem] = []
        for page in WEBSITE_PAGE_DEFINITIONS:
            page_key = page["pageKey"]
            meta = self._repository.get_website_page_meta_from_store(records, page_key)
            if not meta:
                continue
            variants: dict[str, WebsiteVariantSummary] = {}
            for variant_locale in EDITORIAL_LOCALES:
                variant = self._repository.get_website_variant_from_store(
                    records, page_key, variant_locale
                )
                if not variant:
                    continue
                variants[variant_locale] = WebsiteVariantSummary(
                    status=ContentStatus(variant["status"]),
                    updatedAt=parse_iso(variant.get("updatedAt")),
                    publishedAt=parse_iso(variant.get("publishedAt")),
                )
            items.append(
                WebsitePageListItem(
                    pageKey=page_key,
                    slug=meta["slug"],
                    adminLabel=meta["adminLabel"],
                    pageKind=meta["pageKind"],
                    sortOrder=meta["sortOrder"],
                    publicTitle=resolve_public_title_from_store(
                        self._repository, records, page_key, parsed_locale
                    ),
                    variants=variants,
                )
            )
        return items

    def _variant_response(self, page_key: str, locale: str, variant: dict | None) -> WebsiteVariantResponse:
        parsed_locale = parse_admin_locale(locale)
        meta = self._repository.get_website_page_meta(page_key)
        if not meta:
            raise KeyError(page_key)
        page_kind = meta["pageKind"]
        translation_fields = translation_metadata_for_api(variant)
        translation_fields.update(
            classification_fields_for_api(
                locale=parsed_locale,
                ro_variant=(
                    None
                    if parsed_locale == "ro"
                    else self._repository.get_website_variant(page_key, "ro")
                ),
                target_variant=None if parsed_locale == "ro" else variant,
            )
        )
        empty_body = empty_website_draft_body(page_kind)

        if not variant:
            return WebsiteVariantResponse(
                pageKey=page_key,
                locale=parsed_locale,
                pageKind=page_kind,
                status=ContentStatus.DRAFT,
                editorialVisibility=EditorialVisibility.EMPTY,
                body=empty_body,
                exists=False,
                updatedAt=None,
                publishedAt=None,
                **translation_fields,
            )
        status = ContentStatus(variant["status"])
        updated_at = parse_iso(variant.get("updatedAt"))
        published_at = parse_iso(variant.get("publishedAt"))
        return WebsiteVariantResponse(
            pageKey=page_key,
            locale=parsed_locale,
            pageKind=page_kind,
            status=status,
            editorialVisibility=compute_editorial_visibility(
                exists=True,
                status=status,
                updated_at=updated_at,
                published_at=published_at,
            ),
            body=variant["draftBody"],
            exists=True,
            updatedAt=updated_at,
            publishedAt=published_at,
            **translation_fields,
        )

    def get_variant(self, page_key: str, locale: str) -> WebsiteVariantResponse:
        parse_admin_locale(locale)
        if not self._repository.get_website_page_meta(page_key):
            raise KeyError(page_key)
        variant = self._repository.get_website_variant(page_key, locale)
        return self._variant_response(page_key, locale, variant)

    def save_variant(self, page_key: str, locale: str, body: dict) -> WebsiteVariantResponse:
        parsed_locale = parse_admin_locale(locale)
        page = website_page_definition(page_key)
        validated_body = validate_save_body(page["pageKind"], body)
        saved = self._repository.save_website_variant(page_key, parsed_locale, validated_body)
        return self._variant_response(page_key, parsed_locale, saved)

    def generate_translation(
        self,
        page_key: str,
        locale: str,
        *,
        confirm_overwrite: bool = False,
        provider=None,
    ) -> WebsiteVariantResponse:
        from content.services.translation_generation import TranslationGenerationService

        service = TranslationGenerationService(self._repository, provider=provider)
        saved = service.generate(
            module="website",
            content_id=page_key,
            target_locale=locale,
            confirm_overwrite=confirm_overwrite,
        )
        return self._variant_response(page_key, locale, saved)
