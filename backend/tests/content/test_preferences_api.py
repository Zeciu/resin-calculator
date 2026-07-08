import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from content.repositories.preferences import FilesystemPreferencesRepository
from content.routers.preferences import get_preferences_service, router as preferences_router
from content.schemas.preferences import UserPreferences
from content.services.preferences import PreferencesService


@pytest.fixture
def preferences_client(tmp_path):
    repository = FilesystemPreferencesRepository(tmp_path)
    service = PreferencesService(repository)
    app = FastAPI()
    app.include_router(preferences_router, prefix="/api")
    app.dependency_overrides[get_preferences_service] = lambda: service
    with TestClient(app) as client:
        yield client, repository


def test_get_returns_defaults_when_no_preferences_exist(preferences_client):
    client, _repository = preferences_client
    response = client.get(
        "/api/preferences",
        headers={"X-Mock-User-Id": "user-a", "X-Mock-Role": "user"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload == {
        "interfaceLanguage": "en",
        "lengthUnit": "mm",
        "volumeUnit": "L",
        "exists": False,
    }


def test_put_validates_enum_values(preferences_client):
    client, _repository = preferences_client
    response = client.put(
        "/api/preferences",
        headers={"X-Mock-User-Id": "user-a", "X-Mock-Role": "user"},
        json={"interfaceLanguage": "fr"},
    )
    assert response.status_code == 422


def test_put_persists_preferences(preferences_client):
    client, repository = preferences_client
    response = client.put(
        "/api/preferences",
        headers={"X-Mock-User-Id": "user-a", "X-Mock-Role": "user"},
        json={
            "interfaceLanguage": "ro",
            "lengthUnit": "cm",
            "volumeUnit": "ml",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload == {
        "interfaceLanguage": "ro",
        "lengthUnit": "cm",
        "volumeUnit": "ml",
        "exists": True,
    }
    stored = repository.get_preferences("user-a")
    assert stored == UserPreferences(
        interfaceLanguage="ro",
        lengthUnit="cm",
        volumeUnit="ml",
    )


def test_get_after_put_returns_saved_preferences(preferences_client):
    client, _repository = preferences_client
    headers = {"X-Mock-User-Id": "user-a", "X-Mock-Role": "user"}
    client.put(
        "/api/preferences",
        headers=headers,
        json={"interfaceLanguage": "ro", "lengthUnit": "ft", "volumeUnit": "gal"},
    )
    response = client.get("/api/preferences", headers=headers)
    assert response.status_code == 200
    assert response.json()["exists"] is True
    assert response.json()["interfaceLanguage"] == "ro"
    assert response.json()["lengthUnit"] == "ft"
    assert response.json()["volumeUnit"] == "gal"


def test_preferences_are_isolated_per_user(preferences_client):
    client, _repository = preferences_client
    client.put(
        "/api/preferences",
        headers={"X-Mock-User-Id": "user-a", "X-Mock-Role": "user"},
        json={"interfaceLanguage": "ro"},
    )
    client.put(
        "/api/preferences",
        headers={"X-Mock-User-Id": "user-b", "X-Mock-Role": "user"},
        json={"interfaceLanguage": "en", "lengthUnit": "in"},
    )

    user_a = client.get(
        "/api/preferences",
        headers={"X-Mock-User-Id": "user-a", "X-Mock-Role": "user"},
    ).json()
    user_b = client.get(
        "/api/preferences",
        headers={"X-Mock-User-Id": "user-b", "X-Mock-Role": "user"},
    ).json()

    assert user_a["interfaceLanguage"] == "ro"
    assert user_a["lengthUnit"] == "mm"
    assert user_b["interfaceLanguage"] == "en"
    assert user_b["lengthUnit"] == "in"


def test_put_supports_partial_updates(preferences_client):
    client, _repository = preferences_client
    headers = {"X-Mock-User-Id": "user-a", "X-Mock-Role": "user"}
    client.put(
        "/api/preferences",
        headers=headers,
        json={"interfaceLanguage": "ro", "lengthUnit": "cm", "volumeUnit": "ml"},
    )
    response = client.put(
        "/api/preferences",
        headers=headers,
        json={"volumeUnit": "qt"},
    )
    assert response.status_code == 200
    assert response.json() == {
        "interfaceLanguage": "ro",
        "lengthUnit": "cm",
        "volumeUnit": "qt",
        "exists": True,
    }
