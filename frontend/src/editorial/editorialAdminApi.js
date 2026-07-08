import { buildAuthHeaders } from "../auth/authHeaders.js";

const API_BASE_URL = "";

export function adminHeaders(includeJsonContentType = true) {
  return buildAuthHeaders({ includeJsonContentType });
}

export async function parseAdminError(response) {
  try {
    const payload = await response.json();
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    if (Array.isArray(payload.detail) && payload.detail[0]?.msg) {
      return payload.detail[0].msg;
    }
  } catch {
    // ignore parse failures
  }
  return `Request failed (${response.status})`;
}

/**
 * @param {string} basePath e.g. "/api/admin/manual/chapters"
 */
export function createEditorialAdminClient(basePath) {
  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${basePath}${path}`, {
      ...options,
      headers: {
        ...adminHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(await parseAdminError(response));
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
      headers: adminHeaders(false),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await parseAdminError(response));
    }

    return response.json();
  }

  return { request, uploadImage };
}

export async function searchEditorialReferences(query, locale = "en") {
  const params = new URLSearchParams({ q: query, locale });
  const response = await fetch(`${API_BASE_URL}/api/admin/references/search?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseAdminError(response));
  }

  return response.json();
}
