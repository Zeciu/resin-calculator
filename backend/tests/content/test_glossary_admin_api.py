import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_glossary, public_content
from content.services.glossary_source import load_glossary_entries
from content.services.migrate_phase2_glossary import LegacyGlossaryMigrationService


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_glossary.reset_repository_cache()
    public_content.reset_repository_cache()
    from content.routers import admin_editorial

    admin_editorial.reset_repository_cache()
    from app import app

    return TestClient(app)


def admin_headers(role: str = "administrator") -> dict[str, str]:
    return {
        "X-Mock-Role": role,
        "X-Mock-User-Id": "admin-user",
    }


def sample_body(term: str = "Pot life", text: str = "Working time before gelation.") -> dict:
    return {
        "term": term,
        "definitionBlocks": [{"type": "paragraph", "text": text}],
        "media": [],
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


class TestGlossaryAdminAuth:
    def test_non_admin_is_rejected(self, client):
        response = client.get("/api/admin/glossary/entries", headers=admin_headers("user"))
        assert response.status_code == 403


class TestGlossaryEntryCrud:
    def test_create_list_get_delete_entry(self, client):
        create_response = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Pot life"},
            headers=admin_headers(),
        )
        assert create_response.status_code == 201
        entry_id = create_response.json()["contentId"]
        assert entry_id == "pot-life"

        list_response = client.get("/api/admin/glossary/entries", headers=admin_headers())
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1
        assert list_response.json()[0]["term"] == "Pot life"

        get_response = client.get(f"/api/admin/glossary/entries/{entry_id}", headers=admin_headers())
        assert get_response.status_code == 200

        delete_response = client.delete(
            f"/api/admin/glossary/entries/{entry_id}",
            headers=admin_headers(),
        )
        assert delete_response.status_code == 204


class TestGlossaryVariants:
    def test_create_defaults_to_romanian_variant(self, client):
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Termen Nou"},
            headers=admin_headers(),
        ).json()["contentId"]

        ro_variant = client.get(
            f"/api/admin/glossary/entries/{entry_id}/variants/ro",
            headers=admin_headers(),
        ).json()
        en_variant = client.get(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            headers=admin_headers(),
        ).json()

        assert ro_variant["exists"] is True
        assert ro_variant["body"]["term"] == "Termen Nou"
        assert en_variant["exists"] is False

    def test_save_and_load_draft_variant(self, client):
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Calibration"},
            headers=admin_headers(),
        ).json()["contentId"]

        save_response = client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={"body": sample_body("Calibration", "Links pixels to real-world measurements.")},
            headers=admin_headers(),
        )
        assert save_response.status_code == 200
        assert save_response.json()["status"] == "draft"

    def test_list_prefers_romanian_identity_term(self, client):
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Termen RO"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={"body": sample_body("English Term", "English definition.")},
            headers=admin_headers(),
        )

        listed = client.get("/api/admin/glossary/entries?locale=en", headers=admin_headers()).json()
        assert listed[0]["term"] == "Termen RO"


class TestGlossaryPublish:
    def test_publish_makes_entry_available_publicly(self, client):
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Sealing"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={"body": sample_body("Sealing", "A thin coat applied before the main pour.")},
            headers=admin_headers(),
        )
        publish_response = client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert publish_response.status_code == 200

        public_response = client.get("/api/content/glossary?locale=en")
        assert public_response.status_code == 200
        payload = public_response.json()
        assert payload["available"] is True
        assert any(entry["term"] == "Sealing" for entry in payload["entries"])


class TestGlossarySourceLoader:
    def test_reads_glossary_content_js(self):
        entries = load_glossary_entries()
        assert len(entries) >= 10
        assert entries[0]["id"]
        assert entries[0]["term"]


