import { buildAuthHeaders } from "../auth/authHeaders.js";

const API_BASE_URL = "";

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

export async function fetchCapabilities() {
  const response = await fetch(`${API_BASE_URL}/api/me/capabilities`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}
