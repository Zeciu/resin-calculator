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

async function postJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: await buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function fetchBillingStatus() {
  const response = await fetch(`${API_BASE_URL}/api/billing/status`, {
    headers: await buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function createCheckoutSession() {
  return postJson("/api/billing/checkout-session");
}

export async function createPortalSession() {
  return postJson("/api/billing/portal-session");
}
