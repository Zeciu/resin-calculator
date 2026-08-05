import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchPublicLanguagesConfig } from "./publicLanguagesApi.js";

const PublicLanguagesContext = createContext(null);

const DEFAULT_STATE = {
  defaultPublicLocale: "en",
  activePublicLocales: ["en"],
  loadState: "loading",
};

export function PublicLanguagesProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loadState: "loading" }));
    try {
      const payload = await fetchPublicLanguagesConfig();
      setState({
        defaultPublicLocale: payload.defaultPublicLocale || "en",
        activePublicLocales: Array.isArray(payload.activePublicLocales)
          ? payload.activePublicLocales
          : ["en"],
        loadState: "ready",
      });
    } catch {
      setState({
        defaultPublicLocale: "en",
        activePublicLocales: ["en"],
        loadState: "error",
      });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      defaultPublicLocale: state.defaultPublicLocale,
      activePublicLocales: state.activePublicLocales,
      loadState: state.loadState,
      reload,
    }),
    [state, reload],
  );

  return (
    <PublicLanguagesContext.Provider value={value}>{children}</PublicLanguagesContext.Provider>
  );
}

export function usePublicLanguages() {
  const context = useContext(PublicLanguagesContext);
  if (!context) {
    throw new Error("usePublicLanguages must be used within PublicLanguagesProvider");
  }
  return context;
}
