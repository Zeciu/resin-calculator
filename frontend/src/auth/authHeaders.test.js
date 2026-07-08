import { describe, expect, it, vi } from "vitest";
import { mockAuthAdapter } from "./authAdapter.js";
import { buildAuthHeaders, isMockAuthMode } from "./authHeaders.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

describe("buildAuthHeaders", () => {
  it("uses mock headers in mock auth mode", () => {
    vi.stubEnv("VITE_AUTH_MODE", "mock");
    vi.stubEnv("VITE_MOCK_ADMIN", "false");
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-1", role: "user", email: "a@example.com", username: "a" } }),
    );

    const headers = buildAuthHeaders();
    expect(headers["X-Mock-User-Id"]).toBe("user-1");
    expect(headers["X-Mock-Role"]).toBe("user");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(isMockAuthMode()).toBe(true);
    vi.unstubAllEnvs();
  });

  it("includes optional mock access tier header", () => {
    vi.stubEnv("VITE_AUTH_MODE", "mock");
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-1", role: "user", email: "a@example.com", username: "a" } }),
    );
    sessionStorage.setItem("hfzwood.mockAccessTier", "subscriber");

    const headers = buildAuthHeaders();
    expect(headers["X-Mock-Access-Tier"]).toBe("subscriber");
    vi.unstubAllEnvs();
  });

  it("falls back to stub user when session is empty", () => {
    vi.stubEnv("VITE_AUTH_MODE", "mock");
    sessionStorage.clear();
    mockAuthAdapter.logout();

    const headers = buildAuthHeaders({ includeJsonContentType: false });
    expect(headers["X-Mock-User-Id"]).toBe("stub-user");
    expect(headers["X-Mock-Role"]).toBe("user");
    expect(headers["Content-Type"]).toBeUndefined();
    vi.unstubAllEnvs();
  });
});
