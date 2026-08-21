import os
import logging
from pathlib import Path
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Any
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from jose.exceptions import ExpiredSignatureError

from public.content_routers import get_capability_resolver
from public.product.entitlements import EntitlementsServiceUnavailableError
from public.spa_document_indexing import (
    apply_spa_document_robots_header,
    is_extensionless_spa_path,
)
from public.routers.billing import router as billing_router
from public.routers.me import router as me_router
from public.safety.input_limits import (
    CALCULATOR_MAX_BODY_BYTES,
    CALCULATOR_PATHS,
    InputLimitError,
    validate_calculate_request,
    validate_calculate_wood_request,
)

auth_logger = logging.getLogger(__name__)


app = FastAPI()


@app.exception_handler(EntitlementsServiceUnavailableError)
async def entitlements_service_unavailable_handler(
    _request: Request, _exc: EntitlementsServiceUnavailableError
) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Subscription access is temporarily unavailable. Please retry shortly."
        },
    )


def _include_local_editorial_routes() -> bool:
    """Mount authoring routes when the local-only private source is available.

    Editorial routes are never deployed to AWS: `backend/private` is excluded
    from the Docker build context, so this import fails (and this function
    returns False) in production regardless of environment configuration.
    Returns True when local editorial routes (and the CONTENT_DATA_DIR-backed
    public content reader that reads back what they write) were mounted.
    """
    try:
        from private.routers.admin_editorial import router as admin_editorial_router
        from private.routers.admin_glossary import router as admin_glossary_router
        from private.routers.admin_knowledge_base import router as admin_knowledge_base_router
        from private.routers.admin_manual import router as admin_manual_router
        from private.routers.admin_public_languages import router as admin_public_languages_router
        from private.routers.admin_translation_bulk import router as admin_translation_bulk_router
        from private.routers.admin_website import router as admin_website_router
        from private.routers.public_content import router as local_public_content_router
    except ImportError:
        return False

    app.include_router(admin_manual_router, prefix="/api")
    app.include_router(admin_editorial_router, prefix="/api")
    app.include_router(admin_glossary_router, prefix="/api")
    app.include_router(admin_knowledge_base_router, prefix="/api")
    app.include_router(admin_website_router, prefix="/api")
    app.include_router(admin_translation_bulk_router, prefix="/api")
    app.include_router(admin_public_languages_router, prefix="/api")
    app.include_router(local_public_content_router, prefix="/api")
    return True


# Local editorial authoring writes to a CONTENT_DATA_DIR-backed filesystem
# repository (private.routers.public_content) and must read back from that
# same repository. Production (and any process without local editorial
# enabled) serves the packaged, entitlement-gated read-only corpus instead
# (public.content_api). Both routers answer the same /api/content/* paths,
# so exactly one is mounted per process.
if not _include_local_editorial_routes():
    from public.content_api import router as public_content_router

    app.include_router(public_content_router, prefix="/api")
app.include_router(me_router, prefix="/api")
app.include_router(billing_router, prefix="/api")

