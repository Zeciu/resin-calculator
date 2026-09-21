"""Missing-only Admin UI catalog translation. Uses a fake provider — never DeepL."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from private.editorial_content_mode import EDITORIAL_CONTENT_MODE_ENV, EDITORIAL_CONTENT_MODE_RELEASE
from private.routers.admin_ui_translations import get_ui_catalog_service
from private.services.locale_readiness import LayerStatus, evaluate_ui_layer
from private.services.ui_catalog_translation import (
    UiCatalogTranslationError,
    UiCatalogTranslationService,
    missing_ui_keys,
    protect_ui_tokens,
    restore_ui_tokens,
)
from private.translation.types import TranslationResult
from tests.support.authenticated_client import AUTHORIZED_HEADERS, AuthenticatedTestClient


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _catalogs(i18n_dir: Path) -> None:
    _write_json(
        i18n_dir / "en.json",
        {
            "keep.existing": "Keep me",
            "missing.plain": "Home",
            "empty.plain": "Save",
            "tokens.mixed": (
                "Open {name} in HFZWood .hfzproject. Density kg/L, area cm², "
                "ratio A:B. See https://example.com/docs"
            ),
        },
    )
    _write_json(
        i18n_dir / "ro.json",
        {
            "keep.existing": "Păstrează-mă",
            "missing.plain": "Acasă",
            "empty.plain": "Salvează",
            "tokens.mixed": (
                "Deschide {name} în HFZWood .hfzproject. Densitate kg/L, arie cm², "
                "raport A:B. Vezi https://example.com/docs"
            ),
        },
    )
    _write_json(
        i18n_dir / "pt.json",
        {
            "keep.existing": "Já traduzido",
            "empty.plain": "",
            "legacy.extra": "extra",
        },
    )


class FakeProvider:
    def __init__(self, translate=None) -> None:
        self.calls: list[dict] = []
        self._translate = translate or (lambda text: f"PT {text}")

    def translate(self, text, **kwargs):
        return self.translate_many([text], **kwargs)[0]

    def translate_many(self, texts, *, source_locale, target_locale, **kwargs):
        self.calls.append(
            {
                "texts": list(texts),
                "source_locale": source_locale,
                "target_locale": target_locale,
                "content_format": kwargs.get("content_format"),
            }
        )
        return [
            TranslationResult(
                text=self._translate(text),
                provider="fake",
                source_locale=source_locale,
                target_locale=target_locale,
            )
            for text in texts
        ]


@pytest.fixture
def i18n_dir(tmp_path: Path) -> Path:
    directory = tmp_path / "i18n"
    _catalogs(directory)
    return directory


@pytest.fixture
def service(i18n_dir: Path) -> tuple[UiCatalogTranslationService, FakeProvider]:
    provider = FakeProvider()
    return UiCatalogTranslationService(i18n_dir=i18n_dir, provider=provider), provider


class TestMissingKeyDetection:
    def test_missing_target_key_is_identified(self, i18n_dir: Path) -> None:
        required = ("keep.existing", "missing.plain", "empty.plain", "tokens.mixed")
        target = json.loads((i18n_dir / "pt.json").read_text(encoding="utf-8"))
        missing = missing_ui_keys(required, target)
        assert "missing.plain" in missing
        assert "tokens.mixed" in missing

    def test_empty_target_value_is_identified_as_missing(self, i18n_dir: Path) -> None:
        required = ("keep.existing", "missing.plain", "empty.plain", "tokens.mixed")
        target = json.loads((i18n_dir / "pt.json").read_text(encoding="utf-8"))
        assert "empty.plain" in missing_ui_keys(required, target)

    def test_existing_non_empty_translation_is_not_missing(self, i18n_dir: Path) -> None:
        required = ("keep.existing", "missing.plain", "empty.plain", "tokens.mixed")
        target = json.loads((i18n_dir / "pt.json").read_text(encoding="utf-8"))
        assert "keep.existing" not in missing_ui_keys(required, target)

    def test_value_identical_to_english_is_not_missing(self) -> None:
        required = ("keep.existing",)
        assert missing_ui_keys(required, {"keep.existing": "Keep me"}) == ()


class TestGenerateMissing:
    def test_only_missing_strings_are_sent_and_ro_is_source(
        self, service: tuple[UiCatalogTranslationService, FakeProvider]
    ) -> None:
        catalog_service, provider = service
        result = catalog_service.generate_missing("pt")
        assert result.generated_count == 3
        assert result.preserved_count == 1
        assert len(provider.calls) == 1
        call = provider.calls[0]
        assert call["source_locale"] == "ro"
        assert call["target_locale"] == "pt"
        assert call["content_format"] == "plain"
        sent = call["texts"]
        assert len(sent) == 3
        joined = "\n".join(sent)
        assert "Păstrează-mă" not in joined
        assert "Acasă" in joined
        assert "Salvează" in joined
        assert "Deschide" in joined
        assert "Home" not in joined
        assert "Keep me" not in joined

    def test_en_key_structure_controls_expected_keys(
        self, service: tuple[UiCatalogTranslationService, FakeProvider], i18n_dir: Path
    ) -> None:
        catalog_service, _provider = service
        catalog_service.generate_missing("pt")
        written = json.loads((i18n_dir / "pt.json").read_text(encoding="utf-8"))
        assert list(written)[:4] == [
            "keep.existing",
            "missing.plain",
            "empty.plain",
            "tokens.mixed",
        ]
        assert written["legacy.extra"] == "extra"

    def test_existing_translation_is_preserved_and_missing_values_written(
        self, service: tuple[UiCatalogTranslationService, FakeProvider], i18n_dir: Path
    ) -> None:
        catalog_service, _provider = service
        catalog_service.generate_missing("pt")
        written = json.loads((i18n_dir / "pt.json").read_text(encoding="utf-8"))
        assert written["keep.existing"] == "Já traduzido"
        assert written["missing.plain"] == "PT Acasă"
        assert written["empty.plain"] == "PT Salvează"

    def test_placeholders_hfzwood_and_catalog_tokens_survive(
        self, service: tuple[UiCatalogTranslationService, FakeProvider], i18n_dir: Path
    ) -> None:
        catalog_service, provider = service
        catalog_service.generate_missing("pt")
        written = json.loads((i18n_dir / "pt.json").read_text(encoding="utf-8"))
        value = written["tokens.mixed"]
        assert "{name}" in value
        assert "HFZWood" in value
        assert ".hfzproject" in value
        assert "kg/L" in value
        assert "cm²" in value
        assert "A:B" in value
        assert "https://example.com/docs" in value
        sent = provider.calls[0]["texts"]
        token_source = next(text for text in sent if "Deschide" in text or "__HFZUI_" in text)
        assert "{name}" not in token_source
        assert "HFZWood" not in token_source
        assert "https://example.com/docs" not in token_source

    def test_failed_token_restore_does_not_write_that_key(self, i18n_dir: Path) -> None:
        def translate(text: str) -> str:
            if "__HFZUI_" in text:
                return "tradução corrompida"
            return f"PT {text}"

        catalog_service = UiCatalogTranslationService(
            i18n_dir=i18n_dir, provider=FakeProvider(translate)
        )
        result = catalog_service.generate_missing("pt")
        written = json.loads((i18n_dir / "pt.json").read_text(encoding="utf-8"))
        assert written["keep.existing"] == "Já traduzido"
        assert written["missing.plain"] == "PT Acasă"
        assert "tokens.mixed" not in written
        assert any(item.key == "tokens.mixed" for item in result.failed)

    def test_unsupported_and_self_target_locales_are_rejected(self, i18n_dir: Path) -> None:
        catalog_service = UiCatalogTranslationService(i18n_dir=i18n_dir, provider=FakeProvider())
        with pytest.raises(UiCatalogTranslationError, match="en"):
            catalog_service.preview("en")
        with pytest.raises(UiCatalogTranslationError, match="ro"):
            catalog_service.generate_missing("ro")
        with pytest.raises(UiCatalogTranslationError, match="Unsupported admin locale"):
            catalog_service.generate_missing("xx")
        written = json.loads((i18n_dir / "pt.json").read_text(encoding="utf-8"))
        assert written["keep.existing"] == "Já traduzido"
        assert "missing.plain" not in written

    def test_readiness_semantics_untouched_after_generate(
        self, service: tuple[UiCatalogTranslationService, FakeProvider], i18n_dir: Path
    ) -> None:
        required = ("keep.existing", "missing.plain", "empty.plain", "tokens.mixed")
        before = evaluate_ui_layer("pt", i18n_dir, required)
        assert before.status is LayerStatus.INCOMPLETE
        assert before.present_count == 1
        assert before.required_count == 4
        catalog_service, _provider = service
        catalog_service.generate_missing("pt")
        after = evaluate_ui_layer("pt", i18n_dir, required)
        assert after.status is LayerStatus.COMPLETE
        assert after.present_count == 4
        identical = evaluate_ui_layer("pt", i18n_dir, ("keep.existing",))
        assert identical.status is LayerStatus.COMPLETE


class TestTokenHelpers:
    def test_protect_and_restore_round_trip(self) -> None:
        source = "Deschide {name} în HFZWood .hfzproject kg/L cm² A:B https://example.com/x"
        protected, tokens = protect_ui_tokens(source)
        assert "{name}" not in protected
        assert "HFZWood" not in protected
        restored = restore_ui_tokens(f"PT {protected}", tokens)
        assert restored == f"PT {source}"
        assert restore_ui_tokens("sem sentinela", tokens) is None


class TestAdminRoutes:
    def test_preview_and_generate_http(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        i18n_dir = tmp_path / "i18n"
        _catalogs(i18n_dir)
        provider = FakeProvider()
        catalog_service = UiCatalogTranslationService(i18n_dir=i18n_dir, provider=provider)
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path / "content"))
        from app import app

        app.dependency_overrides[get_ui_catalog_service] = lambda: catalog_service
        try:
            client = AuthenticatedTestClient(app)
            preview = client.get(
                "/api/admin/ui-translations/pt/preview",
                headers=AUTHORIZED_HEADERS,
            )
            assert preview.status_code == 200
            body = preview.json()
            assert body["required_count"] == 4
            assert body["present_count"] == 1
            assert body["missing_count"] == 3
            assert "missing.plain" in body["missing_keys"]

            generated = client.post(
                "/api/admin/ui-translations/pt/generate-missing",
                headers=AUTHORIZED_HEADERS,
            )
            assert generated.status_code == 200
            payload = generated.json()
            assert payload["generated_count"] == 3
            assert payload["preserved_count"] == 1
            assert payload["present_count_after"] == 4
            assert payload["provider_called"] is True
            written = json.loads((i18n_dir / "pt.json").read_text(encoding="utf-8"))
            assert written["keep.existing"] == "Já traduzido"
        finally:
            app.dependency_overrides.pop(get_ui_catalog_service, None)

    def test_http_rejects_en_and_ro(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        i18n_dir = tmp_path / "i18n"
        _catalogs(i18n_dir)
        catalog_service = UiCatalogTranslationService(i18n_dir=i18n_dir, provider=FakeProvider())
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path / "content"))
        from app import app

        app.dependency_overrides[get_ui_catalog_service] = lambda: catalog_service
        try:
            client = AuthenticatedTestClient(app)
            for locale in ("en", "ro"):
                response = client.post(
                    f"/api/admin/ui-translations/{locale}/generate-missing",
                    headers=AUTHORIZED_HEADERS,
                )
                assert response.status_code == 400
        finally:
            app.dependency_overrides.pop(get_ui_catalog_service, None)

    def test_generate_forbidden_in_release_mode(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path / "content"))
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, EDITORIAL_CONTENT_MODE_RELEASE)
        from app import app

        client = AuthenticatedTestClient(app)
        response = client.post(
            "/api/admin/ui-translations/pt/generate-missing",
            headers=AUTHORIZED_HEADERS,
        )
        assert response.status_code == 403
