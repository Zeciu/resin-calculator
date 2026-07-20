import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { usePublicLanguages } from "../publicLanguages/usePublicLanguages.js";
import { resolvePublicInterfaceLocale } from "../publicLanguages/publicLanguagesApi.js";
import { usePreferences } from "./usePreferences.js";
import {
  INTERFACE_LANGUAGE_LABELS,
  LENGTH_UNITS,
  VOLUME_UNITS,
} from "./preferencesConstants.js";
import { ROUTES } from "../workspace/routes.js";

export default function PreferencesPage() {
  const { t } = useI18n();
  const { preferences, isLoading, error, updatePreferences } = usePreferences();
  const { activePublicLocales, defaultPublicLocale } = usePublicLanguages();
  const languageOptions =
    activePublicLocales.length > 0 ? activePublicLocales : [defaultPublicLocale || "en"];
  const [draft, setDraft] = useState(preferences);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const resolvedLanguage = resolvePublicInterfaceLocale(
      preferences.interfaceLanguage,
      languageOptions,
      defaultPublicLocale,
    );
    setDraft({
      ...preferences,
      interfaceLanguage: resolvedLanguage,
    });
  }, [preferences, activePublicLocales, defaultPublicLocale, languageOptions]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatusMessage("");
    try {
      await updatePreferences({
        interfaceLanguage: draft.interfaceLanguage,
        lengthUnit: draft.lengthUnit,
        volumeUnit: draft.volumeUnit,
      });
      setStatusMessage(t("preferences.saved"));
    } catch {
      setStatusMessage(t("preferences.saveFailed"));
    }
  }

  return (
    <section className="preferences-page" aria-labelledby="preferences-page-title">
      <header className="preferences-page__header">
        <Link to={ROUTES.ACCOUNT} className="preferences-page__back">
          ← {t("account.title")}
        </Link>
        <h2 id="preferences-page-title" className="preferences-page__title">
          {t("preferences.title")}
        </h2>
        <p className="preferences-page__intro">{t("preferences.intro")}</p>
      </header>

      <form className="preferences-page__form" onSubmit={handleSubmit}>
        <label className="preferences-page__field">
          <span className="preferences-page__label">{t("preferences.interfaceLanguage")}</span>
          <select
            value={draft.interfaceLanguage}
            onChange={(event) =>
              setDraft((current) => ({ ...current, interfaceLanguage: event.target.value }))
            }
          >
            {languageOptions.map((language) => (
              <option key={language} value={language}>
                {INTERFACE_LANGUAGE_LABELS[language]}
              </option>
            ))}
          </select>
          <span className="preferences-page__help">{t("preferences.interfaceLanguageHelp")}</span>
        </label>

        <label className="preferences-page__field">
          <span className="preferences-page__label">{t("preferences.lengthUnit")}</span>
          <select
            value={draft.lengthUnit}
            onChange={(event) =>
              setDraft((current) => ({ ...current, lengthUnit: event.target.value }))
            }
          >
            {LENGTH_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          <span className="preferences-page__help">{t("preferences.lengthUnitHelp")}</span>
        </label>

        <label className="preferences-page__field">
          <span className="preferences-page__label">{t("preferences.volumeUnit")}</span>
          <select
            value={draft.volumeUnit}
            onChange={(event) =>
              setDraft((current) => ({ ...current, volumeUnit: event.target.value }))
            }
          >
            {VOLUME_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          <span className="preferences-page__help">{t("preferences.volumeUnitHelp")}</span>
        </label>

        {error ? (
          <p className="preferences-page__error" role="alert">
            {error}
          </p>
        ) : null}
        {statusMessage ? (
          <p className="preferences-page__status" role="status">
            {statusMessage}
          </p>
        ) : null}

        <button type="submit" className="preferences-page__submit" disabled={isLoading}>
          {isLoading ? t("common.saving") : t("preferences.save")}
        </button>
      </form>
    </section>
  );
}
