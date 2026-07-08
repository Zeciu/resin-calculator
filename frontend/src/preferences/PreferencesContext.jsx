import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth.js";
import { detectBrowserInterfaceLanguage } from "./browserLanguage.js";
import { fetchPreferences, savePreferences } from "./preferencesApi.js";
import { DEFAULT_PREFERENCES, normalizePreferences } from "./preferencesConstants.js";

const PreferencesContext = createContext(null);

function withBrowserLanguageIfNeeded(preferences) {
  if (preferences.exists) {
    return preferences;
  }
  return {
    ...preferences,
    interfaceLanguage: detectBrowserInterfaceLanguage(),
  };
}

function guestPreferences() {
  return withBrowserLanguageIfNeeded({ ...DEFAULT_PREFERENCES, exists: false });
}

export function PreferencesProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [preferences, setPreferences] = useState(guestPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const resetToDefaults = useCallback(() => {
    setPreferences(guestPreferences());
    setError("");
  }, []);

  const reloadPreferences = useCallback(async () => {
    if (!isAuthenticated) {
      resetToDefaults();
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const loaded = await fetchPreferences();
      setPreferences(withBrowserLanguageIfNeeded(loaded));
    } catch (loadError) {
      setError(loadError.message || "Failed to load preferences.");
      setPreferences(guestPreferences());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, resetToDefaults]);

  useEffect(() => {
    if (!isAuthenticated) {
      resetToDefaults();
      return;
    }
    void reloadPreferences();
  }, [isAuthenticated, user?.id, reloadPreferences, resetToDefaults]);

  const updatePreferences = useCallback(
    async (patch) => {
      if (!isAuthenticated) {
        throw new Error("Sign in to save preferences.");
      }

      setIsLoading(true);
      setError("");
      try {
        const saved = await savePreferences(patch);
        setPreferences(normalizePreferences(saved));
        return saved;
      } catch (saveError) {
        setError(saveError.message || "Failed to save preferences.");
        throw saveError;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated],
  );

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
