/** Admin-prepared editorial locales (independent from public language activation). */
export const ADMIN_EDITORIAL_LOCALES = ["ro", "en", "fr", "de", "es", "pt", "pl", "cs", "it"];

export const CANONICAL_SOURCE_LOCALE = "ro";

export const ADMIN_LOCALE_LABELS = {
  ro: "Romanian",
  en: "English",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  pl: "Polish",
  cs: "Czech",
  it: "Italian",
};

export function isCanonicalSourceLocale(locale) {
  return locale === CANONICAL_SOURCE_LOCALE;
}

export function adminLocaleLabel(locale) {
  return ADMIN_LOCALE_LABELS[locale] ?? String(locale ?? "").toUpperCase();
}
