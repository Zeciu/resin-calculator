"""Task A — translation update engine: revisions, classify, media sync."""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Literal

import pytest

from content.repositories.filesystem import FilesystemContentRepository
from content.services.translation_generation import (
    OverwriteConfirmationRequired,
    TranslationGenerationService,
)
from content.services.translation_update import (
    MediaSyncIncompatibleError,
    TranslationUpdateAction,
    TranslationUpdateState,
    TranslationUpdateService,
    classify_translation_update,
    sync_media_only_body,
)
from content.translation.types import TranslationResult


class FakeTranslationProvider:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def translate(
        self,
        text: str,
        *,
        source_locale: str,
        target_locale: str,
        context: str | None = None,
        content_format: Literal["plain", "html"] = "html",
        glossary_id: str | None = None,
    ) -> TranslationResult:
        self.calls.append({"text": text, "target_locale": target_locale})
        return TranslationResult(
            text=f"[{target_locale}]{text}",
            provider="deepl",
            source_locale=source_locale,
            target_locale=target_locale,
            billed_characters=len(text),
        )


@pytest.fixture
def repository(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    return FilesystemContentRepository(tmp_path)


def manual_body(
    title: str = "Capitol",
    paragraph: str = "Text.",
    *,
    blocks: list[dict] | None = None,
) -> dict:
    return {
        "title": title,
        "sections": [
            {
                "id": "main",
                "title": "",
                "blocks": blocks
                if blocks is not None
                else [{"type": "paragraph", "text": paragraph}],
            }
        ],
    }


def glossary_body(term: str = "Termen", definition: str = "Definiție.") -> dict:
    return {
        "term": term,
        "definitionBlocks": [{"type": "paragraph", "text": definition}],
        "media": [],
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


def kb_body(title: str = "Problemă", summary: str = "Rezumat.") -> dict:
    return {
        "title": title,
        "problemSummary": summary,
        "symptoms": ["S1"],
        "possibleCauses": [],
        "solution": ["Sol"],
        "prevention": [],
        "tips": [],
        "warnings": [],
        "searchKeywords": [],
        "estimatedRepairTime": None,
        "requiredTools": [],
        "requiredMaterials": [],
        "bodyBlocks": [],
        "media": [],
        "relatedKbEntryIds": [],
        "relatedGlossaryEntryIds": [],
        "relatedManualChapterIds": [],
    }


class TestSourceTextRevision:
    def test_identical_save_neither_counter_changes(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        body = manual_body()
        first = repository.save_manual_variant(meta["contentId"], "ro", body)
        second = repository.save_manual_variant(meta["contentId"], "ro", body)
        assert second["sourceRevision"] == first["sourceRevision"]
        assert second["sourceTextRevision"] == first["sourceTextRevision"]

    def test_image_src_only_bumps_full_revision(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        blocks = [
            {"type": "paragraph", "text": "P."},
            {"type": "image", "src": "/a.png", "alt": "alt", "caption": "cap"},
        ]
        first = repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks))
        blocks2 = deepcopy(blocks)
        blocks2[1]["src"] = "/b.png"
        second = repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks2))
        assert second["sourceRevision"] == first["sourceRevision"] + 1
        assert second["sourceTextRevision"] == first["sourceTextRevision"]

    def test_video_embed_only_bumps_full_revision(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        blocks = [
            {"type": "paragraph", "text": "P."},
            {
                "type": "video",
                "title": "Clip",
                "embedUrl": "https://example.com/1",
                "caption": "cap",
            },
        ]
        first = repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks))
        blocks2 = deepcopy(blocks)
        blocks2[1]["embedUrl"] = "https://example.com/2"
        second = repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks2))
        assert second["sourceRevision"] == first["sourceRevision"] + 1
        assert second["sourceTextRevision"] == first["sourceTextRevision"]

    def test_paragraph_text_bumps_both(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        first = repository.save_manual_variant(cid, "ro", manual_body(paragraph="Unu."))
        second = repository.save_manual_variant(cid, "ro", manual_body(paragraph="Doi."))
        assert second["sourceRevision"] == first["sourceRevision"] + 1
        assert second["sourceTextRevision"] == first["sourceTextRevision"] + 1

    def test_heading_text_bumps_both(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        blocks = [{"type": "heading", "text": "H1", "level": 2}]
        first = repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks))
        blocks2 = [{"type": "heading", "text": "H2", "level": 2}]
        second = repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks2))
        assert second["sourceTextRevision"] == first["sourceTextRevision"] + 1

    def test_image_alt_bumps_both(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        blocks = [{"type": "image", "src": "/a.png", "alt": "a", "caption": "c"}]
        first = repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks))
        blocks2 = [{"type": "image", "src": "/a.png", "alt": "b", "caption": "c"}]
        second = repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks2))
        assert second["sourceTextRevision"] == first["sourceTextRevision"] + 1
        assert second["sourceRevision"] == first["sourceRevision"] + 1

    def test_video_title_bumps_both(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        blocks = [
            {"type": "video", "title": "T1", "embedUrl": "https://e/1", "caption": "c"}
        ]
        first = repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks))
        blocks2 = [
            {"type": "video", "title": "T2", "embedUrl": "https://e/1", "caption": "c"}
        ]
        second = repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks2))
        assert second["sourceTextRevision"] == first["sourceTextRevision"] + 1

    def test_kb_field_bumps_both(self, repository):
        meta = repository.create_kb_entry("Problemă", "Epoxy", "Beginner")
        cid = meta["contentId"]
        first = repository.save_kb_variant(
            cid, "ro", kb_body(summary="A"), category="Epoxy", difficulty="Beginner"
        )
        second = repository.save_kb_variant(
            cid, "ro", kb_body(summary="B"), category="Epoxy", difficulty="Beginner"
        )
        assert second["sourceRevision"] == first["sourceRevision"] + 1
        assert second["sourceTextRevision"] == first["sourceTextRevision"] + 1

    def test_text_a_b_a_increments_text_revision_each_time(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        a = repository.save_manual_variant(cid, "ro", manual_body(paragraph="A"))
        b = repository.save_manual_variant(cid, "ro", manual_body(paragraph="B"))
        again = repository.save_manual_variant(cid, "ro", manual_body(paragraph="A"))
        assert b["sourceTextRevision"] == a["sourceTextRevision"] + 1
        assert again["sourceTextRevision"] == b["sourceTextRevision"] + 1

    def test_glossary_empty_alt_media_reorder_bumps_full_only(self, repository):
        meta = repository.create_glossary_entry("Termen")
        cid = meta["contentId"]
        body = glossary_body()
        body["media"] = [
            {"type": "image", "src": "/1.png", "alt": "", "caption": ""},
            {"type": "image", "src": "/2.png", "alt": "", "caption": ""},
        ]
        first = repository.save_glossary_variant(cid, "ro", body)
        body2 = deepcopy(body)
        body2["media"] = list(reversed(body2["media"]))
        second = repository.save_glossary_variant(cid, "ro", body2)
        assert second["sourceRevision"] == first["sourceRevision"] + 1
        assert second["sourceTextRevision"] == first["sourceTextRevision"]

    def test_legacy_ro_missing_text_revision_initializes_on_identical_save(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        body = manual_body()
        repository.save_manual_variant(cid, "ro", body)
        variant = repository.get_manual_variant(cid, "ro")
        del variant["sourceTextRevision"]
        records = repository._read_store()
        from content.repositories.filesystem import make_manual_variant_key

        records[make_manual_variant_key(cid, "ro")] = variant
        repository._write_store(records)
        saved = repository.save_manual_variant(cid, "ro", body)
        assert saved["sourceTextRevision"] == saved["sourceRevision"]


class TestClassification:
    def test_missing_target(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        repository.save_manual_variant(meta["contentId"], "ro", manual_body())
        ro = repository.get_manual_variant(meta["contentId"], "ro")
        result = classify_translation_update(ro_variant=ro, target_variant=None)
        assert result.state == TranslationUpdateState.MISSING
        assert result.action == TranslationUpdateAction.GENERATE_FULL

    def test_current(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        repository.save_manual_variant(cid, "ro", manual_body())
        TranslationGenerationService(repository, provider=FakeTranslationProvider()).generate(
            module="manual", content_id=cid, target_locale="en"
        )
        ro = repository.get_manual_variant(cid, "ro")
        en = repository.get_manual_variant(cid, "en")
        result = classify_translation_update(ro_variant=ro, target_variant=en)
        assert result.state == TranslationUpdateState.CURRENT
        assert result.action == TranslationUpdateAction.SKIP_CURRENT

    def test_media_only_outdated(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        blocks = [
            {"type": "paragraph", "text": "P."},
            {"type": "image", "src": "/a.png", "alt": "alt", "caption": "cap"},
        ]
        repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks))
        TranslationGenerationService(repository, provider=FakeTranslationProvider()).generate(
            module="manual", content_id=cid, target_locale="en"
        )
        blocks2 = deepcopy(blocks)
        blocks2[1]["src"] = "/b.png"
        repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks2))
        ro = repository.get_manual_variant(cid, "ro")
        en = repository.get_manual_variant(cid, "en")
        result = classify_translation_update(ro_variant=ro, target_variant=en)
        assert result.state == TranslationUpdateState.MEDIA_ONLY_OUTDATED
        assert result.action == TranslationUpdateAction.SYNC_MEDIA_ONLY

    def test_text_outdated(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        repository.save_manual_variant(cid, "ro", manual_body(paragraph="A"))
        TranslationGenerationService(repository, provider=FakeTranslationProvider()).generate(
            module="manual", content_id=cid, target_locale="en"
        )
        repository.save_manual_variant(cid, "ro", manual_body(paragraph="B"))
        ro = repository.get_manual_variant(cid, "ro")
        en = repository.get_manual_variant(cid, "en")
        result = classify_translation_update(ro_variant=ro, target_variant=en)
        assert result.state == TranslationUpdateState.TEXT_OUTDATED

    def test_manual_untracked(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        repository.save_manual_variant(cid, "ro", manual_body())
        repository.save_manual_variant(cid, "en", manual_body(title="EN", paragraph="EN."))
        ro = repository.get_manual_variant(cid, "ro")
        en = repository.get_manual_variant(cid, "en")
        result = classify_translation_update(ro_variant=ro, target_variant=en)
        assert result.state == TranslationUpdateState.MANUAL_UNTRACKED
        assert result.action == TranslationUpdateAction.SKIP_MANUAL_UNTRACKED

    def test_legacy_target_without_text_stamp_is_text_outdated(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        repository.save_manual_variant(cid, "ro", manual_body())
        TranslationGenerationService(repository, provider=FakeTranslationProvider()).generate(
            module="manual", content_id=cid, target_locale="en"
        )
        en = repository.get_manual_variant(cid, "en")
        del en["generatedFromSourceTextRevision"]
        ro = repository.get_manual_variant(cid, "ro")
        result = classify_translation_update(ro_variant=ro, target_variant=en)
        assert result.state == TranslationUpdateState.TEXT_OUTDATED
        assert result.action == TranslationUpdateAction.GENERATE_FULL

    def test_legacy_ro_without_text_revision_never_media_only(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        repository.save_manual_variant(cid, "ro", manual_body())
        TranslationGenerationService(repository, provider=FakeTranslationProvider()).generate(
            module="manual", content_id=cid, target_locale="en"
        )
        ro = repository.get_manual_variant(cid, "ro")
        del ro["sourceTextRevision"]
        ro["sourceRevision"] = int(ro["sourceRevision"]) + 1
        en = repository.get_manual_variant(cid, "en")
        result = classify_translation_update(ro_variant=ro, target_variant=en)
        assert result.state == TranslationUpdateState.TEXT_OUTDATED


class TestUpdateEngineActions:
    def test_full_generation_stamps_both_counters(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        repository.save_manual_variant(cid, "ro", manual_body())
        saved, classification = TranslationUpdateService(
            repository, provider=FakeTranslationProvider()
        ).update(module="manual", content_id=cid, target_locale="en")
        ro = repository.get_manual_variant(cid, "ro")
        assert classification.state == TranslationUpdateState.CURRENT
        assert classification.action == TranslationUpdateAction.SKIP_CURRENT
        assert saved["generatedFromSourceRevision"] == ro["sourceRevision"]
        assert saved["generatedFromSourceTextRevision"] == ro["sourceTextRevision"]

    def test_current_zero_deepl(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        repository.save_manual_variant(cid, "ro", manual_body())
        provider = FakeTranslationProvider()
        service = TranslationUpdateService(repository, provider=provider)
        service.update(module="manual", content_id=cid, target_locale="en")
        calls = len(provider.calls)
        saved, classification = service.update(
            module="manual", content_id=cid, target_locale="en"
        )
        assert classification.action == TranslationUpdateAction.SKIP_CURRENT
        assert len(provider.calls) == calls
        assert saved["draftBody"]["title"].startswith("[en]")

    def test_media_sync_zero_deepl_and_preserves_paragraphs(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        blocks = [
            {"type": "paragraph", "text": "Primul."},
            {"type": "image", "src": "/a.png", "alt": "alt", "caption": "cap"},
            {"type": "paragraph", "text": "Al doilea."},
        ]
        repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks))
        provider = FakeTranslationProvider()
        service = TranslationUpdateService(repository, provider=provider)
        service.update(module="manual", content_id=cid, target_locale="en")
        en_before = repository.get_manual_variant(cid, "en")
        para1 = en_before["draftBody"]["sections"][0]["blocks"][0]["text"]
        para2 = en_before["draftBody"]["sections"][0]["blocks"][2]["text"]
        calls = len(provider.calls)

        blocks2 = deepcopy(blocks)
        blocks2[1]["src"] = "/replaced.png"
        repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks2))
        saved, classification = service.update(
            module="manual", content_id=cid, target_locale="en"
        )
        assert classification.state == TranslationUpdateState.CURRENT
        assert classification.action == TranslationUpdateAction.SKIP_CURRENT
        assert len(provider.calls) == calls
        out_blocks = saved["draftBody"]["sections"][0]["blocks"]
        assert out_blocks[0]["text"] == para1
        assert out_blocks[2]["text"] == para2
        assert out_blocks[1]["src"] == "/replaced.png"
        ro = repository.get_manual_variant(cid, "ro")
        assert saved["generatedFromSourceRevision"] == ro["sourceRevision"]
        assert (
            saved["generatedFromSourceTextRevision"]
            == en_before["generatedFromSourceTextRevision"]
        )

    def test_manual_image_insertion_preserves_paragraph_order(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        blocks = [
            {"type": "paragraph", "text": "Unu."},
            {"type": "paragraph", "text": "Doi."},
        ]
        repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks))
        service = TranslationUpdateService(repository, provider=FakeTranslationProvider())
        service.update(module="manual", content_id=cid, target_locale="en")
        en_before = repository.get_manual_variant(cid, "en")
        t0 = en_before["draftBody"]["sections"][0]["blocks"][0]["text"]
        t1 = en_before["draftBody"]["sections"][0]["blocks"][1]["text"]

        blocks2 = [
            {"type": "paragraph", "text": "Unu."},
            {"type": "image", "src": "/new.png", "alt": "", "caption": ""},
            {"type": "paragraph", "text": "Doi."},
        ]
        repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks2))
        saved, classification = service.update(
            module="manual", content_id=cid, target_locale="en"
        )
        assert classification.state == TranslationUpdateState.CURRENT
        assert classification.action == TranslationUpdateAction.SKIP_CURRENT
        out = saved["draftBody"]["sections"][0]["blocks"]
        assert out[0]["text"] == t0
        assert out[1]["type"] == "image"
        assert out[1]["src"] == "/new.png"
        assert out[2]["text"] == t1

    def test_incompatible_extract_lengths_fail_safe(self, repository):
        with pytest.raises(MediaSyncIncompatibleError):
            sync_media_only_body(
                module="manual",
                ro_draft=manual_body(blocks=[{"type": "paragraph", "text": "A"}]),
                target_draft={"title": "x", "sections": [{"id": "main", "title": "", "blocks": []}]},
            )

    def test_text_outdated_requires_confirm(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        repository.save_manual_variant(cid, "ro", manual_body(paragraph="A"))
        service = TranslationUpdateService(repository, provider=FakeTranslationProvider())
        service.update(module="manual", content_id=cid, target_locale="en")
        repository.save_manual_variant(cid, "ro", manual_body(paragraph="B"))
        with pytest.raises(OverwriteConfirmationRequired):
            service.update(module="manual", content_id=cid, target_locale="en")

    def test_manual_untracked_not_silently_overwritten(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        repository.save_manual_variant(cid, "ro", manual_body())
        repository.save_manual_variant(cid, "en", manual_body(title="Human", paragraph="Edited."))
        service = TranslationUpdateService(repository, provider=FakeTranslationProvider())
        with pytest.raises(OverwriteConfirmationRequired):
            service.update(module="manual", content_id=cid, target_locale="en")
        en = repository.get_manual_variant(cid, "en")
        assert en["draftBody"]["title"] == "Human"

    def test_glossary_media_add_preserves_definition(self, repository):
        meta = repository.create_glossary_entry("Termen")
        cid = meta["contentId"]
        body = glossary_body()
        repository.save_glossary_variant(cid, "ro", body)
        service = TranslationUpdateService(repository, provider=FakeTranslationProvider())
        service.update(module="glossary", content_id=cid, target_locale="en")
        en_before = repository.get_glossary_variant(cid, "en")
        definition = en_before["draftBody"]["definitionBlocks"][0]["text"]
        body2 = deepcopy(body)
        body2["media"] = [{"type": "image", "src": "/g.png", "alt": "", "caption": ""}]
        repository.save_glossary_variant(cid, "ro", body2)
        saved, classification = service.update(
            module="glossary", content_id=cid, target_locale="en"
        )
        assert classification.state == TranslationUpdateState.CURRENT
        assert classification.action == TranslationUpdateAction.SKIP_CURRENT
        assert saved["draftBody"]["definitionBlocks"][0]["text"] == definition
        assert saved["draftBody"]["media"][0]["src"] == "/g.png"

    def test_kb_media_add_preserves_text(self, repository):
        meta = repository.create_kb_entry("Problemă", "Epoxy", "Beginner")
        cid = meta["contentId"]
        body = kb_body()
        repository.save_kb_variant(cid, "ro", body, category="Epoxy", difficulty="Beginner")
        service = TranslationUpdateService(repository, provider=FakeTranslationProvider())
        service.update(module="knowledge_base", content_id=cid, target_locale="en")
        en_before = repository.get_kb_variant(cid, "en")
        title = en_before["draftBody"]["title"]
        body2 = deepcopy(body)
        body2["media"] = [{"type": "image", "src": "/k.png", "alt": "", "caption": ""}]
        repository.save_kb_variant(cid, "ro", body2, category="Epoxy", difficulty="Beginner")
        saved, classification = service.update(
            module="knowledge_base", content_id=cid, target_locale="en"
        )
        assert classification.state == TranslationUpdateState.CURRENT
        assert classification.action == TranslationUpdateAction.SKIP_CURRENT
        assert saved["draftBody"]["title"] == title
        assert saved["draftBody"]["media"][0]["src"] == "/k.png"

    def test_sync_does_not_change_published_snapshot(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        blocks = [
            {"type": "paragraph", "text": "P."},
            {"type": "image", "src": "/a.png", "alt": "alt", "caption": "c"},
        ]
        repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks))
        service = TranslationUpdateService(repository, provider=FakeTranslationProvider())
        service.update(module="manual", content_id=cid, target_locale="en")
        repository.publish_manual_variant(cid, "en")
        snap_before = repository.read_manual_snapshot("en")

        blocks2 = deepcopy(blocks)
        blocks2[1]["src"] = "/b.png"
        repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks2))
        service.update(module="manual", content_id=cid, target_locale="en")
        snap_after = repository.read_manual_snapshot("en")
        assert snap_before == snap_after
        en = repository.get_manual_variant(cid, "en")
        assert en["status"] == "published"
        assert en["draftBody"]["sections"][0]["blocks"][1]["src"] == "/b.png"

    def test_media_sync_get_variant_reports_current(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        blocks = [
            {"type": "paragraph", "text": "P."},
            {"type": "image", "src": "/a.png", "alt": "alt", "caption": "c"},
        ]
        repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks))
        service = TranslationUpdateService(repository, provider=FakeTranslationProvider())
        service.update(module="manual", content_id=cid, target_locale="en")
        blocks2 = deepcopy(blocks)
        blocks2[1]["src"] = "/b.png"
        repository.save_manual_variant(cid, "ro", manual_body(blocks=blocks2))
        service.update(module="manual", content_id=cid, target_locale="en")

        from content.services.manual_chapters import ManualChapterService

        response = ManualChapterService(repository).get_variant(cid, "en")
        assert response.translationUpdateState == "current"
        assert response.translationUpdateAction == "skip_current"

    def test_ro_and_other_locales_untouched(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        cid = meta["contentId"]
        repository.save_manual_variant(cid, "ro", manual_body())
        service = TranslationUpdateService(repository, provider=FakeTranslationProvider())
        service.update(module="manual", content_id=cid, target_locale="en")
        ro_before = repository.get_manual_variant(cid, "ro")
        service.update(module="manual", content_id=cid, target_locale="fr")
        ro_after = repository.get_manual_variant(cid, "ro")
        assert ro_before["draftBody"] == ro_after["draftBody"]
        assert repository.get_manual_variant(cid, "en") is not None
        assert repository.get_manual_variant(cid, "de") is None
