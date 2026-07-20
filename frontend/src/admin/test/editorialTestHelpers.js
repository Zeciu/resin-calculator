import { mockAuthAdapter } from "../../auth/authAdapter.js";

export function computeMockEditorialVisibility({
  exists = true,
  status = "draft",
  updatedAt = null,
  publishedAt = null,
}) {
  if (!exists) {
    return "empty";
  }
  if (status !== "published" || !publishedAt) {
    return "draft";
  }
  if (updatedAt && publishedAt && new Date(updatedAt) > new Date(publishedAt)) {
    return "stale";
  }
  return "live";
}

export function withEditorialVisibility(variant) {
  const exists = variant?.exists !== false;
  return {
    ...variant,
    editorialVisibility: computeMockEditorialVisibility({
      exists,
      status: variant?.status,
      updatedAt: variant?.updatedAt ?? "2026-01-01T00:00:00+00:00",
      publishedAt: variant?.publishedAt ?? null,
    }),
  };
}

export function isAdministratorFetchRequest(init = {}) {
  const headers = init?.headers ?? {};
  const headerRole =
    typeof headers.get === "function"
      ? headers.get("X-Mock-Role") ?? headers.get("x-mock-role")
      : headers["X-Mock-Role"] ?? headers["x-mock-role"];
  if (headerRole === "administrator") {
    return true;
  }
  return mockAuthAdapter.restoreSession()?.role === "administrator";
}

export function handleGlobalReferenceSearch(url) {
  const parsed = new URL(url, "http://localhost");
  if (parsed.pathname === "/api/content/public-languages") {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        defaultPublicLocale: "en",
        activePublicLocales: ["en", "ro"],
      }),
    });
  }
  if (parsed.pathname === "/api/admin/references/search") {
    return Promise.resolve({ ok: true, status: 200, json: async () => [] });
  }
  if (parsed.pathname === "/api/me/capabilities") {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        role: "user",
        accessTier: "free",
        catalogVersion: 1,
        capabilities: {},
      }),
    });
  }
  if (parsed.pathname === "/api/preferences") {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        interfaceLanguage: "en",
        lengthUnit: "mm",
        volumeUnit: "L",
        exists: false,
      }),
    });
  }
  return null;
}
