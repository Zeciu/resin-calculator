import { ROUTES } from "../workspace/routes.js";

export const PUBLIC_ORIGIN = "https://hfzwood.com";
export const SITE_NAME = "HFZWood";
export const FAVICON_PATH = "/hefzech-logo.png";
export const OG_IMAGE_PATH = "/hefzech-logo.png";
export const OG_IMAGE_URL = `${PUBLIC_ORIGIN}${OG_IMAGE_PATH}`;

/**
 * English search-engine titles and descriptions for the indexable pages.
 *
 * Deliberately English-only and kept out of the i18n catalogs: crawlers index
 * the English rendering, and adding en-only keys to the catalogs would mark
 * every other locale as incomplete. English visitors get these titles in the
 * browser tab; other locales keep their localized short titles. Descriptions
 * are not visible on the page, so they are English for every locale.
 * Keep titles under ~60 characters and descriptions under ~160.
 */
export const SEO_BY_PATH = Object.freeze({
  [ROUTES.HOME]: {
    title: "Epoxy Resin Calculator for Woodworking | HFZWood",
    description:
      "Calculate and plan epoxy resin for woodworking projects, river tables and live-edge slabs, based on the actual shape of your project.",
  },
  [ROUTES.ABOUT]: {
    title: "About HFZWood – Resin Calculator Built by Woodworkers",
    description:
      "HFZWood grew out of more than fifteen years of hands-on epoxy resin and woodworking projects. Learn why we built a shape-based resin calculator.",
  },
  [ROUTES.PRICING]: {
    title: "Pricing – Epoxy Resin Calculator Plans | HFZWood",
    description:
      "Compare HFZWood plans for the epoxy resin calculator: free, monthly and annual options, with simple pricing and no hidden costs.",
  },
  [ROUTES.PRIVACY]: {
    title: "Privacy Policy | HFZWood",
    description:
      "How HFZWood collects, uses and protects your personal data when you use the epoxy resin calculator.",
  },
  [ROUTES.TERMS]: {
    title: "Terms of Service | HFZWood",
    description:
      "The terms that apply when you use HFZWood, the epoxy resin calculator for woodworking projects.",
  },
  [ROUTES.CONTACT]: {
    title: "Contact HFZWood – Resin Calculator Support",
    description:
      "Questions about the HFZWood epoxy resin calculator, your account or a subscription? Get in touch with the HFZWood team.",
  },
});

export const HOME_SEO_TITLE = SEO_BY_PATH[ROUTES.HOME].title;

/** Site-wide description: the static index.html default and the non-indexable fallback. */
export const SITE_DESCRIPTION = SEO_BY_PATH[ROUTES.HOME].description;

export const ROBOTS_INDEX = "index, follow";
export const ROBOTS_NOINDEX = "noindex, nofollow";

export const ROBOTS_META_ATTR = "data-hfzwood-robots";
export const CANONICAL_LINK_ATTR = "data-hfzwood-canonical";

const TITLE_KEY_BY_PATH = {
  [ROUTES.HOME]: "app.documentTitle",
  [ROUTES.ABOUT]: "website.documentTitle.about",
  [ROUTES.PRICING]: "website.documentTitle.pricing",
  [ROUTES.PRIVACY]: "website.documentTitle.privacy",
  [ROUTES.TERMS]: "website.documentTitle.terms",
  [ROUTES.CONTACT]: "website.documentTitle.contact",
};

export const INDEXABLE_PATHS = Object.freeze(Object.keys(TITLE_KEY_BY_PATH));

function canonicalUrlFor(pathname) {
  return pathname === ROUTES.HOME ? `${PUBLIC_ORIGIN}/` : `${PUBLIC_ORIGIN}${pathname}`;
}

export function isIndexablePath(pathname) {
  return Object.prototype.hasOwnProperty.call(TITLE_KEY_BY_PATH, pathname);
}

export function resolveDocumentPolicy(pathname) {
  if (isIndexablePath(pathname)) {
    return {
      indexable: true,
      robots: ROBOTS_INDEX,
      canonicalUrl: canonicalUrlFor(pathname),
      titleKey: TITLE_KEY_BY_PATH[pathname],
    };
  }

  return {
    indexable: false,
    robots: ROBOTS_NOINDEX,
    canonicalUrl: null,
    titleKey: "app.documentTitle",
  };
}

export function resolveDocumentHeadState(pathname, translate, language = "en") {
  const policy = resolveDocumentPolicy(pathname);
  const seo = policy.indexable ? SEO_BY_PATH[pathname] : null;
  const title = seo && language === "en" ? seo.title : translate(policy.titleKey);
  return {
    title,
    description: seo?.description ?? SITE_DESCRIPTION,
    socialUrl: policy.canonicalUrl ?? PUBLIC_ORIGIN,
    robots: policy.robots,
    canonicalUrl: policy.canonicalUrl,
  };
}

function getOwnedRobotsMeta() {
  return document.head.querySelector(`meta[name="robots"][${ROBOTS_META_ATTR}]`);
}

function getOwnedCanonicalLink() {
  return document.head.querySelector(`link[rel="canonical"][${CANONICAL_LINK_ATTR}]`);
}

function setHeadMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function applyDocumentHead({
  title,
  description = SITE_DESCRIPTION,
  socialUrl = PUBLIC_ORIGIN,
  robots,
  canonicalUrl,
}) {
  document.title = title;
  setHeadMeta("name", "description", description);
  setHeadMeta("property", "og:title", title);
  setHeadMeta("property", "og:description", description);
  setHeadMeta("property", "og:url", socialUrl);
  setHeadMeta("name", "twitter:title", title);
  setHeadMeta("name", "twitter:description", description);

  let robotsEl = getOwnedRobotsMeta();
  if (!robotsEl) {
    robotsEl = document.createElement("meta");
    robotsEl.setAttribute("name", "robots");
    robotsEl.setAttribute(ROBOTS_META_ATTR, "");
    document.head.appendChild(robotsEl);
  }
  robotsEl.setAttribute("content", robots);

  let canonicalEl = getOwnedCanonicalLink();
  if (canonicalUrl) {
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      canonicalEl.setAttribute(CANONICAL_LINK_ATTR, "");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonicalUrl);
    return;
  }

  canonicalEl?.remove();
}
