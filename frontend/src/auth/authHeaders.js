import { mockAuthAdapter } from "./authAdapter.js";

const MOCK_ACCESS_TIER_KEY = "hfzwood.mockAccessTier";
const ACCESS_TOKEN_KEY = "hfzwood.accessToken";

export function isMockAuthMode() {
  const mode = import.meta.env.VITE_AUTH_MODE;
  if (typeof mode === "string" && mode.trim().toLowerCase() === "cognito") {
    return false;
  }
  return true;
}

function readMockAccessTier() {
  try {
    const value = sessionStorage.getItem(MOCK_ACCESS_TIER_KEY);
    if (value === "free" || value === "subscriber") {
      return value;
    }
  } catch {
    // ignore
  }
  return null;
}

function readAccessToken() {
  try {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    return typeof token === "string" && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

export function buildAuthHeaders({ includeJsonContentType = true } = {}) {
  const headers = {};
  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (isMockAuthMode()) {
    const user = mockAuthAdapter.restoreSession();
    headers["X-Mock-User-Id"] = user?.id ?? "stub-user";
    headers["X-Mock-Role"] = user?.role ?? "user";
    const mockAccessTier = readMockAccessTier();
    if (mockAccessTier) {
      headers["X-Mock-Access-Tier"] = mockAccessTier;
    }
    return headers;
  }

  const token = readAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
