import importlib.util
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from content.repositories import filesystem as filesystem_module
from content.repositories.filesystem import (
    FilesystemContentRepository,
    INITIALIZATION_MARKER,
    initialize_production_content_root,
)
from content.routers import admin_glossary, admin_knowledge_base, admin_manual, public_content
from content.services.glossary_source import load_glossary_entries
from content.services.knowledge_base_source import load_knowledge_base_entries
from content.services.manual_source import load_manual_sections


def admin_headers(role: str = "administrator") -> dict[str, str]:
    return {
        "X-Mock-Role": role,
        "X-Mock-User-Id": "admin-user",
    }


def import_strict_app(monkeypatch: pytest.MonkeyPatch, root: Path):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(root))
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("AUTH_MODE", "mock")
    monkeypatch.delenv("COGNITO_USER_POOL_ID", raising=False)
    monkeypatch.delenv("COGNITO_REGION", raising=False)
    admin_manual.reset_repository_cache()
    admin_glossary.reset_repository_cache()
    admin_knowledge_base.reset_repository_cache()
    public_content.reset_repository_cache()

    app_path = Path(__file__).resolve().parents[2] / "app.py"
    spec = importlib.util.spec_from_file_location("checkpoint_b_probe_app", app_path)
    assert spec is not None
    assert spec.loader is not None
    app_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(app_module)
    return app_module


@pytest.fixture
def strict_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    app_module = import_strict_app(monkeypatch, tmp_path)
    return TestClient(app_module.app)


def test_first_initialization_seeds_real_admin_cms_content(strict_client: TestClient) -> None:
    manual_sections = load_manual_sections()
    glossary_entries = load_glossary_entries()
    kb_entries = load_knowledge_base_entries()

    manual_response = strict_client.get("/api/admin/manual/chapters", headers=admin_headers())
    assert manual_response.status_code == 200
    manual_items = manual_response.json()
    assert [item["contentId"] for item in manual_items] == [section["id"] for section in manual_sections]
    assert manual_items[0]["title"] == manual_sections[0]["title"]
    assert manual_items[0]["variants"]["en"]["status"] == "published"

    first_manual_variant = strict_client.get(
        f"/api/admin/manual/chapters/{manual_sections[0]['id']}/variants/en",
        headers=admin_headers(),
    ).json()
    assert first_manual_variant["exists"] is True
    assert first_manual_variant["status"] == "published"
    assert first_manual_variant["body"]["title"] == manual_sections[0]["title"]
    seeded_blocks = first_manual_variant["body"]["sections"][0]["blocks"]
    assert [block["type"] for block in seeded_blocks] == [block["type"] for block in manual_sections[0]["blocks"]]
    assert [block.get("text") for block in seeded_blocks] == [block.get("text") for block in manual_sections[0]["blocks"]]

    glossary_response = strict_client.get("/api/admin/glossary/entries", headers=admin_headers())
    assert glossary_response.status_code == 200
    glossary_items = glossary_response.json()
    assert {item["contentId"] for item in glossary_items} == {entry["id"] for entry in glossary_entries}
    glossary_variant = strict_client.get(
        f"/api/admin/glossary/entries/{glossary_entries[0]['id']}/variants/en",
        headers=admin_headers(),
    ).json()
    assert glossary_variant["exists"] is True
    assert glossary_variant["status"] == "published"
    assert glossary_variant["body"]["term"] == glossary_entries[0]["term"]

    kb_response = strict_client.get("/api/admin/knowledge-base/entries", headers=admin_headers())
    assert kb_response.status_code == 200
    kb_items = kb_response.json()
    assert {item["contentId"] for item in kb_items} == {entry["id"] for entry in kb_entries}
    kb_variant = strict_client.get(
        f"/api/admin/knowledge-base/entries/{kb_entries[0]['id']}/variants/en",
        headers=admin_headers(),
    ).json()
    assert kb_variant["exists"] is True
    assert kb_variant["status"] == "published"
    assert kb_variant["body"]["title"] == kb_entries[0]["title"]


