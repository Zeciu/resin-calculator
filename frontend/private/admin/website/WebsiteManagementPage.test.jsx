import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "../../workspace/renderWorkspaceRouter.jsx";
import { ADMIN_ROUTES } from "../adminRoutes.js";
import { handleGlobalReferenceSearch, isAdministratorFetchRequest, withEditorialVisibility } from "../test/editorialTestHelpers.js";

vi.mock("./WebsiteRichTextEditor.jsx", () => ({
  default: function MockWebsiteRichTextEditor({ onDocumentChange, ariaLabel }) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() =>
          onDocumentChange({
            type: "doc",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Edited rich text." }] }],
          })
        }
      >
        Simulate rich text edit
      </button>
    );
  },
}));

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const API_ROOT = "/api/admin/website/pages";

const WEBSITE_PAGES = [
  { pageKey: "home", adminLabel: "Home", pageKind: "home", sortOrder: 100, slug: "/" },
  { pageKey: "about", adminLabel: "About HFZWood", pageKind: "about", sortOrder: 200, slug: "/about" },
  { pageKey: "pricing", adminLabel: "Pricing", pageKind: "pricing", sortOrder: 300, slug: "/pricing" },
  {
    pageKey: "privacy",
    adminLabel: "Privacy Policy",
    pageKind: "privacy",
    sortOrder: 400,
    slug: "/privacy",
  },
  { pageKey: "terms", adminLabel: "Terms of Service", pageKind: "terms", sortOrder: 500, slug: "/terms" },
  { pageKey: "contact", adminLabel: "Contact", pageKind: "contact", sortOrder: 600, slug: "/contact" },
];

function seedAdministrator() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        id: "stub-user",
        email: "admin@example.com",
        username: "admin",
        role: "administrator",
      },
    }),
  );
}

function emptyHomeBody() {
  return {
    pageKind: "home",
    publicTitle: "",
    subtitle: "",
    description: "",
    image: { src: "", alt: "", visible: false },
    video: { url: "", visible: false },
    cta: { label: "", destination: "", visible: false },
  };
}

function emptyBodyForPage(pageKey) {
  const page = WEBSITE_PAGES.find((item) => item.pageKey === pageKey);
  if (page?.pageKind === "pricing") {
    return {
      pageKind: "pricing",
      publicTitle: "",
      intro: "",
      offers: [
        { id: "free", title: "", displayedPriceText: "", benefits: [], ctaLabel: "", ctaDestination: "", visible: true },
        { id: "subscriber", title: "", displayedPriceText: "", benefits: [], ctaLabel: "", ctaDestination: "", visible: true },
        { id: "lifetime", title: "", displayedPriceText: "", benefits: [], ctaLabel: "", ctaDestination: "", visible: true },
      ],
      footnote: "",
    };
  }
  if (page?.pageKind === "about" || page?.pageKind === "privacy" || page?.pageKind === "terms") {
    return { pageKind: page.pageKind, publicTitle: "", sections: [] };
  }
  if (page?.pageKind === "contact") {
    return {
      pageKind: "contact",
      publicTitle: "",
      intro: "",
      supportEmail: "",
      links: [],
      showManualLink: true,
      showKnowledgeBaseLink: true,
      manualLinkLabel: "Manual și tutoriale",
      knowledgeBaseLinkLabel: "Baza de cunoștințe",
    };
  }
  return emptyHomeBody();
}

