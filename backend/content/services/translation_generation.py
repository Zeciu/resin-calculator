"""Editorial translation generation orchestration (Admin Generate Translation)."""

from __future__ import annotations

from typing import Any, Literal

from content.repositories.filesystem import utc_now
from content.schemas.common import parse_admin_locale
from content.translation.deepl import DeepLTranslationProvider, PROVIDER_NAME
from content.translation.editorial_text import (
    EditorialModule,
    extract_translatable_items,
    reconstruct_draft_body,
)
from content.translation.exceptions import (
    TranslationError,
)
from content.translation.provider import TranslationProvider
from content.translation_metadata import (
    CANONICAL_SOURCE_LOCALE,
    read_source_revision,
    translation_metadata_on_generation,
)

GenerateModule = Literal["manual", "glossary", "knowledge_base"]


class TranslationGenerationError(Exception):
    """Base orchestration error with a safe client message."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class MissingRomanianSourceError(TranslationGenerationError):
    pass


class NothingToTranslateError(TranslationGenerationError):
    pass


class OverwriteConfirmationRequired(TranslationGenerationError):
    def __init__(self) -> None:
        super().__init__(
            "Target draft already exists. Confirm overwrite to regenerate the translation."
        )


class TranslationGenerationService:
    """Load RO source → translate fields → atomically persist target draft."""

    def __init__(
        self,
        repository,
        *,
        provider: TranslationProvider | None = None,
    ) -> None:
        self._repository = repository
        self._provider = provider

    def _get_provider(self) -> TranslationProvider:
        if self._provider is not None:
            return self._provider
        return DeepLTranslationProvider()

    def generate(
        self,
        *,
        module: GenerateModule,
        content_id: str,
        target_locale: str,
        confirm_overwrite: bool = False,
    ) -> dict[str, Any]:
        """
        Generate a target-language draft from the Romanian canonical draft.

        Returns the persisted target variant record (dict).
        """
        parsed_target = parse_admin_locale(target_locale)
        if parsed_target == CANONICAL_SOURCE_LOCALE:
            raise TranslationGenerationError(
                "Cannot generate a translation into the Romanian source locale."
            )

        ro_variant = self._load_ro_variant(module, content_id)
        if ro_variant is None:
            raise MissingRomanianSourceError(
                "Romanian source variant was not found for this item."
            )

        draft_body = ro_variant.get("draftBody")
        if not isinstance(draft_body, dict):
            raise MissingRomanianSourceError(
                "Romanian source draft is missing."
            )

        items = extract_translatable_items(module, draft_body)
        if not items:
            raise NothingToTranslateError(
                "Nothing to translate. The Romanian draft has no translatable content."
            )

        provider = self._get_provider()
        if isinstance(provider, DeepLTranslationProvider):
            provider._config.require_available()

        target_variant = self._load_target_variant(module, content_id, parsed_target)
        if target_variant is not None and not confirm_overwrite:
            raise OverwriteConfirmationRequired()

        source_revision = read_source_revision(ro_variant)
        if source_revision is None:
            source_revision = 1

        translated_pairs: list[tuple[Any, str]] = []
        for item in items:
            result = provider.translate(
                item.text,
                source_locale=CANONICAL_SOURCE_LOCALE,
                target_locale=parsed_target,
                context=item.context,
                content_format=item.content_format,
            )
            translated_pairs.append((item, result.text))

        new_body = reconstruct_draft_body(draft_body, translated_pairs)
        generation_metadata = translation_metadata_on_generation(
            source_revision=source_revision,
            provider=PROVIDER_NAME,
            generated_at=utc_now(),
        )
        return self._persist_generated(
            module=module,
            content_id=content_id,
            target_locale=parsed_target,
            body=new_body,
            generation_metadata=generation_metadata,
            existing_target=target_variant,
        )

    def _load_ro_variant(self, module: GenerateModule, content_id: str) -> dict[str, Any] | None:
        self._require_meta(module, content_id)
        if module == "manual":
            return self._repository.get_manual_variant(content_id, CANONICAL_SOURCE_LOCALE)
        if module == "glossary":
            return self._repository.get_glossary_variant(content_id, CANONICAL_SOURCE_LOCALE)
        return self._repository.get_kb_variant(content_id, CANONICAL_SOURCE_LOCALE)

    def _load_target_variant(
        self, module: GenerateModule, content_id: str, locale: str
    ) -> dict[str, Any] | None:
        if module == "manual":
            return self._repository.get_manual_variant(content_id, locale)
        if module == "glossary":
            return self._repository.get_glossary_variant(content_id, locale)
        return self._repository.get_kb_variant(content_id, locale)

    def _require_meta(self, module: GenerateModule, content_id: str) -> None:
        if module == "manual":
            meta = self._repository.get_manual_chapter_meta(content_id)
        elif module == "glossary":
            meta = self._repository.get_glossary_entry_meta(content_id)
        else:
            meta = self._repository.get_kb_entry_meta(content_id)
        if meta is None:
            raise KeyError(content_id)

    def _persist_generated(
        self,
        *,
        module: GenerateModule,
        content_id: str,
        target_locale: str,
        body: dict[str, Any],
        generation_metadata: dict[str, Any],
        existing_target: dict[str, Any] | None,
    ) -> dict[str, Any]:
        if module == "manual":
            return self._repository.save_manual_variant(
                content_id,
                target_locale,
                body,
                generation_metadata=generation_metadata,
            )
        if module == "glossary":
            return self._repository.save_glossary_variant(
                content_id,
                target_locale,
                body,
                generation_metadata=generation_metadata,
            )

        meta = self._repository.get_kb_entry_meta(content_id)
        assert meta is not None
        # Preserve category/difficulty; clear bodyBlocks like normal KB saves.
        cleaned = dict(body)
        cleaned["bodyBlocks"] = []
        return self._repository.save_kb_variant(
            content_id,
            target_locale,
            cleaned,
            category=meta.get("category", "Epoxy"),
            difficulty=meta.get("difficulty", "Beginner"),
            generation_metadata=generation_metadata,
        )


def map_provider_error_to_http(exc: TranslationError) -> tuple[int, str]:
    """Map provider-neutral errors to (status_code, safe_detail)."""
    from content.translation.exceptions import (
        TranslationAuthError,
        TranslationConfigurationError,
        TranslationInvalidRequestError,
        TranslationMalformedResponseError,
        TranslationQuotaExceededError,
        TranslationRateLimitedError,
        TranslationRequestTooLargeError,
        TranslationTemporaryProviderError,
        TranslationTimeoutError,
        TranslationUnsupportedLocaleError,
    )

    if isinstance(exc, TranslationConfigurationError):
        return 503, "Translation provider is not configured."
    if isinstance(
        exc,
        (
            TranslationTemporaryProviderError,
            TranslationTimeoutError,
            TranslationRateLimitedError,
            TranslationAuthError,
            TranslationQuotaExceededError,
            TranslationMalformedResponseError,
        ),
    ):
        return 502, "Translation provider failed. Try again later."
    if isinstance(
        exc,
        (
            TranslationUnsupportedLocaleError,
            TranslationInvalidRequestError,
            TranslationRequestTooLargeError,
        ),
    ):
        return 400, str(exc) if str(exc) else "Invalid translation request."
    return 502, "Translation provider failed. Try again later."
