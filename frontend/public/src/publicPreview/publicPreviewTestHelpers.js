import { vi } from "vitest";
import { GUEST_CAPABILITIES_RESPONSE } from "../capabilities/capabilityDefaults.js";

export function buildManualPreviewResponse({
  locale = "ro",
  available = true,
  chapters = [],
} = {}) {
  return {
    locale,
    requestedLocale: locale,
    available,
    englishAvailable: false,
    documentTitle: "Manual & Tutorials",
    lede: "",
    chapters,
  };
}

export function buildKnowledgeBasePreviewResponse({
  locale = "ro",
  available = true,
  entries = [],
} = {}) {
  return {
    locale,
    requestedLocale: locale,
    available,
    englishAvailable: false,
    documentTitle: "Knowledge Base",
    lede: "",
    entries,
  };
}

export function buildGlossaryPreviewResponse({
  locale = "ro",
  available = true,
  entries = [],
} = {}) {
  return {
    locale,
    requestedLocale: locale,
    available,
    englishAvailable: false,
    documentTitle: "Glossary",
    lede: "",
    entries,
  };
}

export const SAMPLE_MANUAL_CHAPTERS = [
  {
    id: "prima-turnare",
    title: "Prima turnare",
    locked: false,
    blocks: [{ type: "paragraph", text: "Unlocked chapter body for the first pour." }],
  },
  { id: "locked-chapter", title: "Capitol blocat", locked: true },
];

export const SAMPLE_KB_ENTRIES = [
  {
    id: "cum-calculez-cantitatea-necesar-de-r-in-pentru-un-proiect",
    title: "Cum calculez cantitatea de rasina",
    locked: false,
    problemSummary: "Need the right resin volume.",
    solution: ["Measure the cavity, then calculate."],
    relatedKbArticles: [{ id: "locked-kb-article", label: "Locked related article" }],
    relatedGlossaryTerms: [{ id: "locked-glossary-term", label: "Locked related term" }],
    relatedManualChapters: [{ id: "prima-turnare", label: "Prima turnare" }],
  },
  {
    id: "de-ce-apar-bulele-de-aer-n-timpul-turn-rii",
    title: "De ce apar bulele de aer",
    locked: false,
    problemSummary: "Air bubbles during pouring.",
    solution: ["Mix slowly."],
  },
  {
    id: "cum-se-amestec-corect-r-ina-epoxidic",
    title: "Cum se amesteca rasina",
    locked: false,
    problemSummary: "Mixing epoxy correctly.",
    solution: ["Follow the ratio."],
  },
  { id: "locked-kb-article", title: "Articol blocat", locked: true },
];

export const LOCKED_FIRST_KB_ENTRIES = [
  { id: "locked-kb-first", title: "Articol blocat primul", locked: true },
  {
    id: "first-unlocked-kb",
    title: "Primul articol deblocat",
    locked: false,
    problemSummary: "Unlocked KB body shown immediately.",
    solution: ["Read this first."],
  },
  { id: "locked-kb-later", title: "Alt articol blocat", locked: true },
];

export const ORDERED_GLOSSARY_PREVIEW_ENTRIES = [
  { id: "mango-locked", term: "Mango blocat", locked: true },
  {
    id: "zahar-unlocked",
    term: "Zahăr deblocat",
    locked: false,
    definition: ["First unlocked glossary definition from API order."],
  },
  {
    id: "alune-unlocked",
    term: "Alune deblocat",
    locked: false,
    definition: ["Alphabetically first unlocked term, not first in API order."],
  },
];

export const SAMPLE_GLOSSARY_ENTRIES = [
  {
    id: "r-in-epoxidic",
    term: "Rășină epoxidică",
    locked: false,
    definition: ["A two-part resin used in woodworking."],
    media: [
      {
        type: "image",
        src: "/api/public-preview/glossary/images/preview-resin.png",
        alt: "Epoxy resin preview",
      },
    ],
    seeAlso: [
      {
        targetType: "manual_chapter",
        targetId: "prima-turnare",
        label: "Prima turnare",
        href: "/manual#prima-turnare",
      },
    ],
    relatedTerms: [{ id: "locked-glossary-term", term: "Termen blocat" }],
  },
  {
    id: "reac-ie-exoterm",
    term: "Reacție exotermă",
    locked: false,
    definition: ["A reaction that releases heat."],
  },
  {
    id: "bule-de-aer",
    term: "Bule de aer",
    locked: false,
    definition: ["Trapped air in the pour."],
  },
  { id: "locked-glossary-term", term: "Termen blocat", locked: true },
];

export function emptyPreviewResponse(locale = "en") {
  return {
    locale,
    requestedLocale: locale,
    available: false,
    englishAvailable: false,
    documentTitle: "",
    lede: "",
  };
}