def test_first_initialization_preserves_order_ids_and_locale_behavior(strict_client: TestClient) -> None:
    manual_sections = load_manual_sections()

    manual_items = strict_client.get("/api/admin/manual/chapters", headers=admin_headers()).json()
    assert [item["sortOrder"] for item in manual_items] == [100 * (index + 1) for index in range(len(manual_sections))]
    assert [item["contentId"] for item in manual_items] == [section["id"] for section in manual_sections]

    ro_variant = strict_client.get(
        f"/api/admin/manual/chapters/{manual_sections[0]['id']}/variants/ro",
        headers=admin_headers(),
    ).json()
    assert ro_variant["exists"] is False
    assert ro_variant["body"]["title"] == ""


def test_canonical_published_snapshots_exist_and_public_api_does_not_require_legacy_fallback(
    strict_client: TestClient,
    tmp_path: Path,
) -> None:
    manual_payload = strict_client.get("/api/content/manual?locale=en").json()
    glossary_payload = strict_client.get("/api/content/glossary?locale=en").json()
    kb_payload = strict_client.get("/api/content/knowledge-base?locale=en").json()

    assert manual_payload["available"] is True
    assert glossary_payload["available"] is True
    assert kb_payload["available"] is True

    (tmp_path / "legacy" / "manual" / "en" / "document.json").write_text(
        json.dumps({"locale": "en", "sections": [{"id": "wrong", "title": "Wrong", "blocks": []}]}),
        encoding="utf-8",
    )
    (tmp_path / "legacy" / "glossary" / "en" / "entries.json").write_text(
        json.dumps({"locale": "en", "entries": [{"id": "wrong", "term": "Wrong", "definition": []}]}),
        encoding="utf-8",
    )
    (tmp_path / "legacy" / "knowledge-base" / "en" / "entries.json").write_text(
        json.dumps({"locale": "en", "entries": [{"id": "wrong", "title": "Wrong", "solution": []}]}),
        encoding="utf-8",
    )

    assert strict_client.get("/api/content/manual?locale=en").json() == manual_payload
    assert strict_client.get("/api/content/glossary?locale=en").json() == glossary_payload
    assert strict_client.get("/api/content/knowledge-base?locale=en").json() == kb_payload


def test_editing_and_publishing_one_seeded_manual_chapter_preserves_all_other_seeded_content(
    strict_client: TestClient,
) -> None:
    before_payload = strict_client.get("/api/content/manual?locale=en").json()
    first_section = before_payload["sections"][0]
    second_section = before_payload["sections"][1]

    strict_client.put(
        f"/api/admin/manual/chapters/{first_section['id']}/variants/en",
        json={
            "body": {
                "title": "Updated Seeded Title",
                "sections": [
                    {"id": "main", "title": "", "blocks": [{"type": "paragraph", "text": "Updated body text."}]}
                ],
            }
        },
        headers=admin_headers(),
    )
    publish_response = strict_client.post(
        f"/api/admin/manual/chapters/{first_section['id']}/variants/en/publish",
        headers=admin_headers(),
    )
    assert publish_response.status_code == 200

    after_payload = strict_client.get("/api/content/manual?locale=en").json()
    assert len(after_payload["sections"]) == len(before_payload["sections"])
    assert after_payload["sections"][0]["id"] == first_section["id"]
    assert after_payload["sections"][0]["title"] == "Updated Seeded Title"
    assert after_payload["sections"][0]["blocks"][0]["text"] == "Updated body text."
    assert any(section["id"] == second_section["id"] for section in after_payload["sections"])


