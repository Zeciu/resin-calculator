"""Admin Prepare for Production — Preview-gated locale packaging."""

from pathlib import Path
from unittest.mock import patch

import pytest

from private.routers import admin_public_languages, public_languages
from private.schemas.locale_readiness import locale_readiness_to_row
from private.services.admin_prepare_production import (
    PreviewNotReadyError,
    ProductionPrepareError,
    prepare_locale_production,
)
from private.services.locale_readiness import LocaleReadinessRoots
from private.tools.package_published_content import PRODUCTION_PREPARE_MODULES
from tests.content.test_admin_locale_readiness import (
    _layer,
    _result,
    admin_headers,
    patch_activation_readiness,
)
from tests.content.test_package_published_content import (
    IMAGE_A,
    _layout,
    _manual_document,
    _seed_glossary,
    _seed_kb,
    _seed_manual,
    _write_json,
)
from tests.support.authenticated_client import AUTHORIZED_HEADERS, AuthenticatedTestClient
from private.services.locale_readiness import LayerStatus


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    admin_public_languages.reset_repository_cache()
    public_languages.reset_repository_cache()
    from app import app

    return AuthenticatedTestClient(app)


def _headers() -> dict[str, str]:
    return {**AUTHORIZED_HEADERS, **admin_headers()}


def _roots(private_root: Path, public_root: Path) -> LocaleReadinessRoots:
    return LocaleReadinessRoots(
        i18n_dir=private_root / "i18n",
        private_content_root=private_root,
        public_content_root=public_root,
    )


def _seed_three_modules(private_root: Path, public_root: Path, locale: str = "fr"):
    sources = {
        "manual": _seed_manual(private_root, locale, ["new-manual"]),
        "glossary": _seed_glossary(private_root, locale, ["new-term"]),
        "knowledge-base": _seed_kb(private_root, locale, ["new-article"]),
    }
    dests = {
        "manual": _seed_manual(public_root, locale, []),
        "glossary": _seed_glossary(public_root, locale, []),
        "knowledge-base": _seed_kb(public_root, locale, []),
    }
    website = public_root / "published" / "website" / locale / "pages.json"
    _write_json(website, {"locale": locale, "pages": {"home": {"publicTitle": "Stay"}}})
    languages = public_root / "config" / "public-languages.json"
    _write_json(languages, {"defaultPublicLocale": "en", "activePublicLocales": ["en"]})
    return sources, dests, website, languages


