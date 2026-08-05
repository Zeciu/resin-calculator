export const CATALOG_VERSION = 1;

export const FREE_CAPABILITIES = {
  "calculator.maxPolygonPoints": 4,
  "calculator.pdfExport": false,
  "calculator.exportFormat": "none",
  "calculator.layerCalculation": false,
  "calculator.formworkMode": "rectangle",
  "calculator.advancedReports": false,
  "projects.maxSavedProjects": 3,
  "knowledgeBase.maxArticles": 5,
  "tutorial.maxVideos": 5,
  "ai.enabled": false,
  "ai.maxRequestsPerDay": 0,
};

export const GUEST_CAPABILITIES_RESPONSE = {
  role: "user",
  accessTier: "free",
  catalogVersion: CATALOG_VERSION,
  capabilities: FREE_CAPABILITIES,
};
