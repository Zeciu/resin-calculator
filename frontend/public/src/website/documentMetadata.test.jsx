import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CANONICAL_LINK_ATTR,
  FAVICON_PATH,
  INDEXABLE_PATHS,
  OG_IMAGE_PATH,
  PUBLIC_ORIGIN,
  ROBOTS_INDEX,
  ROBOTS_META_ATTR,
  ROBOTS_NOINDEX,
  SITE_DESCRIPTION,
  SITE_NAME,
  applyDocumentHead,
  resolveDocumentHeadState,
  resolveDocumentPolicy,
} from "./documentMetadata.js";
import { ROUTES } from "../workspace/routes.js";
import { ADMIN_ROUTES } from "../../../private/admin/adminRoutes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { mockPublishedWebsiteFetch } from "./websiteTestHelpers.js";
import {
  clearDevicePreferences,
  mockCapabilitiesFetch,
  seedDevicePreferences,
} from "../preferences/testHelpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const indexHtmlPath = join(here, "..", "..", "index.html");
const staticDir = join(here, "..", "..", "static");
const logoPath = join(staticDir, "hefzech-logo.png");
const robotsPath = join(staticDir, "robots.txt");
const sitemapPath = join(staticDir, "sitemap.xml");

const INDEXABLE_CASES = [
  { path: ROUTES.HOME, title: "HFZWood", canonical: `${PUBLIC_ORIGIN}/` },
  { path: ROUTES.ABOUT, title: "About | HFZWood", canonical: `${PUBLIC_ORIGIN}/about` },
  { path: ROUTES.PRICING, title: "Pricing | HFZWood", canonical: `${PUBLIC_ORIGIN}/pricing` },
  { path: ROUTES.PRIVACY, title: "Privacy Policy | HFZWood", canonical: `${PUBLIC_ORIGIN}/privacy` },
  { path: ROUTES.TERMS, title: "Terms | HFZWood", canonical: `${PUBLIC_ORIGIN}/terms` },
  { path: ROUTES.CONTACT, title: "Contact | HFZWood", canonical: `${PUBLIC_ORIGIN}/contact` },
];

const NOINDEX_CASES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PASSWORD_RECOVERY,
  ROUTES.CALLBACK,
  ROUTES.ACCOUNT,
  ROUTES.PREFERENCES,
  ROUTES.NEW_PROJECT,
  ROUTES.PROJECTS,
  ROUTES.MANUAL,
  ROUTES.GLOSSARY,
  ROUTES.KNOWLEDGE_BASE,
  ADMIN_ROUTES.ROOT,
  ADMIN_ROUTES.WEBSITE,
  "/not-a-real-page",
];

function robotsContent() {
  return document.head.querySelector(`meta[name="robots"][${ROBOTS_META_ATTR}]`)?.getAttribute("content") ?? null;
}

function canonicalHref() {
  return (
    document.head.querySelector(`link[rel="canonical"][${CANONICAL_LINK_ATTR}]`)?.getAttribute("href") ?? null
  );
}

function resetDocumentHead() {
  document.head.querySelector(`meta[name="robots"][${ROBOTS_META_ATTR}]`)?.remove();
  document.head.querySelector(`link[rel="canonical"][${CANONICAL_LINK_ATTR}]`)?.remove();
  document.title = "";
  document.documentElement.lang = "en";
}

describe("document metadata policy", () => {
  it("marks only the six public marketing routes as indexable", () => {
    expect([...INDEXABLE_PATHS].sort()).toEqual(
      [ROUTES.HOME, ROUTES.ABOUT, ROUTES.PRICING, ROUTES.PRIVACY, ROUTES.TERMS, ROUTES.CONTACT].sort(),
    );
    for (const { path, canonical } of INDEXABLE_CASES) {
      expect(resolveDocumentPolicy(path)).toEqual({
        indexable: true,
        robots: ROBOTS_INDEX,
        canonicalUrl: canonical,
        titleKey: expect.any(String),
      });
    }
  });

  it("marks auth, product, admin, callback, and unknown paths as noindex without canonical", () => {
    for (const path of NOINDEX_CASES) {
      expect(resolveDocumentPolicy(path)).toEqual({
        indexable: false,
        robots: ROBOTS_NOINDEX,
        canonicalUrl: null,
        titleKey: "app.documentTitle",
      });
    }
  });

  it("applies callback head state without a canonical URL", () => {
    applyDocumentHead(resolveDocumentHeadState(ROUTES.CALLBACK, () => "HFZWood"));
    expect(document.title).toBe("HFZWood");
    expect(robotsContent()).toBe(ROBOTS_NOINDEX);
    expect(canonicalHref()).toBeNull();
  });
});

