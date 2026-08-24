from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from public.safety.input_limits import (
    CALCULATOR_PATHS,
    DEMO_CALCULATE_FIRST_FILL_PATH,
    DEMO_CALCULATE_POUR_LAYERS_PATH,
    DEMO_CALCULATE_WOOD_PATH,
    DEMO_CALCULATOR_PATHS,
)
from tests.support.authenticated_client import AUTHORIZED_HEADERS, authenticated_app

VALID_WOOD_PAYLOAD = {
    "imageWidth": 1000,
    "imageHeight": 500,
    "useImageBorderAsMold": True,
    "woodBoundaryPolygons": [
        [
            {"x": 0, "y": 0},
            {"x": 40, "y": 0},
            {"x": 40, "y": 40},
            {"x": 0, "y": 40},
        ]
    ],
    "cavityPolygons": [
        [
            {"x": 50, "y": 50},
            {"x": 70, "y": 50},
            {"x": 70, "y": 70},
            {"x": 50, "y": 70},
        ]
    ],
    "cavityDepthsMm": [8],
    "referenceMeasurements": [
        {
            "calibrationPoints": [{"x": 0, "y": 0}, {"x": 100, "y": 0}],
            "knownLengthCm": 10,
        }
    ],
    "mainPourDepthMm": 12,
}


VALID_FIRST_FILL_PAYLOAD = {
    "resinSurfaceAreaCm2": 100,
    "firstFillThicknessMm": 3,
}

VALID_POUR_LAYERS_PAYLOAD = {
    "mainDepthMm": 20,
    "maxPourThicknessMm": 5,
    "resinSurfaceAreaCm2": 100,
    "firstFillThicknessMm": 3,
}


def test_demo_calculate_path_is_not_a_general_calculator_path():
    assert DEMO_CALCULATE_WOOD_PATH == "/api/demo/calculate-wood"
    assert DEMO_CALCULATE_FIRST_FILL_PATH == "/api/demo/calculate-first-fill"
    assert DEMO_CALCULATE_POUR_LAYERS_PATH == "/api/demo/calculate-pour-layers"
    assert DEMO_CALCULATE_WOOD_PATH not in CALCULATOR_PATHS
    assert DEMO_CALCULATE_FIRST_FILL_PATH not in CALCULATOR_PATHS
    assert DEMO_CALCULATE_POUR_LAYERS_PATH not in CALCULATOR_PATHS
    assert DEMO_CALCULATOR_PATHS.isdisjoint(CALCULATOR_PATHS)


