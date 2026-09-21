"""Phase 3 — Activate requires Phase 1 Production Ready."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from private.repositories.filesystem import FilesystemContentRepository
from private.repositories.public_languages import PublicLanguagesRepository
from private.routers import admin_public_languages, public_content, public_languages
from private.services.locale_readiness import evaluate_locale_readiness
from private.services.public_languages import ProductionNotReadyError, PublicLanguagesService
from tests.content.test_admin_locale_readiness import (
    _result,
    admin_headers,
    patch_activation_readiness,
)
from tests.support.authenticated_client import AuthenticatedTestClient


def _reset_language_caches() -> None:
    admin_public_languages.reset_repository_cache()
    public_languages.reset_repository_cache()
    public_content.reset_repository_cache()


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    _reset_language_caches()
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
        public_content.reset_repository_cache()
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


CHECKOUT_PRIVATE_LANGUAGES = (
    Path(__file__).resolve().parents[2] / "private" / "content" / "config" / "public-languages.json"
)
CHECKOUT_PUBLIC_LANGUAGES = (
    Path(__file__).resolve().parents[2] / "public" / "content" / "config" / "public-languages.json"
)


def _write_languages(root: Path, active: list[str]) -> Path:
    path = root / "config" / "public-languages.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {"defaultPublicLocale": "en", "activePublicLocales": active},
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return path


def _read_languages(root: Path) -> list[str]:
    path = root / "config" / "public-languages.json"
    if not path.is_file():
        return ["en"]
    return json.loads(path.read_text(encoding="utf-8"))["activePublicLocales"]


class TestProductionRegistryIsAuthoritative:
    @pytest.fixture
    def split_roots(self, tmp_path, monkeypatch):
        editorial = tmp_path / "editorial"
        production = tmp_path / "production"
        editorial.mkdir()
        production.mkdir()
        monkeypatch.setenv("CONTENT_DATA_DIR", str(editorial))
        monkeypatch.setenv("PUBLIC_CONTENT_DATA_DIR", str(production))
        _reset_language_caches()
        from app import app

        return {
            "editorial": editorial,
            "production": production,
            "client": AuthenticatedTestClient(app),
        }

    def test_private_de_without_public_de_is_admin_inactive(self, split_roots):
        _write_languages(split_roots["editorial"], ["en", "ro", "de"])
        _write_languages(split_roots["production"], ["en", "ro"])
        overview = split_roots["client"].get(
            "/api/admin/public-languages", headers=admin_headers()
        ).json()
        german = next(row for row in overview["languages"] if row["locale"] == "de")
        assert overview["activePublicLocales"] == ["en", "ro"]
        assert german["publicVisibility"] == "Inactive"
        assert german["canDeactivate"] is False
        assert _read_languages(split_roots["editorial"]) == ["en", "ro", "de"]
        assert _read_languages(split_roots["production"]) == ["en", "ro"]

    def test_activate_de_writes_public_registry_when_production_ready(self, split_roots):
        _write_languages(split_roots["editorial"], ["en", "ro", "de"])
        _write_languages(split_roots["production"], ["en", "ro"])
        with patch_activation_readiness(production_ready=True):
            response = split_roots["client"].post(
                "/api/admin/public-languages/de/activate",
                headers=admin_headers(),
            )
        assert response.status_code == 200
        body = response.json()
        assert body["activePublicLocales"] == ["en", "ro", "de"]
        german = next(row for row in body["languages"] if row["locale"] == "de")
        assert german["publicVisibility"] == "Active"
        assert german["canDeactivate"] is True
        assert _read_languages(split_roots["production"]) == ["en", "ro", "de"]
        assert _read_languages(split_roots["editorial"]) == ["en", "ro", "de"]

    def test_activate_de_does_not_require_private_presence(self, split_roots):
        _write_languages(split_roots["editorial"], ["en", "ro"])
        _write_languages(split_roots["production"], ["en", "ro"])
        with patch_activation_readiness(production_ready=True):
            response = split_roots["client"].post(
                "/api/admin/public-languages/de/activate",
                headers=admin_headers(),
            )
        assert response.status_code == 200
        assert _read_languages(split_roots["production"]) == ["en", "ro", "de"]
        assert "de" in _read_languages(split_roots["editorial"])

    def test_production_ready_no_leaves_both_registries_unchanged(self, split_roots):
        _write_languages(split_roots["editorial"], ["en", "ro", "de"])
        public_path = _write_languages(split_roots["production"], ["en", "ro"])
        before_public = public_path.read_bytes()
        before_private = (
            split_roots["editorial"] / "config" / "public-languages.json"
        ).read_bytes()
        with patch_activation_readiness(production_ready=False):
            response = split_roots["client"].post(
                "/api/admin/public-languages/de/activate",
                headers=admin_headers(),
            )
        assert response.status_code == 409
        assert public_path.read_bytes() == before_public
        assert (
            split_roots["editorial"] / "config" / "public-languages.json"
        ).read_bytes() == before_private
        assert _read_languages(split_roots["production"]) == ["en", "ro"]

    def test_already_public_active_is_idempotent(self, split_roots):
        _write_languages(split_roots["editorial"], ["en", "ro", "de"])
        public_path = _write_languages(split_roots["production"], ["en", "ro", "de"])
        before = public_path.read_bytes()
        with patch(
            "private.services.public_languages.evaluate_locale_readiness",
            return_value=_result("de", preview_ready=True, production_ready=False),
        ) as readiness:
            response = split_roots["client"].post(
                "/api/admin/public-languages/de/activate",
                headers=admin_headers(),
            )
        readiness.assert_not_called()
        assert response.status_code == 200
        assert response.json()["activePublicLocales"] == ["en", "ro", "de"]
        assert public_path.read_bytes() == before

    def test_deactivate_removes_from_public_and_keeps_private(self, split_roots):
        _write_languages(split_roots["editorial"], ["en", "ro", "de"])
        _write_languages(split_roots["production"], ["en", "ro", "de"])
        response = split_roots["client"].post(
            "/api/admin/public-languages/de/deactivate",
            headers=admin_headers(),
        )
        assert response.status_code == 200
        assert response.json()["activePublicLocales"] == ["en", "ro"]
        german = next(
            row for row in response.json()["languages"] if row["locale"] == "de"
        )
        assert german["publicVisibility"] == "Inactive"
        assert _read_languages(split_roots["production"]) == ["en", "ro"]
        assert _read_languages(split_roots["editorial"]) == ["en", "ro", "de"]

    def test_default_locale_still_cannot_be_deactivated(self, split_roots):
        _write_languages(split_roots["production"], ["en", "ro"])
        response = split_roots["client"].post(
            "/api/admin/public-languages/en/deactivate",
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "default public language" in response.json()["detail"].lower()
        assert _read_languages(split_roots["production"]) == ["en", "ro"]

    def test_stale_frontend_cannot_bypass_backend_readiness(self, split_roots):
        _write_languages(split_roots["production"], ["en", "ro"])
        with patch_activation_readiness(production_ready=False):
            response = split_roots["client"].post(
                "/api/admin/public-languages/de/activate",
                headers=admin_headers(),
            )
        assert response.status_code == 409
        assert _read_languages(split_roots["production"]) == ["en", "ro"]

    def test_split_activate_does_not_mutate_checkout_registries(self, split_roots):
        before_private = CHECKOUT_PRIVATE_LANGUAGES.read_bytes()
        before_public = CHECKOUT_PUBLIC_LANGUAGES.read_bytes()
        _write_languages(split_roots["editorial"], ["en", "ro", "de"])
        _write_languages(split_roots["production"], ["en", "ro"])
        with patch_activation_readiness(production_ready=True):
            assert (
                split_roots["client"].post(
                    "/api/admin/public-languages/de/activate",
                    headers=admin_headers(),
                ).status_code
                == 200
            )
        assert CHECKOUT_PRIVATE_LANGUAGES.read_bytes() == before_private
        assert CHECKOUT_PUBLIC_LANGUAGES.read_bytes() == before_public
        assert json.loads(before_public.decode("utf-8"))["activePublicLocales"] == [
            "en",
            "ro",
            "de",
        ]
        assert json.loads(before_private.decode("utf-8"))["activePublicLocales"] == [
            "en",
            "ro",
            "de",
        ]
