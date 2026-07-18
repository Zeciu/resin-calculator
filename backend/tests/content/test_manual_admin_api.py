import pytest
from fastapi.testclient import TestClient

from content.routers import admin_manual, public_content


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


def sample_body(title: str = "Chapter One", text: str = "Body text.") -> dict:
    return {
        "title": title,
        "sections": [
            {
                "id": "main",
                "title": "",
                "blocks": [{"type": "paragraph", "text": text}],
            }
        ],
    }


class TestManualAdminAuth:
    def test_non_admin_is_rejected(self, client):
        response = client.get("/api/admin/manual/chapters", headers=admin_headers("user"))
        assert response.status_code == 403


class TestManualChapterCrud:
    def test_create_list_get_delete_chapter(self, client):
        create_response = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Calibration Basics"},
            headers=admin_headers(),
        )
        assert create_response.status_code == 201
        chapter_id = create_response.json()["contentId"]
        assert chapter_id == "calibration-basics"

        list_response = client.get("/api/admin/manual/chapters", headers=admin_headers())
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1
        assert list_response.json()[0]["title"] == "Calibration Basics"

        get_response = client.get(f"/api/admin/manual/chapters/{chapter_id}", headers=admin_headers())
        assert get_response.status_code == 200

        delete_response = client.delete(
            f"/api/admin/manual/chapters/{chapter_id}",
            headers=admin_headers(),
        )
        assert delete_response.status_code == 204

        missing_response = client.get(f"/api/admin/manual/chapters/{chapter_id}", headers=admin_headers())
        assert missing_response.status_code == 404

    def test_create_defaults_to_romanian_variant(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Romanian Default"},
            headers=admin_headers(),
        ).json()["contentId"]

        en_variant = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            headers=admin_headers(),
        ).json()
        ro_variant = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            headers=admin_headers(),
        ).json()

        assert ro_variant["exists"] is True
        assert ro_variant["body"]["title"] == "Romanian Default"
        assert en_variant["exists"] is False
        assert en_variant["body"]["title"] == ""

    def test_create_in_en_populates_en_variant_and_leaves_ro_empty(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "English Chapter", "locale": "en"},
            headers=admin_headers(),
        ).json()["contentId"]

        en_variant = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            headers=admin_headers(),
        ).json()
        ro_variant = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            headers=admin_headers(),
        ).json()

        assert en_variant["exists"] is True
        assert en_variant["body"]["title"] == "English Chapter"
        assert ro_variant["exists"] is False
        assert ro_variant["body"]["title"] == ""


class TestManualVariants:
    def test_save_and_load_draft_variant(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Draft Chapter"},
            headers=admin_headers(),
        ).json()["contentId"]

        save_response = client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": sample_body("Draft Chapter", "Saved draft body.")},
            headers=admin_headers(),
        )
        assert save_response.status_code == 200
        assert save_response.json()["status"] == "draft"

        load_response = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            headers=admin_headers(),
        )
        assert load_response.status_code == 200
        assert (
            load_response.json()["body"]["sections"][0]["blocks"][0]["text"]
            == "Saved draft body."
        )

    def test_en_and_ro_variants_are_independent(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Bilingual Chapter"},
            headers=admin_headers(),
        ).json()["contentId"]

        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": sample_body("English Title", "English body.")},
            headers=admin_headers(),
        )
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            json={"body": sample_body("Titlu Romana", "Continut romana.")},
            headers=admin_headers(),
        )

        en_variant = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            headers=admin_headers(),
        ).json()
        ro_variant = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            headers=admin_headers(),
        ).json()

        assert en_variant["body"]["title"] == "English Title"
        assert ro_variant["body"]["title"] == "Titlu Romana"

    def test_ro_list_includes_chapters_without_a_ro_variant(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "English Chapter", "locale": "en"},
            headers=admin_headers(),
        ).json()["contentId"]

        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": sample_body("English Chapter", "English body.")},
            headers=admin_headers(),
        )

        en_list = client.get("/api/admin/manual/chapters?locale=en", headers=admin_headers())
        assert en_list.status_code == 200
        assert [item["contentId"] for item in en_list.json()] == [chapter_id]

        ro_list = client.get("/api/admin/manual/chapters?locale=ro", headers=admin_headers())
        assert ro_list.status_code == 200
        assert [item["contentId"] for item in ro_list.json()] == [chapter_id]
        assert ro_list.json()[0]["title"] == "English Chapter"

    def test_ro_created_chapter_also_appears_in_en_list_by_identity(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Capitol Nou", "locale": "ro"},
            headers=admin_headers(),
        ).json()["contentId"]

        ro_list = client.get("/api/admin/manual/chapters?locale=ro", headers=admin_headers())
        assert [item["contentId"] for item in ro_list.json()] == [chapter_id]
        assert ro_list.json()[0]["title"] == "Capitol Nou"

        en_list = client.get("/api/admin/manual/chapters?locale=en", headers=admin_headers())
        assert [item["contentId"] for item in en_list.json()] == [chapter_id]
        assert en_list.json()[0]["title"] == "Capitol Nou"

    def test_chapter_with_both_variants_appears_in_both_lists(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Shared Chapter", "locale": "en"},
            headers=admin_headers(),
        ).json()["contentId"]

        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            json={"body": sample_body("Capitol Comun", "Continut.")},
            headers=admin_headers(),
        )

        en_list = client.get("/api/admin/manual/chapters?locale=en", headers=admin_headers()).json()
        ro_list = client.get("/api/admin/manual/chapters?locale=ro", headers=admin_headers()).json()

        assert [item["contentId"] for item in en_list] == [chapter_id]
        assert en_list[0]["title"] == "Shared Chapter"
        assert [item["contentId"] for item in ro_list] == [chapter_id]
        assert ro_list[0]["title"] == "Capitol Comun"


