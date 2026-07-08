import { vi } from "vitest";
import { GUEST_CAPABILITIES_RESPONSE } from "../capabilities/capabilityDefaults.js";
import { DEFAULT_PREFERENCES } from "./preferencesConstants.js";

function capabilitiesResponse() {
  return GUEST_CAPABILITIES_RESPONSE;
}

function handleMockApiFetch(url, init, preferences) {
  const path = String(url);
  if (path.endsWith("/api/me/capabilities")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => capabilitiesResponse(),
    });
  }
  if (path.endsWith("/api/preferences")) {
    if ((init?.method ?? "GET") === "PUT") {
      const body = JSON.parse(init.body);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          ...preferences,
          ...body,
          exists: true,
        }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => preferences,
    });
  }
  return Promise.reject(new Error(`Unhandled fetch: ${path}`));
}

export function mockPreferencesFetch(preferences = DEFAULT_PREFERENCES) {
  return vi.spyOn(global, "fetch").mockImplementation((url, init) =>
    handleMockApiFetch(url, init, preferences),
  );
}

/**
 * Stateful preferences mock: PUT updates are reflected on subsequent GET,
 * matching real backend persistence behavior in integration tests.
 */
export function mockStatefulPreferencesFetch(initial = {}) {
  let stored = {
    interfaceLanguage: "en",
    lengthUnit: "mm",
    volumeUnit: "L",
    exists: true,
    ...initial,
  };
  const fetchMock = vi.fn(async (url, options) => {
    const requestUrl = String(url);
    if (requestUrl.includes("/api/me/capabilities")) {
      return { ok: true, json: async () => capabilitiesResponse() };
    }
    if (requestUrl.includes("/api/preferences")) {
      if (options?.method === "PUT") {
        stored = { ...stored, ...JSON.parse(options.body), exists: true };
      }
      return { ok: true, json: async () => stored };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
