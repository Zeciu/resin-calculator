/** Fixed public Website page keys (must match backend registry). */
export const WEBSITE_PAGE_KEYS = {
  HOME: "home",
  ABOUT: "about",
  PRICING: "pricing",
  PRIVACY: "privacy",
  TERMS: "terms",
  CONTACT: "contact",
};

/** Public Website paths (aligned with workspace ROUTES). */
export const WEBSITE_PUBLIC_PATHS = {
  ABOUT: "/about",
  PRICING: "/pricing",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  CONTACT: "/contact",
};

/**
 * Footer navigation for public Website surfaces only.
 * Paths mirror workspace ROUTES; labels use i18n keys.
 */
export const WEBSITE_FOOTER_LINKS = [
  {
    pageKey: WEBSITE_PAGE_KEYS.ABOUT,
    path: WEBSITE_PUBLIC_PATHS.ABOUT,
    labelKey: "website.nav.about",
  },
  {
    pageKey: WEBSITE_PAGE_KEYS.PRICING,
    path: WEBSITE_PUBLIC_PATHS.PRICING,
    labelKey: "website.nav.pricing",
  },
  {
    pageKey: WEBSITE_PAGE_KEYS.PRIVACY,
    path: WEBSITE_PUBLIC_PATHS.PRIVACY,
    labelKey: "website.nav.privacy",
  },
  {
    pageKey: WEBSITE_PAGE_KEYS.TERMS,
    path: WEBSITE_PUBLIC_PATHS.TERMS,
    labelKey: "website.nav.terms",
  },
  {
    pageKey: WEBSITE_PAGE_KEYS.CONTACT,
    path: WEBSITE_PUBLIC_PATHS.CONTACT,
    labelKey: "website.nav.contact",
  },
];