# Production SPA is same-origin behind the ALB. Restrict CORS when configured;
# local mock development keeps the permissive default.
_CORS_ALLOWED_ORIGINS_RAW = os.environ.get("CORS_ALLOWED_ORIGINS", "").strip()
_CORS_ALLOWED_ORIGINS = (
    [origin.strip() for origin in _CORS_ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]
    if _CORS_ALLOWED_ORIGINS_RAW
    else ["*"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ALLOWED_ORIGINS,
    allow_credentials=_CORS_ALLOWED_ORIGINS != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Cognito JWT validation ─────────────────────────────────────────────────────
_COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
_COGNITO_REGION = os.environ.get("COGNITO_REGION", "")
_COGNITO_CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID", "")
_COGNITO_ISSUER = (
    f"https://cognito-idp.{_COGNITO_REGION}.amazonaws.com/{_COGNITO_USER_POOL_ID}"
    if _COGNITO_USER_POOL_ID and _COGNITO_REGION else ""
)
_JWKS_CACHE: dict | None = None

_COGNITO_CONFIGURED = bool(
    _COGNITO_USER_POOL_ID and _COGNITO_REGION and _COGNITO_CLIENT_ID
)
_AUTH_ENABLED = _COGNITO_CONFIGURED
_UNPROTECTED_PATHS = {"/health", "/callback", "/api/billing/webhook"}
_PUBLIC_GUEST_CONTENT_PATHS = {"/api/content/public-languages"}
_PUBLIC_GUEST_CONTENT_PREFIXES = ("/api/content/website/",)


def _is_public_spa_request(request: Request) -> bool:
    """Allow the public SPA shell, guest website content, and static assets.

    StaticFiles is mounted at `/`, so a browser must be able to request the
    initial HTML document, hashed assets, and public images without a bearer
    token. The published language configuration and public marketing website
    are also needed before sign-in. All other APIs and calculation routes
    remain Cognito-protected.
    """
    path = request.url.path
    is_static_or_spa_route = not path.startswith("/api") and path not in CALCULATOR_PATHS
    is_guest_content_route = (
        path in _PUBLIC_GUEST_CONTENT_PATHS
        or path.startswith(_PUBLIC_GUEST_CONTENT_PREFIXES)
    )
    return request.method in {"GET", "HEAD"} and (
        is_static_or_spa_route or is_guest_content_route
    )


if not _COGNITO_CONFIGURED:
    raise RuntimeError(
        "AUTH_MODE=cognito requires COGNITO_USER_POOL_ID, COGNITO_REGION, "
        "and COGNITO_CLIENT_ID to be set."
    )


def _assert_token_audience(claims: dict) -> None:
    """Reject tokens that were not issued for this app client.

    Cognito access tokens carry `client_id`; ID tokens carry `aud`.
    """
    expected = _COGNITO_CLIENT_ID
    if not expected:
        raise JWTError("COGNITO_CLIENT_ID is not configured")

    candidates: list[str] = []
    client_id = claims.get("client_id")
    if isinstance(client_id, str) and client_id.strip():
        candidates.append(client_id.strip())

    audience = claims.get("aud")
    if isinstance(audience, str) and audience.strip():
        candidates.append(audience.strip())
    elif isinstance(audience, (list, tuple)):
        candidates.extend(
            str(item).strip() for item in audience if str(item).strip()
        )

    if expected not in candidates:
        raise JWTError("Token client/audience mismatch")


async def _get_jwks() -> dict:
    global _JWKS_CACHE
    if _JWKS_CACHE is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{_COGNITO_ISSUER}/.well-known/jwks.json")
            resp.raise_for_status()
            _JWKS_CACHE = resp.json()
    return _JWKS_CACHE


def _auth_failure_reason(exc: Exception) -> str:
    message = str(exc).lower()
    if isinstance(exc, ExpiredSignatureError):
        return "expired_token"
    if "audience" in message or "client" in message:
        return "audience_mismatch"
    return "invalid_token"


@app.middleware("http")
async def calculator_request_size_limit_middleware(request: Request, call_next):
    if request.method == "POST" and request.url.path in CALCULATOR_PATHS:
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                if int(content_length) > CALCULATOR_MAX_BODY_BYTES:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Request body too large."},
                    )
            except ValueError:
                pass
    return await call_next(request)


@app.middleware("http")
async def cognito_auth_middleware(request: Request, call_next):
    if (
        not _AUTH_ENABLED
        or request.url.path in _UNPROTECTED_PATHS
        or _is_public_spa_request(request)
    ):
        return await call_next(request)

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        auth_logger.warning(
            "Authentication failed path=%s reason=missing_token",
            request.url.path,
        )
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    token = auth_header[len("Bearer "):]
    try:
        jwks = await _get_jwks()
        claims = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=_COGNITO_ISSUER,
            options={"verify_at_hash": False, "verify_aud": False},
        )
        _assert_token_audience(claims)
        request.state.jwt_claims = claims
    except ExpiredSignatureError:
        auth_logger.warning(
            "Authentication failed path=%s reason=expired_token",
            request.url.path,
        )
        return JSONResponse(status_code=401, content={"detail": "Token expired"})
    except JWTError as exc:
        auth_logger.warning(
            "Authentication failed path=%s reason=%s",
            request.url.path,
            _auth_failure_reason(exc),
        )
        return JSONResponse(status_code=401, content={"detail": "Invalid token"})
    except Exception:
        auth_logger.warning(
            "Authentication failed path=%s reason=invalid_token",
            request.url.path,
        )
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    return await call_next(request)

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
    try:
        validate_calculate_request(req.polygonPoints, req.referenceMeasurements)
    except InputLimitError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None

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

    if wood_boundary_polygons is None:
        wood_boundary_polygons = [wood_boundary_points] if len(wood_boundary_points) > 0 else []

    try:
        validate_calculate_wood_request(
            mold_boundary_points=mold_boundary_points,
            wood_boundary_polygons=wood_boundary_polygons,
            cavity_polygons=cavity_polygons,
            reference_measurements=reference_measurements,
        )
    except InputLimitError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None

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


class CalculatePourLayersRequest(BaseModel):
    mainDepthMm: float
    maxPourThicknessMm: float
    resinSurfaceAreaCm2: float
    firstFillThicknessMm: Optional[float] = None


class CalculateFirstFillRequest(BaseModel):
    resinSurfaceAreaCm2: float
    firstFillThicknessMm: float


