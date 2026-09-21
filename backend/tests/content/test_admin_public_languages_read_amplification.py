"""Admin public-languages overview must not N+1 the editorial content store."""

from __future__ import annotations

from pathlib import Path

import pytest

from private.repositories.filesystem import FilesystemContentRepository
from private.repositories.public_languages import PublicLanguagesRepository
from private.schemas.common import ADMIN_EDITORIAL_LOCALE_ORDER
from private.services.public_languages import (
    PublicLanguagesService,
    translation_status_for_locale,
)


def _count_reads(repository: FilesystemContentRepository) -> dict[str, int]:
    reads = {"n": 0}
    real = repository._read_store

    def counting():
        reads["n"] += 1
        return real()

    repository._read_store = counting  # type: ignore[method-assign]
    return reads


def _legacy_translation_status_for_locale(
    repository: FilesystemContentRepository, locale: str
) -> str:
    """Pre-optimization algorithm: one store read per list/get call."""
    from private.services.public_languages import (
        STATUS_AVAILABLE,
        STATUS_NOT_GENERATED,
        STATUS_PARTIAL,
        _module_has_any_variant,
    )

    modules_present = 0
    if _module_has_any_variant(
        repository.list_manual_chapter_ids(),
        repository.get_manual_variant,
        locale,
    ):
        modules_present += 1
    if _module_has_any_variant(
        repository.list_glossary_entry_ids(),
        repository.get_glossary_variant,
        locale,
    ):
        modules_present += 1
    if _module_has_any_variant(
        repository.list_kb_entry_ids(),
        repository.get_kb_variant,
        locale,
    ):
        modules_present += 1
    if modules_present == 0:
        return STATUS_NOT_GENERATED
    if modules_present < 3:
        return STATUS_PARTIAL
    return STATUS_AVAILABLE


def _seed_ro_only_corpus(repository: FilesystemContentRepository, count: int) -> None:
    for index in range(count):
        repository.create_manual_chapter(f"Chapter {index}", content_id=f"chapter-{index}")
        repository.create_glossary_entry(f"Term {index}", content_id=f"term-{index}")
        repository.create_kb_entry(
            f"Problem {index}", "Epoxy", "Beginner", content_id=f"kb-{index}"
        )


def _overview_service(
    repository: FilesystemContentRepository, tmp_path: Path
) -> PublicLanguagesService:
    languages = PublicLanguagesRepository(tmp_path)
    return PublicLanguagesService(
        languages_repository=languages,
        content_repository=repository,
        production_repository=languages,
    )


@pytest.fixture
def repository(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> FilesystemContentRepository:
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    return FilesystemContentRepository(tmp_path)


class TestAdminPublicLanguagesReadAmplification:
    def test_overview_uses_exactly_one_store_read(self, repository, tmp_path):
        _seed_ro_only_corpus(repository, 20)
        service = _overview_service(repository, tmp_path)
        reads = _count_reads(repository)
        overview = service.get_admin_overview()
        assert reads["n"] == 1
        assert [row.locale for row in overview.languages] == list(ADMIN_EDITORIAL_LOCALE_ORDER)

    @pytest.mark.parametrize("count", [10, 25])
    def test_overview_read_count_constant_across_corpus_sizes(
        self, repository, tmp_path, count: int
    ):
        _seed_ro_only_corpus(repository, count)
        service = _overview_service(repository, tmp_path)
        reads = _count_reads(repository)
        overview = service.get_admin_overview()
        assert reads["n"] == 1
        assert len(overview.languages) == len(ADMIN_EDITORIAL_LOCALE_ORDER)

    def test_translation_status_matches_legacy_getter_algorithm(self, repository, tmp_path):
        _seed_ro_only_corpus(repository, 8)
        service = _overview_service(repository, tmp_path)
        overview = service.get_admin_overview()
        by_locale = {row.locale: row.translationStatus for row in overview.languages}
        for locale in ADMIN_EDITORIAL_LOCALE_ORDER:
            expected = _legacy_translation_status_for_locale(repository, locale)
            assert by_locale[locale] == expected
            assert translation_status_for_locale(repository, locale) == expected
        assert by_locale["ro"] == "Available"
        assert by_locale["fr"] == "Not generated"
