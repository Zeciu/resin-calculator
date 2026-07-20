import { useCallback, useEffect, useState } from "react";
import { usePreferences } from "../preferences/usePreferences.js";
import { usePublicLanguages } from "../publicLanguages/usePublicLanguages.js";
import { resolvePublicInterfaceLocale } from "../publicLanguages/publicLanguagesApi.js";

/**
 * Load published educational content for the active interface language.
 *
 * @param {(locale: string) => Promise<object>} fetchContent
 */
export function usePublishedContent(fetchContent) {
  const { preferences } = usePreferences();
  const { activePublicLocales, defaultPublicLocale, loadState: languagesLoadState } =
    usePublicLanguages();
  const resolvedLocale = resolvePublicInterfaceLocale(
    preferences.interfaceLanguage,
    activePublicLocales,
    defaultPublicLocale,
  );
  const [locale, setLocale] = useState(resolvedLocale);
  const [payload, setPayload] = useState(null);
  const [loadState, setLoadState] = useState("loading");

  const loadLocale = useCallback(
    async (nextLocale) => {
      setLoadState("loading");
      try {
        const response = await fetchContent(nextLocale);
        setPayload(response);
        setLocale(nextLocale);
        setLoadState(response.available ? "ready" : "unavailable");
      } catch {
        setPayload(null);
        setLoadState("error");
      }
    },
    [fetchContent],
  );

  useEffect(() => {
    if (languagesLoadState === "loading") {
      return;
    }
    void loadLocale(resolvedLocale);
  }, [resolvedLocale, languagesLoadState, loadLocale]);

  const viewEnglishVersion = useCallback(() => {
    if (!payload?.englishAvailable) {
      return;
    }
    void loadLocale("en");
  }, [loadLocale, payload?.englishAvailable]);

  return {
    locale,
    payload,
    loadState,
    viewEnglishVersion,
    reload: () => loadLocale(locale),
  };
}
