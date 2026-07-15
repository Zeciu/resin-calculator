import "@testing-library/jest-dom";
import { afterEach, beforeEach, vi } from "vitest";
import { FREE_CAPABILITIES } from "./capabilities/capabilityDefaults.js";

const DEFAULT_TEST_CAPABILITIES_RESPONSE = {
  role: "user",
  accessTier: "subscriber",
  catalogVersion: 1,
  capabilities: {
    ...FREE_CAPABILITIES,
    "calculator.maxPolygonPoints": null,
    "calculator.pdfExport": true,
    "calculator.layerCalculation": true,
    "calculator.formworkMode": "advanced",
    "calculator.advancedReports": true,
    "calculator.exportFormat": "pdf_and_csv",
    "knowledgeBase.maxArticles": null,
  },
};

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_AUTH_MODE", "mock");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/api/me/capabilities")) {
        return {
          ok: true,
          json: async () => DEFAULT_TEST_CAPABILITIES_RESPONSE,
        };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ detail: "Not found" }),
      };
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