class TestLegacyGlossaryMigration:
    def test_migration_writes_legacy_public_entries_only(self, tmp_path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        source_entries = load_glossary_entries()
        repository = FilesystemContentRepository()
        repository.create_glossary_entry("Admin Term", content_id="admin-term")

        result = LegacyGlossaryMigrationService(repository).migrate()

        assert result["entryCount"] == len(source_entries)
        legacy_document = repository.read_legacy_glossary_document("en")
        assert legacy_document is not None
        assert len(legacy_document["entries"]) == len(source_entries)
        assert repository.list_glossary_entry_ids() == ["admin-term"]
        assert repository.read_glossary_snapshot("en") == {"locale": "en", "entries": []}


class TestGlossaryPublicApi:
    def test_legacy_glossary_served_when_no_admin_snapshot(self, client, tmp_path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        admin_glossary.reset_repository_cache()
        public_content.reset_repository_cache()
        LegacyGlossaryMigrationService(FilesystemContentRepository()).migrate()

        response = client.get("/api/content/glossary?locale=en")
        assert response.status_code == 200
        payload = response.json()
        assert payload["available"] is True
        terms = [entry["term"] for entry in payload["entries"]]
        assert "Epoxy resin" in terms
        assert terms == sorted(terms, key=str.casefold)


class TestGlossaryRelationshipValidation:
    def _create_and_publish(self, client, term: str, text: str) -> str:
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": term},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={"body": sample_body(term, text)},
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        return entry_id

    def test_rejects_self_reference_as_related_term(self, client):
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Pot life"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={
                "body": {
                    **sample_body("Pot life"),
                    "relatedTermIds": [entry_id],
                }
            },
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "itself" in response.json()["detail"].lower()

    def test_rejects_self_reference_as_synonym(self, client):
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Hardener"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={
                "body": {
                    **sample_body("Hardener"),
                    "synonymTermIds": [entry_id],
                }
            },
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "itself" in response.json()["detail"].lower()

    def test_rejects_unpublished_related_term(self, client):
        related_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Draft Related"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{related_id}/variants/en",
            json={"body": sample_body("Draft Related", "Still a draft.")},
            headers=admin_headers(),
        )

        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Main Term"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={
                "body": {
                    **sample_body("Main Term"),
                    "relatedTermIds": [related_id],
                }
            },
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "published" in response.json()["detail"].lower()

    def test_rejects_kb_entry_see_also(self, client):
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Sealing"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={
                "body": {
                    **sample_body("Sealing"),
                    "seeAlso": [
                        {
                            "targetContentId": "future-kb-entry",
                            "targetType": "kb_entry",
                            "label": "Future article",
                        }
                    ],
                }
            },
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "knowledge base" in response.json()["detail"].lower()

    def test_publish_with_valid_related_term(self, client):
        related_id = self._create_and_publish(client, "Epoxy resin", "A two-part polymer system.")
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Resin"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={
                "body": {
                    **sample_body("Resin"),
                    "relatedTermIds": [related_id],
                }
            },
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 200

        public_response = client.get("/api/content/glossary?locale=en")
        entry = next(item for item in public_response.json()["entries"] if item["id"] == entry_id)
        assert entry["relatedTerms"][0]["id"] == related_id


class TestGlossaryUnpublishAndDelete:
    def test_unpublish_removes_entry_from_public_snapshot(self, client):
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Formwork"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={"body": sample_body("Formwork", "Contains liquid resin until it cures.")},
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert any(
            item["id"] == entry_id
            for item in client.get("/api/content/glossary?locale=en").json()["entries"]
        )

        client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/en/unpublish",
            headers=admin_headers(),
        )
        public_entries = client.get("/api/content/glossary?locale=en").json()["entries"]
        assert all(item["id"] != entry_id for item in public_entries)

    def test_delete_rebuilds_snapshot_without_removed_entry(self, client):
        keep_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Calibration"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{keep_id}/variants/en",
            json={"body": sample_body("Calibration", "Links pixels to real measurements.")},
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/glossary/entries/{keep_id}/variants/en/publish",
            headers=admin_headers(),
        )

        remove_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Temporary Term"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{remove_id}/variants/en",
            json={"body": sample_body("Temporary Term", "Will be deleted.")},
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/glossary/entries/{remove_id}/variants/en/publish",
            headers=admin_headers(),
        )

        delete_response = client.delete(
            f"/api/admin/glossary/entries/{remove_id}",
            headers=admin_headers(),
        )
        assert delete_response.status_code == 204

        public_entries = client.get("/api/content/glossary?locale=en").json()["entries"]
        public_ids = [item["id"] for item in public_entries]
        assert remove_id not in public_ids
        assert keep_id in public_ids
        terms = [item["term"] for item in public_entries]
        assert terms == sorted(terms, key=str.casefold)


