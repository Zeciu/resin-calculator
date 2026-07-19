import { buildAuthHeaders } from "../auth/authHeaders.js";

const API_BASE_URL = "";

export async function adminHeaders(includeJsonContentType = true) {
  return buildAuthHeaders({ includeJsonContentType });
}

export async function parseAdminError(response) {
  const status = response.status;
  try {
    const payload = await response.json();
    const detail = payload?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail.trim();
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first === "string" && first.trim()) {
        return first.trim();
      }
      if (typeof first?.msg === "string" && first.msg.trim()) {
        return first.msg.trim();
      }
    }
    if (detail && typeof detail === "object" && typeof detail.msg === "string" && detail.msg.trim()) {
      return detail.msg.trim();
    }
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {
    // Fall through to status-based message when the body is not JSON.
  }
  return `Request failed (${status})`;
}

export class AdminApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   */
  constructor(message, status) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

/**
 * @param {string} basePath e.g. "/api/admin/manual/chapters"
 */
export function createEditorialAdminClient(basePath) {
  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${basePath}${path}`, {
      ...options,
      headers: {
        ...(await adminHeaders()),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new AdminApiError(await parseAdminError(response), response.status);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}${basePath}/images`, {
      method: "POST",
      headers: await adminHeaders(false),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await parseAdminError(response));
    }

    return response.json();
  }

  return { request, uploadImage };
}

export async function searchEditorialReferences(query, locale = "ro", options = {}) {
  const params = new URLSearchParams({ q: query, locale });
  if (options.publishedOnly) {
    params.set("publishedOnly", "true");
  }
  const response = await fetch(`${API_BASE_URL}/api/admin/references/search?${params.toString()}`, {
    headers: await adminHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseAdminError(response));
  }

  return response.json();
}
