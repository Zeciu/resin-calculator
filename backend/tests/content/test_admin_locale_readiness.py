"""Admin locale readiness overview — read-only display of Phase 1 results."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from private.routers import admin_public_languages, public_languages
from private.schemas.common import ADMIN_EDITORIAL_LOCALE_ORDER
from private.services.locale_readiness import (
    LayerReadiness,
    LayerStatus,
    LocaleReadiness,
    StoreDiagnostics,
    StoreVariantDiagnostic,
)
from tests.support.authenticated_client import AuthenticatedTestClient

LAYER_FIELDS = (
    "ui",
    "website_preview",
    "website_production",
    "manual_preview",
    "manual_production",
    "glossary_preview",
    "glossary_production",
    "knowledge_base_preview",
    "knowledge_base_production",
)


def admin_headers() -> dict[str, str]:
    return {
        "X-Mock-Role": "administrator",
        "X-Mock-User-Id": "admin-user",
    }


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    admin_public_languages.reset_repository_cache()
    public_languages.reset_repository_cache()
    from app import app

    return AuthenticatedTestClient(app)


def _layer(
    status: LayerStatus,
    required: int,
    present: int,
    missing: tuple[str, ...] = (),
    extra: tuple[str, ...] = (),
) -> LayerReadiness:
    return LayerReadiness(
        status=status,
        required_count=required,
        present_count=present,
        missing=missing,
        extra=extra,
    )


def _complete(required: int) -> LayerReadiness:
    return _layer(LayerStatus.COMPLETE, required, required)


def _store(
    canonical: int,
    published: int,
    draft: int = 0,
    no_variant: int = 0,
    draft_ids: tuple[str, ...] = (),
    no_variant_ids: tuple[str, ...] = (),
) -> StoreVariantDiagnostic:
    return StoreVariantDiagnostic(
        canonical_count=canonical,
        published_count=published,
        draft_count=draft,
        no_variant_count=no_variant,
        published_ids=(),
        draft_ids=draft_ids,
        no_variant_ids=no_variant_ids,
    )


def _result(
    locale: str,
    *,
    preview_ready: bool,
    production_ready: bool,
    ui: LayerReadiness | None = None,
    glossary_preview: LayerReadiness | None = None,
    glossary_production: LayerReadiness | None = None,
    manual_production: LayerReadiness | None = None,
    knowledge_base_production: LayerReadiness | None = None,
    extra_ui: tuple[str, ...] = (),
) -> LocaleReadiness:
    complete_ui = ui or _complete(10)
    if extra_ui:
        complete_ui = _layer(LayerStatus.COMPLETE, 10, 10, extra=extra_ui)
    return LocaleReadiness(
        locale=locale,
        ui=complete_ui,
        website_preview=_complete(6),
        website_production=_complete(6),
        manual_preview=_complete(18),
        manual_production=manual_production or _complete(18),
        glossary_preview=glossary_preview or _complete(173),
        glossary_production=glossary_production or _complete(173),
        knowledge_base_preview=_complete(112),
        knowledge_base_production=knowledge_base_production or _complete(112),
        preview_ready=preview_ready,
        production_ready=production_ready,
        store=StoreDiagnostics(
            manual=_store(18, 18),
            glossary=_store(173, 173 if glossary_preview is None else glossary_preview.present_count),
            knowledge_base=_store(112, 112),
        ),
    )


def _configured_results() -> tuple[LocaleReadiness, ...]:
    by_locale = {
        "en": _result("en", preview_ready=True, production_ready=True, extra_ui=("legacy.unused",)),
        "de": _result(
            "de",
            preview_ready=True,
            production_ready=False,
            manual_production=_layer(LayerStatus.MISSING, 18, 0, missing=("chapter-a", "chapter-b")),
            glossary_production=_layer(LayerStatus.INCOMPLETE, 173, 0, missing=("term-a",)),
            knowledge_base_production=_layer(LayerStatus.INCOMPLETE, 112, 0, missing=("article-a",)),
        ),
        "fr": _result(
            "fr",
            preview_ready=False,
            production_ready=False,
            ui=_layer(LayerStatus.INCOMPLETE, 10, 8, missing=("nav.home", "nav.glossary")),
        ),
    }
    rows = []
    for locale in ADMIN_EDITORIAL_LOCALE_ORDER:
        if locale in by_locale:
            rows.append(by_locale[locale])
        else:
            rows.append(
                _result(
                    locale,
                    preview_ready=False,
                    production_ready=False,
                    ui=_layer(LayerStatus.INCOMPLETE, 10, 0, missing=("nav.home",)),
                )
            )
    return tuple(rows)


class TestAdminLocaleReadinessEndpoint:
    def test_uses_phase1_service_and_exposes_all_locales_and_layers(self, client):
        with patch(
            "private.services.admin_locale_readiness.evaluate_configured_locales",
            return_value=_configured_results(),
        ) as mocked:
            response = client.get("/api/admin/public-languages/readiness", headers=admin_headers())
        mocked.assert_called_once_with()
        assert response.status_code == 200
        payload = response.json()
        locales = [row["locale"] for row in payload["locales"]]
        assert locales == list(ADMIN_EDITORIAL_LOCALE_ORDER)
        english = payload["locales"][locales.index("en")]
        for field in LAYER_FIELDS:
            layer = english[field]
            assert set(layer) == {
                "status",
                "required_count",
                "present_count",
                "missing",
                "extra",
            }
        assert english["preview_ready"] is True
        assert english["production_ready"] is True
        assert english["ui"]["status"] == "complete"
        assert english["ui"]["required_count"] == 10
        assert english["ui"]["present_count"] == 10
        assert english["ui"]["extra"] == ["legacy.unused"]
        assert "label" in english
        assert "published_ids" not in english["store"]["glossary"]
        assert set(english["store"]["glossary"]) == {
            "canonical_count",
            "published_count",
            "draft_count",
            "no_variant_count",
            "draft_ids",
            "no_variant_ids",
        }

    def test_english_can_report_preview_and_production_ready(self, client):
        with patch(
            "private.services.admin_locale_readiness.evaluate_configured_locales",
            return_value=_configured_results(),
        ):
            payload = client.get(
                "/api/admin/public-languages/readiness", headers=admin_headers()
            ).json()
        english = next(row for row in payload["locales"] if row["locale"] == "en")
        assert english["preview_ready"] is True
        assert english["production_ready"] is True

    def test_german_can_report_preview_ready_production_not_ready(self, client):
        with patch(
            "private.services.admin_locale_readiness.evaluate_configured_locales",
            return_value=_configured_results(),
        ):
            payload = client.get(
                "/api/admin/public-languages/readiness", headers=admin_headers()
            ).json()
        german = next(row for row in payload["locales"] if row["locale"] == "de")
        assert german["preview_ready"] is True
        assert german["production_ready"] is False
        assert german["manual_production"]["status"] == "missing"
        assert german["glossary_production"]["status"] == "incomplete"
        assert german["knowledge_base_production"]["status"] == "incomplete"

    def test_incomplete_locale_exposes_missing_items(self, client):
        with patch(
            "private.services.admin_locale_readiness.evaluate_configured_locales",
            return_value=_configured_results(),
        ):
            payload = client.get(
                "/api/admin/public-languages/readiness", headers=admin_headers()
            ).json()
        french = next(row for row in payload["locales"] if row["locale"] == "fr")
        assert french["preview_ready"] is False
        assert french["ui"]["status"] == "incomplete"
        assert french["ui"]["missing"] == ["nav.home", "nav.glossary"]

    def test_endpoint_is_get_only(self, client):
        with patch(
            "private.services.admin_locale_readiness.evaluate_configured_locales",
            return_value=_configured_results(),
        ):
            get_response = client.get(
                "/api/admin/public-languages/readiness", headers=admin_headers()
            )
            post_response = client.post(
                "/api/admin/public-languages/readiness", headers=admin_headers()
            )
        assert get_response.status_code == 200
        assert post_response.status_code == 405

    def test_activation_endpoints_are_unchanged(self, client):
        with patch(
            "private.services.admin_locale_readiness.evaluate_configured_locales",
            return_value=_configured_results(),
        ):
            activated = client.post(
                "/api/admin/public-languages/fr/activate",
                headers=admin_headers(),
            )
        assert activated.status_code == 200
        body = activated.json()
        assert "fr" in body["activePublicLocales"]
        assert "readiness" not in body
        assert "locales" not in body
        assert "languages" in body
        french = next(row for row in body["languages"] if row["locale"] == "fr")
        assert french["publicVisibility"] == "Active"
        assert set(french) == {
            "locale",
            "label",
            "translationStatus",
            "publishedContentStatus",
            "publicVisibility",
            "isDefault",
            "canDeactivate",
        }
