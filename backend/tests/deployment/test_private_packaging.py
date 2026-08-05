"""Production packaging must exclude local-only editorial implementation."""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
DOCKERFILE = REPO_ROOT / "Dockerfile"
DOCKERIGNORE = REPO_ROOT / ".dockerignore"
PUBLIC_ROUTER = REPO_ROOT / "frontend" / "public" / "src" / "workspace" / "WorkspaceRouter.jsx"

REQUIRED_SHARED_RUNTIME_COPIES = (
    "COPY backend/content/__init__.py ./content/__init__.py",
    "COPY backend/content/repositories/__init__.py ./content/repositories/__init__.py",
    "COPY backend/content/repositories/entitlements.py ./content/repositories/entitlements.py",
    "COPY backend/content/routers/__init__.py ./content/routers/__init__.py",
    "COPY backend/content/routers/billing.py ./content/routers/billing.py",
    "COPY backend/content/routers/me.py ./content/routers/me.py",
)


def test_private_source_and_editorial_data_have_explicit_docker_exclusions() -> None:
    dockerignore = DOCKERIGNORE.read_text(encoding="utf-8")
    assert "frontend/private/" in dockerignore
    assert "backend/private/" in dockerignore
    assert "backend/data/" in dockerignore


def test_docker_build_allowlists_only_public_and_commercial_backend_runtime() -> None:
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    assert "COPY frontend/public ./public" in dockerfile
    assert "COPY backend/public ./public" in dockerfile
    assert "COPY frontend/ ./" not in dockerfile
    assert "COPY backend/content ./content" not in dockerfile
    assert "COPY backend/data" not in dockerfile
    assert "editorial-seed-build" not in dockerfile
    assert "COPY frontend/private" not in dockerfile
    assert "COPY backend/private" not in dockerfile
    for line in REQUIRED_SHARED_RUNTIME_COPIES:
        assert line in dockerfile


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
