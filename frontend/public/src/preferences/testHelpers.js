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

export function assertNoPreferencesApiCalls(fetchMock) {
  const preferenceCalls = fetchMock.mock.calls.filter(([url]) =>
    String(url).includes("/api/preferences"),
  );
  expect(preferenceCalls).toHaveLength(0);
}
