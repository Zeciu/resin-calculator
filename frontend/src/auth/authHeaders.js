import { fetchAuthSession } from "aws-amplify/auth";
import { mockAuthAdapter } from "./authAdapter.js";
import { isMockAuthMode } from "./authMode.js";

const MOCK_ACCESS_TIER_KEY = "hfzwood.mockAccessTier";

export { isMockAuthMode } from "./authMode.js";

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

async function readCognitoAccessToken() {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();
    return typeof token === "string" && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

export async function buildAuthHeaders({ includeJsonContentType = true } = {}) {
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

  const token = await readCognitoAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
