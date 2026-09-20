/** Configured public language codes (activation is separate). */
export const CONFIGURED_PUBLIC_LANGUAGES = [
  "en",
  "ro",
  "fr",
  "de",
  "es",
  "pt",
  "pl",
  "cs",
  "it",
];

export const INTERFACE_LANGUAGE_LABELS = {
  en: "English",
  ro: "Română",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
  pl: "Polski",
  cs: "Čeština",
  it: "Italiano",
};

export const LENGTH_UNITS = ["mm", "cm", "m", "in", "ft"];

/**
 * Public/authenticated language menus list Active locales from Admin.
 * Unknown codes are ignored so a stale API payload cannot offer a locale
 * with no UI bundle.
 */
export function listActiveInterfaceLanguages(
  activePublicLocales = [],
  defaultPublicLocale = "en",
) {
  const fallback =
    typeof defaultPublicLocale === "string" && defaultPublicLocale
      ? defaultPublicLocale
      : "en";
  const active =
    Array.isArray(activePublicLocales) && activePublicLocales.length > 0
      ? activePublicLocales
      : [fallback];
  const known = active.filter((code) => CONFIGURED_PUBLIC_LANGUAGES.includes(code));
  return known.length > 0 ? known : [fallback];
}

export const VOLUME_UNITS = ["ml", "L", "fl_oz", "pt", "qt", "gal"];

export const DEFAULT_PREFERENCES = {
  interfaceLanguage: "en",
  lengthUnit: "mm",
  volumeUnit: "L",
  exists: false,
};

export function normalizePreferences(payload = {}) {
  return {
    interfaceLanguage: CONFIGURED_PUBLIC_LANGUAGES.includes(payload.interfaceLanguage)
      ? payload.interfaceLanguage
      : DEFAULT_PREFERENCES.interfaceLanguage,
    lengthUnit: LENGTH_UNITS.includes(payload.lengthUnit)
      ? payload.lengthUnit
      : DEFAULT_PREFERENCES.lengthUnit,
    volumeUnit: VOLUME_UNITS.includes(payload.volumeUnit)
      ? payload.volumeUnit
      : DEFAULT_PREFERENCES.volumeUnit,
    exists: Boolean(payload.exists),
  };
}
