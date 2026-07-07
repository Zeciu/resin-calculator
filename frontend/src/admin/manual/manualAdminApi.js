import { mockAuthAdapter } from "../../auth/authAdapter.js";

const API_BASE_URL = "";

function adminHeaders(includeJsonContentType = true) {
  const user = mockAuthAdapter.restoreSession();
  const headers = {
    "X-Mock-User-Id": user?.id ?? "stub-user",
    "X-Mock-Role": user?.role ?? "user",
  };
  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function parseError(response) {
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

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/admin/manual/chapters${path}`, {
    ...options,
    headers: {
      ...adminHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function listManualChapters(locale = "en") {
  return request(`?locale=${encodeURIComponent(locale)}`);
}

export function createManualChapter(title) {
  return request("", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function getManualVariant(contentId, locale) {
  return request(`/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}`);
}

export function saveManualVariant(contentId, locale, body) {
  return request(`/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}`, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
}

export function publishManualVariant(contentId, locale) {
  return request(
    `/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}/publish`,
    { method: "POST" },
  );
}

export function deleteManualChapter(contentId) {
  return request(`/${encodeURIComponent(contentId)}`, { method: "DELETE" });
}

export async function uploadManualImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/admin/manual/chapters/images`, {
    method: "POST",
    headers: adminHeaders(false),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}