class TestManualPublish:
    def test_publish_requires_non_empty_body(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Publish Chapter"},
            headers=admin_headers(),
        ).json()["contentId"]

        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": sample_body("Publish Chapter", "")},
            headers=admin_headers(),
        )

        publish_response = client.post(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert publish_response.status_code == 400

    def test_publish_writes_snapshot(self, client, tmp_path):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Published Chapter"},
            headers=admin_headers(),
        ).json()["contentId"]

        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": sample_body("Published Chapter", "Published body.")},
            headers=admin_headers(),
        )

        publish_response = client.post(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert publish_response.status_code == 200
        assert publish_response.json()["status"] == "published"

        snapshot_path = tmp_path / "published" / "manual" / "en" / "document.json"
        assert snapshot_path.exists()
        snapshot = snapshot_path.read_text(encoding="utf-8")
        assert "Published body." in snapshot

    def test_publish_en_does_not_publish_ro(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Locale Publish"},
            headers=admin_headers(),
        ).json()["contentId"]

        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": sample_body("Locale Publish", "English only.")},
            headers=admin_headers(),
        )
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            json={"body": sample_body("Locale Publish RO", "Doar romana.")},
            headers=admin_headers(),
        )

        client.post(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en/publish",
            headers=admin_headers(),
        )

        en_variant = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            headers=admin_headers(),
        ).json()
        ro_variant = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            headers=admin_headers(),
        ).json()

        assert en_variant["status"] == "published"
        assert ro_variant["status"] == "draft"


class TestManualValidation:
    def test_invalid_locale_rejected(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Locale Check"},
            headers=admin_headers(),
        ).json()["contentId"]

        response = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/xx",
            headers=admin_headers(),
        )
        assert response.status_code == 400

    def test_prepared_admin_locale_accepted(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Locale Check"},
            headers=admin_headers(),
        ).json()["contentId"]

        response = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/fr",
            headers=admin_headers(),
        )
        assert response.status_code == 200
        assert response.json()["locale"] == "fr"
        assert response.json()["exists"] is False

    def test_missing_locale_variant_returns_empty_draft(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "English Chapter", "locale": "en"},
            headers=admin_headers(),
        ).json()["contentId"]

        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": sample_body("English Chapter", "English body.")},
            headers=admin_headers(),
        )

        ro_response = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            headers=admin_headers(),
        )
        assert ro_response.status_code == 200
        payload = ro_response.json()
        assert payload["exists"] is False
        assert payload["body"]["title"] == ""
        assert payload["body"]["sections"][0]["blocks"] == []

        ro_list = client.get(
            "/api/admin/manual/chapters?locale=ro",
            headers=admin_headers(),
        ).json()
        assert [item["contentId"] for item in ro_list] == [chapter_id]
        assert ro_list[0]["title"] == "English Chapter"

    def test_empty_title_on_save_rejected(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Title Validation"},
            headers=admin_headers(),
        ).json()["contentId"]

        response = client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": sample_body("", "Body")},
            headers=admin_headers(),
        )
        assert response.status_code == 422


