from copy import deepcopy

from .schema import CAPABILITY_KEYS, CATALOG_VERSION, validate_capability_map

# calculator.formworkMode: "rectangle" = simple four-point / rectangular workflow;
# "advanced" = full formwork / complex polygon workflow.

CAPABILITY_CATALOG: dict[str, dict[str, object]] = {
    "free": {
        "calculator.maxPolygonPoints": 4,
        "calculator.pdfExport": False,
        "calculator.exportFormat": "none",
        "calculator.layerCalculation": False,
        "calculator.formworkMode": "rectangle",
        "calculator.advancedReports": False,
        "projects.maxSavedProjects": 3,
        "knowledgeBase.maxArticles": 5,
        "tutorial.maxVideos": 5,
        "ai.enabled": False,
        "ai.maxRequestsPerDay": 0,
    },
    "subscriber": {
        "calculator.maxPolygonPoints": None,
        "calculator.pdfExport": True,
        "calculator.exportFormat": "pdf_and_csv",
        "calculator.layerCalculation": True,
        "calculator.formworkMode": "advanced",
        "calculator.advancedReports": True,
        "projects.maxSavedProjects": None,
        "knowledgeBase.maxArticles": None,
        "tutorial.maxVideos": None,
        "ai.enabled": True,
        "ai.maxRequestsPerDay": 50,
    },
    "administrator_unlimited": {
        "calculator.maxPolygonPoints": None,
        "calculator.pdfExport": True,
        "calculator.exportFormat": "pdf_and_csv",
        "calculator.layerCalculation": True,
        "calculator.formworkMode": "advanced",
        "calculator.advancedReports": True,
        "projects.maxSavedProjects": None,
        "knowledgeBase.maxArticles": None,
        "tutorial.maxVideos": None,
        "ai.enabled": True,
        "ai.maxRequestsPerDay": None,
    },
}


def catalog_for_tier(access_tier: str) -> dict[str, object]:
    if access_tier not in CAPABILITY_CATALOG:
        raise KeyError(access_tier)
    return deepcopy(CAPABILITY_CATALOG[access_tier])


def validate_catalog() -> None:
    for tier, capabilities in CAPABILITY_CATALOG.items():
        validate_capability_map(capabilities)
    if set(CAPABILITY_CATALOG.keys()) != {"free", "subscriber", "administrator_unlimited"}:
        raise ValueError("Capability catalog must define free, subscriber, and administrator_unlimited.")
    for tier in CAPABILITY_CATALOG:
        if set(CAPABILITY_CATALOG[tier].keys()) != set(CAPABILITY_KEYS):
            raise ValueError(f"Catalog tier '{tier}' is missing capability keys.")


validate_catalog()