class TestGlossaryRelationshipPublishQa:
    """Observation 005 follow-up: relationship validation UX + locale-aware picker feed."""

    def test_save_draft_with_unpublished_related_then_publish_surfaces_term_label(self, client):
        related_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Epoxy resin"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{related_id}/variants/ro",
            json={"body": sample_body("Epoxy resin", "Two-part polymer system.")},
            headers=admin_headers(),
        )

        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Indepartarea bulelor"},
            headers=admin_headers(),
        ).json()["contentId"]
        save_response = client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/ro",
            json={
                "body": {
                    **sample_body("Indepartarea bulelor", "Cum scoatem bulele."),
                    "relatedTermIds": [related_id],
                }
            },
            headers=admin_headers(),
        )
        assert save_response.status_code == 200

        publish_response = client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/ro/publish",
            headers=admin_headers(),
        )
        assert publish_response.status_code == 400
        assert publish_response.json()["detail"] == "Published related term required: Epoxy resin"

    def test_publish_succeeds_after_related_term_is_published(self, client):
        related_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Epoxy resin"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{related_id}/variants/ro",
            json={"body": sample_body("Epoxy resin", "Two-part polymer system.")},
            headers=admin_headers(),
        )

        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Indepartarea bulelor"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/ro",
            json={
                "body": {
                    **sample_body("Indepartarea bulelor", "Cum scoatem bulele."),
                    "relatedTermIds": [related_id],
                }
            },
            headers=admin_headers(),
        )
        assert (
            client.post(
                f"/api/admin/glossary/entries/{entry_id}/variants/ro/publish",
                headers=admin_headers(),
            ).status_code
            == 400
        )

        assert (
            client.post(
                f"/api/admin/glossary/entries/{related_id}/variants/ro/publish",
                headers=admin_headers(),
            ).status_code
            == 200
        )
        publish_response = client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/ro/publish",
            headers=admin_headers(),
        )
        assert publish_response.status_code == 200

        from content.routers import admin_public_languages, public_languages

        admin_public_languages.reset_repository_cache()
        public_languages.reset_repository_cache()
        assert (
            client.post(
                "/api/admin/public-languages/ro/activate",
                headers=admin_headers(),
            ).status_code
            == 200
        )
        public = client.get("/api/content/glossary?locale=ro").json()
        assert public["available"] is True
        assert any(item["id"] == entry_id for item in public["entries"])

    def test_published_only_reference_search_excludes_unpublished_locale_variants(self, client):
        from content.routers import admin_editorial

        admin_editorial.reset_repository_cache()

        draft_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Draft only term"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{draft_id}/variants/ro",
            json={"body": sample_body("Draft only term", "Not published yet.")},
            headers=admin_headers(),
        )

        published_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Published term"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{published_id}/variants/ro",
            json={"body": sample_body("Published term", "Ready for references.")},
            headers=admin_headers(),
        )
        assert (
            client.post(
                f"/api/admin/glossary/entries/{published_id}/variants/ro/publish",
                headers=admin_headers(),
            ).status_code
            == 200
        )

        unfiltered = client.get(
            "/api/admin/references/search",
            params={"q": "term", "locale": "ro"},
            headers=admin_headers(),
        )
        assert unfiltered.status_code == 200
        unfiltered_ids = {
            item["contentId"]
            for item in unfiltered.json()
            if item["contentType"] == "glossary_entry"
        }
        assert draft_id in unfiltered_ids
        assert published_id in unfiltered_ids

        filtered = client.get(
            "/api/admin/references/search",
            params={"q": "term", "locale": "ro", "publishedOnly": "true"},
            headers=admin_headers(),
        )
        assert filtered.status_code == 200
        filtered_ids = {
            item["contentId"]
            for item in filtered.json()
            if item["contentType"] == "glossary_entry"
        }
        assert draft_id not in filtered_ids
        assert published_id in filtered_ids
        published_option = next(
            item for item in filtered.json() if item["contentId"] == published_id
        )
        assert published_option["label"] == "Published term"

