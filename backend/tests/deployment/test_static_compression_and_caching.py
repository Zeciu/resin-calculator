"""Compression and HTTP caching for the built frontend served by FastAPI."""

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.testclient import TestClient

from public.app import (
    CACHE_CONTROL_IMMUTABLE,
    CACHE_CONTROL_REVALIDATE,
    SpaStaticFiles,
    app as production_app,
    cache_control_for_static_path,
)

LARGE_JS = "console.log('hfzwood');\n" * 400  # ~9.6 KB, compressible
INDEX_HTML = "<!doctype html><html><body><div id=\"root\"></div></body></html>"


def _client(tmp_path):
    (tmp_path / "index.html").write_text(INDEX_HTML, encoding="utf-8")
    (tmp_path / "robots.txt").write_text("User-agent: *\nAllow: /\n", encoding="utf-8")
    (tmp_path / "assets").mkdir()
    # write_bytes: write_text would add \r on Windows and change the byte size.
    (tmp_path / "assets" / "index-abc123.js").write_bytes(LARGE_JS.encode("utf-8"))
    app = FastAPI()
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.mount("/", SpaStaticFiles(directory=tmp_path, html=True), name="static")
    return TestClient(app)


def test_production_app_registers_gzip_middleware():
    middleware_classes = [entry.cls for entry in production_app.user_middleware]
    assert GZipMiddleware in middleware_classes


def test_production_gzip_is_innermost_so_small_responses_stay_uncompressed():
    # user_middleware is ordered outermost first. Any BaseHTTPMiddleware inside
    # GZip would re-stream responses and defeat minimum_size.
    assert production_app.user_middleware[-1].cls is GZipMiddleware
    client = TestClient(production_app)
    response = client.get("/health", headers={"Accept-Encoding": "gzip"})
    assert response.status_code == 200
    assert "content-encoding" not in response.headers


def test_hashed_assets_are_gzip_compressed_when_accepted(tmp_path):
    client = _client(tmp_path)
    response = client.get("/assets/index-abc123.js", headers={"Accept-Encoding": "gzip"})
    assert response.status_code == 200
    assert response.headers["content-encoding"] == "gzip"
    assert int(response.headers["content-length"]) < len(LARGE_JS) // 4
    assert response.text == LARGE_JS  # client transparently decompresses
    assert "accept-encoding" in response.headers["vary"].lower()


def test_assets_are_not_compressed_without_accept_encoding(tmp_path):
    client = _client(tmp_path)
    response = client.get("/assets/index-abc123.js", headers={"Accept-Encoding": "identity"})
    assert response.status_code == 200
    assert "content-encoding" not in response.headers
    assert int(response.headers["content-length"]) == len(LARGE_JS)


def test_hashed_assets_are_cached_as_immutable(tmp_path):
    client = _client(tmp_path)
    response = client.get("/assets/index-abc123.js")
    assert response.headers["cache-control"] == CACHE_CONTROL_IMMUTABLE


def test_html_documents_and_stable_files_must_revalidate(tmp_path):
    client = _client(tmp_path)
    for path in ("/", "/about", "/login", "/robots.txt"):
        response = client.get(path)
        assert response.status_code == 200, path
        assert response.headers["cache-control"] == CACHE_CONTROL_REVALIDATE, path


def test_revalidation_returns_304_with_cache_control(tmp_path):
    client = _client(tmp_path)
    first = client.get("/about")
    second = client.get("/about", headers={"If-None-Match": first.headers["etag"]})
    assert second.status_code == 304
    assert second.headers["cache-control"] == CACHE_CONTROL_REVALIDATE


def test_missing_assets_are_not_cached(tmp_path):
    client = _client(tmp_path)
    response = client.get("/assets/missing-xyz.js")
    assert response.status_code == 404
    assert response.headers.get("cache-control") != CACHE_CONTROL_IMMUTABLE


def test_cache_policy_never_marks_html_fallback_immutable():
    assert cache_control_for_static_path("/assets/vendor-react-abc.js") == CACHE_CONTROL_IMMUTABLE
    assert cache_control_for_static_path("/assets/index-abc.css") == CACHE_CONTROL_IMMUTABLE
    assert cache_control_for_static_path("/assets/no-suffix") == CACHE_CONTROL_REVALIDATE
    assert cache_control_for_static_path("/") == CACHE_CONTROL_REVALIDATE
    assert cache_control_for_static_path("/sitemap.xml") == CACHE_CONTROL_REVALIDATE
