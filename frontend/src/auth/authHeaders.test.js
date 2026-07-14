import { afterEach, describe, expect, it, vi } from "vitest";
import { mockAuthAdapter } from "./authAdapter.js";
import { buildAuthHeaders, isMockAuthMode } from "./authHeaders.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

describe("buildAuthHeaders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    sessionStorage.clear();
  });

  it("uses mock headers in mock auth mode", async () => {
    vi.stubEnv("VITE_AUTH_MODE", "mock");
    vi.stubEnv("VITE_MOCK_ADMIN", "false");
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-1", role: "user", email: "a@example.com", username: "a" } }),
    );

    const headers = await buildAuthHeaders();
    expect(headers["X-Mock-User-Id"]).toBe("user-1");
    expect(headers["X-Mock-Role"]).toBe("user");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers.Authorization).toBeUndefined();
    expect(isMockAuthMode()).toBe(true);
  });

  it("includes optional mock access tier header", async () => {
    vi.stubEnv("VITE_AUTH_MODE", "mock");
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-1", role: "user", email: "a@example.com", username: "a" } }),
    );
    sessionStorage.setItem("hfzwood.mockAccessTier", "subscriber");

    const headers = await buildAuthHeaders();
    expect(headers["X-Mock-Access-Tier"]).toBe("subscriber");
  });

  it("falls back to stub user when session is empty", async () => {
    vi.stubEnv("VITE_AUTH_MODE", "mock");
    sessionStorage.clear();
    mockAuthAdapter.logout();

    const headers = await buildAuthHeaders({ includeJsonContentType: false });
    expect(headers["X-Mock-User-Id"]).toBe("stub-user");
    expect(headers["X-Mock-Role"]).toBe("user");
    expect(headers["Content-Type"]).toBeUndefined();
  });
});
