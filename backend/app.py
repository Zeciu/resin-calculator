from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AXIS_DOMINANCE_RATIO = 1.5
RESIN_SAFETY_MARGIN = 0.10  # 10% extra resin recommended


class CalibrationPoint(BaseModel):
    x: float
    y: float


class ReferenceMeasurement(BaseModel):
    calibrationPoints: List[CalibrationPoint]
    knownLengthCm: float


class CalculateRequest(BaseModel):
    polygonPoints: List[CalibrationPoint]
    referenceMeasurements: List[ReferenceMeasurement]
    depthMm: float


class CalculateWoodRequest(BaseModel):
    imageWidth: float
    imageHeight: float
    useImageBorderAsMold: bool = True
    moldBoundaryPoints: List[CalibrationPoint] = []
    woodBoundaryPoints: List[CalibrationPoint] = []
    woodBoundaryPolygons: Optional[List[List[CalibrationPoint]]] = None
    cavityPolygons: List[List[CalibrationPoint]] = []
    referenceMeasurements: List[ReferenceMeasurement]
    mainPourDepthMm: Optional[float] = None
    depthMm: Optional[float] = None
    cavityDepthsMm: List[float] = []


def polygon_area_px2(points):
    """Shoelace formula for polygon area in square pixels."""
    if len(points) < 3:
        return 0.0

    area = 0.0
    n = len(points)
    for i in range(n):
        x1, y1 = points[i].x, points[i].y
        x2, y2 = points[(i + 1) % n].x, points[(i + 1) % n].y
        area += (x1 * y2) - (x2 * y1)

    return abs(area) / 2.0


def classify_reference_direction(dx, dy):
    abs_dx = abs(dx)
    abs_dy = abs(dy)
    if abs_dx >= abs_dy * AXIS_DOMINANCE_RATIO:
        return "horizontal"
    if abs_dy >= abs_dx * AXIS_DOMINANCE_RATIO:
        return "vertical"
    return "diagonal"


def resolve_calibration_scales(reference_measurements):
    if not isinstance(reference_measurements, list) or len(reference_measurements) == 0:
        return None, None, "At least 1 reference measurement is required."

    scale_x_horizontal = []
    scale_y_vertical = []
    diagonal_count = 0

    for idx, ref in enumerate(reference_measurements):
        calibration_points = ref.calibrationPoints
        known_length_cm = ref.knownLengthCm

        if not isinstance(calibration_points, list) or len(calibration_points) != 2:
            return None, None, f"Reference {idx + 1}: Exactly 2 calibration points are required."

        try:
            known_length_cm = float(known_length_cm)
        except (TypeError, ValueError):
            return None, None, f"Reference {idx + 1}: knownLengthCm must be a number."

        if known_length_cm <= 0:
            return None, None, f"Reference {idx + 1}: knownLengthCm must be > 0."

        p1, p2 = calibration_points
        dx = p2.x - p1.x
        dy = p2.y - p1.y
        calibration_distance_px = (dx**2 + dy**2) ** 0.5

        if calibration_distance_px <= 0:
            return None, None, f"Reference {idx + 1}: calibration points must differ."

        direction = classify_reference_direction(dx, dy)
        abs_dx = abs(dx)
        abs_dy = abs(dy)

        if direction == "horizontal":
            if abs_dx <= 0:
                return None, None, f"Reference {idx + 1}: horizontal reference has invalid deltaX."
            scale_x_horizontal.append(known_length_cm / abs_dx)
        elif direction == "vertical":
            if abs_dy <= 0:
                return None, None, f"Reference {idx + 1}: vertical reference has invalid deltaY."
            scale_y_vertical.append(known_length_cm / abs_dy)
        else:
            diagonal_count += 1

    horizontal_count = len(scale_x_horizontal)
    vertical_count = len(scale_y_vertical)

    if horizontal_count == 0 and vertical_count == 0:
        return None, None, "No horizontal or vertical references found."

    scale_x_avg = sum(scale_x_horizontal) / horizontal_count if horizontal_count > 0 else None
    scale_y_avg = sum(scale_y_vertical) / vertical_count if vertical_count > 0 else None

    one_direction_only = horizontal_count == 0 or vertical_count == 0
    if scale_x_avg is None:
        scale_x_avg = scale_y_avg
    if scale_y_avg is None:
        scale_y_avg = scale_x_avg

    scale_quality = {
        "scaleXAvgCmPerPx": scale_x_avg,
        "scaleYAvgCmPerPx": scale_y_avg,
        "horizontalCount": horizontal_count,
        "verticalCount": vertical_count,
        "diagonalCount": diagonal_count,
        "oneDirectionOnlyWarning": one_direction_only,
    }

    return scale_x_avg, scale_y_avg, scale_quality


