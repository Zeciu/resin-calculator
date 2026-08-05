import "@testing-library/jest-dom";
import { Amplify } from "aws-amplify";
import { afterEach, beforeEach, vi } from "vitest";
import { FREE_CAPABILITIES } from "./capabilities/capabilityDefaults.js";

// Component tests render AuthProvider (and anything else touching
// aws-amplify/auth, e.g. cognitoAuthAdapter.restoreSession()/getCurrentUser())
// without going through main.jsx, which is the only place Amplify.configure()
// normally runs. Configure Amplify once here with a fixed dummy pool so
// aws-amplify's Cognito calls resolve (to "no session") instead of warning
// "Amplify has not been configured" and leaving requests hanging.
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "eu-central-1_testpool",
      userPoolClientId: "test-client-id",
    },
  },
});

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
