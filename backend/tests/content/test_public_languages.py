"""Observation 007 — public language activation."""

from __future__ import annotations

import json
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.repositories.public_languages import (
    PublicLanguagesRepository,
    default_public_languages_config,
)
from content.routers import (
    admin_glossary,
    admin_manual,
    admin_public_languages,
    public_content,
    public_languages,
)
from content.services.manual_public import ManualPublicService
from content.services.public_languages import PublicLanguagesService


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_manual.reset_repository_cache()
    admin_glossary.reset_repository_cache()
    admin_public_languages.reset_repository_cache()
    public_content.reset_repository_cache()
    public_languages.reset_repository_cache()
    from app import app

    return TestClient(app)


def admin_headers() -> dict[str, str]:
    return {
        "X-Mock-Role": "administrator",
        "X-Mock-User-Id": "admin-user",
    }


class TestPublicLanguagesConfig:
    def test_initial_configuration_english_active_default_others_inactive(
        self, client, tmp_path
    ):
        response = client.get("/api/content/public-languages")
        assert response.status_code == 200
        payload = response.json()
        assert payload["defaultPublicLocale"] == "en"
        assert payload["activePublicLocales"] == ["en"]

        admin = client.get("/api/admin/public-languages", headers=admin_headers())
        assert admin.status_code == 200
        overview = admin.json()
        assert overview["defaultPublicLocale"] == "en"
        assert overview["activePublicLocales"] == ["en"]

        by_locale = {row["locale"]: row for row in overview["languages"]}
        assert set(by_locale) == {
            "ro",
            "en",
            "fr",
            "de",
            "es",
            "pt",
            "pl",
            "cs",
            "it",
        }
        assert by_locale["en"]["publicVisibility"] == "Active"
        assert by_locale["en"]["isDefault"] is True
        assert by_locale["en"]["canDeactivate"] is False
        for locale in ("ro", "fr", "de", "es", "pt", "pl", "cs", "it"):
            assert by_locale[locale]["publicVisibility"] == "Inactive"
            assert by_locale[locale]["isDefault"] is False

        # Default file is created lazily on first write; read defaults without file.
        config_path = tmp_path / "config" / "public-languages.json"
        assert not config_path.exists() or json.loads(config_path.read_text(encoding="utf-8"))[
            "activePublicLocales"
        ] == ["en"]

    def test_configuration_persistence_and_restart(self, tmp_path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        monkeypatch.setenv("AUTH_MODE", "mock")
        admin_public_languages.reset_repository_cache()
        public_languages.reset_repository_cache()

        first = PublicLanguagesRepository(tmp_path)
        assert first.read() == default_public_languages_config()
        first.write(
            {
                "defaultPublicLocale": "en",
                "activePublicLocales": ["en", "ro"],
            }
        )

        # New repository instance (simulates restart) preserves config.
        second = PublicLanguagesRepository(tmp_path)
        config = second.read()
        assert config["defaultPublicLocale"] == "en"
        assert config["activePublicLocales"] == ["en", "ro"]

        config_path = tmp_path / "config" / "public-languages.json"
        assert config_path.is_file()
        on_disk = json.loads(config_path.read_text(encoding="utf-8"))
        assert on_disk["activePublicLocales"] == ["en", "ro"]

    def test_activate_and_deactivate_locale(self, client):
        activated = client.post(
            "/api/admin/public-languages/ro/activate",
            headers=admin_headers(),
        )
        assert activated.status_code == 200
        assert "ro" in activated.json()["activePublicLocales"]
        row = next(item for item in activated.json()["languages"] if item["locale"] == "ro")
        assert row["publicVisibility"] == "Active"

        public = client.get("/api/content/public-languages").json()
        assert set(public["activePublicLocales"]) == {"en", "ro"}

        deactivated = client.post(
            "/api/admin/public-languages/ro/deactivate",
            headers=admin_headers(),
        )
        assert deactivated.status_code == 200
        assert deactivated.json()["activePublicLocales"] == ["en"]
        row = next(item for item in deactivated.json()["languages"] if item["locale"] == "ro")
        assert row["publicVisibility"] == "Inactive"

    def test_default_english_cannot_be_deactivated(self, client):
        response = client.post(
            "/api/admin/public-languages/en/deactivate",
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "default public language" in response.json()["detail"].lower()
        assert client.get("/api/content/public-languages").json()["activePublicLocales"] == [
            "en"
        ]

    def test_inactive_locale_not_publicly_available(self, client):
        response = client.get("/api/content/manual?locale=ro")
        assert response.status_code == 400
        assert "not active" in response.json()["detail"].lower()

        fr = client.get("/api/content/glossary?locale=fr")
        assert fr.status_code == 400

        # English remains available (empty content is still a valid active response).
        en = client.get("/api/content/manual?locale=en")
        assert en.status_code == 200

    def test_admin_can_manage_inactive_locale(self, client):
        create = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Capitol RO"},
            headers=admin_headers(),
        )
        assert create.status_code in {200, 201}
        content_id = create.json()["contentId"]

        # Romanian remains inactive publicly, but Admin can still edit RO variants.
        variant = client.get(
            f"/api/admin/manual/chapters/{content_id}/variants/ro",
            headers=admin_headers(),
        )
        assert variant.status_code == 200
        assert variant.json()["exists"] is True

        public = client.get("/api/content/manual?locale=ro")
        assert public.status_code == 400

    def test_activation_does_not_call_translation_or_publish(self, tmp_path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        languages = PublicLanguagesRepository(tmp_path)
        content = FilesystemContentRepository(tmp_path)
        service = PublicLanguagesService(languages, content)

        translation_mock = MagicMock()
        publish_mock = MagicMock()
        monkeypatch.setattr(
            "content.services.translation_update.TranslationUpdateService",
            translation_mock,
            raising=False,
        )
        monkeypatch.setattr(
            "content.services.snapshot_publish.SnapshotPublishService",
            publish_mock,
            raising=False,
        )

        service.activate("de")
        service.deactivate("de")

        translation_mock.assert_not_called()
        publish_mock.assert_not_called()

        # Config-only write — no published snapshots created by activation.
        assert content.read_manual_snapshot("de") is None
        assert content.read_glossary_snapshot("de") is None
        assert content.read_kb_snapshot("de") is None

    def test_no_legacy_seed_resurrection_when_empty_snapshot_and_inactive(
        self, client, tmp_path
    ):
        repository = FilesystemContentRepository(tmp_path)
        repository.write_legacy_manual_document(
            "de",
            {
                "locale": "de",
                "sections": [
                    {
                        "id": "legacy-intro",
                        "title": "Introduction",
                        "blocks": [{"type": "paragraph", "text": "Legacy seed"}],
                    }
                ],
            },
        )
        repository.write_manual_snapshot("de", {"locale": "de", "chapters": []})

        # Even after activating DE, empty published snapshot must not resurrect legacy.
        client.post("/api/admin/public-languages/de/activate", headers=admin_headers())
        response = client.get("/api/content/manual?locale=de")
        assert response.status_code == 200
        payload = response.json()
        assert payload["available"] is False
        assert payload["sections"] == []

        # Inactive again: rejected, still no legacy resurrection path via public API.
        client.post("/api/admin/public-languages/de/deactivate", headers=admin_headers())
        inactive = client.get("/api/content/manual?locale=de")
        assert inactive.status_code == 400

        # Direct service (bypassing activation gate) still respects empty snapshot ownership.
        direct = ManualPublicService(repository).get_published_manual("de")
        assert direct.available is False
        assert direct.sections == []

    def test_status_columns_are_informational(self, client, tmp_path):
        repository = FilesystemContentRepository(tmp_path)
        meta = repository.create_manual_chapter("Capitol", locale="ro")
        content_id = meta["contentId"]
        repository.save_manual_variant(
            content_id,
            "en",
            {
                "title": "Chapter",
                "sections": [
                    {
                        "id": "main",
                        "title": "",
                        "blocks": [{"type": "paragraph", "text": "Body"}],
                    }
                ],
            },
        )
        repository.write_manual_snapshot(
            "en",
            {
                "locale": "en",
                "chapters": [
                    {
                        "contentId": content_id,
                        "title": "Chapter",
                        "sortOrder": 0,
                        "sections": [
                            {
                                "id": "main",
                                "title": "",
                                "blocks": [{"type": "paragraph", "text": "Body"}],
                            }
                        ],
                    }
                ],
            },
        )

        overview = client.get("/api/admin/public-languages", headers=admin_headers()).json()
        by_locale = {row["locale"]: row for row in overview["languages"]}
        assert by_locale["en"]["translationStatus"] in {
            "Not generated",
            "Partial",
            "Available",
        }
        assert by_locale["en"]["publishedContentStatus"] == "Partial"
        assert by_locale["fr"]["translationStatus"] == "Not generated"
        assert by_locale["fr"]["publishedContentStatus"] == "Not published"

        # Status does not block activation.
        activated = client.post(
            "/api/admin/public-languages/fr/activate",
            headers=admin_headers(),
        )
        assert activated.status_code == 200
        assert "fr" in activated.json()["activePublicLocales"]

    def test_non_admin_cannot_change_visibility(self, client):
        response = client.post(
            "/api/admin/public-languages/ro/activate",
            headers={"X-Mock-Role": "user", "X-Mock-User-Id": "u1"},
        )
        assert response.status_code in {401, 403}
