import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockAuthAdapter } from "./authAdapter.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

describe("mockAuthAdapter roles", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  it("assigns administrator on login when VITE_MOCK_ADMIN is true", () => {
    vi.stubEnv("VITE_MOCK_ADMIN", "true");

    const user = mockAuthAdapter.login({
      email: "admin@example.com",
      username: "admin",
    });

    expect(user.role).toBe("administrator");
  });

  it("upgrades restored sessions when VITE_MOCK_ADMIN is true", () => {
    vi.stubEnv("VITE_MOCK_ADMIN", "true");
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        user: {
          id: "stub-user",
          email: "user@example.com",
          username: "user",
          role: "user",
        },
      }),
    );

    const user = mockAuthAdapter.restoreSession();

    expect(user.role).toBe("administrator");
  });

  it("assigns user on login when VITE_MOCK_ADMIN is false", () => {
    vi.stubEnv("VITE_MOCK_ADMIN", "false");

    const user = mockAuthAdapter.login({
      email: "user@example.com",
      username: "user",
    });

    expect(user.role).toBe("user");
  });
});
