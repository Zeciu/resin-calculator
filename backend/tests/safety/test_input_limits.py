import pytest
from fastapi.testclient import TestClient

from app import app
from safety.input_limits import (
    CALCULATOR_MAX_BODY_BYTES,
    MAX_CAVITIES,
    MAX_POINTS_PER_POLYGON,
    MAX_REFERENCE_MEASUREMENTS,
    MAX_WOOD_ISLANDS,
)

client = TestClient(app)

H_REF = {"calibrationPoints": [{"x": 0, "y": 0}, {"x": 100, "y": 0}], "knownLengthCm": 10}


def _point(index: int) -> dict[str, float]:
    return {"x": float(index), "y": 0.0}


def _square_polygon(size: int = 100) -> list[dict[str, float]]:
    return [
        {"x": 0, "y": 0},
        {"x": float(size), "y": 0},
        {"x": float(size), "y": float(size)},
        {"x": 0, "y": float(size)},
    ]


def _many_points(count: int) -> list[dict[str, float]]:
    return [_point(index) for index in range(count)]


class TestCalculatorInputLimits:
    def test_excessive_polygon_points_returns_400(self):
        response = client.post(
            "/calculate",
            json={
                "polygonPoints": _many_points(MAX_POINTS_PER_POLYGON + 1),
                "referenceMeasurements": [H_REF],
                "depthMm": 10,
            },
        )
        assert response.status_code == 400
        assert "polygonPoints" in response.json()["detail"]

    def test_excessive_reference_measurements_returns_400(self):
        response = client.post(
            "/calculate",
            json={
                "polygonPoints": _square_polygon(),
                "referenceMeasurements": [H_REF] * (MAX_REFERENCE_MEASUREMENTS + 1),
                "depthMm": 10,
            },
        )
        assert response.status_code == 400
        assert "referenceMeasurements" in response.json()["detail"]

    def test_excessive_wood_islands_returns_400(self):
        response = client.post(
            "/calculate-wood",
            json={
                "imageWidth": 1000,
                "imageHeight": 500,
                "useImageBorderAsMold": True,
                "woodBoundaryPolygons": [_square_polygon()] * (MAX_WOOD_ISLANDS + 1),
                "referenceMeasurements": [H_REF],
                "mainPourDepthMm": 10,
                "cavityPolygons": [],
                "cavityDepthsMm": [],
            },
        )
        assert response.status_code == 400
        assert "woodBoundaryPolygons" in response.json()["detail"]

    def test_excessive_cavities_returns_400(self):
        response = client.post(
            "/calculate-wood",
            json={
                "imageWidth": 1000,
                "imageHeight": 500,
                "useImageBorderAsMold": True,
                "woodBoundaryPolygons": [_square_polygon()],
                "referenceMeasurements": [H_REF],
                "mainPourDepthMm": 10,
                "cavityPolygons": [_square_polygon()] * (MAX_CAVITIES + 1),
                "cavityDepthsMm": [10] * (MAX_CAVITIES + 1),
            },
        )
        assert response.status_code == 400
        assert "cavityPolygons" in response.json()["detail"]

    def test_oversized_calculator_request_body_returns_413(self):
        oversized = CALCULATOR_MAX_BODY_BYTES + 1
        response = client.post(
            "/calculate",
            content="{}",
            headers={
                "Content-Type": "application/json",
                "Content-Length": str(oversized),
            },
        )
        assert response.status_code == 413
        assert response.json()["detail"] == "Request body too large."
