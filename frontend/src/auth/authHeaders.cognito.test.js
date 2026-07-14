import { afterEach, describe, expect, it, vi } from "vitest";

const fetchAuthSession = vi.hoisted(() => vi.fn());

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession,
}));

describe("buildAuthHeaders cognito mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    fetchAuthSession.mockReset();
  });

  it("uses bearer token in cognito mode and does not send mock headers", async () => {
    vi.stubEnv("VITE_AUTH_MODE", "cognito");
    fetchAuthSession.mockResolvedValue({
      tokens: {
        accessToken: {
          toString: () => "cognito-access-token",
        },
      },
    });

    const { buildAuthHeaders } = await import("./authHeaders.js");
    const headers = await buildAuthHeaders();
    expect(headers.Authorization).toBe("Bearer cognito-access-token");
    expect(headers["X-Mock-User-Id"]).toBeUndefined();
    expect(headers["X-Mock-Role"]).toBeUndefined();
  });
});
