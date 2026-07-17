import pytest
from fastapi.testclient import TestClient

from content.routers import admin_manual, public_content

PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_manual.reset_repository_cache()
    public_content.reset_repository_cache()
    from app import app

    return TestClient(app)


def admin_headers(role: str = "administrator") -> dict[str, str]:
    return {
        "X-Mock-Role": role,
        "X-Mock-User-Id": "admin-user",
    }


class TestEditorialImageValidation:
    def test_invalid_mime_type_rejected(self, client):
        response = client.post(
            "/api/admin/manual/chapters/images",
            files={"file": ("photo.txt", b"plain-text", "text/plain")},
            headers=admin_headers(),
        )
        assert response.status_code == 400

    def test_empty_upload_rejected(self, client):
        response = client.post(
            "/api/admin/manual/chapters/images",
            files={"file": ("photo.png", b"", "image/png")},
            headers=admin_headers(),
        )
        assert response.status_code == 400

    def test_oversized_upload_rejected(self, client):
        oversized = b"x" * (5 * 1024 * 1024 + 1)
        response = client.post(
            "/api/admin/manual/chapters/images",
            files={"file": ("photo.png", oversized, "image/png")},
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "too large" in response.json()["detail"].lower()

    def test_malformed_public_image_filename_returns_404(self, client):
        response = client.get("/api/content/manual/images/not-a-valid-name.png")
        assert response.status_code == 404

    def test_path_traversal_public_image_filename_returns_404(self, client):
        response = client.get("/api/content/manual/images/..%2F..%2Fetc%2Fpasswd")
        assert response.status_code == 404

    def test_valid_upload_still_works(self, client):
        response = client.post(
            "/api/admin/manual/chapters/images",
            files={"file": ("photo.png", PNG_1X1, "image/png")},
            headers=admin_headers(),
        )
        assert response.status_code == 201
