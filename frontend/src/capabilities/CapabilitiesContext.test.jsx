import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProviderForTests } from "../auth/AuthContext.jsx";
import { CapabilitiesProvider, useCapability, useCapabilityLimit } from "./CapabilitiesContext.jsx";
import { CAPABILITY_KEYS } from "./capabilityKeys.js";
import { GUEST_CAPABILITIES_RESPONSE } from "./capabilityDefaults.js";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { PublicLanguagesProvider } from "../publicLanguages/PublicLanguagesContext.jsx";
import { mockCapabilitiesFetch, seedDevicePreferences } from "../preferences/testHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const ADMIN_CAPABILITIES = {
  role: "administrator",
  accessTier: "administrator_unlimited",
  catalogVersion: 1,
  capabilities: {
    ...GUEST_CAPABILITIES_RESPONSE.capabilities,
    "calculator.maxPolygonPoints": null,
    "calculator.pdfExport": true,
    "projects.maxSavedProjects": null,
    "ai.maxRequestsPerDay": null,
  },
};

function CapabilityProbe() {
  const pdfExport = useCapability(CAPABILITY_KEYS.CALCULATOR_PDF_EXPORT);
  const polygonLimit = useCapabilityLimit(CAPABILITY_KEYS.CALCULATOR_MAX_POLYGON_POINTS);
  return (
    <div>
      <span data-testid="pdf-export">{String(pdfExport)}</span>
      <span data-testid="polygon-limit">{polygonLimit === null ? "unlimited" : String(polygonLimit)}</span>
    </div>
  );
}

function renderCapabilitiesTree() {
  return render(
    <AuthProviderForTests>
      <CapabilitiesProvider>
        <PublicLanguagesProvider>
          <PreferencesProvider>
            <CapabilityProbe />
          </PreferencesProvider>
        </PublicLanguagesProvider>
      </CapabilitiesProvider>
    </AuthProviderForTests>,
  );
}

function mockCapabilitiesApiFetch(response = GUEST_CAPABILITIES_RESPONSE) {
  return vi.spyOn(global, "fetch").mockImplementation((url) => {
    const path = String(url);
    if (path.endsWith("/api/content/public-languages")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          defaultPublicLocale: "en",
          activePublicLocales: ["en", "ro"],
        }),
      });
    }
    if (path.endsWith("/api/me/capabilities")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => response,
      });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${path}`));
  });
}

describe("CapabilitiesProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("loads capabilities after authentication", async () => {
    mockCapabilitiesApiFetch();
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a", role: "user" } }),
    );

    renderCapabilitiesTree();

    await waitFor(() => {
      expect(screen.getByTestId("pdf-export")).toHaveTextContent("false");
    });
    expect(screen.getByTestId("polygon-limit")).toHaveTextContent("4");
  });

  it("returns boolean values from useCapability", async () => {
    mockCapabilitiesApiFetch({
      ...GUEST_CAPABILITIES_RESPONSE,
      capabilities: {
        ...GUEST_CAPABILITIES_RESPONSE.capabilities,
        "calculator.pdfExport": true,
      },
    });
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a", role: "user" } }),
    );

    renderCapabilitiesTree();

    await waitFor(() => {
      expect(screen.getByTestId("pdf-export")).toHaveTextContent("true");
    });
  });

  it("returns numeric limits and unlimited from useCapabilityLimit", async () => {
    mockCapabilitiesApiFetch(ADMIN_CAPABILITIES);
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        user: { id: "admin", email: "admin@example.com", username: "admin", role: "administrator" },
      }),
    );

    renderCapabilitiesTree();

    await waitFor(() => {
      expect(screen.getByTestId("polygon-limit")).toHaveTextContent("unlimited");
    });
  });

  it("does not interfere with preferences provider", async () => {
    const fetchMock = mockCapabilitiesFetch();
    seedDevicePreferences({
      interfaceLanguage: "ro",
      lengthUnit: "cm",
      volumeUnit: "ml",
    });
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a", role: "user" } }),
    );

    function CombinedProbe() {
      const language = useCapability(CAPABILITY_KEYS.CALCULATOR_PDF_EXPORT);
      return <span data-testid="combined">{String(language)}</span>;
    }

    render(
      <AuthProviderForTests>
        <CapabilitiesProvider>
          <PublicLanguagesProvider>
            <PreferencesProvider>
              <CombinedProbe />
            </PreferencesProvider>
          </PublicLanguagesProvider>
        </CapabilitiesProvider>
      </AuthProviderForTests>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    const calledPaths = fetchMock.mock.calls.map(([url]) => String(url));
    expect(calledPaths.some((path) => path.endsWith("/api/preferences"))).toBe(false);
    expect(calledPaths.some((path) => path.endsWith("/api/me/capabilities"))).toBe(true);
  });
});
