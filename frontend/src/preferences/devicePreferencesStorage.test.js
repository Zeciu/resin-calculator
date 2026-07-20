import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEVICE_PREFERENCES_STORAGE_KEY,
  loadDevicePreferences,
  saveDevicePreferences,
} from "./devicePreferencesStorage.js";

describe("devicePreferencesStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("navigator", { language: "en-US", languages: ["en-US"] });
  });

  it("uses browser language and default units on first launch", () => {
    vi.stubGlobal("navigator", { language: "ro-RO", languages: ["ro-RO"] });

    const loaded = loadDevicePreferences();

    expect(loaded.interfaceLanguage).toBe("ro");
    expect(loaded.lengthUnit).toBe("mm");
    expect(loaded.volumeUnit).toBe("L");
    expect(loaded.exists).toBe(false);
  });

  it("loads persisted device preferences", () => {
    localStorage.setItem(
      DEVICE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        interfaceLanguage: "ro",
        lengthUnit: "cm",
        volumeUnit: "ml",
      }),
    );

    const loaded = loadDevicePreferences();

    expect(loaded).toMatchObject({
      interfaceLanguage: "ro",
      lengthUnit: "cm",
      volumeUnit: "ml",
      exists: true,
    });
  });

  it("normalizes malformed stored values safely", () => {
    localStorage.setItem(
      DEVICE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        interfaceLanguage: "xx",
        lengthUnit: "bad",
        volumeUnit: "bad",
      }),
    );

    const loaded = loadDevicePreferences();

    expect(loaded.interfaceLanguage).toBe("en");
    expect(loaded.lengthUnit).toBe("mm");
    expect(loaded.volumeUnit).toBe("L");
    expect(loaded.exists).toBe(true);
  });

  it("falls back safely when stored JSON is invalid", () => {
    localStorage.setItem(DEVICE_PREFERENCES_STORAGE_KEY, "not-json");

    const loaded = loadDevicePreferences();

    expect(loaded.interfaceLanguage).toBe("en");
    expect(loaded.lengthUnit).toBe("mm");
    expect(loaded.volumeUnit).toBe("L");
    expect(loaded.exists).toBe(false);
  });

  it("persists merged preference updates", () => {
    const saved = saveDevicePreferences({ interfaceLanguage: "ro", lengthUnit: "cm" });

    expect(saved).toMatchObject({
      interfaceLanguage: "ro",
      lengthUnit: "cm",
      volumeUnit: "L",
      exists: true,
    });
    expect(JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY))).toEqual({
      interfaceLanguage: "ro",
      lengthUnit: "cm",
      volumeUnit: "L",
    });
  });

  it("throws when localStorage write fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => saveDevicePreferences({ interfaceLanguage: "ro" })).toThrow(
      /Could not save preferences/i,
    );
  });
});
