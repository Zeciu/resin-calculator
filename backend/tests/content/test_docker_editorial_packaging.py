"""Task B4 — Docker packaging of the Git-tracked editorial release corpus."""

from __future__ import annotations

import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parents[3]
DOCKERFILE = REPO_ROOT / "Dockerfile"
DOCKERIGNORE = REPO_ROOT / ".dockerignore"
CORPUS_ROOT = REPO_ROOT / "backend" / "data"

APPROVED_CORPUS_RELATIVE = [
    "editorial/content-store.json",
    "config/public-languages.json",
]

APPROVED_TREE_PREFIXES = (
    "published/manual/",
    "published/glossary/",
    "published/knowledge-base/",
    "published/website/",
    "manual/images/",
    "glossary/images/",
    "knowledge-base/images/",
    "website/images/",
)

FORBIDDEN_TOP_LEVEL = (
    "preferences",
    "entitlements",
    "legacy",
    ".hfzwood-initialized.json",
)

REQUIRED_DOCKERFILE_COPIES = [
    "COPY backend/data/editorial/content-store.json /app/content/editorial/content-store.json",
    "COPY backend/data/config/public-languages.json /app/content/config/public-languages.json",
    "COPY backend/data/published/manual/ /app/content/published/manual/",
    "COPY backend/data/published/glossary/ /app/content/published/glossary/",
    "COPY backend/data/published/knowledge-base/ /app/content/published/knowledge-base/",
    "COPY backend/data/published/website/ /app/content/published/website/",
    "COPY backend/data/manual/images/ /app/content/manual/images/",
    "COPY backend/data/glossary/images/ /app/content/glossary/images/",
    "COPY backend/data/knowledge-base/images/ /app/content/knowledge-base/images/",
    "COPY backend/data/website/images/ /app/content/website/images/",
]


def _list_approved_corpus_files() -> list[Path]:
    files: list[Path] = []
    for relative in APPROVED_CORPUS_RELATIVE:
        path = CORPUS_ROOT / relative
        assert path.is_file(), f"Missing approved corpus file: {relative}"
        files.append(path)
    for prefix in APPROVED_TREE_PREFIXES:
        root = CORPUS_ROOT / prefix
        assert root.is_dir(), f"Missing approved corpus directory: {prefix}"
        files.extend(sorted(p for p in root.rglob("*") if p.is_file()))
    return files


def _dockerignore_text() -> str:
    return DOCKERIGNORE.read_text(encoding="utf-8")


def _dockerfile_text() -> str:
    return DOCKERFILE.read_text(encoding="utf-8")


class TestDockerEditorialPackagingFiles:
    def test_dockerfile_copies_approved_corpus_to_app_content(self):
        text = _dockerfile_text()
        assert "COPY backend/data/ /app/content" not in text
        assert "COPY backend/data /app/content" not in text
        for line in REQUIRED_DOCKERFILE_COPIES:
            assert line in text, f"Missing Dockerfile COPY line: {line}"
        assert "COPY --from=editorial-seed-build /app/seed-data ./seed-data" in text

    def test_dockerignore_excludes_commercial_and_allows_corpus(self):
        text = _dockerignore_text()
        assert "backend/data\n" not in text.replace("\r\n", "\n") or "backend/data/*" in text
        assert "backend/data/*" in text
        assert "!backend/data/editorial/content-store.json" in text
        assert "!backend/data/config/public-languages.json" in text
        for prefix in (
            "published/manual",
            "published/glossary",
            "published/knowledge-base",
            "published/website",
            "manual/images",
            "glossary/images",
            "knowledge-base/images",
            "website/images",
        ):
            assert f"!backend/data/{prefix}/" in text
            assert f"!backend/data/{prefix}/**" in text
        for blocked in (
            "backend/data/preferences/",
            "backend/data/entitlements/",
            "backend/data/legacy/",
            "backend/data/.hfzwood-initialized.json",
            "backend/data/**/*.tmp*",
            "backend/data/**/.hfzwood-write-check-*",
            "backend/data/**/.hfzwood-init-*",
        ):
            assert blocked in text

    def test_approved_corpus_exists_and_excludes_commercial_paths(self):
        files = _list_approved_corpus_files()
        assert len(files) >= 40
        total = sum(path.stat().st_size for path in files)
        assert total > 1_000_000
        dockerfile = _dockerfile_text()
        for name in FORBIDDEN_TOP_LEVEL:
            # Presence on disk is fine locally; packaging must not COPY these.
            assert re.search(rf"COPY backend/data/{re.escape(name)}", dockerfile) is None