def test_editing_and_publishing_one_seeded_glossary_entry_preserves_all_other_seeded_content(
    strict_client: TestClient,
) -> None:
    glossary_entries = load_glossary_entries()
    before_payload = strict_client.get("/api/content/glossary?locale=en").json()
    first_entry = before_payload["entries"][0]
    second_entry = next(
        entry for entry in before_payload["entries"] if entry["id"] != first_entry["id"]
    )

    strict_client.put(
        f"/api/admin/glossary/entries/{first_entry['id']}/variants/en",
        json={
            "body": {
                "term": "Updated Seeded Glossary Term",
                "definitionBlocks": [{"type": "paragraph", "text": "Updated glossary definition."}],
                "media": [],
                "relatedTermIds": [],
                "synonymTermIds": [],
                "seeAlso": [],
            }
        },
        headers=admin_headers(),
    )
    publish_response = strict_client.post(
        f"/api/admin/glossary/entries/{first_entry['id']}/variants/en/publish",
        headers=admin_headers(),
    )
    assert publish_response.status_code == 200

    after_payload = strict_client.get("/api/content/glossary?locale=en").json()
    assert len(after_payload["entries"]) == len(before_payload["entries"])
    updated = next(entry for entry in after_payload["entries"] if entry["id"] == first_entry["id"])
    assert updated["term"] == "Updated Seeded Glossary Term"
    assert updated["definition"] == ["Updated glossary definition."]
    assert any(entry["id"] == second_entry["id"] for entry in after_payload["entries"])
    assert [entry["id"] for entry in glossary_entries if entry["id"] != first_entry["id"]] == [
        entry["id"]
        for entry in after_payload["entries"]
        if entry["id"] != first_entry["id"]
    ]


def test_editing_and_publishing_one_seeded_kb_entry_preserves_all_other_seeded_content(
    strict_client: TestClient,
) -> None:
    kb_entries = load_knowledge_base_entries()
    before_payload = strict_client.get("/api/content/knowledge-base?locale=en").json()
    first_entry = before_payload["entries"][0]
    second_entry = before_payload["entries"][1]

    strict_client.put(
        f"/api/admin/knowledge-base/entries/{first_entry['id']}/variants/en",
        json={
            "body": {
                **strict_client.get(
                    f"/api/admin/knowledge-base/entries/{first_entry['id']}/variants/en",
                    headers=admin_headers(),
                ).json()["body"],
                "title": "Updated Seeded KB Title",
                "solution": ["Updated KB solution step."],
            },
            "category": kb_entries[0]["category"],
            "difficulty": kb_entries[0]["difficulty"],
        },
        headers=admin_headers(),
    )
    publish_response = strict_client.post(
        f"/api/admin/knowledge-base/entries/{first_entry['id']}/variants/en/publish",
        headers=admin_headers(),
    )
    assert publish_response.status_code == 200

    after_payload = strict_client.get("/api/content/knowledge-base?locale=en").json()
    assert len(after_payload["entries"]) == len(before_payload["entries"])
    updated = next(entry for entry in after_payload["entries"] if entry["id"] == first_entry["id"])
    assert updated["title"] == "Updated Seeded KB Title"
    assert updated["solution"] == ["Updated KB solution step."]
    assert any(entry["id"] == second_entry["id"] for entry in after_payload["entries"])
    assert [entry["id"] for entry in kb_entries] == [entry["id"] for entry in after_payload["entries"]]


