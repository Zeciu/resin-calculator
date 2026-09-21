"""Phase 3 — Activate requires Phase 1 Production Ready."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from private.repositories.filesystem import FilesystemContentRepository
from private.repositories.public_languages import PublicLanguagesRepository
from private.routers import admin_public_languages, public_languages
from private.services.locale_readiness import evaluate_locale_readiness
from private.services.public_languages import ProductionNotReadyError, PublicLanguagesService
from tests.content.test_admin_locale_readiness import (
    _result,
    admin_headers,
    patch_activation_readiness,
)
from tests.support.authenticated_client import AuthenticatedTestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    admin_public_languages.reset_repository_cache()
    public_languages.reset_repository_cache()
    from app import app

    return AuthenticatedTestClient(app)


def _config_path(tmp_path):
    return tmp_path / "config" / "public-languages.json"


def _read_active(tmp_path):
    path = _config_path(tmp_path)
    if not path.is_file():
        return ["en"]
    return json.loads(path.read_text(encoding="utf-8"))["activePublicLocales"]


class TestActivateRequiresProductionReady:
    def test_production_ready_yes_activates(self, client, tmp_path):
        with patch_activation_readiness(production_ready=True):
            response = client.post(
                "/api/admin/public-languages/fr/activate",
                headers=admin_headers(),
            )
        assert response.status_code == 200
        body = response.json()
        assert "fr" in body["activePublicLocales"]
        french = next(row for row in body["languages"] if row["locale"] == "fr")
        assert french["publicVisibility"] == "Active"
        assert french["canDeactivate"] is True
        assert _read_active(tmp_path) == ["en", "fr"]

    def test_production_ready_no_refuses_without_config_or_artifact_changes(self, client, tmp_path):
        snapshot = tmp_path / "published" / "manual" / "fr" / "document.json"
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        snapshot.write_text('{"locale":"fr","chapters":[]}', encoding="utf-8")
        before_snapshot = snapshot.read_bytes()
        before_config = (
            _config_path(tmp_path).read_bytes() if _config_path(tmp_path).is_file() else None
        )

        with patch(
            "private.services.public_languages.evaluate_locale_readiness",
            return_value=_result("fr", preview_ready=True, production_ready=False),
        ) as readiness:
            with patch("private.tools.package_published_content.run_packaging") as packaging:
                with patch(
                    "private.services.admin_prepare_production.prepare_locale_production"
                ) as prepare:
                    with patch(
                        "private.services.snapshot_publish.SnapshotPublishService",
                        create=True,
                    ) as publish:
                        response = client.post(
                            "/api/admin/public-languages/fr/activate",
                            headers=admin_headers(),
                        )

        readiness.assert_called_once_with("fr")
        packaging.assert_not_called()
        prepare.assert_not_called()
        publish.assert_not_called()
        assert response.status_code == 409
        detail = response.json()["detail"]
        assert "Production Ready" in detail
        assert "Locale Readiness" in detail
        assert "Prepare for Production" in detail
        assert "\\" not in detail
        assert "/content/" not in detail
        assert "tmp" not in detail.lower()
        assert snapshot.read_bytes() == before_snapshot
        after_config = (
            _config_path(tmp_path).read_bytes() if _config_path(tmp_path).is_file() else None
        )
        assert after_config == before_config
        assert _read_active(tmp_path) == ["en"]

    def test_uses_phase1_evaluate_locale_readiness(self, client):
        from private.services import public_languages as service_module

        assert service_module.evaluate_locale_readiness is evaluate_locale_readiness
        with patch(
            "private.services.public_languages.evaluate_locale_readiness",
            return_value=_result("cs", preview_ready=True, production_ready=True),
        ) as mocked:
            response = client.post(
                "/api/admin/public-languages/cs/activate",
                headers=admin_headers(),
            )
        mocked.assert_called_once_with("cs")
        assert response.status_code == 200

    def test_success_does_not_package_or_publish(self, tmp_path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        languages = PublicLanguagesRepository(tmp_path)
        content = FilesystemContentRepository(tmp_path)
        service = PublicLanguagesService(languages, content)
        translation_mock = MagicMock()
        publish_mock = MagicMock()
        packaging = MagicMock()
        monkeypatch.setattr(
            "private.services.translation_update.TranslationUpdateService",
            translation_mock,
            raising=False,
        )
        monkeypatch.setattr(
            "private.services.snapshot_publish.SnapshotPublishService",
            publish_mock,
            raising=False,
        )
        with patch(
            "private.services.public_languages.evaluate_locale_readiness",
            return_value=_result("de", preview_ready=True, production_ready=True),
        ) as readiness:
            with patch("private.tools.package_published_content.run_packaging", packaging):
                overview = service.activate("de")

        readiness.assert_called_once_with("de")
        packaging.assert_not_called()
        translation_mock.assert_not_called()
        publish_mock.assert_not_called()
        assert "de" in overview.activePublicLocales
        assert content.read_manual_snapshot("de") is None

    def test_deactivate_ignores_readiness(self, client, tmp_path):
        with patch_activation_readiness(production_ready=True):
            assert (
                client.post(
                    "/api/admin/public-languages/ro/activate",
                    headers=admin_headers(),
                ).status_code
                == 200
            )
        with patch_activation_readiness(production_ready=False, preview_ready=False):
            deactivated = client.post(
                "/api/admin/public-languages/ro/deactivate",
                headers=admin_headers(),
            )
        assert deactivated.status_code == 200
        assert deactivated.json()["activePublicLocales"] == ["en"]
        assert _read_active(tmp_path) == ["en"]

    def test_default_english_still_cannot_be_deactivated(self, client):
        with patch_activation_readiness(production_ready=False):
            response = client.post(
                "/api/admin/public-languages/en/deactivate",
                headers=admin_headers(),
            )
        assert response.status_code == 400
        assert "default public language" in response.json()["detail"].lower()

    def test_unknown_locale_remains_400(self, client, tmp_path):
        with patch(
            "private.services.public_languages.evaluate_locale_readiness"
        ) as readiness:
            response = client.post(
                "/api/admin/public-languages/xx/activate",
                headers=admin_headers(),
            )
        readiness.assert_not_called()
        assert response.status_code == 400
        assert "locale" in response.json()["detail"].lower()
        assert _read_active(tmp_path) == ["en"]

    def test_already_active_is_idempotent_even_if_not_production_ready(self, tmp_path):
        languages = PublicLanguagesRepository(tmp_path)
        languages.write(
            {"defaultPublicLocale": "en", "activePublicLocales": ["en", "de"]}
        )
        path = tmp_path / "config" / "public-languages.json"
        before = path.read_bytes()
        service = PublicLanguagesService(languages, FilesystemContentRepository(tmp_path))
        with patch(
            "private.services.public_languages.evaluate_locale_readiness",
            return_value=_result("de", preview_ready=True, production_ready=False),
        ) as readiness:
            overview = service.activate("de")
        readiness.assert_not_called()
        assert overview.activePublicLocales == ["en", "de"]
        assert path.read_bytes() == before

    def test_already_active_does_not_allow_inactive_reentry_without_readiness(self, client, tmp_path):
        languages = PublicLanguagesRepository(tmp_path)
        languages.write(
            {"defaultPublicLocale": "en", "activePublicLocales": ["en", "de"]}
        )
        admin_public_languages.reset_repository_cache()
        public_languages.reset_repository_cache()
        with patch_activation_readiness(production_ready=True):
            assert (
                client.post(
                    "/api/admin/public-languages/de/deactivate",
                    headers=admin_headers(),
                ).status_code
                == 200
            )
        with patch_activation_readiness(production_ready=False):
            refused = client.post(
                "/api/admin/public-languages/de/activate",
                headers=admin_headers(),
            )
        assert refused.status_code == 409
        assert _read_active(tmp_path) == ["en"]

    def test_production_not_ready_error_is_value_error_subclass(self):
        assert issubclass(ProductionNotReadyError, ValueError)