class TestPackagedReleaseCorpusSmoke:
    """Release-mode smoke against the on-disk approved corpus layout (container-equivalent)."""

    @pytest.fixture
    def release_client(self, tmp_path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(CORPUS_ROOT))
        monkeypatch.setenv("COMMERCIAL_DATA_DIR", str(tmp_path / "commercial"))
        monkeypatch.setenv("EDITORIAL_CONTENT_MODE", "release")
        monkeypatch.setenv("AUTH_MODE", "mock")
        monkeypatch.delenv("REQUIRE_CONTENT_DATA_DIR", raising=False)

        from content.repositories.filesystem import validate_release_editorial_root

        validate_release_editorial_root(CORPUS_ROOT)

        from content.routers import (
            admin_editorial,
            admin_glossary,
            admin_knowledge_base,
            admin_manual,
            admin_public_languages,
            admin_website,
            public_content,
            public_languages,
        )

        for module in (
            admin_manual,
            admin_glossary,
            admin_knowledge_base,
            admin_website,
            admin_public_languages,
            public_content,
            public_languages,
            admin_editorial,
        ):
            if hasattr(module, "reset_repository_cache"):
                module.reset_repository_cache()

        from app import app

        return TestClient(app)

    def test_release_startup_and_public_reads(self, release_client: TestClient, tmp_path: Path):
        store_path = CORPUS_ROOT / "editorial" / "content-store.json"
        store_mtime_before = store_path.stat().st_mtime_ns

        manual = release_client.get("/api/content/manual", params={"locale": "en"})
        assert manual.status_code == 200, manual.text

        glossary = release_client.get("/api/content/glossary", params={"locale": "en"})
        assert glossary.status_code == 200, glossary.text

        kb = release_client.get("/api/content/knowledge-base", params={"locale": "en"})
        assert kb.status_code == 200, kb.text

        website = release_client.get("/api/content/website/home", params={"locale": "en"})
        assert website.status_code == 200, website.text

        languages = release_client.get("/api/content/public-languages")
        assert languages.status_code == 200, languages.text

        manual_image = next((CORPUS_ROOT / "manual" / "images").glob("*"))
        image_response = release_client.get(f"/api/content/manual/images/{manual_image.name}")
        assert image_response.status_code == 200, image_response.text
        assert len(image_response.content) > 1000

        website_image = next((CORPUS_ROOT / "website" / "images").glob("*"))
        website_image_response = release_client.get(
            f"/api/content/website/images/{website_image.name}"
        )
        assert website_image_response.status_code == 200, website_image_response.text

        admin_headers = {
            "X-Mock-Role": "administrator",
            "X-Mock-User-Id": "admin-a",
        }
        mutation = release_client.post(
            "/api/admin/glossary/entries",
            headers=admin_headers,
            json={"term": "Blocked term"},
        )
        assert mutation.status_code == 403, mutation.text
        assert "EDITORIAL_CONTENT_MODE=release" in mutation.json()["detail"]

        admin_list = release_client.get(
            "/api/admin/glossary/entries",
            headers=admin_headers,
            params={"locale": "en"},
        )
        assert admin_list.status_code == 200, admin_list.text

        assert store_path.stat().st_mtime_ns == store_mtime_before
        assert not (CORPUS_ROOT / "preferences").exists() or not any(
            (CORPUS_ROOT / "preferences").glob("admin-a.json")
        )
        assert not any(CORPUS_ROOT.glob("**/.hfzwood-write-check-*"))
        assert not any(CORPUS_ROOT.glob("**/*.tmp"))
        # Commercial isolation for any incidental preference/entitlement mkdir
        assert not (CORPUS_ROOT / "entitlements").joinpath("admin-a.json").exists()