def px2_to_cm2(area_px2, scale_x, scale_y):
    return area_px2 * (scale_x * scale_y)


def volume_liters_from_area_cm2(area_cm2, depth_mm):
    depth_cm = depth_mm / 10.0
    volume_cm3 = area_cm2 * depth_cm
    return volume_cm3 / 1000.0


def volume_from_area_cm2(area_cm2, depth_mm):
    volume_liters = volume_liters_from_area_cm2(area_cm2, depth_mm)
    recommended_liters = volume_liters * (1.0 + RESIN_SAFETY_MARGIN)
    return volume_liters, recommended_liters


@app.post("/calculate")
def calculate(req: CalculateRequest):
    if len(req.polygonPoints) < 3:
        raise HTTPException(status_code=400, detail="At least 3 polygon points are required.")

    try:
        depth_mm = float(req.depthMm)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="depthMm must be a number.")

    if depth_mm <= 0:
        raise HTTPException(status_code=400, detail="depthMm must be > 0.")

    scale_x_avg, scale_y_avg, scale_or_error = resolve_calibration_scales(req.referenceMeasurements)
    if scale_x_avg is None:
        raise HTTPException(status_code=400, detail=scale_or_error)

    scale_quality = scale_or_error

    polygon_area_px = polygon_area_px2(req.polygonPoints)
    area_cm2 = px2_to_cm2(polygon_area_px, scale_x_avg, scale_y_avg)
    volume_liters, recommended_liters = volume_from_area_cm2(area_cm2, depth_mm)

    return {
        "areaCm2": area_cm2,
        "volumeLiters": volume_liters,
        "recommendedVolumeLiters": recommended_liters,
        "safetyMarginPercent": RESIN_SAFETY_MARGIN * 100.0,
        "scaleQuality": scale_quality,
    }


