/**
 * Detect supported interface language from the browser on first launch.
 */
export function detectBrowserInterfaceLanguage() {
  const languages = [
  ...(navigator.languages ?? []),
  navigator.language,
  ].filter(Boolean);

  for (const language of languages) {
    const normalized = String(language).toLowerCase();
    if (normalized.startsWith("ro")) {
      return "ro";
    }
    if (normalized.startsWith("en")) {
      return "en";
    }
  }

  return "en";
}