function createInMemoryWebsiteApi() {
  const variants = new Map();

  function variantKey(pageKey, locale) {
    return `${pageKey}:${locale}`;
  }

  return {
    reset() {
      variants.clear();
    },
    seedVariant(pageKey, locale, body, status = "draft") {
      const page = WEBSITE_PAGES.find((item) => item.pageKey === pageKey);
      variants.set(variantKey(pageKey, locale), {
        pageKey,
        locale,
        pageKind: page?.pageKind ?? "home",
        status,
        exists: true,
        body,
        updatedAt: "2026-01-01T00:00:00+00:00",
        publishedAt: status === "published" ? "2026-01-01T00:00:00+00:00" : null,
      });
    },
    getVariant(pageKey, locale) {
      return variants.get(variantKey(pageKey, locale));
    },
    handler(url, method, init) {
      const parsed = new URL(url, "http://localhost");
      const path = parsed.pathname.replace(API_ROOT, "") || "/";

      if (!isAdministratorFetchRequest(init)) {
        return Promise.resolve({ ok: false, status: 403, json: async () => ({ detail: "Forbidden" }) });
      }

      if (path === "/images" && method === "POST") {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ url: "/api/content/website/images/mock.png" }),
        });
      }

      if (path === "/" && method === "GET") {
        const locale = parsed.searchParams.get("locale") || "ro";
        const items = WEBSITE_PAGES.map((page) => {
          const variant = variants.get(variantKey(page.pageKey, locale));
          return {
            ...page,
            publicTitle: variant?.body?.publicTitle ?? "",
            variants: {
              ro: { status: variants.get(variantKey(page.pageKey, "ro"))?.status ?? "draft" },
              en: { status: variants.get(variantKey(page.pageKey, "en"))?.status ?? "draft" },
            },
          };
        });
        return Promise.resolve({ ok: true, status: 200, json: async () => items });
      }

      const variantMatch = path.match(/^\/([^/]+)\/variants\/([^/]+)$/);
      if (variantMatch && method === "GET") {
        const [, pageKey, locale] = variantMatch;
        const variant = variants.get(variantKey(pageKey, locale));
        const page = WEBSITE_PAGES.find((item) => item.pageKey === pageKey);
        if (!page) {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: async () => ({ detail: "Website page not found." }),
          });
        }
        if (!variant) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              pageKey,
              locale,
              pageKind: page.pageKind,
              status: "draft",
              exists: false,
              body: emptyBodyForPage(pageKey),
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => withEditorialVisibility(variant),
        });
      }

      if (variantMatch && method === "PUT") {
        const [, pageKey, locale] = variantMatch;
        const page = WEBSITE_PAGES.find((item) => item.pageKey === pageKey);
        const payload = JSON.parse(init.body);
        if (!String(payload.body?.publicTitle ?? "").trim()) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ detail: "Public title cannot be empty." }),
          });
        }
        const existing = variants.get(variantKey(pageKey, locale));
        const saved = {
          pageKey,
          locale,
          pageKind: page?.pageKind ?? "home",
          status: existing?.status ?? "draft",
          exists: true,
          body: payload.body,
          updatedAt: "2026-01-02T00:00:00+00:00",
          publishedAt: existing?.publishedAt ?? null,
        };
        variants.set(variantKey(pageKey, locale), saved);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => withEditorialVisibility(saved),
        });
      }

      const publishMatch = path.match(/^\/([^/]+)\/variants\/([^/]+)\/publish$/);
      if (publishMatch && method === "POST") {
        const [, pageKey, locale] = publishMatch;
        const variant = variants.get(variantKey(pageKey, locale));
        if (!variant?.body?.publicTitle?.trim()) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ detail: "Public title cannot be empty." }),
          });
        }
        const published = {
          ...variant,
          status: "published",
          publishedAt: "2026-01-03T00:00:00+00:00",
          updatedAt: "2026-01-03T00:00:00+00:00",
        };
        variants.set(variantKey(pageKey, locale), published);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            pageKey,
            locale,
            status: "published",
            publishedAt: "2026-01-03T00:00:00+00:00",
            snapshotKey: `published/website/${locale}/pages.json`,
          }),
        });
      }

      const unpublishMatch = path.match(/^\/([^/]+)\/variants\/([^/]+)\/unpublish$/);
      if (unpublishMatch && method === "POST") {
        const [, pageKey, locale] = unpublishMatch;
        const variant = variants.get(variantKey(pageKey, locale));
        if (!variant) {
          return Promise.resolve({ ok: false, status: 404, json: async () => ({ detail: "Not found" }) });
        }
        const unpublished = {
          ...variant,
          status: "draft",
          publishedAt: null,
          updatedAt: "2026-01-04T00:00:00+00:00",
        };
        variants.set(variantKey(pageKey, locale), unpublished);
        return Promise.resolve({ ok: true, status: 204, json: async () => null });
      }

      const generateMatch = path.match(/^\/([^/]+)\/variants\/([^/]+)\/generate-translation$/);
      if (generateMatch && method === "POST") {
        const [, pageKey, locale] = generateMatch;
        const ro = variants.get(variantKey(pageKey, "ro"));
        const translatedBody = {
          ...ro.body,
          publicTitle: `[${locale}]${ro.body.publicTitle}`,
        };
        const saved = {
          pageKey,
          locale,
          pageKind: ro.pageKind,
          status: "draft",
          exists: true,
          body: translatedBody,
          updatedAt: "2026-01-05T00:00:00+00:00",
          publishedAt: null,
          generatedFromSourceRevision: 1,
          generatedFromSourceTextRevision: 1,
          translationProvider: "deepl",
        };
        variants.set(variantKey(pageKey, locale), saved);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () =>
            withEditorialVisibility({
              ...saved,
              translationUpdateState: "current",
              translationUpdateAction: "skip_current",
            }),
        });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ detail: "Not found" }),
      });
    },
  };
}

