import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProviderForTests } from "../auth/AuthContext.jsx";
import { CapabilitiesProvider, useCapabilities } from "./CapabilitiesContext.jsx";
import { FREE_CAPABILITIES, GUEST_CAPABILITIES_RESPONSE } from "./capabilityDefaults.js";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const SUBSCRIBER_RESPONSE = {
  role: "user",
  accessTier: "subscriber",
  catalogVersion: 1,
  capabilities: {
    ...FREE_CAPABILITIES,
    "calculator.pdfExport": true,
    "calculator.maxPolygonPoints": null,
  },
};

function StatusProbe() {
  const { capabilities, error, reloadCapabilities } = useCapabilities();
  return (
    <div>
      <span data-testid="tier">{capabilities.accessTier}</span>
      <span data-testid="error">{error || ""}</span>
      <button type="button" onClick={() => void reloadCapabilities()}>
        reload
      </button>
    </div>
  );
}

describe("CapabilitiesProvider fail-soft refresh", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a", role: "user" } }),
    );
  });

  it("keeps last successful capabilities when refresh fails", async () => {
    let failNext = false;
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      const path = String(url);
      if (!path.endsWith("/api/me/capabilities")) {
        return Promise.reject(new Error(`Unhandled fetch: ${path}`));
      }
      if (failNext) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ detail: "temporary failure" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => SUBSCRIBER_RESPONSE,
      });
    });

    render(
      <AuthProviderForTests>
        <CapabilitiesProvider>
          <PreferencesProvider>
            <StatusProbe />
          </PreferencesProvider>
        </CapabilitiesProvider>
      </AuthProviderForTests>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("tier")).toHaveTextContent("subscriber");
    });

    failNext = true;
    screen.getByRole("button", { name: "reload" }).click();

    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).not.toEqual("");
    });
    expect(screen.getByTestId("tier")).toHaveTextContent("subscriber");
    expect(screen.getByTestId("tier")).not.toHaveTextContent(GUEST_CAPABILITIES_RESPONSE.accessTier);
  });
});