describe("document metadata runtime", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    resetDocumentHead();
    vi.restoreAllMocks();
    mockCapabilitiesFetch();
    mockPublishedWebsiteFetch();
  });

  afterEach(() => {
    cleanup();
    resetDocumentHead();
    vi.restoreAllMocks();
    clearDevicePreferences();
  });

  it.each(INDEXABLE_CASES)(
    "indexes $path with the public title and production canonical",
    async ({ path, title, canonical }) => {
      renderWorkspace(path);
      await waitFor(() => {
        expect(document.title).toBe(title);
      });
      expect(robotsContent()).toBe(ROBOTS_INDEX);
      expect(canonicalHref()).toBe(canonical);
    },
  );

  it.each(
    NOINDEX_CASES.filter((path) => path !== ROUTES.CALLBACK),
  )("sets noindex and removes canonical on %s", async (path) => {
    renderWorkspace(path);
    await waitFor(() => {
      expect(robotsContent()).toBe(ROBOTS_NOINDEX);
    });
    expect(document.title).toBe("HFZWood");
    expect(canonicalHref()).toBeNull();
  });

  it("restores index, title, and canonical after public → private → public navigation", async () => {
    const { router } = renderWorkspace(ROUTES.ABOUT);

    await waitFor(() => {
      expect(document.title).toBe("About | HFZWood");
    });
    expect(robotsContent()).toBe(ROBOTS_INDEX);
    expect(canonicalHref()).toBe(`${PUBLIC_ORIGIN}/about`);

    await router.navigate(ROUTES.ACCOUNT);
    await waitFor(() => {
      expect(robotsContent()).toBe(ROBOTS_NOINDEX);
    });
    expect(document.title).toBe("HFZWood");
    expect(canonicalHref()).toBeNull();

    await router.navigate(ROUTES.PRICING);
    await waitFor(() => {
      expect(document.title).toBe("Pricing | HFZWood");
    });
    expect(robotsContent()).toBe(ROBOTS_INDEX);
    expect(canonicalHref()).toBe(`${PUBLIC_ORIGIN}/pricing`);
  });

  it("uses localized public titles when the active locale is Romanian", async () => {
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.ABOUT);
    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ro");
    });
    expect(document.title).toBe("Despre | HFZWood");
  });

  it("renders a noindex Not Found page for unknown paths", async () => {
    renderWorkspace("/this-route-does-not-exist");

    const notFound = await screen.findByRole("article", { name: "Page not found" });
    expect(screen.getByRole("heading", { name: "Page not found", level: 1 })).toBeInTheDocument();
    expect(notFound.querySelector('a[href="/"]')).toHaveTextContent("Back to Home");
    expect(robotsContent()).toBe(ROBOTS_NOINDEX);
    expect(canonicalHref()).toBeNull();
    expect(document.title).toBe("HFZWood");
  });
});

describe("static publication files", () => {
  const indexHtml = readFileSync(indexHtmlPath, "utf8");
  const robotsTxt = readFileSync(robotsPath, "utf8");
  const sitemapXml = readFileSync(sitemapPath, "utf8");

  it("keeps site-wide fallback metadata and favicon in the SPA HTML", () => {
    const compactHtml = indexHtml.replace(/\s+/g, " ");
    expect(compactHtml).toContain(`<title>${SITE_NAME}</title>`);
    expect(compactHtml).toContain(`content="${SITE_DESCRIPTION}"`);
    expect(compactHtml).not.toMatch(/name=["']robots["']/i);
    expect(compactHtml).not.toMatch(/rel=["']canonical["']/i);
    expect(compactHtml).not.toContain("index, follow");
    expect(compactHtml).toContain(`href="${FAVICON_PATH}"`);
    expect(compactHtml).toContain(`property="og:title" content="${SITE_NAME}"`);
    expect(compactHtml).toContain(`property="og:description" content="${SITE_DESCRIPTION}"`);
    expect(compactHtml).toContain(`property="og:url" content="${PUBLIC_ORIGIN}"`);
    expect(compactHtml).toContain(`property="og:image" content="${PUBLIC_ORIGIN}${OG_IMAGE_PATH}"`);
    expect(compactHtml).toContain(`property="og:type" content="website"`);
    expect(compactHtml).toContain(`name="twitter:card" content="summary"`);
    expect(compactHtml).toContain(`name="twitter:title" content="${SITE_NAME}"`);
    expect(compactHtml).toContain(`name="twitter:description" content="${SITE_DESCRIPTION}"`);
    expect(compactHtml).toContain(`name="twitter:image" content="${PUBLIC_ORIGIN}${OG_IMAGE_PATH}"`);
    expect(existsSync(logoPath)).toBe(true);
  });

  it("serves a permissive robots.txt that points at the sitemap", () => {
    expect(robotsTxt.replace(/\r\n/g, "\n")).toBe(
      "User-agent: *\nAllow: /\n\nSitemap: https://hfzwood.com/sitemap.xml\n",
    );
  });

  it("includes only the six public URLs in the sitemap", () => {
    const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(urls).toEqual([
      `${PUBLIC_ORIGIN}/`,
      `${PUBLIC_ORIGIN}/about`,
      `${PUBLIC_ORIGIN}/pricing`,
      `${PUBLIC_ORIGIN}/privacy`,
      `${PUBLIC_ORIGIN}/terms`,
      `${PUBLIC_ORIGIN}/contact`,
    ]);
    expect(sitemapXml).not.toContain("/login");
    expect(sitemapXml).not.toContain("/account");
    expect(sitemapXml).not.toContain("/new-project");
    expect(sitemapXml).not.toContain("/projects");
    expect(sitemapXml).not.toContain("/manual");
    expect(sitemapXml).not.toContain("/glossary");
    expect(sitemapXml).not.toContain("/knowledge-base");
    expect(sitemapXml).not.toContain("/callback");
    expect(sitemapXml).not.toContain("/admin");
  });
});
