"""Infrastructure abuse ceilings for calculator endpoints.

These limits are not product capability tiers. They protect expensive backend
computation from oversized payloads independent of subscription state.
"""

from __future__ import annotations

from typing import Any

CALCULATOR_MAX_BODY_BYTES = 2 * 1024 * 1024
MAX_POINTS_PER_POLYGON = 1000
MAX_WOOD_ISLANDS = 50
MAX_CAVITIES = 50
MAX_REFERENCE_MEASUREMENTS = 20

CALCULATOR_PATHS = frozenset({
    "/calculate",
    "/calculate-wood",
    "/calculate-pour-layers",
    "/calculate-first-fill",
})


class InputLimitError(ValueError):
    """Raised when a request exceeds an infrastructure safety ceiling."""


def _validate_polygon_point_count(count: int, *, label: str) -> None:
    if count > MAX_POINTS_PER_POLYGON:
        raise InputLimitError(
            f"{label} exceeds the maximum of {MAX_POINTS_PER_POLYGON} points."
        )


def _validate_reference_count(count: int) -> None:
    if count > MAX_REFERENCE_MEASUREMENTS:
        raise InputLimitError(
            f"referenceMeasurements exceeds the maximum of {MAX_REFERENCE_MEASUREMENTS} entries."
        )


def validate_calculate_request(polygon_points: list[Any], reference_measurements: list[Any]) -> None:
    _validate_polygon_point_count(len(polygon_points), label="polygonPoints")
    _validate_reference_count(len(reference_measurements))


def validate_calculate_wood_request(
    *,
    mold_boundary_points: list[Any],
    wood_boundary_polygons: list[Any],
    cavity_polygons: list[Any],
    reference_measurements: list[Any],
) -> None:
    _validate_reference_count(len(reference_measurements))

    if len(wood_boundary_polygons) > MAX_WOOD_ISLANDS:
        raise InputLimitError(
            f"woodBoundaryPolygons exceeds the maximum of {MAX_WOOD_ISLANDS} islands."
        )

    if len(cavity_polygons) > MAX_CAVITIES:
        raise InputLimitError(
            f"cavityPolygons exceeds the maximum of {MAX_CAVITIES} cavities."
        )

    _validate_polygon_point_count(len(mold_boundary_points), label="moldBoundaryPoints")
    for idx, wood_polygon in enumerate(wood_boundary_polygons):
        if isinstance(wood_polygon, list):
            _validate_polygon_point_count(
                len(wood_polygon),
                label=f"woodBoundaryPolygons[{idx}]",
            )
    for idx, cavity in enumerate(cavity_polygons):
        if isinstance(cavity, list):
            _validate_polygon_point_count(len(cavity), label=f"cavityPolygons[{idx}]")
