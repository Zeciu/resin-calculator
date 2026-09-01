import { useI18n } from "../i18n/I18nContext.jsx";
import { usePublicLanguages } from "../publicLanguages/usePublicLanguages.js";
import { resolvePublicInterfaceLocale } from "../publicLanguages/publicLanguagesApi.js";
import { usePreferences } from "./usePreferences.js";
import {
  INTERFACE_LANGUAGE_LABELS,
  PUBLIC_SIDEBAR_LANGUAGES,
} from "./preferencesConstants.js";

/**
 * Compact public/logged-out language control.
 * Reuses PreferencesProvider language state; does not include unit settings.
 */
export default function PublicLanguageSelector() {
  const { t } = useI18n();
  const { preferences, updatePreferences, isLoading } = usePreferences();
  const { activePublicLocales, defaultPublicLocale, loadState } = usePublicLanguages();
  const active =
    activePublicLocales.length > 0 ? activePublicLocales : [defaultPublicLocale || "en"];
  const languageOptions = PUBLIC_SIDEBAR_LANGUAGES.filter((code) => active.includes(code));
  const options = languageOptions.length > 0 ? languageOptions : [defaultPublicLocale || "en"];
  const resolvedLanguage = options.includes(preferences.interfaceLanguage)
    ? preferences.interfaceLanguage
    : resolvePublicInterfaceLocale(
        preferences.interfaceLanguage,
        options,
        defaultPublicLocale,
      );

  function handleChange(event) {
    void updatePreferences({ interfaceLanguage: event.target.value }).catch(() => {
      // Errors surface through the shared PreferencesProvider error state.
    });
  }

  return (
    <label className="workspace-sidebar__guest-language">
      <span className="workspace-sidebar__guest-language-label">{t("publicLanguage.label")}</span>
      <select
        className="workspace-sidebar__guest-language-select"
        value={resolvedLanguage}
        disabled={isLoading || loadState === "loading"}
        onChange={handleChange}
      >
        {options.map((language) => (
          <option key={language} value={language}>
            {INTERFACE_LANGUAGE_LABELS[language] ?? language}
          </option>
        ))}
      </select>
    </label>
  );
}
