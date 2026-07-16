import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app import (
    app,
    polygon_area_px2,
    classify_reference_direction,
    resolve_calibration_scales,
    px2_to_cm2,
    volume_from_area_cm2,
    CalibrationPoint,
    ReferenceMeasurement,
)

client = TestClient(app)


# ---------------------------------------------------------------------------
# Pure function unit tests
# ---------------------------------------------------------------------------

def pt(x, y):
    return CalibrationPoint(x=x, y=y)


def ref(x1, y1, x2, y2, length_cm):
    return ReferenceMeasurement(calibrationPoints=[pt(x1, y1), pt(x2, y2)], knownLengthCm=length_cm)


class TestPolygonArea:
    def test_unit_square(self):
        points = [pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)]
        assert polygon_area_px2(points) == pytest.approx(1.0)

    def test_rectangle(self):
        points = [pt(0, 0), pt(10, 0), pt(10, 5), pt(0, 5)]
        assert polygon_area_px2(points) == pytest.approx(50.0)

    def test_triangle(self):
        # base=10, height=6 -> area=30
        points = [pt(0, 0), pt(10, 0), pt(5, 6)]
        assert polygon_area_px2(points) == pytest.approx(30.0)

    def test_less_than_3_points_returns_zero(self):
        assert polygon_area_px2([pt(0, 0), pt(1, 1)]) == 0.0


class TestClassifyDirection:
    def test_horizontal(self):
        assert classify_reference_direction(100, 10) == "horizontal"

    def test_vertical(self):
        assert classify_reference_direction(10, 100) == "vertical"

    def test_diagonal(self):
        assert classify_reference_direction(50, 50) == "diagonal"


class TestResolveCalibrationScales:
    def test_horizontal_ref(self):
        sx, sy, _ = resolve_calibration_scales([ref(0, 0, 100, 0, 10)])
        assert sx == pytest.approx(0.1)
        assert sy == pytest.approx(0.1)  # falls back to sx

    def test_vertical_ref(self):
        sx, sy, _ = resolve_calibration_scales([ref(0, 0, 0, 100, 10)])
        assert sy == pytest.approx(0.1)
        assert sx == pytest.approx(0.1)  # falls back to sy

    def test_both_axes(self):
        refs = [ref(0, 0, 200, 0, 10), ref(0, 0, 0, 100, 10)]
        sx, sy, q = resolve_calibration_scales(refs)
        assert sx == pytest.approx(0.05)
        assert sy == pytest.approx(0.1)
        assert q["oneDirectionOnlyWarning"] is False

    def test_diagonal_only_returns_error(self):
        sx, sy, msg = resolve_calibration_scales([ref(0, 0, 50, 50, 10)])
        assert sx is None
        assert "No horizontal or vertical" in msg

    def test_empty_list_returns_error(self):
        sx, sy, msg = resolve_calibration_scales([])
        assert sx is None

    def test_zero_length_ref_returns_error(self):
        sx, sy, msg = resolve_calibration_scales([ref(5, 5, 5, 5, 10)])
        assert sx is None


class TestVolumeCalculations:
    def test_px2_to_cm2(self):
        assert px2_to_cm2(100.0, 0.1, 0.1) == pytest.approx(1.0)

    def test_volume_from_area(self):
        # 100 cm2, 10mm depth = 1cm -> 100 cm3 -> 0.1 L
        vol, recommended = volume_from_area_cm2(100.0, 10.0)
        assert vol == pytest.approx(0.1)
        assert recommended == pytest.approx(0.11)  # 10% margin


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------

H_REF = {"calibrationPoints": [{"x": 0, "y": 0}, {"x": 100, "y": 0}], "knownLengthCm": 10}
SQUARE_POLY = [{"x": 0, "y": 0}, {"x": 100, "y": 0}, {"x": 100, "y": 100}, {"x": 0, "y": 100}]


class TestHealthEndpoint:
    def test_health(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}


