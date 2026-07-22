import { vi } from "vitest";
import { handleGlobalReferenceSearch } from "../admin/test/editorialTestHelpers.js";

export function buildPublishedWebsiteResponse(pageKey, overrides = {}) {
  return {
    locale: "en",
    requestedLocale: "en",
    available: true,
    englishAvailable: true,
    page: {
      pageKey,
      slug: `/${pageKey === "home" ? "" : pageKey}`,
      pageKind: pageKey,
      body: {
        pageKind: pageKey,
        publicTitle: `Published ${pageKey}`,
      },
    },
    ...overrides,
  };
}

/**
 * @param {{
 *   pages?: Record<string, object>;
 *   unavailableKeys?: string[];
 *   publishHome?: boolean;
 * }} [options]
 */
export function mockPublishedWebsiteFetch(options = {}) {
  const pages = options.pages ?? {};
  const unavailableKeys = new Set(options.unavailableKeys ?? []);
  const publishHome = options.publishHome === true;

  const fetchMock = vi.fn(async (url, init) => {
    const global = handleGlobalReferenceSearch(url);
    if (global) {
      return global;
    }

    const requestUrl = String(url);
    const match = requestUrl.match(/\/api\/content\/website\/([^/?]+)/);
    if (match) {
      const pageKey = decodeURIComponent(match[1]);
      if (unavailableKeys.has(pageKey)) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            locale: "en",
            requestedLocale: "en",
            available: false,
            englishAvailable: true,
            page: null,
          }),
        };
      }
      if (pageKey === "home" && !pages.home && !publishHome) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            locale: "en",
            requestedLocale: "en",
            available: false,
            englishAvailable: false,
            page: null,
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => pages[pageKey] ?? buildPublishedWebsiteResponse(pageKey),
      };
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({ detail: "Not found" }),
    };
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function buildPublishedHomeBody(overrides = {}) {
  return {
    pageKind: "home",
    publicTitle: "CMS Home Title",
    subtitle: "CMS Home Subtitle",
    description: "CMS Home Description",
    image: { src: "", alt: "", visible: false },
    video: { url: "", visible: false },
    cta: { label: "", destination: "", visible: false },
    ...overrides,
  };
}

export function buildPublishedHomeResponse(bodyOverrides = {}, responseOverrides = {}) {
  return buildPublishedWebsiteResponse("home", {
    page: {
      pageKey: "home",
      slug: "/",
      pageKind: "home",
      body: buildPublishedHomeBody(bodyOverrides),
    },
    ...responseOverrides,
  });
}

export function buildAboutSection(overrides = {}) {
  return {
    id: "section-a",
    title: "About section",
    blocks: [{ type: "paragraph", text: "<p>About body</p>" }],
    image: { src: "", alt: "" },
    ...overrides,
  };
}

export function buildPublishedAboutResponse(bodyOverrides = {}, responseOverrides = {}) {
  return buildPublishedWebsiteResponse("about", {
    page: {
      pageKey: "about",
      slug: "/about",
      pageKind: "about",
      body: {
        pageKind: "about",
        publicTitle: "About HFZWood",
        sections: [buildAboutSection()],
        ...bodyOverrides,
      },
    },
    ...responseOverrides,
  });
}

export function buildPricingOffer(id, overrides = {}) {
  return {
    id,
    title: `${id} title`,
    displayedPriceText: `${id} price`,
    benefits: [`${id} benefit`],
    ctaLabel: `${id} cta`,
    ctaDestination: `/${id}`,
    visible: true,
    ...overrides,
  };
}

export function buildPublishedPricingResponse(bodyOverrides = {}, responseOverrides = {}) {
  return buildPublishedWebsiteResponse("pricing", {
    page: {
      pageKey: "pricing",
      slug: "/pricing",
      pageKind: "pricing",
      body: {
        pageKind: "pricing",
        publicTitle: "Pricing",
        intro: "Pricing intro",
        footnote: "Pricing footnote",
        offers: [
          buildPricingOffer("free"),
          buildPricingOffer("subscriber"),
          buildPricingOffer("lifetime"),
        ],
        ...bodyOverrides,
      },
    },
    ...responseOverrides,
  });
}

export function buildDocumentSection(overrides = {}) {
  return {
    id: "doc-1",
    title: "Document section",
    blocks: [{ type: "paragraph", text: "<p>Document body</p>" }],
    ...overrides,
  };
}

export function buildPublishedDocumentResponse(pageKey, bodyOverrides = {}, responseOverrides = {}) {
  return buildPublishedWebsiteResponse(pageKey, {
    page: {
      pageKey,
      slug: `/${pageKey}`,
      pageKind: pageKey,
      body: {
        pageKind: pageKey,
        publicTitle: pageKey === "privacy" ? "Privacy Policy" : "Terms of Service",
        sections: [buildDocumentSection()],
        ...bodyOverrides,
      },
    },
    ...responseOverrides,
  });
}

export function buildPublishedContactResponse(bodyOverrides = {}, responseOverrides = {}) {
  return buildPublishedWebsiteResponse("contact", {
    page: {
      pageKey: "contact",
      slug: "/contact",
      pageKind: "contact",
      body: {
        pageKind: "contact",
        publicTitle: "Contact",
        intro: "Contact intro",
        supportEmail: "support@example.com",
        showManualLink: true,
        showKnowledgeBaseLink: true,
        manualLinkLabel: "Manual",
        knowledgeBaseLinkLabel: "Knowledge Base",
        links: [],
        ...bodyOverrides,
      },
    },
    ...responseOverrides,
  });
}
