import { vi } from "vitest";
import { GUEST_CAPABILITIES_RESPONSE } from "../capabilities/capabilityDefaults.js";
import { DEFAULT_PREFERENCES } from "./preferencesConstants.js";
import {
  DEVICE_PREFERENCES_STORAGE_KEY,
  loadDevicePreferences,
  saveDevicePreferences,
} from "./devicePreferencesStorage.js";

function capabilitiesResponse(overrides) {
  return overrides ?? GUEST_CAPABILITIES_RESPONSE;
}

function defaultBillingStatus() {
  return {
    plan: "free",
    status: "none",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    grantExpiresAt: null,
    canCheckout: true,
    canManage: false,
  };
}

function publicLanguagesConfigResponse(activePublicLocales = ["en", "ro"]) {
  return {
    defaultPublicLocale: "en",
    activePublicLocales,
  };
}

function handleCapabilitiesFetch(url, _init, options = {}) {
  const activePublicLocales = options.activePublicLocales ?? ["en", "ro"];
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
      json: async () => capabilitiesResponse(options.capabilities),
    });
  }
  if (path.endsWith("/api/billing/status")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        ...defaultBillingStatus(),
        ...options.billingStatus,
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
  const fetchOptions = {
    activePublicLocales: options.activePublicLocales ?? ["en", "ro"],
    billingStatus: options.billingStatus,
    capabilities: options.capabilities,
  };
  return vi.spyOn(global, "fetch").mockImplementation((url, init) => {
    const path = String(url);
    if (path.includes("/api/preferences")) {
      return Promise.reject(new Error("Unexpected /api/preferences call"));
    }
    return handleCapabilitiesFetch(url, init, fetchOptions);
  });
}

export function assertNoPreferencesApiCalls(fetchMock) {
  const preferenceCalls = fetchMock.mock.calls.filter(([url]) =>
    String(url).includes("/api/preferences"),
  );
  expect(preferenceCalls).toHaveLength(0);
}