class TestPrepareLocaleProductionService:
    def test_preview_not_ready_refuses_and_writes_nothing(self, tmp_path):
        private_root, public_root = _layout(tmp_path)
        _sources, dests, website, languages = _seed_three_modules(private_root, public_root)
        before = {key: path.read_bytes() for key, path in dests.items()}
        website_before = website.read_bytes()
        languages_before = languages.read_bytes()
        not_ready = _result("fr", preview_ready=False, production_ready=False)

        with patch(
            "private.services.admin_prepare_production.evaluate_locale_readiness",
            return_value=not_ready,
        ):
            with pytest.raises(PreviewNotReadyError, match="Preview Ready"):
                prepare_locale_production(
                    "fr",
                    roots=_roots(private_root, public_root),
                    private_root=private_root,
                    public_root=public_root,
                )

        for key, path in dests.items():
            assert path.read_bytes() == before[key]
        assert website.read_bytes() == website_before
        assert languages.read_bytes() == languages_before

    def test_unknown_locale_refuses(self, tmp_path):
        private_root, public_root = _layout(tmp_path)
        with pytest.raises(ValueError, match="Unsupported admin locale"):
            prepare_locale_production(
                "xx",
                roots=_roots(private_root, public_root),
                private_root=private_root,
                public_root=public_root,
            )

    def test_success_updates_three_modules_not_website_and_reevaluates(self, tmp_path):
        private_root, public_root = _layout(tmp_path)
        sources, dests, website, languages = _seed_three_modules(private_root, public_root)
        website_before = website.read_bytes()
        languages_before = languages.read_bytes()
        before_ready = _result("fr", preview_ready=True, production_ready=False)
        after_ready = _result("fr", preview_ready=True, production_ready=True)

        with patch(
            "private.services.admin_prepare_production.evaluate_locale_readiness",
            side_effect=[before_ready, after_ready],
        ):
            payload = prepare_locale_production(
                "fr",
                roots=_roots(private_root, public_root),
                private_root=private_root,
                public_root=public_root,
            )

        assert payload.prepared is True
        assert payload.modules == list(PRODUCTION_PREPARE_MODULES)
        assert "website" not in payload.modules
        assert payload.preview_ready is True
        assert payload.production_ready is True
        assert payload.warning is None
        assert dests["manual"].read_bytes() == sources["manual"].read_bytes()
        assert dests["glossary"].read_bytes() == sources["glossary"].read_bytes()
        assert dests["knowledge-base"].read_bytes() == sources["knowledge-base"].read_bytes()
        assert website.read_bytes() == website_before
        assert languages.read_bytes() == languages_before

    def test_planning_error_writes_nothing(self, tmp_path):
        private_root, public_root = _layout(tmp_path)
        _seed_manual(private_root, "fr", ["new-manual"])
        _seed_glossary(private_root, "fr", ["new-term"])
        dests = {
            "manual": _seed_manual(public_root, "fr", ["old-manual"]),
            "glossary": _seed_glossary(public_root, "fr", ["old-term"]),
        }
        before = {key: path.read_bytes() for key, path in dests.items()}
        with patch(
            "private.services.admin_prepare_production.evaluate_locale_readiness",
            return_value=_result("fr", preview_ready=True, production_ready=False),
        ):
            with pytest.raises(ProductionPrepareError):
                prepare_locale_production(
                    "fr",
                    roots=_roots(private_root, public_root),
                    private_root=private_root,
                    public_root=public_root,
                )
        for key, path in dests.items():
            assert path.read_bytes() == before[key]

    def test_missing_referenced_image_writes_nothing(self, tmp_path):
        private_root, public_root = _layout(tmp_path)
        snapshot = private_root / "published" / "manual" / "fr" / "document.json"
        _write_json(snapshot, _manual_document("fr", ["chapter-one"], image=IMAGE_A))
        _seed_glossary(private_root, "fr", ["term"])
        _seed_kb(private_root, "fr", ["article"])
        dest = _seed_manual(public_root, "fr", ["old"])
        before = dest.read_bytes()
        with patch(
            "private.services.admin_prepare_production.evaluate_locale_readiness",
            return_value=_result("fr", preview_ready=True, production_ready=False),
        ):
            with pytest.raises(ProductionPrepareError, match="Missing required source images"):
                prepare_locale_production(
                    "fr",
                    roots=_roots(private_root, public_root),
                    private_root=private_root,
                    public_root=public_root,
                )
        assert dest.read_bytes() == before

    def test_id_removal_writes_nothing(self, tmp_path):
        private_root, public_root = _layout(tmp_path)
        _seed_manual(private_root, "fr", ["keep"])
        _seed_glossary(private_root, "fr", ["keep-term"])
        _seed_kb(private_root, "fr", ["keep-article"])
        dest = _seed_manual(public_root, "fr", ["keep", "remove-me"])
        _seed_glossary(public_root, "fr", ["keep-term"])
        _seed_kb(public_root, "fr", ["keep-article"])
        before = dest.read_bytes()
        with patch(
            "private.services.admin_prepare_production.evaluate_locale_readiness",
            return_value=_result("fr", preview_ready=True, production_ready=False),
        ):
            with pytest.raises(ProductionPrepareError, match="removed"):
                prepare_locale_production(
                    "fr",
                    roots=_roots(private_root, public_root),
                    private_root=private_root,
                    public_root=public_root,
                )
        assert dest.read_bytes() == before

    def test_prepared_but_still_not_production_ready_returns_warning(self, tmp_path):
        private_root, public_root = _layout(tmp_path)
        _seed_three_modules(private_root, public_root)
        still_no = _result(
            "fr",
            preview_ready=True,
            production_ready=False,
            glossary_production=_layer(LayerStatus.INCOMPLETE, 173, 172, missing=("term-x",)),
        )
        with patch(
            "private.services.admin_prepare_production.evaluate_locale_readiness",
            side_effect=[
                _result("fr", preview_ready=True, production_ready=False),
                still_no,
            ],
        ):
            payload = prepare_locale_production(
                "fr",
                roots=_roots(private_root, public_root),
                private_root=private_root,
                public_root=public_root,
            )
        assert payload.prepared is True
        assert payload.production_ready is False
        assert payload.warning is not None


class TestPrepareProductionEndpoint:
    def test_preview_not_ready_does_not_package(self, client):
        with patch(
            "private.services.admin_prepare_production.evaluate_locale_readiness",
            return_value=_result("fr", preview_ready=False, production_ready=False),
        ):
            with patch("private.services.admin_prepare_production.run_packaging") as packaging:
                response = client.post(
                    "/api/admin/public-languages/fr/prepare-production",
                    headers=_headers(),
                )
        packaging.assert_not_called()
        assert response.status_code == 409
        assert "Preview Ready" in response.json()["detail"]

    def test_unknown_locale(self, client):
        response = client.post(
            "/api/admin/public-languages/xx/prepare-production",
            headers=_headers(),
        )
        assert response.status_code == 400
        assert "locale" in response.json()["detail"].lower()

    def test_success_payload_and_does_not_activate(self, client):
        ready = _result("fr", preview_ready=True, production_ready=True)
        fake = locale_readiness_to_row(ready)
        with patch(
            "private.routers.admin_public_languages.prepare_locale_production",
            return_value={
                "locale": "fr",
                "label": "French",
                "prepared": True,
                "modules": list(PRODUCTION_PREPARE_MODULES),
                "preview_ready": True,
                "production_ready": True,
                "warning": None,
                "readiness": fake,
            },
        ) as mocked:
            prepared = client.post(
                "/api/admin/public-languages/fr/prepare-production",
                headers=_headers(),
            )
        mocked.assert_called_once_with("fr")
        assert prepared.status_code == 200
        body = prepared.json()
        assert body["prepared"] is True
        assert body["modules"] == ["manual", "knowledge-base", "glossary"]
        assert "website" not in body["modules"]
        assert body["production_ready"] is True

        overview = client.get("/api/admin/public-languages", headers=_headers()).json()
        assert overview["activePublicLocales"] == ["en"]
        french = next(row for row in overview["languages"] if row["locale"] == "fr")
        assert french["publicVisibility"] == "Inactive"

    def test_activate_still_works_independently(self, client):
        with patch_activation_readiness(production_ready=True):
            activated = client.post(
                "/api/admin/public-languages/fr/activate",
                headers=_headers(),
            )
        assert activated.status_code == 200
        assert "fr" in activated.json()["activePublicLocales"]
