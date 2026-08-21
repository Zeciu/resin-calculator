import { ROUTES } from "../workspace/routes.js";

export const PUBLIC_ORIGIN = "https://hfzwood.com";
export const SITE_NAME = "HFZWood";
export const FAVICON_PATH = "/hefzech-logo.png";
export const OG_IMAGE_PATH = "/hefzech-logo.png";
export const OG_IMAGE_URL = `${PUBLIC_ORIGIN}${OG_IMAGE_PATH}`;

/** Site-wide static description, taken from published Home subtitle copy. */
export const SITE_DESCRIPTION =
  "Calculate and plan epoxy resin projects based on the actual shape of your project.";

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

export function resolveDocumentHeadState(pathname, translate) {
  const policy = resolveDocumentPolicy(pathname);
  return {
    title: translate(policy.titleKey),
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

export function applyDocumentHead({ title, robots, canonicalUrl }) {
  document.title = title;

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
