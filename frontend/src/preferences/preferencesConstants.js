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

/** @deprecated Use CONFIGURED_PUBLIC_LANGUAGES; kept for preference normalization. */
export const INTERFACE_LANGUAGES = CONFIGURED_PUBLIC_LANGUAGES;

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

export const VOLUME_UNITS = ["ml", "L", "fl_oz", "pt", "qt", "gal"];

export const DEFAULT_PREFERENCES = {
  interfaceLanguage: "en",
  lengthUnit: "mm",
  volumeUnit: "L",
  exists: false,
};

export function normalizePreferences(payload = {}) {
  return {
    interfaceLanguage: INTERFACE_LANGUAGES.includes(payload.interfaceLanguage)
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
