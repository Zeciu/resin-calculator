"""Production packaging must exclude the local-only authoring boundary."""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
DOCKERFILE = REPO_ROOT / "Dockerfile"
DOCKERIGNORE = REPO_ROOT / ".dockerignore"
PUBLIC_ROUTER = REPO_ROOT / "frontend" / "public" / "src" / "workspace" / "WorkspaceRouter.jsx"


def test_private_source_has_explicit_docker_exclusions() -> None:
    dockerignore = DOCKERIGNORE.read_text(encoding="utf-8")
    assert "frontend/private/" in dockerignore
    assert "backend/private/" in dockerignore


def test_docker_build_allowlists_public_frontend_source() -> None:
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    assert "COPY frontend/public ./public" in dockerfile
    assert "COPY frontend/ ./" not in dockerfile
    assert "COPY frontend/private" not in dockerfile
    assert "COPY backend/private" not in dockerfile


def test_public_router_has_no_direct_private_source_import() -> None:
    source = PUBLIC_ROUTER.read_text(encoding="utf-8")
    assert 'from "@private-editorial-routes"' in source
    assert "../admin/" not in source
    assert "../editorial/" not in source


def test_private_boundaries_document_local_only_policy() -> None:
    assert (REPO_ROOT / "frontend" / "private" / "README.md").is_file()
    assert (REPO_ROOT / "backend" / "private" / "README.md").is_file()