@app.post("/calculate-pour-layers")
def calculate_pour_layers(req: CalculatePourLayersRequest):
    main_depth = req.mainDepthMm
    max_pour = req.maxPourThicknessMm
    area_cm2 = req.resinSurfaceAreaCm2
    first_fill = req.firstFillThicknessMm

    if main_depth <= 0:
        raise HTTPException(status_code=400, detail="mainDepthMm must be > 0.")
    if max_pour <= 0:
        raise HTTPException(status_code=400, detail="maxPourThicknessMm must be > 0.")
    if area_cm2 <= 0:
        raise HTTPException(status_code=400, detail="resinSurfaceAreaCm2 must be > 0.")
    if first_fill is not None and (first_fill <= 0 or first_fill > main_depth):
        raise HTTPException(status_code=400, detail="firstFillThicknessMm must be > 0 and not exceed mainDepthMm.")

    def build_row(label, thickness_mm, row_type="mainPour"):
        volume_liters = area_cm2 * (thickness_mm / 10.0) / 1000.0
        return {
            "label": label,
            "type": row_type,
            "thicknessMm": thickness_mm,
            "volumeLiters": volume_liters,
            "recommendedVolumeLiters": volume_liters * (1.0 + RESIN_SAFETY_MARGIN),
        }

    rows = []
    remaining_mm = main_depth

    if first_fill is not None:
        rows.append(build_row("Pour 1 — First Fill Seal Coat", first_fill, "firstFill"))
        remaining_mm = max(0.0, main_depth - first_fill)

    remaining_hundredths = round(remaining_mm * 100)
    max_pour_hundredths = max(1, int(max_pour * 100))
    remaining_pour_count = -(-remaining_hundredths // max_pour_hundredths) if remaining_hundredths > 0 else 0  # ceiling div
    base_hundredths = remaining_hundredths // remaining_pour_count if remaining_pour_count > 0 else 0
    extra_hundredths = remaining_hundredths % remaining_pour_count if remaining_pour_count > 0 else 0

    for idx in range(remaining_pour_count):
        thickness_hundredths = base_hundredths + (1 if idx < extra_hundredths else 0)
        rows.append(build_row(f"Pour {len(rows) + 1}", thickness_hundredths / 100.0))

    return {"rows": rows, "layerCount": len(rows)}


@app.post("/calculate-first-fill")
def calculate_first_fill(req: CalculateFirstFillRequest):
    area_cm2 = req.resinSurfaceAreaCm2
    thickness_mm = req.firstFillThicknessMm

    if area_cm2 <= 0:
        raise HTTPException(status_code=400, detail="resinSurfaceAreaCm2 must be > 0.")
    if thickness_mm <= 0:
        raise HTTPException(status_code=400, detail="firstFillThicknessMm must be > 0.")

    volume_liters = area_cm2 * (thickness_mm / 10.0) / 1000.0
    return {"volumeLiters": volume_liters}


@app.get("/health")
def health():
    return {"status": "ok"}


class SpaStaticFiles(StaticFiles):
    """Serve index.html for extensionless client-side SPA routes.

    Missing API paths and missing files retain their 404 responses so frontend
    routing does not conceal backend or asset errors. Non-public HTML document
    responses receive X-Robots-Tag: noindex, nofollow so crawlers do not have
    to execute JavaScript to see the indexing policy.
    """

    async def get_response(self, path: str, scope):
        raw_path = scope.get("path") or scope.get("raw_path", path)
        if isinstance(raw_path, bytes):
            raw_path = raw_path.decode("ascii", errors="ignore")
        request_path = str(raw_path)
        if not request_path.startswith("/"):
            request_path = "/" + request_path.lstrip("/")
        relative_path = path.lstrip("/")
        is_api_path = request_path.startswith("/api/") or relative_path.startswith("api/")
        try:
            response = await super().get_response(path, scope)
        except Exception as exc:
            if (
                getattr(exc, "status_code", None) != 404
                or scope["method"] not in {"GET", "HEAD"}
                or is_api_path
                or Path(relative_path).suffix
            ):
                raise
            response = await super().get_response("index.html", scope)
            return self._with_document_robots(response, request_path, is_api_path)

        if (
            response.status_code != 404
            or scope["method"] not in {"GET", "HEAD"}
            or is_api_path
            or Path(relative_path).suffix
        ):
            return self._with_document_robots(response, request_path, is_api_path)
        response = await super().get_response("index.html", scope)
        return self._with_document_robots(response, request_path, is_api_path)

    @staticmethod
    def _with_document_robots(response, request_path: str, is_api_path: bool):
        if (
            getattr(response, "status_code", None) != 200
            or is_api_path
            or not is_extensionless_spa_path(request_path)
        ):
            return response
        return apply_spa_document_robots_header(response, request_path)


# Serve built frontend in production (static/ folder is present in the Docker image)
_static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_static_dir):
    _index_html = os.path.join(_static_dir, "index.html")

    @app.get("/callback", include_in_schema=False)
    async def spa_callback():
        return apply_spa_document_robots_header(FileResponse(_index_html), "/callback")

    app.mount("/", SpaStaticFiles(directory=_static_dir, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)