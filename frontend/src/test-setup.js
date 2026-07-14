import "@testing-library/jest-dom";
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("VITE_AUTH_MODE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});
