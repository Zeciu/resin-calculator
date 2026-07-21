import { vi } from "vitest";
import { GUEST_CAPABILITIES_RESPONSE } from "../capabilities/capabilityDefaults.js";
import { DEFAULT_PREFERENCES } from "./preferencesConstants.js";
import {
  DEVICE_PREFERENCES_STORAGE_KEY,
  loadDevicePreferences,
  saveDevicePreferences,
} from "./devicePreferencesStorage.js";

function capabilitiesResponse() {
  return GUEST_CAPABILITIES_RESPONSE;
}

function publicLanguagesConfigResponse(activePublicLocales = ["en", "ro"]) {
  return {
    defaultPublicLocale: "en",
    activePublicLocales,
  };
}

function handleCapabilitiesFetch(url, _init, activePublicLocales = ["en", "ro"]) {
  const path = String(url);
  if (path.endsWith("/api/content/public-languages")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => publicLanguagesConfigResponse(activePublicLocales),
    });
  }
  if (path.endsWith("/api/me/capabilities")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => capabilitiesResponse(),
    });
  }
  if (path.endsWith("/api/billing/status")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        plan: "free",
        status: "none",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        canCheckout: true,
        canManage: false,
      }),
    });
  }
  return Promise.reject(new Error(`Unhandled fetch: ${path}`));
}

export function clearDevicePreferences() {
  localStorage.removeItem(DEVICE_PREFERENCES_STORAGE_KEY);
}

export function seedDevicePreferences(preferences = {}) {
  saveDevicePreferences({
    interfaceLanguage: DEFAULT_PREFERENCES.interfaceLanguage,
    lengthUnit: DEFAULT_PREFERENCES.lengthUnit,
    volumeUnit: DEFAULT_PREFERENCES.volumeUnit,
    ...preferences,
  });
}

export function readDevicePreferencesFromStorage() {
  return loadDevicePreferences();
}

export function mockCapabilitiesFetch(options = {}) {
  const activePublicLocales = options.activePublicLocales ?? ["en", "ro"];
  return vi.spyOn(global, "fetch").mockImplementation((url, init) => {
    const path = String(url);
    if (path.includes("/api/preferences")) {
      return Promise.reject(new Error("Unexpected /api/preferences call"));
    }
    return handleCapabilitiesFetch(url, init, activePublicLocales);
  });
}

function handleMockApiFetch(url, init, preferences) {
  const path = String(url);
  if (path.endsWith("/api/content/public-languages")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => publicLanguagesConfigResponse(),
    });
  }
  if (path.endsWith("/api/me/capabilities")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => capabilitiesResponse(),
    });
  }
  if (path.endsWith("/api/billing/status")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        plan: "free",
        status: "none",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        canCheckout: true,
        canManage: false,
      }),
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

/** @deprecated Use seedDevicePreferences + mockCapabilitiesFetch for device-local preference tests. */
export function mockPreferencesFetch(preferences = DEFAULT_PREFERENCES) {
  return vi.spyOn(global, "fetch").mockImplementation((url, init) =>
    handleMockApiFetch(url, init, preferences),
  );
}

/**
 * @deprecated Use seedDevicePreferences + mockCapabilitiesFetch for device-local preference tests.
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
    if (requestUrl.includes("/api/content/public-languages")) {
      return { ok: true, json: async () => publicLanguagesConfigResponse() };
    }
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

export function assertNoPreferencesApiCalls(fetchMock) {
  const preferenceCalls = fetchMock.mock.calls.filter(([url]) =>
    String(url).includes("/api/preferences"),
  );
  expect(preferenceCalls).toHaveLength(0);
}
