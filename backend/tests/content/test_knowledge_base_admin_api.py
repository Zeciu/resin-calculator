import pytest
import json

from private.routers import admin_knowledge_base, admin_public_languages, public_content, public_languages
from tests.support.authenticated_client import AuthenticatedTestClient
from tests.support.in_memory_entitlements_repository import InMemoryEntitlementsRepository


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    (config_dir / "free-preview.json").write_text(
        json.dumps(
            {
                "knowledgeBaseEntryIds": [f"free-article-{index}" for index in range(5)],
                "glossaryEntryIds": [
                    "preview-glossary-one",
                    "preview-glossary-two",
                    "preview-glossary-three",
                    "preview-glossary-four",
                    "preview-glossary-five",
                ],
            }
        ),
        encoding="utf-8",
    )
    admin_knowledge_base.reset_repository_cache()
    public_content.reset_repository_cache()
    admin_public_languages.reset_repository_cache()
    public_languages.reset_repository_cache()
    from app import app
    from public.content_routers import get_capability_resolver
    from public.product.capabilities.resolver import CapabilityResolver

    entitlements = InMemoryEntitlementsRepository()
    entitlements.save_access_tier("test-user", "subscriber")
    app.dependency_overrides[get_capability_resolver] = lambda: CapabilityResolver(entitlements)
    test_client = AuthenticatedTestClient(app)
    try:
        yield test_client
    finally:
        test_client.close()
        app.dependency_overrides.pop(get_capability_resolver, None)
        admin_knowledge_base.reset_repository_cache()
        public_content.reset_repository_cache()
        admin_public_languages.reset_repository_cache()
        public_languages.reset_repository_cache()


def admin_headers(role: str = "administrator") -> dict[str, str]:
    return {
        "X-Mock-Role": role,
        "X-Mock-User-Id": "admin-user",
    }


def sample_body(
    title: str = "Bubbles after curing",
    summary: str = "Small voids remain visible after cure.",
    solution: str = "Seal porous wood before the main pour.",
) -> dict:
    return {
        "title": title,
        "problemSummary": summary,
        "symptoms": ["Tiny pits across the surface"],
        "possibleCauses": ["Air introduced during mixing"],
        "solution": [solution],
        "prevention": [],
        "tips": [],
        "warnings": [],
        "searchKeywords": [],
        "estimatedRepairTime": None,
        "requiredTools": [],
        "requiredMaterials": [],
        "bodyBlocks": [],
        "media": [],
        "relatedKbEntryIds": [],
        "relatedGlossaryEntryIds": [],
        "relatedManualChapterIds": [],
    }


def save_payload(body: dict, category: str = "Epoxy", difficulty: str = "Beginner") -> dict:
    return {"category": category, "difficulty": difficulty, "body": body}


class TestKnowledgeBaseEntryCrud:
    def test_create_list_get_delete_entry(self, client):
        create_response = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Cloudy epoxy", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        )
        assert create_response.status_code == 201
        entry_id = create_response.json()["contentId"]
        assert entry_id == "cloudy-epoxy"
        assert create_response.json()["category"] == "Epoxy"

        list_response = client.get("/api/admin/knowledge-base/entries", headers=admin_headers())
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1
        assert list_response.json()[0]["title"] == "Cloudy epoxy"

        get_response = client.get(
            f"/api/admin/knowledge-base/entries/{entry_id}",
            headers=admin_headers(),
        )
        assert get_response.status_code == 200

        delete_response = client.delete(
            f"/api/admin/knowledge-base/entries/{entry_id}",
            headers=admin_headers(),
        )
        assert delete_response.status_code == 204

    def test_list_title_follows_active_locale_with_identity_fallback(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Articol RO", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]

        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(sample_body("EN Article")),
            headers=admin_headers(),
        )
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/fr",
            json=save_payload(sample_body("Article FR")),
            headers=admin_headers(),
        )

        ro_list = client.get(
            "/api/admin/knowledge-base/entries?locale=ro",
            headers=admin_headers(),
        ).json()
        en_list = client.get(
            "/api/admin/knowledge-base/entries?locale=en",
            headers=admin_headers(),
        ).json()
        fr_list = client.get(
            "/api/admin/knowledge-base/entries?locale=fr",
            headers=admin_headers(),
        ).json()
        de_list = client.get(
            "/api/admin/knowledge-base/entries?locale=de",
            headers=admin_headers(),
        ).json()

        assert [item["contentId"] for item in ro_list] == [entry_id]
        assert ro_list[0]["title"] == "Articol RO"
        assert en_list[0]["title"] == "EN Article"
        assert fr_list[0]["title"] == "Article FR"
        # Missing DE translation falls back to identity (first non-empty, Romanian).
        assert de_list[0]["contentId"] == entry_id
        assert de_list[0]["title"] == "Articol RO"


