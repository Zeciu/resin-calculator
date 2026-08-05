"""Docker packaging tests for the public-only production image."""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
DOCKERFILE = REPO_ROOT / "Dockerfile"
DOCKERIGNORE = REPO_ROOT / ".dockerignore"
PUBLIC_CORPUS = REPO_ROOT / "backend" / "public" / "content"


def test_public_corpus_is_packaged_with_the_public_backend() -> None:
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    assert "COPY backend/public ./public" in dockerfile
    assert (PUBLIC_CORPUS / "published" / "manual" / "en" / "document.json").is_file()
    assert (PUBLIC_CORPUS / "published" / "glossary" / "en" / "entries.json").is_file()
    assert (PUBLIC_CORPUS / "published" / "knowledge-base" / "en" / "entries.json").is_file()
    assert (PUBLIC_CORPUS / "published" / "website" / "en" / "pages.json").is_file()


def test_dockerfile_does_not_package_editorial_release_data_or_seed_builds() -> None:
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    assert "backend/data" not in dockerfile
    assert "editorial-seed-build" not in dockerfile
    assert "/app/content" not in dockerfile


def test_dockerignore_excludes_local_editorial_data() -> None:
    dockerignore = DOCKERIGNORE.read_text(encoding="utf-8")
    assert "backend/data/" in dockerignore
    assert "backend/private/" in dockerignore
    assert "frontend/private/" in dockerignore
