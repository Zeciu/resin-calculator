import { useI18n } from "../i18n/I18nContext.jsx";
import { usePreferences } from "./usePreferences.js";
import {
  INTERFACE_LANGUAGES,
  INTERFACE_LANGUAGE_LABELS,
  LENGTH_UNITS,
  VOLUME_UNITS,
} from "./preferencesConstants.js";

/**
 * Compact preference controls that reuse the shared PreferencesProvider.
 * Changes are saved immediately via updatePreferences; no local logic is
 * duplicated from the full Application Preferences page.
 */
export default function QuickPreferences({ variant = "sidebar" }) {
  const { t } = useI18n();
  const { preferences, updatePreferences, isLoading } = usePreferences();

  function handleChange(field, value) {
    void updatePreferences({ [field]: value }).catch(() => {
      // Errors surface through the shared PreferencesProvider error state.
    });
  }

  return (
    <section
      className={`quick-preferences quick-preferences--${variant}`}
      aria-label={t("quickPreferences.title")}
    >
      <p className="quick-preferences__title">{t("quickPreferences.title")}</p>

      <label className="quick-preferences__field">
        <span className="quick-preferences__label">{t("preferences.interfaceLanguage")}</span>
        <select
          className="quick-preferences__select"
          value={preferences.interfaceLanguage}
          disabled={isLoading}
          onChange={(event) => handleChange("interfaceLanguage", event.target.value)}
        >
          {INTERFACE_LANGUAGES.map((language) => (
            <option key={language} value={language}>
              {INTERFACE_LANGUAGE_LABELS[language] ?? language}
            </option>
          ))}
        </select>
      </label>

      <label className="quick-preferences__field">
        <span className="quick-preferences__label">{t("preferences.lengthUnit")}</span>
        <select
          className="quick-preferences__select"
          value={preferences.lengthUnit}
          disabled={isLoading}
          onChange={(event) => handleChange("lengthUnit", event.target.value)}
        >
          {LENGTH_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </label>

      <label className="quick-preferences__field">
        <span className="quick-preferences__label">{t("preferences.volumeUnit")}</span>
        <select
          className="quick-preferences__select"
          value={preferences.volumeUnit}
          disabled={isLoading}
          onChange={(event) => handleChange("volumeUnit", event.target.value)}
        >
          {VOLUME_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
