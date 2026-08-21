from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from public.app import SpaStaticFiles
from public.spa_document_indexing import (
    PUBLIC_SPA_DOCUMENT_PATHS,
    X_ROBOTS_TAG_HEADER,
    X_ROBOTS_TAG_NOINDEX,
    apply_spa_document_robots_header,
    is_public_spa_document_path,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
FRONTEND_METADATA = REPO_ROOT / "frontend" / "public" / "src" / "website" / "documentMetadata.js"
FRONTEND_ROUTES = REPO_ROOT / "frontend" / "public" / "src" / "workspace" / "routes.js"

PUBLIC_DOCUMENT_PATHS = (
    "/",
    "/about",
    "/pricing",
    "/privacy",
    "/terms",
    "/contact",
)
NOINDEX_DOCUMENT_PATHS = (
    "/login",
    "/register",
    "/password-recovery",
    "/callback",
    "/account",
    "/account/preferences",
    "/new-project",
    "/projects",
    "/manual",
    "/glossary",
    "/knowledge-base",
    "/admin",
    "/admin/website",
    "/this-route-does-not-exist",
)


def _spa_client(tmp_path):
    (tmp_path / "index.html").write_text("<html>HFZWood</html>", encoding="utf-8")
    (tmp_path / "hefzech-logo.png").write_bytes(b"png")
    (tmp_path / "robots.txt").write_text("User-agent: *\nAllow: /\n", encoding="utf-8")
    (tmp_path / "sitemap.xml").write_text("<urlset></urlset>", encoding="utf-8")
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text("console.log(1)", encoding="utf-8")
    app = FastAPI()

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/api/me")
    def me():
        return {"id": "user"}

    @app.get("/callback", include_in_schema=False)
    def spa_callback():
        from fastapi.responses import FileResponse

        return apply_spa_document_robots_header(
            FileResponse(tmp_path / "index.html"), "/callback"
        )

    app.mount("/", SpaStaticFiles(directory=tmp_path, html=True), name="static")
    return TestClient(app)


def _robots_tag(response):
    return response.headers.get(X_ROBOTS_TAG_HEADER)


def test_spa_static_files_fall_back_to_index_for_client_routes(tmp_path):
    client = _spa_client(tmp_path)
    assert client.get("/login").text == "<html>HFZWood</html>"
    assert client.get("/about").status_code == 200
    assert client.get("/assets/missing.js").status_code == 404
    assert client.get("/api/unknown").status_code == 404


def test_public_spa_documents_do_not_send_noindex_header(tmp_path):
    client = _spa_client(tmp_path)
    for path in PUBLIC_DOCUMENT_PATHS:
        response = client.get(path)
        assert response.status_code == 200, path
        assert response.text == "<html>HFZWood</html>", path
        assert _robots_tag(response) != X_ROBOTS_TAG_NOINDEX, path
        assert X_ROBOTS_TAG_HEADER not in {key.lower() for key in response.headers}, path


def test_non_public_spa_documents_send_noindex_header(tmp_path):
    client = _spa_client(tmp_path)
    for path in NOINDEX_DOCUMENT_PATHS:
        response = client.get(path)
        assert response.status_code == 200, path
        assert response.text == "<html>HFZWood</html>", path
        assert _robots_tag(response) == X_ROBOTS_TAG_NOINDEX, path


def test_static_assets_and_api_do_not_receive_document_noindex(tmp_path):
    client = _spa_client(tmp_path)
    logo = client.get("/hefzech-logo.png")
    assert logo.status_code == 200
    assert _robots_tag(logo) is None

    robots = client.get("/robots.txt")
    assert robots.status_code == 200
    assert _robots_tag(robots) is None

    sitemap = client.get("/sitemap.xml")
    assert sitemap.status_code == 200
    assert _robots_tag(sitemap) is None

    script = client.get("/assets/app.js")
    assert script.status_code == 200
    assert _robots_tag(script) is None

    missing_asset = client.get("/assets/missing.js")
    assert missing_asset.status_code == 404
    assert _robots_tag(missing_asset) is None

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert _robots_tag(health) is None

    api = client.get("/api/me")
    assert api.status_code == 200
    assert api.json() == {"id": "user"}
    assert _robots_tag(api) is None

    unknown_api = client.get("/api/unknown")
    assert unknown_api.status_code == 404
    assert _robots_tag(unknown_api) is None


def test_callback_document_is_noindex(tmp_path):
    client = _spa_client(tmp_path)
    response = client.get("/callback")
    assert response.status_code == 200
    assert response.text == "<html>HFZWood</html>"
    assert _robots_tag(response) == X_ROBOTS_TAG_NOINDEX


def test_public_spa_allowlist_matches_frontend_indexable_routes():
    assert PUBLIC_SPA_DOCUMENT_PATHS == frozenset(PUBLIC_DOCUMENT_PATHS)
    for path in PUBLIC_DOCUMENT_PATHS:
        assert is_public_spa_document_path(path) is True
    assert is_public_spa_document_path("/login") is False
    assert is_public_spa_document_path("/account/preferences") is False

    routes_source = FRONTEND_ROUTES.read_text(encoding="utf-8")
    metadata_source = FRONTEND_METADATA.read_text(encoding="utf-8")
    route_values = {}
    for name in ("HOME", "ABOUT", "PRICING", "PRIVACY", "TERMS", "CONTACT"):
        marker = f'{name}: "'
        start = routes_source.index(marker) + len(marker)
        end = routes_source.index('"', start)
        route_values[name] = routes_source[start:end]
        assert f"[ROUTES.{name}]" in metadata_source

    assert frozenset(route_values.values()) == PUBLIC_SPA_DOCUMENT_PATHS
