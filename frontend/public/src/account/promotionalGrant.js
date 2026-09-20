const DATE_LOCALES = {
  en: "en-GB",
  ro: "ro-RO",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-PT",
  pl: "pl-PL",
  cs: "cs-CZ",
  it: "it-IT",
};

export function unixNowSeconds() {
  return Math.floor(Date.now() / 1000);
}

export function hasActivePromotionalGrant(billingStatus, nowSeconds = unixNowSeconds()) {
  const expiresAt = billingStatus?.grantExpiresAt;
  return typeof expiresAt === "number" && Number.isFinite(expiresAt) && expiresAt > nowSeconds;
}

export function formatGrantExpiryDate(unixSeconds, language) {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) {
    return null;
  }
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const locale = DATE_LOCALES[language] || DATE_LOCALES.en;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return null;
  }
}
