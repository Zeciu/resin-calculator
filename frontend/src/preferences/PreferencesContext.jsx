import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePublicLanguages } from "../publicLanguages/usePublicLanguages.js";
import { resolvePublicInterfaceLocale } from "../publicLanguages/publicLanguagesApi.js";
import {
  DevicePreferencesStorageError,
  loadDevicePreferences,
  saveDevicePreferences,
} from "./devicePreferencesStorage.js";

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const { activePublicLocales, defaultPublicLocale, loadState: languagesLoadState } =
    usePublicLanguages();
  const [preferences, setPreferences] = useState(() => loadDevicePreferences());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const reloadPreferences = useCallback(() => {
    setError("");
    setPreferences(loadDevicePreferences());
  }, []);

  const updatePreferences = useCallback(async (patch) => {
    setIsLoading(true);
    setError("");
    try {
      const saved = saveDevicePreferences(patch);
      setPreferences(saved);
      return saved;
    } catch (saveError) {
      const message =
        saveError instanceof DevicePreferencesStorageError
          ? saveError.message
          : saveError instanceof Error
            ? saveError.message
            : "Failed to save preferences.";
      setError(message);
      throw saveError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (languagesLoadState === "loading") {
      return;
    }
    const resolved = resolvePublicInterfaceLocale(
      preferences.interfaceLanguage,
      activePublicLocales,
      defaultPublicLocale,
    );
    if (resolved === preferences.interfaceLanguage) {
      return;
    }
    void updatePreferences({ interfaceLanguage: resolved }).catch(() => {
      // Surface via shared error state when persistence fails.
    });
  }, [
    languagesLoadState,
    activePublicLocales,
    defaultPublicLocale,
    preferences.interfaceLanguage,
    updatePreferences,
  ]);

  const value = useMemo(
    () => ({
      preferences,
      isLoading,
      error,
      updatePreferences,
      reloadPreferences,
    }),
    [preferences, isLoading, error, updatePreferences, reloadPreferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
