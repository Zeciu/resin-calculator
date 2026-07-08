import { createContext, useContext, useMemo } from "react";
import { usePreferences } from "../preferences/usePreferences.js";
import { translate } from "./translate.js";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const { preferences } = usePreferences();
  const language = preferences.interfaceLanguage;

  const value = useMemo(
    () => ({
      language,
      t: (key, params) => translate(language, key, params),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
