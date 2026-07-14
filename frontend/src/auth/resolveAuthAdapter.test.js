import { describe, expect, it, vi } from "vitest";
import { mockAuthAdapter, resolveAuthAdapter } from "./authAdapter.js";
import { cognitoAuthAdapter } from "./cognitoAuthAdapter.js";

describe("resolveAuthAdapter", () => {
  it("selects mock adapter by default", () => {
    vi.stubEnv("VITE_AUTH_MODE", "mock");
    expect(resolveAuthAdapter()).toBe(mockAuthAdapter);
    vi.unstubAllEnvs();
  });

  it("selects cognito adapter in cognito mode", () => {
    vi.stubEnv("VITE_AUTH_MODE", "cognito");
    expect(resolveAuthAdapter()).toBe(cognitoAuthAdapter);
    vi.unstubAllEnvs();
  });
});
