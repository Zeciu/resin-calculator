import { detectBrowserInterfaceLanguage } from "./browserLanguage.js";
import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
} from "./preferencesConstants.js";

export const DEVICE_PREFERENCES_STORAGE_KEY = "hfzwood.devicePreferences";

export class DevicePreferencesStorageError extends Error {
  constructor(message = "Could not save preferences.") {
    super(message);
    this.name = "DevicePreferencesStorageError";
  }
}

function readStoredPayload() {
  const raw = localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  return parsed;
}

function withFirstLaunchInterfaceLanguage(preferences) {
  if (preferences.exists) {
    return preferences;
  }

  return {
    ...preferences,
    interfaceLanguage: detectBrowserInterfaceLanguage(),
  };
}

export function loadDevicePreferences() {
  try {
    const stored = readStoredPayload();
    if (!stored) {
      return withFirstLaunchInterfaceLanguage({
        ...DEFAULT_PREFERENCES,
        exists: false,
      });
    }

    return withFirstLaunchInterfaceLanguage(
      normalizePreferences({
        ...stored,
        exists: true,
      }),
    );
  } catch {
    return withFirstLaunchInterfaceLanguage({
      ...DEFAULT_PREFERENCES,
      exists: false,
    });
  }
}

function readPersistedPreferencesForMerge() {
  try {
    const stored = readStoredPayload();
    if (!stored) {
      return normalizePreferences({
        ...DEFAULT_PREFERENCES,
        exists: false,
      });
    }

    return normalizePreferences({
      ...stored,
      exists: true,
    });
  } catch {
    return normalizePreferences({
      ...DEFAULT_PREFERENCES,
      exists: false,
    });
  }
}

export function saveDevicePreferences(patch) {
  const merged = normalizePreferences({
    ...readPersistedPreferencesForMerge(),
    ...patch,
    exists: true,
  });

  const payload = {
    interfaceLanguage: merged.interfaceLanguage,
    lengthUnit: merged.lengthUnit,
    volumeUnit: merged.volumeUnit,
  };

  try {
    localStorage.setItem(DEVICE_PREFERENCES_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    throw new DevicePreferencesStorageError();
  }

  return merged;
}
