/** Admin-prepared editorial locales (independent from public language activation). */
export const ADMIN_EDITORIAL_LOCALES = ["ro", "en", "fr", "de", "es", "pt", "pl", "cs", "it"];

export const CANONICAL_SOURCE_LOCALE = "ro";

export function isCanonicalSourceLocale(locale) {
  return locale === CANONICAL_SOURCE_LOCALE;
}
