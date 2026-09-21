import {
  AdminApiError,
  adminHeaders,
  parseAdminError,
} from "../editorial/editorialAdminApi.js";

const API_BASE_URL = "";

export async function fetchAdminPublicLanguages() {
  const response = await fetch(`${API_BASE_URL}/api/admin/public-languages`, {
    headers: await adminHeaders(false),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }
  return response.json();
}

export async function activatePublicLanguage(locale) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/public-languages/${encodeURIComponent(locale)}/activate`,
    { method: "POST", headers: await adminHeaders(false) },
  );
  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }
  return response.json();
}

export async function deactivatePublicLanguage(locale) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/public-languages/${encodeURIComponent(locale)}/deactivate`,
    { method: "POST", headers: await adminHeaders(false) },
  );
  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }
  return response.json();
}

export async function fetchAdminLocaleReadiness() {
  const response = await fetch(`${API_BASE_URL}/api/admin/public-languages/readiness`, {
    headers: await adminHeaders(false),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }
  return response.json();
}

export async function prepareLocaleProduction(locale) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/public-languages/${encodeURIComponent(locale)}/prepare-production`,
    { method: "POST", headers: await adminHeaders(false) },
  );
  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }
  return response.json();
}

export async function previewMissingUiTranslations(locale) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/ui-translations/${encodeURIComponent(locale)}/preview`,
    { headers: await adminHeaders(false), cache: "no-store" },
  );
  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }
  return response.json();
}

export async function generateMissingUiTranslations(locale) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/ui-translations/${encodeURIComponent(locale)}/generate-missing`,
    { method: "POST", headers: await adminHeaders(false) },
  );
  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }
  return response.json();
}