def test_anonymous_demo_calculate_wood_succeeds():
    from app import app

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(DEMO_CALCULATE_WOOD_PATH, json=VALID_WOOD_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["woodIslandCount"] == 1
    assert body["volumeLiters"] > 0
    assert "recommendedVolumeLiters" in body


def test_demo_calculate_wood_reuses_authenticated_calculate_wood_logic():
    from app import app, run_calculate_wood, CalculateWoodRequest

    request = CalculateWoodRequest.model_validate(VALID_WOOD_PAYLOAD)
    direct = run_calculate_wood(request)

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(DEMO_CALCULATE_WOOD_PATH, json=VALID_WOOD_PAYLOAD)

    assert response.status_code == 200
    assert response.json()["volumeLiters"] == direct["volumeLiters"]
    assert response.json()["mainResinAreaCm2"] == direct["mainResinAreaCm2"]


def test_anonymous_calculate_wood_still_requires_auth():
    from app import app

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post("/calculate-wood", json=VALID_WOOD_PAYLOAD)

    assert response.status_code == 401


def test_anonymous_pour_layers_still_requires_auth():
    from app import app

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(
            "/calculate-pour-layers",
            json={
                "mainDepthMm": 20,
                "maxPourThicknessMm": 5,
                "resinSurfaceAreaCm2": 100,
            },
        )

    assert response.status_code == 401


def test_anonymous_first_fill_still_requires_auth():
    from app import app

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(
            "/calculate-first-fill",
            json={"resinSurfaceAreaCm2": 100, "firstFillThicknessMm": 2},
        )

    assert response.status_code == 401


def test_anonymous_demo_calculate_wood_accepts_zero_wood_islands():
    from app import app

    client = TestClient(app)
    payload = {**VALID_WOOD_PAYLOAD, "woodBoundaryPolygons": []}
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(DEMO_CALCULATE_WOOD_PATH, json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["woodIslandCount"] == 0
    assert body["woodAreaCm2"] == 0
    assert body["mainResinAreaCm2"] == pytest.approx(body["moldAreaCm2"])
    assert body["volumeLiters"] > body["mainVolumeLiters"]


def test_invalid_demo_payload_is_rejected():
    from app import app

    client = TestClient(app)
    invalid = {**VALID_WOOD_PAYLOAD, "referenceMeasurements": []}
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(DEMO_CALCULATE_WOOD_PATH, json=invalid)

    assert response.status_code == 400


def test_anonymous_oversized_demo_request_is_rejected():
    from app import app
    from public.safety.input_limits import CALCULATOR_MAX_BODY_BYTES

    client = TestClient(app)
    oversized = CALCULATOR_MAX_BODY_BYTES + 1
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(
            DEMO_CALCULATE_WOOD_PATH,
            content="{}",
            headers={
                "Content-Type": "application/json",
                "Content-Length": str(oversized),
            },
        )

    assert response.status_code == 413
    assert response.json()["detail"] == "Request body too large."


def test_demo_calculate_wood_performs_no_project_persistence():
    from app import app, run_calculate_wood

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True), patch(
        "public.app.run_calculate_wood", wraps=run_calculate_wood
    ) as calculate:
        response = client.post(DEMO_CALCULATE_WOOD_PATH, json=VALID_WOOD_PAYLOAD)

    assert response.status_code == 200
    calculate.assert_called_once()
    assert response.json()["volumeLiters"] > 0


def test_authenticated_calculate_wood_still_works():
    from app import app

    client = TestClient(app)
    with authenticated_app():
        response = client.post(
            "/calculate-wood",
            json=VALID_WOOD_PAYLOAD,
            headers=AUTHORIZED_HEADERS,
        )

    assert response.status_code == 200
    assert response.json()["volumeLiters"] > 0


def test_anonymous_demo_calculate_first_fill_succeeds():
    from app import app

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(DEMO_CALCULATE_FIRST_FILL_PATH, json=VALID_FIRST_FILL_PAYLOAD)

    assert response.status_code == 200
    assert response.json()["volumeLiters"] > 0


def test_demo_calculate_first_fill_reuses_authenticated_logic():
    from app import app, run_calculate_first_fill, CalculateFirstFillRequest

    request = CalculateFirstFillRequest.model_validate(VALID_FIRST_FILL_PAYLOAD)
    direct = run_calculate_first_fill(request)

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(DEMO_CALCULATE_FIRST_FILL_PATH, json=VALID_FIRST_FILL_PAYLOAD)

    assert response.status_code == 200
    assert response.json()["volumeLiters"] == direct["volumeLiters"]


def test_invalid_demo_first_fill_payload_is_rejected():
    from app import app

    client = TestClient(app)
    invalid = {**VALID_FIRST_FILL_PAYLOAD, "firstFillThicknessMm": 0}
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(DEMO_CALCULATE_FIRST_FILL_PATH, json=invalid)

    assert response.status_code == 400


def test_anonymous_oversized_demo_first_fill_request_is_rejected():
    from app import app
    from public.safety.input_limits import CALCULATOR_MAX_BODY_BYTES

    client = TestClient(app)
    oversized = CALCULATOR_MAX_BODY_BYTES + 1
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(
            DEMO_CALCULATE_FIRST_FILL_PATH,
            content="{}",
            headers={
                "Content-Type": "application/json",
                "Content-Length": str(oversized),
            },
        )

    assert response.status_code == 413
    assert response.json()["detail"] == "Request body too large."


def test_demo_calculate_first_fill_performs_no_project_persistence():
    from app import app, run_calculate_first_fill

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True), patch(
        "public.app.run_calculate_first_fill", wraps=run_calculate_first_fill
    ) as calculate:
        response = client.post(DEMO_CALCULATE_FIRST_FILL_PATH, json=VALID_FIRST_FILL_PAYLOAD)

    assert response.status_code == 200
    calculate.assert_called_once()
    assert response.json()["volumeLiters"] > 0


def test_anonymous_demo_calculate_pour_layers_succeeds():
    from app import app

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(DEMO_CALCULATE_POUR_LAYERS_PATH, json=VALID_POUR_LAYERS_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["layerCount"] >= 2
    assert len(body["rows"]) == body["layerCount"]
    assert body["rows"][0]["type"] == "firstFill"


def test_demo_calculate_pour_layers_reuses_authenticated_logic():
    from app import app, run_calculate_pour_layers, CalculatePourLayersRequest

    request = CalculatePourLayersRequest.model_validate(VALID_POUR_LAYERS_PAYLOAD)
    direct = run_calculate_pour_layers(request)

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(DEMO_CALCULATE_POUR_LAYERS_PATH, json=VALID_POUR_LAYERS_PAYLOAD)

    assert response.status_code == 200
    assert response.json()["layerCount"] == direct["layerCount"]
    assert response.json()["rows"] == direct["rows"]


def test_invalid_demo_pour_layers_payload_is_rejected():
    from app import app

    client = TestClient(app)
    invalid = {**VALID_POUR_LAYERS_PAYLOAD, "maxPourThicknessMm": 0}
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(DEMO_CALCULATE_POUR_LAYERS_PATH, json=invalid)

    assert response.status_code == 400


def test_anonymous_oversized_demo_pour_layers_request_is_rejected():
    from app import app
    from public.safety.input_limits import CALCULATOR_MAX_BODY_BYTES

    client = TestClient(app)
    oversized = CALCULATOR_MAX_BODY_BYTES + 1
    with patch("public.app._AUTH_ENABLED", True):
        response = client.post(
            DEMO_CALCULATE_POUR_LAYERS_PATH,
            content="{}",
            headers={
                "Content-Type": "application/json",
                "Content-Length": str(oversized),
            },
        )

    assert response.status_code == 413
    assert response.json()["detail"] == "Request body too large."


def test_demo_calculate_pour_layers_performs_no_project_persistence():
    from app import app, run_calculate_pour_layers

    client = TestClient(app)
    with patch("public.app._AUTH_ENABLED", True), patch(
        "public.app.run_calculate_pour_layers", wraps=run_calculate_pour_layers
    ) as calculate:
        response = client.post(DEMO_CALCULATE_POUR_LAYERS_PATH, json=VALID_POUR_LAYERS_PAYLOAD)

    assert response.status_code == 200
    calculate.assert_called_once()
    assert response.json()["layerCount"] > 0