export function mockPublicPreviewFetch({
  manual,
  knowledgeBase,
  glossary,
  activePublicLocales = ["en", "ro", "fr"],
} = {}) {
  const roManual = buildManualPreviewResponse({ locale: "ro", chapters: SAMPLE_MANUAL_CHAPTERS });
  const roKb = buildKnowledgeBasePreviewResponse({ locale: "ro", entries: SAMPLE_KB_ENTRIES });
  const roGlossary = buildGlossaryPreviewResponse({ locale: "ro", entries: SAMPLE_GLOSSARY_ENTRIES });

  const fetchMock = vi.fn(async (url) => {
    const requestUrl = typeof url === "string" ? url : String(url?.url ?? url);
    if (requestUrl.includes("/api/me/capabilities")) {
      return {
        ok: true,
        json: async () => GUEST_CAPABILITIES_RESPONSE,
      };
    }
    if (requestUrl.includes("/api/content/public-languages")) {
      return {
        ok: true,
        json: async () => ({
          defaultPublicLocale: "en",
          activePublicLocales,
        }),
      };
    }
    if (/\/api\/content\/(manual|knowledge-base|glossary)(\?|\/|$)/.test(requestUrl)) {
      return {
        ok: false,
        status: 401,
        json: async () => ({ detail: "Not authenticated" }),
      };
    }
    const requestedLocale = new URL(requestUrl, "http://local.test").searchParams.get("locale") || "en";
    if (requestUrl.includes("/api/public-preview/manual?")) {
      const payload =
        manual ??
        (requestedLocale === "ro"
          ? roManual
          : buildManualPreviewResponse({ locale: requestedLocale, available: false, chapters: [] }));
      return { ok: true, json: async () => payload };
    }
    if (requestUrl.includes("/api/public-preview/knowledge-base?")) {
      const payload =
        knowledgeBase ??
        (requestedLocale === "ro"
          ? roKb
          : buildKnowledgeBasePreviewResponse({
              locale: requestedLocale,
              available: false,
              entries: [],
            }));
      return { ok: true, json: async () => payload };
    }
    if (requestUrl.includes("/api/public-preview/glossary?")) {
      const payload =
        glossary ??
        (requestedLocale === "ro"
          ? roGlossary
          : buildGlossaryPreviewResponse({
              locale: requestedLocale,
              available: false,
              entries: [],
            }));
      return { ok: true, json: async () => payload };
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({}),
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function expectNoAuthenticatedContentFetch(fetchMock) {
  const urls = fetchMock.mock.calls.map((call) => String(call[0]));
  expect(urls.some((url) => /\/api\/content\/(manual|knowledge-base|glossary)(\?|\/|$)/.test(url))).toBe(
    false,
  );
  expect(urls.some((url) => url.includes("/api/content/glossary/images/"))).toBe(false);
}

function installPreviewRevealRectMock(onAlign) {
  let aligned = false;
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function previewRevealRect() {
    const isContent = this.hasAttribute("data-preview-unlocked-content");
    const isBody =
      this.classList.contains("knowledge-base-entry__body") ||
      this.classList.contains("glossary-entry__body");
    if (this.classList.contains("glossary-module__scroll")) {
      return {
        top: 0,
        bottom: 500,
        left: 0,
        right: 400,
        width: 400,
        height: 500,
        x: 0,
        y: 0,
        toJSON() {},
      };
    }
    if (isContent || isBody) {
      const top = aligned ? (isBody ? 96 : 72) : isBody ? 1680 : 1600;
      return {
        top,
        bottom: top + 80,
        left: 0,
        right: 400,
        width: 400,
        height: 80,
        x: 0,
        y: top,
        toJSON() {},
      };
    }
    return originalRect.call(this);
  };
  return {
    markAligned() {
      aligned = true;
      onAlign?.();
    },
    restore() {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    },
  };
}

export function installPreviewDocumentScrollMock() {
  Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 700 });
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 4000 });
  Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });
  const rectMock = installPreviewRevealRectMock(() => {
    window.scrollY = window.scrollY;
  });
  const scrollTo = vi.fn((options) => {
    rectMock.markAligned();
    window.scrollY = options?.top ?? 0;
  });
  window.scrollTo = scrollTo;
  return {
    scrollTo,
    restore() {
      rectMock.restore();
    },
  };
}

export function installPreviewGlossaryScrollMock() {
  const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
  const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() {
      if (this.classList?.contains("glossary-module__scroll")) {
        return 500;
      }
      return originalClientHeight?.get ? originalClientHeight.get.call(this) : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get() {
      if (this.classList?.contains("glossary-module__scroll")) {
        return 3000;
      }
      return originalScrollHeight?.get ? originalScrollHeight.get.call(this) : 0;
    },
  });

  const rectMock = installPreviewRevealRectMock();
  const listScrollTo = vi.fn(function glossaryListScrollTo(options) {
    rectMock.markAligned();
    this.scrollTop = options?.top ?? 0;
  });
  const originalElementScrollTo = Element.prototype.scrollTo;
  Element.prototype.scrollTo = function previewGlossaryScrollTo(...args) {
    if (this.classList?.contains("glossary-module__scroll")) {
      return listScrollTo.apply(this, args);
    }
    if (typeof originalElementScrollTo === "function") {
      return originalElementScrollTo.apply(this, args);
    }
    return undefined;
  };
  const windowScrollTo = vi.fn();
  window.scrollTo = windowScrollTo;

  return {
    listScrollTo,
    windowScrollTo,
    restore() {
      Element.prototype.scrollTo = originalElementScrollTo;
      rectMock.restore();
      if (originalClientHeight) {
        Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
      } else {
        delete HTMLElement.prototype.clientHeight;
      }
      if (originalScrollHeight) {
        Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
      } else {
        delete HTMLElement.prototype.scrollHeight;
      }
    },
  };
}


