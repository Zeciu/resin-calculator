from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

AccessTier = Literal["free", "subscriber", "administrator_unlimited"]
Role = Literal["user", "administrator"]

VALID_ACCESS_TIERS = frozenset({"free", "subscriber", "administrator_unlimited"})
VALID_ROLES = frozenset({"user", "administrator"})

FORMWORK_MODES = frozenset({"rectangle", "advanced"})
EXPORT_FORMATS = frozenset({"none", "pdf", "pdf_and_csv"})

CAPABILITY_KEYS: tuple[str, ...] = (
    "calculator.maxPolygonPoints",
    "calculator.pdfExport",
    "calculator.exportFormat",
    "calculator.layerCalculation",
    "calculator.formworkMode",
    "calculator.advancedReports",
    "projects.maxSavedProjects",
    "knowledgeBase.maxArticles",
    "tutorial.maxVideos",
    "ai.enabled",
    "ai.maxRequestsPerDay",
)

CATALOG_VERSION = 1


class CapabilitiesResponse(BaseModel):
    role: Role
    accessTier: AccessTier
    catalogVersion: int = CATALOG_VERSION
    capabilities: dict[str, Any]

    @field_validator("capabilities")
    @classmethod
    def validate_capability_keys(cls, capabilities: dict[str, Any]) -> dict[str, Any]:
        validate_capability_map(capabilities)
        return capabilities


def validate_capability_map(capabilities: dict[str, Any]) -> None:
    missing = [key for key in CAPABILITY_KEYS if key not in capabilities]
    if missing:
        raise ValueError(f"Missing capability keys: {', '.join(missing)}")

    max_points = capabilities["calculator.maxPolygonPoints"]
    if max_points is not None and (not isinstance(max_points, int) or max_points < 1):
        raise ValueError("calculator.maxPolygonPoints must be a positive integer or null.")

    for bool_key in (
        "calculator.pdfExport",
        "calculator.layerCalculation",
        "calculator.advancedReports",
        "ai.enabled",
    ):
        if not isinstance(capabilities[bool_key], bool):
            raise ValueError(f"{bool_key} must be a boolean.")

    formwork = capabilities["calculator.formworkMode"]
    if formwork not in FORMWORK_MODES:
        raise ValueError("calculator.formworkMode must be 'rectangle' or 'advanced'.")

    export_format = capabilities["calculator.exportFormat"]
    if export_format not in EXPORT_FORMATS:
        raise ValueError("calculator.exportFormat must be none, pdf, or pdf_and_csv.")

    for limit_key in (
        "projects.maxSavedProjects",
        "knowledgeBase.maxArticles",
        "tutorial.maxVideos",
        "ai.maxRequestsPerDay",
    ):
        value = capabilities[limit_key]
        if value is not None and (not isinstance(value, int) or value < 0):
            raise ValueError(f"{limit_key} must be a non-negative integer or null.")