class TestKnowledgeBaseVariants:
    def test_create_defaults_to_romanian_variant(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Articol Nou", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]

        ro_variant = client.get(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/ro",
            headers=admin_headers(),
        ).json()
        en_variant = client.get(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            headers=admin_headers(),
        ).json()

        assert ro_variant["exists"] is True
        assert ro_variant["body"]["title"] == "Articol Nou"
        assert en_variant["exists"] is False

    def test_save_and_load_draft_variant(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Mold leakage", "category": "Wood", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]

        save_response = client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(sample_body("Mold leakage"), category="Wood"),
            headers=admin_headers(),
        )
        assert save_response.status_code == 200
        assert save_response.json()["status"] == "draft"
        assert save_response.json()["category"] == "Wood"

    def test_rejects_invalid_category_on_save(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Test entry", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]

        response = client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json={
                "category": "Invalid",
                "difficulty": "Beginner",
                "body": sample_body(),
            },
            headers=admin_headers(),
        )
        assert response.status_code == 422


class TestKnowledgeBasePublish:
    def test_publish_makes_entry_available_publicly(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Sticky resin", "category": "Epoxy", "difficulty": "Intermediate"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(sample_body("Sticky resin")),
            headers=admin_headers(),
        )
        publish_response = client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert publish_response.status_code == 200

        public_response = client.get("/api/content/knowledge-base?locale=en")
        assert public_response.status_code == 200
        payload = public_response.json()
        assert payload["available"] is True
        assert any(entry["title"] == "Sticky resin" for entry in payload["entries"])

    def test_publish_requires_problem_summary_and_solution(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Incomplete article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(
                {
                    **sample_body("Incomplete article"),
                    "problemSummary": "",
                    "solution": [],
                }
            ),
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 400


class TestKnowledgeBaseBulkPublishDrafts:
    def _create_draft(self, client, title: str, locale: str = "en"):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": title, "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        response = client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/{locale}",
            json=save_payload(sample_body(title)),
            headers=admin_headers(),
        )
        assert response.status_code == 200
        return entry_id

    def test_bulk_publish_drafts(self, client):
        first_id = self._create_draft(client, "KB Draft A")
        second_id = self._create_draft(client, "KB Draft B")
        response = client.post(
            "/api/admin/knowledge-base/entries/variants/en/publish-drafts",
            headers=admin_headers(),
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["locale"] == "en"
        published_ids = {item["contentId"] for item in payload["published"]}
        assert first_id in published_ids
        assert second_id in published_ids
        assert payload["snapshotKey"]

        public_response = client.get("/api/content/knowledge-base?locale=en")
        assert public_response.status_code == 200
        public_ids = {entry["id"] for entry in public_response.json()["entries"]}
        assert first_id in public_ids
        assert second_id in public_ids

    def test_bulk_publish_reports_unpublished_reference_failures(self, client):
        related_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Draft related", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        # Leave related unpublished and unpublishable so the referencing article fails validation.
        client.put(
            f"/api/admin/knowledge-base/entries/{related_id}/variants/en",
            json=save_payload(
                {
                    **sample_body("Draft related"),
                    "problemSummary": "",
                    "solution": [],
                }
            ),
            headers=admin_headers(),
        )

        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Main article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        body = sample_body("Main article")
        body["relatedKbEntryIds"] = [related_id]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(body),
            headers=admin_headers(),
        )
        good_id = self._create_draft(client, "Valid article")

        response = client.post(
            "/api/admin/knowledge-base/entries/variants/en/publish-drafts",
            headers=admin_headers(),
        )
        assert response.status_code == 200
        payload = response.json()
        failed_ids = {item["contentId"] for item in payload["failed"]}
        published_ids = {item["contentId"] for item in payload["published"]}
        assert entry_id in failed_ids
        assert related_id in failed_ids
        assert good_id in published_ids
        assert any(
            item["contentId"] == entry_id and "published" in (item["reason"] or "").lower()
            for item in payload["failed"]
        )
    def test_bulk_publish_skips_unchanged_live_entries(self, client):
        live_id = self._create_draft(client, "Already live")
        assert (
            client.post(
                f"/api/admin/knowledge-base/entries/{live_id}/variants/en/publish",
                headers=admin_headers(),
            ).status_code
            == 200
        )
        draft_id = self._create_draft(client, "Fresh draft")
        response = client.post(
            "/api/admin/knowledge-base/entries/variants/en/publish-drafts",
            headers=admin_headers(),
        )
        assert response.status_code == 200
        payload = response.json()
        assert draft_id in {item["contentId"] for item in payload["published"]}
        assert live_id in {item["contentId"] for item in payload["skipped"]}

    def _create_entry(self, client, title: str) -> str:
        return client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": title, "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]

    def _save_en_draft(self, client, entry_id: str, title: str, related: list[str] | None = None) -> None:
        body = sample_body(title)
        if related:
            body["relatedKbEntryIds"] = related
        assert (
            client.put(
                f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
                json=save_payload(body),
                headers=admin_headers(),
            ).status_code
            == 200
        )

    def _publish_all_en(self, client):
        response = client.post(
            "/api/admin/knowledge-base/entries/variants/en/publish-drafts",
            headers=admin_headers(),
        )
        assert response.status_code == 200
        return response.json()

    def test_bulk_publish_allows_mutual_draft_references(self, client):
        first_id = self._create_entry(client, "Article A")
        second_id = self._create_entry(client, "Article B")
        self._save_en_draft(client, first_id, "Article A", [second_id])
        self._save_en_draft(client, second_id, "Article B", [first_id])

        payload = self._publish_all_en(client)
        assert payload["failedCount"] == 0
        assert payload["publishedCount"] == 2
        published_ids = {item["contentId"] for item in payload["published"]}
        assert published_ids == {first_id, second_id}

        public_ids = {
            entry["id"]
            for entry in client.get("/api/content/knowledge-base?locale=en").json()["entries"]
        }
        assert public_ids == {first_id, second_id}

    def test_bulk_publish_chain_ignores_list_order(self, client):
        first_id = self._create_entry(client, "Article A")
        second_id = self._create_entry(client, "Article B")
        third_id = self._create_entry(client, "Article C")
        self._save_en_draft(client, first_id, "Article A", [second_id])
        self._save_en_draft(client, second_id, "Article B", [third_id])
        self._save_en_draft(client, third_id, "Article C")

        payload = self._publish_all_en(client)
        assert payload["failedCount"] == 0
        assert {item["contentId"] for item in payload["published"]} == {first_id, second_id, third_id}

    def test_bulk_publish_circular_references(self, client):
        first_id = self._create_entry(client, "Article A")
        second_id = self._create_entry(client, "Article B")
        third_id = self._create_entry(client, "Article C")
        self._save_en_draft(client, first_id, "Article A", [second_id])
        self._save_en_draft(client, second_id, "Article B", [third_id])
        self._save_en_draft(client, third_id, "Article C", [first_id])

        payload = self._publish_all_en(client)
        assert payload["failedCount"] == 0
        assert payload["publishedCount"] == 3

    def test_bulk_publish_accepts_already_published_related_article(self, client):
        live_id = self._create_draft(client, "Already live")
        assert (
            client.post(
                f"/api/admin/knowledge-base/entries/{live_id}/variants/en/publish",
                headers=admin_headers(),
            ).status_code
            == 200
        )
        draft_id = self._create_entry(client, "Depends on live")
        self._save_en_draft(client, draft_id, "Depends on live", [live_id])

        payload = self._publish_all_en(client)
        assert draft_id in {item["contentId"] for item in payload["published"]}
        assert live_id in {item["contentId"] for item in payload["skipped"]}
        assert payload["failedCount"] == 0

    def test_bulk_publish_rejects_missing_related_article_without_blocking_unrelated(self, client):
        good_id = self._create_draft(client, "Independent")
        blocked_id = self._create_entry(client, "Blocked")
        self._save_en_draft(client, blocked_id, "Blocked", ["does-not-exist"])

        payload = self._publish_all_en(client)
        failed_ids = {item["contentId"] for item in payload["failed"]}
        published_ids = {item["contentId"] for item in payload["published"]}
        assert blocked_id in failed_ids
        assert good_id in published_ids
        assert any("does not exist" in (item["reason"] or "").lower() for item in payload["failed"])

    def test_bulk_publish_does_not_mutate_when_every_draft_fails(self, client):
        blocked_id = self._create_entry(client, "Blocked")
        self._save_en_draft(client, blocked_id, "Blocked", ["does-not-exist"])

        before = client.get("/api/content/knowledge-base?locale=en").json()
        payload = self._publish_all_en(client)
        after = client.get("/api/content/knowledge-base?locale=en").json()

        assert payload["publishedCount"] == 0
        assert payload["failedCount"] == 1
        assert payload["snapshotKey"] == ""
        assert after["entries"] == before["entries"]
        variant = client.get(
            f"/api/admin/knowledge-base/entries/{blocked_id}/variants/en",
            headers=admin_headers(),
        ).json()
        assert variant["status"] != "published"

    def test_bulk_publish_leaves_drafts_unpublished_until_success(self, client):
        entry_id = self._create_draft(client, "Later")
        public_before = client.get("/api/content/knowledge-base?locale=en").json()
        assert public_before["available"] is False
        payload = self._publish_all_en(client)
        assert payload["publishedCount"] == 1
        public_after = client.get("/api/content/knowledge-base?locale=en").json()
        assert public_after["available"] is True
        assert public_after["entries"][0]["id"] == entry_id

    def test_bulk_publish_keeps_glossary_and_manual_rules(self, client):
        glossary_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Unpublished term"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/glossary/entries/{glossary_id}/variants/en",
            json={
                "body": {
                    "term": "Unpublished term",
                    "definitionBlocks": [{"type": "paragraph", "text": "Definition."}],
                    "media": [],
                    "relatedTermIds": [],
                    "synonymTermIds": [],
                    "seeAlso": [],
                }
            },
            headers=admin_headers(),
        )
        blocked_id = self._create_entry(client, "Needs glossary")
        body = sample_body("Needs glossary")
        body["relatedGlossaryEntryIds"] = [glossary_id]
        assert (
            client.put(
                f"/api/admin/knowledge-base/entries/{blocked_id}/variants/en",
                json=save_payload(body),
                headers=admin_headers(),
            ).status_code
            == 200
        )
        good_id = self._create_draft(client, "No glossary link")

        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Unpublished chapter"},
            headers=admin_headers(),
        ).json()["contentId"]
        assert (
            client.put(
                f"/api/admin/manual/chapters/{chapter_id}/variants/en",
                json={
                    "body": {
                        "title": "Unpublished chapter",
                        "sections": [
                            {
                                "id": "main",
                                "title": "",
                                "blocks": [{"type": "paragraph", "text": "Draft only."}],
                            }
                        ],
                    }
                },
                headers=admin_headers(),
            ).status_code
            == 200
        )
        blocked_manual_id = self._create_entry(client, "Needs manual")
        manual_body = sample_body("Needs manual")
        manual_body["relatedManualChapterIds"] = [chapter_id]
        assert (
            client.put(
                f"/api/admin/knowledge-base/entries/{blocked_manual_id}/variants/en",
                json=save_payload(manual_body),
                headers=admin_headers(),
            ).status_code
            == 200
        )

        payload = self._publish_all_en(client)
        failed_ids = {item["contentId"] for item in payload["failed"]}
        published_ids = {item["contentId"] for item in payload["published"]}
        assert blocked_id in failed_ids
        assert blocked_manual_id in failed_ids
        assert good_id in published_ids
        assert any("glossary" in (item["reason"] or "").lower() for item in payload["failed"])
        assert any("manual" in (item["reason"] or "").lower() for item in payload["failed"])

    def test_bulk_publish_does_not_change_romanian_snapshot(self, client):
        assert (
            client.post(
                "/api/admin/public-languages/ro/activate",
                headers=admin_headers(),
            ).status_code
            == 200
        )
        ro_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Articol RO", "locale": "ro", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        assert (
            client.put(
                f"/api/admin/knowledge-base/entries/{ro_id}/variants/ro",
                json=save_payload(sample_body("Articol RO")),
                headers=admin_headers(),
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/api/admin/knowledge-base/entries/{ro_id}/variants/ro/publish",
                headers=admin_headers(),
            ).status_code
            == 200
        )
        romanian_before_response = client.get("/api/content/knowledge-base?locale=ro")
        assert romanian_before_response.status_code == 200, romanian_before_response.json()
        romanian_before = romanian_before_response.json()
        en_id = self._create_draft(client, "English only")

        payload = self._publish_all_en(client)
        assert en_id in {item["contentId"] for item in payload["published"]}
        romanian_after_response = client.get("/api/content/knowledge-base?locale=ro")
        assert romanian_after_response.status_code == 200, romanian_after_response.json()
        romanian_after = romanian_after_response.json()
        assert romanian_after["entries"] == romanian_before["entries"]
        english = client.get("/api/content/knowledge-base?locale=en").json()
        assert {entry["id"] for entry in english["entries"]} == {en_id}