class TestCalculateEndpoint:
    def test_valid_request(self):
        r = client.post("/calculate", json={
            "polygonPoints": SQUARE_POLY,
            "referenceMeasurements": [H_REF],
            "depthMm": 10,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["areaCm2"] == pytest.approx(100.0)   # 100px * (0.1 cm/px)^2
        assert data["volumeLiters"] == pytest.approx(0.1)
        assert data["recommendedVolumeLiters"] == pytest.approx(0.11)

    def test_too_few_polygon_points(self):
        r = client.post("/calculate", json={
            "polygonPoints": [{"x": 0, "y": 0}, {"x": 1, "y": 0}],
            "referenceMeasurements": [H_REF],
            "depthMm": 10,
        })
        assert r.status_code == 400

    def test_zero_depth(self):
        r = client.post("/calculate", json={
            "polygonPoints": SQUARE_POLY,
            "referenceMeasurements": [H_REF],
            "depthMm": 0,
        })
        assert r.status_code == 400

    def test_no_usable_reference(self):
        diagonal_ref = {"calibrationPoints": [{"x": 0, "y": 0}, {"x": 50, "y": 50}], "knownLengthCm": 10}
        r = client.post("/calculate", json={
            "polygonPoints": SQUARE_POLY,
            "referenceMeasurements": [diagonal_ref],
            "depthMm": 10,
        })
        assert r.status_code == 400


class TestCalculateWoodEndpoint:
    def test_valid_request_image_border_as_mold(self):
        r = client.post("/calculate-wood", json={
            "imageWidth": 1000,
            "imageHeight": 500,
            "useImageBorderAsMold": True,
            "woodBoundaryPolygons": [SQUARE_POLY],
            "referenceMeasurements": [H_REF],
            "mainPourDepthMm": 10,
            "cavityPolygons": [],
            "cavityDepthsMm": [],
        })
        assert r.status_code == 200
        data = r.json()
        # mold = 1000*500 px, wood = 100*100 px, scale = 0.1 cm/px
        assert data["moldAreaCm2"] == pytest.approx(5000.0)
        assert data["woodAreaCm2"] == pytest.approx(100.0)
        assert data["mainResinAreaCm2"] == pytest.approx(4900.0)

    def test_wood_area_exceeds_mold_returns_400(self):
        big_wood = [{"x": 0, "y": 0}, {"x": 2000, "y": 0}, {"x": 2000, "y": 2000}, {"x": 0, "y": 2000}]
        r = client.post("/calculate-wood", json={
            "imageWidth": 100,
            "imageHeight": 100,
            "useImageBorderAsMold": True,
            "woodBoundaryPolygons": [big_wood],
            "referenceMeasurements": [H_REF],
            "mainPourDepthMm": 10,
            "cavityPolygons": [],
            "cavityDepthsMm": [],
        })
        assert r.status_code == 400

    def test_cavity_depth_mismatch_returns_400(self):
        r = client.post("/calculate-wood", json={
            "imageWidth": 1000,
            "imageHeight": 500,
            "useImageBorderAsMold": True,
            "woodBoundaryPolygons": [SQUARE_POLY],
            "referenceMeasurements": [H_REF],
            "mainPourDepthMm": 10,
            "cavityPolygons": [SQUARE_POLY],
            "cavityDepthsMm": [],  # mismatch: 1 cavity but 0 depths
        })
        assert r.status_code == 400


class TestCalculatePourLayersEndpoint:
    def test_single_layer(self):
        r = client.post("/calculate-pour-layers", json={
            "mainDepthMm": 5,
            "maxPourThicknessMm": 10,
            "resinSurfaceAreaCm2": 100,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["layerCount"] == 1
        assert data["rows"][0]["thicknessMm"] == pytest.approx(5.0)

    def test_multiple_layers(self):
        r = client.post("/calculate-pour-layers", json={
            "mainDepthMm": 25,
            "maxPourThicknessMm": 10,
            "resinSurfaceAreaCm2": 100,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["layerCount"] == 3
        total = sum(row["thicknessMm"] for row in data["rows"])
        assert total == pytest.approx(25.0)

    def test_first_fill_prepended(self):
        r = client.post("/calculate-pour-layers", json={
            "mainDepthMm": 20,
            "maxPourThicknessMm": 10,
            "resinSurfaceAreaCm2": 100,
            "firstFillThicknessMm": 3,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["rows"][0]["type"] == "firstFill"
        total = sum(row["thicknessMm"] for row in data["rows"])
        assert total == pytest.approx(20.0)

    def test_zero_depth_returns_400(self):
        r = client.post("/calculate-pour-layers", json={
            "mainDepthMm": 0,
            "maxPourThicknessMm": 10,
            "resinSurfaceAreaCm2": 100,
        })
        assert r.status_code == 400


class TestCalculateFirstFillEndpoint:
    def test_correct_volume(self):
        # 200 cm2, 5mm = 0.5cm -> 100 cm3 = 0.1 L
        r = client.post("/calculate-first-fill", json={
            "resinSurfaceAreaCm2": 200,
            "firstFillThicknessMm": 5,
        })
        assert r.status_code == 200
        assert r.json()["volumeLiters"] == pytest.approx(0.1)

    def test_zero_area_returns_400(self):
        r = client.post("/calculate-first-fill", json={
            "resinSurfaceAreaCm2": 0,
            "firstFillThicknessMm": 5,
        })
        assert r.status_code == 400



# ---------------------------------------------------------------------------
# JWT middleware tests
# ---------------------------------------------------------------------------

VALID_PAYLOAD = {
    "sub": "user-123",
    "iss": "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_test",
    "token_use": "access",
    "client_id": "test-client",
}
MOCK_JWKS = {"keys": [{"kty": "RSA", "kid": "test-key"}]}


class TestJwtMiddleware:
    def test_health_endpoint_requires_no_auth(self):
        """Health check is always public."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_protected_endpoint_without_token_returns_401(self):
        """Requests without Authorization header are rejected when auth is enabled."""
        with patch("app._AUTH_ENABLED", True):
            response = client.post("/calculate", json={})
            assert response.status_code == 401

    def test_protected_endpoint_with_invalid_token_returns_401(self):
        """Requests with a malformed token are rejected."""
        with patch("app._AUTH_ENABLED", True), \
             patch("app._get_jwks", AsyncMock(return_value=MOCK_JWKS)), \
             patch("app.jwt.decode", side_effect=Exception("bad token")):
            response = client.post(
                "/calculate", json={},
                headers={"Authorization": "Bearer not.a.real.token"}
            )
            assert response.status_code == 401

    def test_protected_endpoint_with_valid_token_passes_through(self):
        """Requests with a valid token reach the endpoint (may still get 400 for bad body)."""
        with patch("app._AUTH_ENABLED", True), \
             patch("app._COGNITO_CLIENT_ID", "test-client"), \
             patch("app._get_jwks", AsyncMock(return_value=MOCK_JWKS)), \
             patch("app.jwt.decode", return_value=VALID_PAYLOAD):
            response = client.post(
                "/calculate",
                json={"polygonPoints": [], "referenceMeasurements": [], "depthMm": 10},
                headers={"Authorization": "Bearer valid.token.here"}
            )
            # Middleware passed — endpoint logic returns 400 for empty polygon
            assert response.status_code == 400

    def test_token_with_wrong_client_id_is_rejected(self):
        with patch("app._AUTH_ENABLED", True), \
             patch("app._COGNITO_CLIENT_ID", "expected-client"), \
             patch("app._get_jwks", AsyncMock(return_value=MOCK_JWKS)), \
             patch("app.jwt.decode", return_value=VALID_PAYLOAD):
            response = client.post(
                "/calculate",
                json={"polygonPoints": [], "referenceMeasurements": [], "depthMm": 10},
                headers={"Authorization": "Bearer valid.token.here"},
            )
            assert response.status_code == 401

    def test_auth_disabled_when_env_vars_missing(self):
        """When COGNITO env vars are not set, all requests pass through without auth."""
        with patch("app._AUTH_ENABLED", False):
            response = client.post(
                "/calculate",
                json={"polygonPoints": [], "referenceMeasurements": [], "depthMm": 10},
            )
            # No 401 — auth is disabled; endpoint returns 400 for bad input
            assert response.status_code == 400



