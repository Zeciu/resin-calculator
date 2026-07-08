import { mockAuthAdapter } from "../auth/authAdapter.js";
import { normalizePreferences } from "./preferencesConstants.js";

const API_BASE_URL = "";

export function preferencesHeaders() {
  const user = mockAuthAdapter.restoreSession();
  return {
    "Content-Type": "application/json",
    "X-Mock-User-Id": user?.id ?? "stub-user",
    "X-Mock-Role": user?.role ?? "user",
  };
}

async function parseError(response) {
  try {
    const payload = await response.json();
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

export async function fetchPreferences() {
  const response = await fetch(`${API_BASE_URL}/api/preferences`, {
    headers: preferencesHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const payload = await response.json();
  return normalizePreferences(payload);
}

export async function savePreferences(patch) {
  const response = await fetch(`${API_BASE_URL}/api/preferences`, {
    method: "PUT",
    headers: preferencesHeaders(),
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const payload = await response.json();
  return normalizePreferences(payload);
}
