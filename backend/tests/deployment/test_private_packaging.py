"""Production packaging must exclude local-only editorial implementation."""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
DOCKERFILE = REPO_ROOT / "Dockerfile"
DOCKERIGNORE = REPO_ROOT / ".dockerignore"
PUBLIC_ROUTER = REPO_ROOT / "frontend" / "public" / "src" / "workspace" / "WorkspaceRouter.jsx"


def test_private_source_and_editorial_data_have_explicit_docker_exclusions() -> None:
    dockerignore = DOCKERIGNORE.read_text(encoding="utf-8")
    assert "frontend/private/" in dockerignore
    assert "backend/private/" in dockerignore


def test_editorial_content_lives_under_private_and_is_excluded_from_the_image() -> None:
    """Editorial content is the private source of truth; only the published copy ships."""
    assert (REPO_ROOT / "backend" / "private" / "content" / "editorial" / "content-store.json").is_file()
    assert not (REPO_ROOT / "backend" / "data").exists()
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    assert "backend/private/content" not in dockerfile


def test_public_corpus_is_packaged_with_the_public_backend() -> None:
    assert (REPO_ROOT / "backend" / "public" / "content" / "published" / "manual" / "en" / "document.json").is_file()
    assert (REPO_ROOT / "backend" / "public" / "content" / "published" / "glossary" / "en" / "entries.json").is_file()
    assert (REPO_ROOT / "backend" / "public" / "content" / "published" / "knowledge-base" / "en" / "entries.json").is_file()
    assert (REPO_ROOT / "backend" / "public" / "content" / "published" / "website" / "en" / "pages.json").is_file()


def test_docker_build_allowlists_only_the_public_backend_runtime() -> None:
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    assert "COPY frontend/public ./public" in dockerfile
    assert "COPY backend/public ./public" in dockerfile
    assert "COPY frontend/ ./" not in dockerfile
    assert "COPY backend/content" not in dockerfile
    assert "COPY backend/data" not in dockerfile
    assert "editorial-seed-build" not in dockerfile
    assert "COPY frontend/private" not in dockerfile
    assert "COPY backend/private" not in dockerfile


def test_public_backend_has_no_static_import_of_private_modules() -> None:
    """Production must be importable without backend/private on disk."""
    offenders = []
    for path in sorted((REPO_ROOT / "backend" / "public").rglob("*.py")):
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            stripped = line.strip()
            if not stripped.startswith(("import private", "from private")):
                continue
            # public.app mounts editorial routes only via a guarded local import.
            if path.name == "app.py" and line.startswith("        "):
                continue
            offenders.append(f"{path.relative_to(REPO_ROOT)}:{number}: {stripped}")
    assert offenders == []


def test_public_router_has_no_direct_private_source_import() -> None:
    source = PUBLIC_ROUTER.read_text(encoding="utf-8")
    assert 'from "@private-editorial-routes"' in source
    assert "../admin/" not in source
    assert "../editorial/" not in source


def test_private_route_access_has_no_special_authorization() -> None:
    access = (REPO_ROOT / "backend" / "private" / "access.py").read_text(encoding="utf-8")
    assert "HFZWOOD_LOCAL_EDITORIAL" not in access
    assert "HTTPException" not in access
    assert "role or entitlement requirement" in access
    assert "return None" in access


def test_private_boundaries_document_local_only_policy() -> None:
    assert (REPO_ROOT / "frontend" / "private" / "README.md").is_file()
    assert (REPO_ROOT / "backend" / "private" / "README.md").is_file()
