import { describe, expect, it, vi } from "vitest";
import {
  assertProductionAuthConfig,
  isCognitoAuthMode,
  isMockAuthMode,
  resolveAuthMode,
} from "./authMode.js";

describe("authMode", () => {
  it("defaults to mock mode when VITE_AUTH_MODE is unset", () => {
    vi.stubEnv("VITE_AUTH_MODE", "");
    expect(resolveAuthMode()).toBe("mock");
    expect(isMockAuthMode()).toBe(true);
    expect(isCognitoAuthMode()).toBe(false);
    vi.unstubAllEnvs();
  });

  it("selects cognito mode when configured", () => {
    vi.stubEnv("VITE_AUTH_MODE", "cognito");
    expect(resolveAuthMode()).toBe("cognito");
    expect(isCognitoAuthMode()).toBe(true);
    vi.unstubAllEnvs();
  });

  it("rejects mock mode in production builds", () => {
    vi.stubEnv("VITE_AUTH_MODE", "mock");
    vi.stubEnv("PROD", true);
    expect(() => assertProductionAuthConfig()).toThrow(/VITE_AUTH_MODE=cognito/);
    vi.unstubAllEnvs();
  });
});