def test_initialized_content_is_not_overwritten_on_restart(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    first_app = import_strict_app(monkeypatch, tmp_path)
    first_client = TestClient(first_app.app)

    first_section = first_client.get("/api/content/manual?locale=en").json()["sections"][0]
    first_client.put(
        f"/api/admin/manual/chapters/{first_section['id']}/variants/en",
        json={
            "body": {
                "title": "Restart-Safe Title",
                "sections": [
                    {"id": "main", "title": "", "blocks": [{"type": "paragraph", "text": "Restart-safe body."}]}
                ],
            }
        },
        headers=admin_headers(),
    )
    first_client.post(
        f"/api/admin/manual/chapters/{first_section['id']}/variants/en/publish",
        headers=admin_headers(),
    )

    second_app = import_strict_app(monkeypatch, tmp_path)
    second_client = TestClient(second_app.app)
    payload = second_client.get("/api/content/manual?locale=en").json()
    assert payload["sections"][0]["title"] == "Restart-Safe Title"
    assert payload["sections"][0]["blocks"][0]["text"] == "Restart-safe body."


def test_partial_initialization_without_completion_marker_is_recoverable(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    partial_store_path = tmp_path / "editorial" / "content-store.json"
    partial_store_path.parent.mkdir(parents=True, exist_ok=True)
    partial_store_path.write_text(json.dumps({"records": {}}), encoding="utf-8")
    (tmp_path / "published").mkdir(parents=True, exist_ok=True)

    initialize_production_content_root(tmp_path)

    assert (tmp_path / INITIALIZATION_MARKER).is_file()
    assert (tmp_path / "published" / "manual" / "en" / "document.json").is_file()
    assert len(FilesystemContentRepository(tmp_path).list_manual_chapter_ids()) == len(load_manual_sections())


def test_completion_marker_is_created_only_after_all_required_artifacts_exist(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    replace_order: list[str] = []
    real_replace = filesystem_module.os.replace

    def tracking_replace(source, target):
        replace_order.append(Path(target).name)
        return real_replace(source, target)

    monkeypatch.setattr(filesystem_module.os, "replace", tracking_replace)

    initialize_production_content_root(tmp_path)

    assert replace_order[-1] == INITIALIZATION_MARKER
    assert (tmp_path / INITIALIZATION_MARKER).is_file()
    assert (tmp_path / "editorial" / "content-store.json").is_file()
    assert (tmp_path / "published" / "manual" / "en" / "document.json").is_file()
    assert (tmp_path / "legacy" / "manual" / "en" / "document.json").is_file()


def test_existing_unrelated_files_are_not_deleted_by_initialization_failure(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    unrelated = tmp_path / "preexisting-note.txt"
    unrelated.write_text("keep me", encoding="utf-8")

    with pytest.raises(RuntimeError, match="refusing initialization"):
        initialize_production_content_root(tmp_path)

    assert unrelated.read_text(encoding="utf-8") == "keep me"
    assert not (tmp_path / "editorial").exists()


def test_interrupted_store_write_does_not_corrupt_existing_json(tmp_path: Path) -> None:
    repository = FilesystemContentRepository(tmp_path)
    repository.create_manual_chapter("Existing Chapter", content_id="existing-chapter")
    original_payload = json.loads(repository._store_path.read_text(encoding="utf-8"))

    real_replace = filesystem_module.os.replace

    def fail_replace(source, target):
        if Path(target) == repository._store_path:
            raise OSError("replace failed")
        return real_replace(source, target)

    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr(filesystem_module.os, "replace", fail_replace)
        with pytest.raises(OSError, match="replace failed"):
            repository.create_manual_chapter("New Chapter", content_id="new-chapter")

    assert json.loads(repository._store_path.read_text(encoding="utf-8")) == original_payload
    assert list(repository._store_path.parent.glob(".content-store.json.tmp-*")) == []


def test_snapshot_write_failure_propagates_without_overwriting_existing_snapshot(tmp_path: Path) -> None:
    repository = FilesystemContentRepository(tmp_path)
    snapshot_path = tmp_path / "published" / "manual" / "en" / "document.json"
    repository.write_manual_snapshot("en", {"locale": "en", "chapters": [{"contentId": "existing"}]})
    original_payload = json.loads(snapshot_path.read_text(encoding="utf-8"))

    real_replace = filesystem_module.os.replace

    def fail_replace(source, target):
        if Path(target) == snapshot_path:
            raise OSError("snapshot replace failed")
        return real_replace(source, target)

    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr(filesystem_module.os, "replace", fail_replace)
        with pytest.raises(OSError, match="snapshot replace failed"):
            repository.write_manual_snapshot("en", {"locale": "en", "chapters": [{"contentId": "new"}]})

    assert json.loads(snapshot_path.read_text(encoding="utf-8")) == original_payload
    assert list(snapshot_path.parent.glob(".document.json.tmp-*")) == []


def test_non_strict_local_repository_behavior_remains_unchanged(tmp_path: Path) -> None:
    repository = FilesystemContentRepository(tmp_path)

    assert (tmp_path / "editorial" / "content-store.json").is_file()
    assert (tmp_path / "published").is_dir()
    assert not (tmp_path / "legacy" / "manual" / "en" / "document.json").exists()