class TestManualBlockTypes:
    def test_image_and_video_blocks_load_in_admin_editor(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Media Chapter"},
            headers=admin_headers(),
        ).json()["contentId"]

        body = {
            "title": "Media Chapter",
            "sections": [
                {
                    "id": "main",
                    "title": "",
                    "blocks": [
                        {"type": "paragraph", "text": "Workflow intro."},
                        {
                            "type": "image",
                            "src": "/header-wood-epoxy.png",
                            "alt": "Wood and epoxy resin in a workshop setting",
                        },
                        {"type": "paragraph", "text": "Workflow outro."},
                    ],
                }
            ],
        }
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": body},
            headers=admin_headers(),
        )

        load_response = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            headers=admin_headers(),
        )
        assert load_response.status_code == 200
        blocks = load_response.json()["body"]["sections"][0]["blocks"]
        assert blocks[1]["type"] == "image"
        assert blocks[1]["src"] == "/header-wood-epoxy.png"

    def test_image_and_video_blocks_can_be_saved_unchanged(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Calibration Chapter"},
            headers=admin_headers(),
        ).json()["contentId"]

        body = {
            "title": "Calibration Chapter",
            "sections": [
                {
                    "id": "main",
                    "title": "",
                    "blocks": [
                        {"type": "paragraph", "text": "Calibration intro."},
                        {
                            "type": "video",
                            "title": "Calibration walkthrough",
                            "embedUrl": "https://www.youtube.com/embed/EngW7tLk6R8",
                        },
                    ],
                }
            ],
        }
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": body},
            headers=admin_headers(),
        )

        load_response = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            headers=admin_headers(),
        ).json()

        save_response = client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": load_response["body"]},
            headers=admin_headers(),
        )
        assert save_response.status_code == 200
        assert save_response.json()["body"]["sections"][0]["blocks"][1]["type"] == "video"

    def test_callout_blocks_can_be_saved_and_loaded(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Callout Chapter"},
            headers=admin_headers(),
        ).json()["contentId"]

        body = {
            "title": "Callout Chapter",
            "sections": [
                {
                    "id": "main",
                    "title": "",
                    "blocks": [
                        {
                            "type": "callout",
                            "variant": "warning",
                            "blocks": [{"type": "paragraph", "text": "Check the calibration line."}],
                        }
                    ],
                }
            ],
        }
        save_response = client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": body},
            headers=admin_headers(),
        )
        assert save_response.status_code == 200

        load_response = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            headers=admin_headers(),
        )
        assert load_response.status_code == 200
        block = load_response.json()["body"]["sections"][0]["blocks"][0]
        assert block["type"] == "callout"
        assert block["variant"] == "warning"
        assert block["blocks"][0]["text"] == "Check the calibration line."


PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


class TestManualImageUpload:
    def test_upload_and_serve_manual_image(self, client):
        response = client.post(
            "/api/admin/manual/chapters/images",
            files={"file": ("photo.png", PNG_1X1, "image/png")},
            headers=admin_headers(),
        )
        assert response.status_code == 201
        image_url = response.json()["url"]
        assert image_url.startswith("/api/content/manual/images/")

        image_response = client.get(image_url)
        assert image_response.status_code == 200
        assert image_response.content == PNG_1X1

    def test_uploaded_image_survives_save_publish_and_public_manual(self, client):
        upload_response = client.post(
            "/api/admin/manual/chapters/images",
            files={"file": ("diagram.png", PNG_1X1, "image/png")},
            headers=admin_headers(),
        )
        image_url = upload_response.json()["url"]

        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Illustrated Chapter"},
            headers=admin_headers(),
        ).json()["contentId"]

        body = {
            "title": "Illustrated Chapter",
            "sections": [
                {
                    "id": "main",
                    "title": "",
                    "blocks": [
                        {"type": "paragraph", "text": "See the diagram."},
                        {
                            "type": "image",
                            "src": image_url,
                            "alt": "Workshop diagram",
                        },
                    ],
                }
            ],
        }
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": body},
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en/publish",
            headers=admin_headers(),
        )

        manual_response = client.get("/api/content/manual?locale=en")
        blocks = manual_response.json()["sections"][0]["blocks"]
        assert blocks[1]["type"] == "image"
        assert blocks[1]["src"] == image_url

        image_response = client.get(image_url)
        assert image_response.status_code == 200