@app.post("/calculate-wood")
def calculate_wood(req: CalculateWoodRequest):
    image_width = req.imageWidth
    image_height = req.imageHeight
    use_image_border_as_mold = req.useImageBorderAsMold
    mold_boundary_points = req.moldBoundaryPoints
    wood_boundary_points = req.woodBoundaryPoints
    wood_boundary_polygons = req.woodBoundaryPolygons
    cavity_polygons = req.cavityPolygons
    reference_measurements = req.referenceMeasurements
    main_pour_depth_mm = req.mainPourDepthMm or req.depthMm
    cavity_depths_mm = req.cavityDepthsMm

    try:
        image_width = float(image_width)
        image_height = float(image_height)
        main_pour_depth_mm = float(main_pour_depth_mm)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="imageWidth, imageHeight, and mainPourDepthMm must be numbers.")

    if image_width <= 0 or image_height <= 0:
        raise HTTPException(status_code=400, detail="imageWidth and imageHeight must be > 0.")

    if main_pour_depth_mm <= 0:
        raise HTTPException(status_code=400, detail="mainPourDepthMm must be > 0.")

    if not use_image_border_as_mold and len(mold_boundary_points) < 3:
        raise HTTPException(status_code=400, detail="Mold boundary requires at least 3 points.")

    if wood_boundary_polygons is None:
        wood_boundary_polygons = [wood_boundary_points] if len(wood_boundary_points) > 0 else []

    if not isinstance(wood_boundary_polygons, list):
        raise HTTPException(status_code=400, detail="woodBoundaryPolygons must be an array.")

    if len(wood_boundary_polygons) == 0:
        raise HTTPException(status_code=400, detail="At least one wood island is required.")

    for idx, wood_polygon in enumerate(wood_boundary_polygons):
        if not isinstance(wood_polygon, list) or len(wood_polygon) < 3:
            raise HTTPException(status_code=400, detail=f"Wood island {idx + 1}: at least 3 points are required.")

    if not isinstance(cavity_polygons, list):
        raise HTTPException(status_code=400, detail="cavityPolygons must be an array.")

    if not isinstance(cavity_depths_mm, list):
        raise HTTPException(status_code=400, detail="cavityDepthsMm must be an array.")

    if len(cavity_depths_mm) != len(cavity_polygons):
        raise HTTPException(status_code=400, detail="cavityDepthsMm must have one depth value per cavity polygon.")

    for idx, cavity in enumerate(cavity_polygons):
        if not isinstance(cavity, list) or len(cavity) < 3:
            raise HTTPException(status_code=400, detail=f"Cavity {idx + 1}: at least 3 points are required.")

    scale_x_avg, scale_y_avg, scale_or_error = resolve_calibration_scales(reference_measurements)
    if scale_x_avg is None:
        raise HTTPException(status_code=400, detail=scale_or_error)

    scale_quality = scale_or_error

    mold_area_px = image_width * image_height if use_image_border_as_mold else polygon_area_px2(mold_boundary_points)
    wood_area_px = sum(polygon_area_px2(polygon) for polygon in wood_boundary_polygons)

    cavity_areas_cm2 = []
    for idx, cavity in enumerate(cavity_polygons):
        try:
            depth_mm = float(cavity_depths_mm[idx])
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail=f"Cavity {idx + 1}: depth must be a number.")
        if depth_mm <= 0:
            raise HTTPException(status_code=400, detail=f"Cavity {idx + 1}: depth must be > 0.")

        area_cm2 = px2_to_cm2(polygon_area_px2(cavity), scale_x_avg, scale_y_avg)
        volume_liters = volume_liters_from_area_cm2(area_cm2, depth_mm)
        cavity_areas_cm2.append({
            "name": f"Cavity {idx + 1}",
            "areaCm2": area_cm2,
            "depthMm": depth_mm,
            "volumeLiters": volume_liters,
        })

    cavity_area_px = sum(polygon_area_px2(cavity) for cavity in cavity_polygons)

    mold_area_cm2 = px2_to_cm2(mold_area_px, scale_x_avg, scale_y_avg)
    wood_area_cm2 = px2_to_cm2(wood_area_px, scale_x_avg, scale_y_avg)
    cavity_area_cm2 = px2_to_cm2(cavity_area_px, scale_x_avg, scale_y_avg)
    main_resin_area_cm2 = mold_area_cm2 - wood_area_cm2

    if main_resin_area_cm2 < 0:
        raise HTTPException(status_code=400, detail="Computed main resin area is negative. Check wood island traces.")

    main_volume_liters = volume_liters_from_area_cm2(main_resin_area_cm2, main_pour_depth_mm)
    cavity_volume_liters = sum(c["volumeLiters"] for c in cavity_areas_cm2)
    total_volume_liters = main_volume_liters + cavity_volume_liters
    recommended_liters = total_volume_liters * (1.0 + RESIN_SAFETY_MARGIN)

    return {
        "moldAreaCm2": mold_area_cm2,
        "useImageBorderAsMold": bool(use_image_border_as_mold),
        "woodAreaCm2": wood_area_cm2,
        "woodIslandCount": len(wood_boundary_polygons),
        "cavityAreaCm2": cavity_area_cm2,
        "mainResinAreaCm2": main_resin_area_cm2,
        "mainPourDepthMm": main_pour_depth_mm,
        "mainVolumeLiters": main_volume_liters,
        "cavities": cavity_areas_cm2,
        "volumeLiters": total_volume_liters,
        "recommendedVolumeLiters": recommended_liters,
        "safetyMarginPercent": RESIN_SAFETY_MARGIN * 100.0,
        "scaleQuality": scale_quality,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)