const memoryApi = createInMemoryWebsiteApi();

function setupWebsiteFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn((url, init) => {
      const global = handleGlobalReferenceSearch(url);
      if (global) {
        return global;
      }
      if (String(url).startsWith(API_ROOT)) {
        return memoryApi.handler(url, init?.method || "GET", init || {});
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ detail: "Not found" }),
      });
    }),
  );
}

describe("Website management editors (Stage 5B)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_MOCK_ADMIN", "true");
    memoryApi.reset();
    setupWebsiteFetchMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("renders user-oriented editing header without internal keys", async () => {
    memoryApi.seedVariant("home", "ro", { ...emptyHomeBody(), publicTitle: "HFZWood Home" });
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    await waitFor(() => {
      expect(screen.getByText(/Editing:/i)).toBeInTheDocument();
      expect(screen.getByText(/Language:/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Page key:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/next phase/i)).not.toBeInTheDocument();
  });

  it("lists exactly six fixed website pages with Home selected by default", async () => {
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const sidebar = await screen.findByRole("navigation", { name: "Website pages" });
    const pageButtons = within(sidebar).getAllByRole("button");
    expect(pageButtons).toHaveLength(6);
    expect(within(sidebar).getByRole("button", { name: "Home" })).toHaveClass(
      "editorial-sidebar__item--active",
    );
  });

  it("saves home draft edits and clears dirty state", async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    await screen.findByLabelText("Hero title");
    await user.type(screen.getByLabelText("Hero title"), "HFZWood");
    await user.type(screen.getByLabelText("Subtitle"), "Subtitle");

    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(screen.queryByText(/Unsaved changes/i)).not.toBeInTheDocument();
    });
    expect(memoryApi.getVariant("home", "ro")?.body.publicTitle).toBe("HFZWood");
  });

  it("publishes and unpublishes a saved home page", async () => {
    memoryApi.seedVariant("home", "ro", {
      ...emptyHomeBody(),
      publicTitle: "HFZWood",
      subtitle: "Welcome",
    });
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    await screen.findByLabelText("Hero title");
    await user.click(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() => {
      expect(memoryApi.getVariant("home", "ro")?.status).toBe("published");
    });

    await user.click(screen.getByRole("button", { name: "Unpublish" }));
    await waitFor(() => {
      expect(memoryApi.getVariant("home", "ro")?.status).toBe("draft");
    });
  });

  it("shows unsaved changes guard when switching pages", async () => {
    memoryApi.seedVariant("home", "ro", { ...emptyHomeBody(), publicTitle: "Home" });
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    await screen.findByLabelText("Hero title");
    await user.type(screen.getByLabelText("Subtitle"), "Changed");
    const sidebar = screen.getByRole("navigation", { name: "Website pages" });
    await user.click(within(sidebar).getByRole("button", { name: "Pricing" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("generates an English translation from Romanian source", async () => {
    memoryApi.seedVariant("home", "ro", { ...emptyHomeBody(), publicTitle: "Acasă" });
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    await screen.findByLabelText("Hero title");
    await user.click(screen.getByRole("button", { name: "EN" }));
    await user.click(screen.getByRole("button", { name: "Update Translation" }));

    await waitFor(() => {
      expect(memoryApi.getVariant("home", "en")?.body.publicTitle).toBe("[en]Acasă");
    });
  });

  it("renders pricing editor with fixed plans only", async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const sidebar = await screen.findByRole("navigation", { name: "Website pages" });
    await user.click(within(sidebar).getByRole("button", { name: "Pricing" }));

    expect(screen.getByRole("article", { name: "Free plan" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Subscriber plan" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Lifetime plan" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add plan/i })).not.toBeInTheDocument();
  });

  it("validates contact email on save", async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const sidebar = await screen.findByRole("navigation", { name: "Website pages" });
    await user.click(within(sidebar).getByRole("button", { name: "Contact" }));

    await user.type(screen.getByLabelText("Page title"), "Contact");
    await user.type(screen.getByLabelText("Support email"), "bad-email");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(screen.getByText("Support email must be a valid email address.")).toBeInTheDocument();
    });
  });

  it("uploads and removes an about content section image", async () => {
    memoryApi.seedVariant("about", "ro", {
      pageKind: "about",
      publicTitle: "About",
      sections: [
        { id: "hero", title: "Hero", blocks: [{ type: "paragraph", text: "Intro" }] },
        { id: "story", title: "Story", blocks: [{ type: "paragraph", text: "Body" }] },
      ],
    });
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const sidebar = await screen.findByRole("navigation", { name: "Website pages" });
    await user.click(within(sidebar).getByRole("button", { name: "About HFZWood" }));

    const file = new File(["png"], "story.png", { type: "image/png" });
    const uploadInput = document.querySelector(".website-image-field__file-input");
    expect(uploadInput).toBeTruthy();
    await user.upload(uploadInput, file);
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      const saved = memoryApi.getVariant("about", "ro");
      const story = saved?.body.sections.find((section) => section.id === "story");
      expect(story?.image?.src).toBe("/api/content/website/images/mock.png");
    });

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      const saved = memoryApi.getVariant("about", "ro");
      const story = saved?.body.sections.find((section) => section.id === "story");
      expect(story?.image?.src).toBe("");
      expect(story?.image?.alt).toBe("");
    });
  });

  it("saves pricing offer visibility toggle", async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const sidebar = await screen.findByRole("navigation", { name: "Website pages" });
    await user.click(within(sidebar).getByRole("button", { name: "Pricing" }));

    await user.type(screen.getByLabelText("Page title"), "Pricing");
    const freePlan = screen.getByRole("article", { name: "Free plan" });
    await user.click(within(freePlan).getByRole("checkbox", { name: "Show plan on page" }));
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      const offers = memoryApi.getVariant("pricing", "ro")?.body.offers ?? [];
      const free = offers.find((offer) => offer.id === "free");
      expect(free?.visible).toBe(false);
    });
  });

  it("saves home CTA visibility toggle as false", async () => {
    memoryApi.seedVariant("home", "ro", {
      ...emptyHomeBody(),
      publicTitle: "Home with CTA",
      cta: { label: "View Pricing", destination: "/pricing", visible: true },
    });
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    await screen.findByDisplayValue("View Pricing");
    const showCta = screen.getByRole("checkbox", { name: "Show CTA" });
    expect(showCta).toBeChecked();
    await user.click(showCta);
    expect(showCta).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(memoryApi.getVariant("home", "ro")?.body.cta).toEqual({
        label: "View Pricing",
        destination: "/pricing",
        visible: false,
      });
    });
  });

  it("shows explicit home visibility toggle labels", async () => {
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    await screen.findByLabelText("Hero title");
    expect(screen.getByRole("checkbox", { name: "Show hero image" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Show CTA" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Show video" })).toBeInTheDocument();
  });

  it("renders website checkboxes inline with their labels", async () => {
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const toggle = await screen.findByRole("checkbox", { name: "Show hero image" });
    expect(toggle.closest("label")).toHaveClass("website-admin__checkbox");
    expect(toggle.closest("label")?.textContent).toMatch(/Show hero image/);
  });

  it("shows About main heading and content sections labels", async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const sidebar = await screen.findByRole("navigation", { name: "Website pages" });
    await user.click(within(sidebar).getByRole("button", { name: "About HFZWood" }));

    expect(screen.getByLabelText("Main heading")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Content sections" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add content section" })).toBeInTheDocument();
  });

  it("shows Sections heading on Privacy and Terms editors", async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const sidebar = await screen.findByRole("navigation", { name: "Website pages" });
    await user.click(within(sidebar).getByRole("button", { name: "Privacy Policy" }));
    expect(screen.getByRole("heading", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Section 1" })).toBeInTheDocument();

    await user.click(within(sidebar).getByRole("button", { name: "Terms of Service" }));
    expect(screen.getByRole("heading", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Section 1" })).toBeInTheDocument();
  });

  it("disables deleting the final Privacy and Terms section", async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const sidebar = await screen.findByRole("navigation", { name: "Website pages" });
    await user.click(within(sidebar).getByRole("button", { name: "Privacy Policy" }));
    expect(screen.getByRole("button", { name: "Delete Section 1" })).toBeDisabled();

    await user.click(within(sidebar).getByRole("button", { name: "Terms of Service" }));
    expect(screen.getByRole("button", { name: "Delete Section 1" })).toBeDisabled();
  });

  it("saves contact built-in link labels", async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const sidebar = await screen.findByRole("navigation", { name: "Website pages" });
    await user.click(within(sidebar).getByRole("button", { name: "Contact" }));

    await user.type(screen.getByLabelText("Page title"), "Contact");
    const manualLabel = screen.getByLabelText("Manual link label");
    const kbLabel = screen.getByLabelText("Knowledge Base link label");
    await user.clear(manualLabel);
    await user.type(manualLabel, "Manual custom");
    await user.clear(kbLabel);
    await user.type(kbLabel, "KB custom");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      const body = memoryApi.getVariant("contact", "ro")?.body;
      expect(body?.manualLinkLabel).toBe("Manual custom");
      expect(body?.knowledgeBaseLinkLabel).toBe("KB custom");
    });
  });

  it("saves contact official links", async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const sidebar = await screen.findByRole("navigation", { name: "Website pages" });
    await user.click(within(sidebar).getByRole("button", { name: "Contact" }));

    await user.type(screen.getByLabelText("Page title"), "Contact");
    await user.type(screen.getByLabelText("YouTube URL"), "https://www.youtube.com/@hfzwood");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      const body = memoryApi.getVariant("contact", "ro")?.body;
      expect(body?.officialLinks?.youtube).toBe("https://www.youtube.com/@hfzwood");
      expect(body?.officialLinks?.facebook).toBe("");
    });
  });
});

describe("Admin navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_MOCK_ADMIN", "true");
    memoryApi.reset();
    setupWebsiteFetchMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("shows Website in admin navigation and removes Future content sections", () => {
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.ROOT);

    const adminNav = screen.getByRole("navigation", { name: "Administration navigation" });
    expect(within(adminNav).getByRole("link", { name: "Website" })).toBeInTheDocument();
    expect(within(adminNav).queryByRole("link", { name: "Future content sections" })).not.toBeInTheDocument();
  });

  it("marks Website as the active admin navigation item on /admin/website", async () => {
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.WEBSITE);

    const adminNav = screen.getByRole("navigation", { name: "Administration navigation" });
    expect(within(adminNav).getByRole("link", { name: "Website" })).toHaveClass(
      "admin-sidebar__link--active",
    );
  });

  it("keeps manual, glossary and knowledge base routes available", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.ROOT);

    const adminNav = screen.getByRole("navigation", { name: "Administration navigation" });
    await user.click(within(adminNav).getByRole("link", { name: "Manual & Tutorials" }));
    expect(screen.getByRole("region", { name: "Manual management" })).toBeInTheDocument();
  });
});
