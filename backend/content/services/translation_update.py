"""Shared single-item translation update engine (classify + sync + generate)."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Literal

from content.repositories.filesystem import utc_now
from content.schemas.common import parse_admin_locale
from content.translation.deepl import DeepLTranslationProvider, PROVIDER_NAME
from content.translation.editorial_text import (
    EditorialModule,
    extract_translatable_items,
    reconstruct_draft_body,
)
from content.translation.provider import TranslationProvider
from content.translation_metadata import (
    CANONICAL_SOURCE_LOCALE,
    effective_source_text_revision,
    read_generated_from_source_revision,
    read_generated_from_source_text_revision,
    read_source_revision,
    translation_metadata_on_generation,
    translation_metadata_on_media_sync,
)

GenerateModule = Literal["manual", "glossary", "knowledge_base", "website"]


class TranslationUpdateState(str, Enum):
    MISSING = "missing"
    CURRENT = "current"
    MEDIA_ONLY_OUTDATED = "media_only_outdated"
    TEXT_OUTDATED = "text_outdated"
    MANUAL_UNTRACKED = "manual_untracked"


class TranslationUpdateAction(str, Enum):
    SKIP_CURRENT = "skip_current"
    SKIP_MANUAL_UNTRACKED = "skip_manual_untracked"
    GENERATE_FULL = "generate_full"
    SYNC_MEDIA_ONLY = "sync_media_only"


@dataclass(frozen=True, slots=True)
class TranslationClassification:
    state: TranslationUpdateState
    action: TranslationUpdateAction


class TranslationUpdateError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class MissingRomanianSourceError(TranslationUpdateError):
    pass


class NothingToTranslateError(TranslationUpdateError):
    pass


class OverwriteConfirmationRequired(TranslationUpdateError):
    def __init__(self, *, state: TranslationUpdateState) -> None:
        if state == TranslationUpdateState.MANUAL_UNTRACKED:
            message = (
                "Target draft is manual or untracked. Confirm overwrite to replace it "
                "with an AI translation."
            )
        else:
            message = (
                "Target draft already exists. Confirm overwrite to regenerate the translation."
            )
        super().__init__(message)
        self.state = state


class MediaSyncIncompatibleError(TranslationUpdateError):
    def __init__(self) -> None:
        super().__init__(
            "Media-only synchronization is unsafe for this structure. "
            "Full translation regeneration is required."
        )


def classify_translation_update(
    *,
    ro_variant: dict[str, Any],
    target_variant: dict[str, Any] | None,
) -> TranslationClassification:
    """
    Classify a single target against the Romanian source counters.

    Legacy targets without generatedFromSourceTextRevision → text_outdated (never media-only).
    Legacy RO without sourceTextRevision → cannot prove media-only → text_outdated when
    revision metadata is incomplete.
    """
    if target_variant is None:
        return TranslationClassification(
            state=TranslationUpdateState.MISSING,
            action=TranslationUpdateAction.GENERATE_FULL,
        )

    generated_from = read_generated_from_source_revision(target_variant)
    if generated_from is None:
        return TranslationClassification(
            state=TranslationUpdateState.MANUAL_UNTRACKED,
            action=TranslationUpdateAction.SKIP_MANUAL_UNTRACKED,
        )

    generated_from_text = read_generated_from_source_text_revision(target_variant)
    ro_rev = read_source_revision(ro_variant)
    ro_text = effective_source_text_revision(ro_variant)

    if generated_from_text is None or ro_text is None or ro_rev is None:
        return TranslationClassification(
            state=TranslationUpdateState.TEXT_OUTDATED,
            action=TranslationUpdateAction.GENERATE_FULL,
        )

    if generated_from == ro_rev and generated_from_text == ro_text:
        return TranslationClassification(
            state=TranslationUpdateState.CURRENT,
            action=TranslationUpdateAction.SKIP_CURRENT,
        )

    if generated_from_text == ro_text and generated_from < ro_rev:
        return TranslationClassification(
            state=TranslationUpdateState.MEDIA_ONLY_OUTDATED,
            action=TranslationUpdateAction.SYNC_MEDIA_ONLY,
        )

    return TranslationClassification(
        state=TranslationUpdateState.TEXT_OUTDATED,
        action=TranslationUpdateAction.GENERATE_FULL,
    )


def classification_fields_for_api(
    *,
    locale: str,
    ro_variant: dict[str, Any] | None,
    target_variant: dict[str, Any] | None,
) -> dict[str, str | None]:
    """Ephemeral classification for Admin variant responses (not persisted)."""
    if locale == CANONICAL_SOURCE_LOCALE or ro_variant is None:
        return {"translationUpdateState": None, "translationUpdateAction": None}
    classification = classify_translation_update(
        ro_variant=ro_variant,
        target_variant=target_variant,
    )
    return {
        "translationUpdateState": classification.state.value,
        "translationUpdateAction": classification.action.value,
    }


def sync_media_only_body(
    *,
    module: EditorialModule,
    ro_draft: dict[str, Any],
    target_draft: dict[str, Any],
) -> dict[str, Any]:
    """
    Rebuild target draft from the Romanian structural skeleton, remapping translated
    texts by ordered extract sequence (safe across media insert/move when text sequence
    length matches).
    """
    ro_items = extract_translatable_items(module, ro_draft)
    target_items = extract_translatable_items(module, target_draft)
    if len(ro_items) != len(target_items):
        raise MediaSyncIncompatibleError()

    pairs = list(zip(ro_items, (item.text for item in target_items), strict=True))
    return reconstruct_draft_body(ro_draft, pairs)


class TranslationUpdateService:
    """Classify and apply a single-item translation update."""

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

    def classify_item(
        self,
        *,
        module: GenerateModule,
        content_id: str,
        target_locale: str,
    ) -> tuple[dict[str, Any] | None, dict[str, Any] | None, TranslationClassification]:
        """
        Load latest Romanian draft + target draft and classify.

        Same source data path as update() / Admin GET variant classification.
        Returns (ro_variant, target_variant, classification).
        """
        parsed_target = parse_admin_locale(target_locale)
        if parsed_target == CANONICAL_SOURCE_LOCALE:
            raise TranslationUpdateError(
                "Cannot classify a translation for the Romanian source locale."
            )

        self._require_meta(module, content_id)
        ro_variant = self._load_ro_variant(module, content_id)
        target_variant = self._load_target_variant(module, content_id, parsed_target)
        if ro_variant is None or not isinstance(ro_variant.get("draftBody"), dict):
            return (
                ro_variant,
                target_variant,
                TranslationClassification(
                    state=TranslationUpdateState.MISSING,
                    action=TranslationUpdateAction.GENERATE_FULL,
                ),
            )
        classification = classify_translation_update(
            ro_variant=ro_variant,
            target_variant=target_variant,
        )
        return ro_variant, target_variant, classification

    def update(
        self,
        *,
        module: GenerateModule,
        content_id: str,
        target_locale: str,
        confirm_overwrite: bool = False,
    ) -> tuple[dict[str, Any], TranslationClassification]:
        """Return (variant_record, classification) after applying the update action."""
        parsed_target = parse_admin_locale(target_locale)
        if parsed_target == CANONICAL_SOURCE_LOCALE:
            raise TranslationUpdateError(
                "Cannot generate a translation into the Romanian source locale."
            )

        ro_variant, target_variant, classification = self.classify_item(
            module=module,
            content_id=content_id,
            target_locale=parsed_target,
        )
        if ro_variant is None:
            raise MissingRomanianSourceError(
                "Romanian source variant was not found for this item."
            )

        draft_body = ro_variant.get("draftBody")
        if not isinstance(draft_body, dict):
            raise MissingRomanianSourceError("Romanian source draft is missing.")

        if classification.action == TranslationUpdateAction.SKIP_CURRENT:
            assert target_variant is not None
            return target_variant, classification

        if classification.action == TranslationUpdateAction.SKIP_MANUAL_UNTRACKED:
            if not confirm_overwrite:
                raise OverwriteConfirmationRequired(
                    state=TranslationUpdateState.MANUAL_UNTRACKED
                )
            saved = self._generate_full(
                module=module,
                content_id=content_id,
                target_locale=parsed_target,
                ro_variant=ro_variant,
                draft_body=draft_body,
            )
            post = classify_translation_update(ro_variant=ro_variant, target_variant=saved)
            return saved, post

        if classification.action == TranslationUpdateAction.SYNC_MEDIA_ONLY:
            assert target_variant is not None
            target_body = target_variant.get("draftBody")
            if not isinstance(target_body, dict):
                raise MediaSyncIncompatibleError()
            try:
                new_body = sync_media_only_body(
                    module=module,
                    ro_draft=draft_body,
                    target_draft=target_body,
                )
            except MediaSyncIncompatibleError:
                if not confirm_overwrite:
                    raise OverwriteConfirmationRequired(
                        state=TranslationUpdateState.TEXT_OUTDATED
                    ) from None
                saved = self._generate_full(
                    module=module,
                    content_id=content_id,
                    target_locale=parsed_target,
                    ro_variant=ro_variant,
                    draft_body=draft_body,
                )
                post = classify_translation_update(ro_variant=ro_variant, target_variant=saved)
                return saved, post

            source_revision = read_source_revision(ro_variant) or 1
            metadata = translation_metadata_on_media_sync(
                source_revision=source_revision,
                existing_target=target_variant,
            )
            saved = self._persist(
                module=module,
                content_id=content_id,
                target_locale=parsed_target,
                body=new_body,
                generation_metadata=metadata,
            )
            post = classify_translation_update(ro_variant=ro_variant, target_variant=saved)
            return saved, post

        if target_variant is not None and not confirm_overwrite:
            raise OverwriteConfirmationRequired(state=classification.state)

        items = extract_translatable_items(module, draft_body)
        if not items:
            raise NothingToTranslateError(
                "Nothing to translate. The Romanian draft has no translatable content."
            )

        saved = self._generate_full(
            module=module,
            content_id=content_id,
            target_locale=parsed_target,
            ro_variant=ro_variant,
            draft_body=draft_body,
        )
        post = classify_translation_update(ro_variant=ro_variant, target_variant=saved)
        return saved, post

    def _generate_full(
        self,
        *,
        module: GenerateModule,
        content_id: str,
        target_locale: str,
        ro_variant: dict[str, Any],
        draft_body: dict[str, Any],
    ) -> dict[str, Any]:
        items = extract_translatable_items(module, draft_body)
        if not items:
            raise NothingToTranslateError(
                "Nothing to translate. The Romanian draft has no translatable content."
            )

        provider = self._get_provider()
        if isinstance(provider, DeepLTranslationProvider):
            provider._config.require_available()

        translated_pairs: list[tuple[Any, str]] = []
        for item in items:
            result = provider.translate(
                item.text,
                source_locale=CANONICAL_SOURCE_LOCALE,
                target_locale=target_locale,
                context=item.context,
                content_format=item.content_format,
            )
            translated_pairs.append((item, result.text))

        new_body = reconstruct_draft_body(draft_body, translated_pairs)
        source_revision = read_source_revision(ro_variant) or 1
        source_text_revision = effective_source_text_revision(ro_variant)
        if source_text_revision is None:
            source_text_revision = source_revision

        generation_metadata = translation_metadata_on_generation(
            source_revision=source_revision,
            source_text_revision=source_text_revision,
            provider=PROVIDER_NAME,
            generated_at=utc_now(),
        )
        return self._persist(
            module=module,
            content_id=content_id,
            target_locale=target_locale,
            body=new_body,
            generation_metadata=generation_metadata,
        )

    def _load_ro_variant(self, module: GenerateModule, content_id: str) -> dict[str, Any] | None:
        if module == "manual":
            return self._repository.get_manual_variant(content_id, CANONICAL_SOURCE_LOCALE)
        if module == "glossary":
            return self._repository.get_glossary_variant(content_id, CANONICAL_SOURCE_LOCALE)
        if module == "website":
            return self._repository.get_website_variant(content_id, CANONICAL_SOURCE_LOCALE)
        return self._repository.get_kb_variant(content_id, CANONICAL_SOURCE_LOCALE)

    def _load_target_variant(
        self, module: GenerateModule, content_id: str, locale: str
    ) -> dict[str, Any] | None:
        if module == "manual":
            return self._repository.get_manual_variant(content_id, locale)
        if module == "glossary":
            return self._repository.get_glossary_variant(content_id, locale)
        if module == "website":
            return self._repository.get_website_variant(content_id, locale)
        return self._repository.get_kb_variant(content_id, locale)

    def _require_meta(self, module: GenerateModule, content_id: str) -> None:
        if module == "manual":
            meta = self._repository.get_manual_chapter_meta(content_id)
        elif module == "glossary":
            meta = self._repository.get_glossary_entry_meta(content_id)
        elif module == "website":
            meta = self._repository.get_website_page_meta(content_id)
        else:
            meta = self._repository.get_kb_entry_meta(content_id)
        if meta is None:
            raise KeyError(content_id)

    def _persist(
        self,
        *,
        module: GenerateModule,
        content_id: str,
        target_locale: str,
        body: dict[str, Any],
        generation_metadata: dict[str, Any],
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
        if module == "website":
            return self._repository.save_website_variant(
                content_id,
                target_locale,
                body,
                generation_metadata=generation_metadata,
            )

        meta = self._repository.get_kb_entry_meta(content_id)
        assert meta is not None
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