class TestKnowledgeBaseRelationshipValidation:
    def _create_and_publish(self, client, title: str) -> str:
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": title, "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(sample_body(title)),
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        return entry_id

    def test_rejects_self_reference(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Self reference", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        body = sample_body("Self reference")
        body["relatedKbEntryIds"] = [entry_id]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(body),
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "itself" in response.json()["detail"].lower()

    def test_rejects_unpublished_related_kb_article(self, client):
        related_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Draft related", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{related_id}/variants/en",
            json=save_payload(sample_body("Draft related")),
            headers=admin_headers(),
        )

        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Main article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        body = sample_body("Main article")
        body["relatedKbEntryIds"] = [related_id]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(body),
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "published" in response.json()["detail"].lower()


class TestKnowledgeBaseUnpublishAndDelete:
    def test_unpublish_removes_entry_from_public_snapshot(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Temporary article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(sample_body("Temporary article")),
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/unpublish",
            headers=admin_headers(),
        )
        public_entries = client.get("/api/content/knowledge-base?locale=en").json()["entries"]
        assert all(item["id"] != entry_id for item in public_entries)

    def test_delete_rebuilds_snapshot_without_removed_entry(self, client):
        keep_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Keep article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{keep_id}/variants/en",
            json=save_payload(sample_body("Keep article")),
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/knowledge-base/entries/{keep_id}/variants/en/publish",
            headers=admin_headers(),
        )

        remove_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Remove article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{remove_id}/variants/en",
            json=save_payload(sample_body("Remove article")),
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/knowledge-base/entries/{remove_id}/variants/en/publish",
            headers=admin_headers(),
        )

        client.delete(f"/api/admin/knowledge-base/entries/{remove_id}", headers=admin_headers())
        public_ids = [item["id"] for item in client.get("/api/content/knowledge-base?locale=en").json()["entries"]]
        assert remove_id not in public_ids
        assert keep_id in public_ids


class TestKnowledgeBaseEntitlements:
    def test_subscribers_receive_all_published_entries(self, client):
        for index in range(6):
            title = f"Published article {index}"
            entry_id = client.post(
                "/api/admin/knowledge-base/entries",
                json={"title": title, "category": "Epoxy", "difficulty": "Beginner"},
                headers=admin_headers(),
            ).json()["contentId"]
            client.put(
                f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
                json=save_payload(sample_body(title)),
                headers=admin_headers(),
            )
            publish_response = client.post(
                f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
                headers=admin_headers(),
            )
            assert publish_response.status_code == 200

        admin_response = client.get(
            "/api/admin/knowledge-base/entries?locale=en",
            headers=admin_headers(),
        )
        assert admin_response.status_code == 200
        assert len(admin_response.json()) == 6

        response = client.get("/api/content/knowledge-base?locale=en")

        assert response.status_code == 200
        assert len(response.json()["entries"]) == 6
