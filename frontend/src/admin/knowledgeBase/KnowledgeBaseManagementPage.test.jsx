import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "../../workspace/renderWorkspaceRouter.jsx";
import { ADMIN_ROUTES } from "../adminRoutes.js";
import { handleGlobalReferenceSearch, isAdministratorFetchRequest, withEditorialVisibility } from "../test/editorialTestHelpers.js";

vi.mock("../../editorial/CrossReferencePicker.jsx", () => ({
  default: function MockCrossReferencePicker({ label }) {
    return <div aria-label={label}>Relationship picker</div>;
  },
}));

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const API_ROOT = "/api/admin/knowledge-base/entries";

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

function emptyVariantBody(title = "") {
  return {
    title,
    problemSummary: "",
    symptoms: [],
    possibleCauses: [],
    solution: [],
    prevention: [],
    tips: [],
    warnings: [],
    searchKeywords: [],
    estimatedRepairTime: null,
    requiredTools: [],
    requiredMaterials: [],
    bodyBlocks: [],
    media: [],
    relatedKbEntryIds: [],
    relatedGlossaryEntryIds: [],
    relatedManualChapterIds: [],
  };
}

function createInMemoryKnowledgeBaseApi() {
  const entries = new Map();
  const variants = new Map();
  let sortOrder = 100;

  function variantKey(contentId, locale) {
    return `${contentId}:${locale}`;
  }

  function entryListTitle(contentId) {
    for (const locale of ["ro", "en"]) {
      const variant = variants.get(variantKey(contentId, locale));
      const title = variant?.body?.title?.trim();
      if (title) {
        return title;
      }
    }
    return entries.get(contentId)?.title ?? "";
  }

  return {
    reset() {
      entries.clear();
      variants.clear();
      sortOrder = 100;
    },
    seedEntry({ contentId, title, category = "Epoxy", difficulty = "Beginner", body, status = "draft", locale = "ro" }) {
      entries.set(contentId, {
        contentId,
        title,
        category,
        difficulty,
        sortOrder: entries.size * 100 + 100,
      });
      variants.set(variantKey(contentId, locale), {
        contentId,
        locale,
        category,
        difficulty,
        status,
        exists: true,
        body,
      });
    },
    handler(url, method, init) {
      const parsed = new URL(url, "http://localhost");
      const path = parsed.pathname.replace(API_ROOT, "") || "/";
      const headers = init.headers || {};

      if (!isAdministratorFetchRequest(init)) {
        return Promise.resolve({ ok: false, status: 403, json: async () => ({ detail: "Forbidden" }) });
      }

      if (path === "/" && method === "GET") {
        const locale = parsed.searchParams.get("locale") || "ro";
        const items = [...entries.values()]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((entry) => ({
            contentId: entry.contentId,
            title: entryListTitle(entry.contentId),
            category: entry.category,
            difficulty: entry.difficulty,
            sortOrder: entry.sortOrder,
            variants: {
              en: { status: variants.get(variantKey(entry.contentId, "en"))?.status || "draft" },
              ro: { status: variants.get(variantKey(entry.contentId, "ro"))?.status || "draft" },
            },
          }));
        return Promise.resolve({ ok: true, status: 200, json: async () => items });
      }

      if (path === "/" && method === "POST") {
        const payload = JSON.parse(init.body);
        const contentId = payload.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        sortOrder += 100;
        entries.set(contentId, {
          contentId,
          title: payload.title,
          category: payload.category,
          difficulty: payload.difficulty,
          sortOrder,
        });
        variants.set(variantKey(contentId, "ro"), {
          contentId,
          locale: "ro",
          category: payload.category,
          difficulty: payload.difficulty,
          status: "draft",
          exists: true,
          body: emptyVariantBody(payload.title),
        });
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            contentId,
            category: payload.category,
            difficulty: payload.difficulty,
            sortOrder,
            createdAt: "2026-01-01T00:00:00+00:00",
            updatedAt: "2026-01-01T00:00:00+00:00",
          }),
        });
      }

      const deleteMatch = path.match(/^\/([^/]+)$/);
      if (deleteMatch && method === "DELETE") {
        const [, contentId] = deleteMatch;
        entries.delete(contentId);
        for (const key of [...variants.keys()]) {
          if (key.startsWith(`${contentId}:`)) {
            variants.delete(key);
          }
        }
        return Promise.resolve({ ok: true, status: 204, json: async () => null });
      }

      const variantMatch = path.match(/^\/([^/]+)\/variants\/([^/]+)$/);
      if (variantMatch && method === "DELETE") {
        const [, contentId, locale] = variantMatch;
        if (locale === "ro") {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: async () => ({
              detail: "Cannot delete the canonical Romanian variant in isolation.",
            }),
          });
        }
        const key = variantKey(contentId, locale);
        if (!variants.has(key)) {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: async () => ({ detail: "Not found" }),
          });
        }
        variants.delete(key);
        return Promise.resolve({ ok: true, status: 204, json: async () => null });
      }

      if (variantMatch && method === "GET") {
        const [, contentId, locale] = variantMatch;
        const entry = entries.get(contentId);
        const variant = variants.get(variantKey(contentId, locale));
        if (!variant) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              contentId,
              locale,
              category: entry?.category || "Epoxy",
              difficulty: entry?.difficulty || "Beginner",
              status: "draft",
              exists: false,
              body: emptyVariantBody(),
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () =>
            withEditorialVisibility({
              ...variant,
              exists: true,
              updatedAt: variant.updatedAt ?? "2026-01-01T00:00:00+00:00",
              publishedAt: variant.publishedAt ?? null,
            }),
        });
      }

      if (variantMatch && method === "PUT") {
        const [, contentId, locale] = variantMatch;
        const payload = JSON.parse(init.body);
        const existing = variants.get(variantKey(contentId, locale));
        const entry = entries.get(contentId);
        if (entry) {
          entry.category = payload.category;
          entry.difficulty = payload.difficulty;
        }
        const saved = {
          contentId,
          locale,
          category: payload.category,
          difficulty: payload.difficulty,
          status: existing?.status || "draft",
          exists: true,
          body: payload.body,
          updatedAt: "2026-01-02T00:00:00+00:00",
          publishedAt: existing?.publishedAt ?? null,
        };
        variants.set(variantKey(contentId, locale), saved);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => withEditorialVisibility(saved),
        });
      }

      const publishMatch = path.match(/^\/([^/]+)\/variants\/([^/]+)\/publish$/);
      if (publishMatch && method === "POST") {
        const [, contentId, locale] = publishMatch;
        const variant = variants.get(variantKey(contentId, locale));
        if (!variant?.body?.title?.trim()) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ detail: "Knowledge base title cannot be empty." }),
          });
        }
        if (!(variant.body.solution?.length ?? 0)) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ detail: "Knowledge base solution cannot be empty." }),
          });
        }
        const published = {
          ...variant,
          status: "published",
          publishedAt: "2026-01-03T00:00:00+00:00",
          updatedAt: "2026-01-03T00:00:00+00:00",
        };
        variants.set(variantKey(contentId, locale), published);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            contentId,
            locale,
            status: "published",
            publishedAt: "2026-01-01T00:00:00+00:00",
            snapshotKey: `published/knowledge-base/${locale}/document.json`,
          }),
        });
      }

      if (path.startsWith("/references/search")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ detail: "Not found" }),
      });
    },
  };
}

const memoryApi = createInMemoryKnowledgeBaseApi();

describe("Knowledge base management workspace (Task 61)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_MOCK_ADMIN", "true");
    memoryApi.reset();
    vi.stubGlobal(
      "fetch",
      vi.fn((url, init) => {
        const global = handleGlobalReferenceSearch(url);
        if (global) {
          return global;
        }
        return memoryApi.handler(url, init?.method || "GET", init || {});
      }),
    );
    vi.spyOn(window, "prompt").mockImplementation(() => "Sticky resin test");
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("opens with an empty entry list", async () => {
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.KNOWLEDGE_BASE);

    expect(screen.getByRole("region", { name: "Knowledge base management" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add New Entry" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Add an entry to begin writing/i)).toBeInTheDocument();
    });
  });

  it(
    "creates, edits list fields, saves, and publishes an entry",
    async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.KNOWLEDGE_BASE);

    await user.click(screen.getByRole("button", { name: "Add New Entry" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sticky resin test" })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Category"), "Wood");
    await user.selectOptions(screen.getByLabelText("Difficulty"), "Intermediate");
    await user.type(screen.getByLabelText("Problem summary"), "Resin stays tacky after cure.");
    await user.type(screen.getByLabelText("Solution row 1"), "Check mixing ratio.");
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => {
      expect(screen.queryByText(/Unsaved changes/i)).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() => {
      expect(screen.getByText(/Live \(RO\)|Draft changes \(RO\)/i)).toBeInTheDocument();
    });
    },
    15000,
  );

  it("deletes the selected knowledge base entry", async () => {
    memoryApi.seedEntry({
      contentId: "sticky-resin",
      title: "Sticky resin",
      body: {
        ...emptyVariantBody("Sticky resin"),
        solution: ["Check ratio."],
      },
    });

    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.KNOWLEDGE_BASE);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sticky resin" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Delete entry in all languages" }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Sticky resin" })).not.toBeInTheDocument();
    });
  });

  it("switches locale without leaving the admin knowledge base workspace", async () => {
    memoryApi.seedEntry({
      contentId: "cloudy-epoxy",
      title: "Cloudy epoxy",
      body: {
        ...emptyVariantBody("Cloudy epoxy"),
        solution: ["Warm the resin."],
      },
      status: "published",
    });

    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.KNOWLEDGE_BASE);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cloudy epoxy" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByText(/Live \(EN\)|Draft \(EN\)|Draft changes \(EN\)|No EN content yet/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Related Knowledge Base Articles")).toBeInTheDocument();
  });

  it("deletes only the active non-RO translation and keeps the entry selected", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    memoryApi.seedEntry({
      contentId: "multi-locale",
      title: "Multi Locale",
      locale: "ro",
      body: { ...emptyVariantBody("Multi Locale"), solution: ["RO."] },
    });
    memoryApi.seedEntry({
      contentId: "multi-locale",
      title: "Multi Locale EN",
      locale: "en",
      body: { ...emptyVariantBody("Multi Locale EN"), solution: ["EN."] },
    });
    memoryApi.seedEntry({
      contentId: "multi-locale",
      title: "Multi Locale FR",
      locale: "fr",
      body: { ...emptyVariantBody("Multi Locale FR"), solution: ["FR."] },
    });

    renderWorkspace(ADMIN_ROUTES.KNOWLEDGE_BASE);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Multi Locale" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "FR" }));
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Entry title" })).toHaveValue("Multi Locale FR");
    });

    await user.click(screen.getByRole("button", { name: "Delete French translation" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Delete the French translation[\s\S]*Only this language will be removed/i),
    );

    const localeDeleteCalls = global.fetch.mock.calls.filter(
      ([url, init]) =>
        init?.method === "DELETE" &&
        String(url).endsWith("/api/admin/knowledge-base/entries/multi-locale/variants/fr"),
    );
    const entityDeleteCalls = global.fetch.mock.calls.filter(
      ([url, init]) =>
        init?.method === "DELETE" &&
        String(url).endsWith("/api/admin/knowledge-base/entries/multi-locale"),
    );
    expect(localeDeleteCalls).toHaveLength(1);
    expect(entityDeleteCalls).toHaveLength(0);

    await waitFor(() => {
      expect(screen.getByText(/No FR content yet/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Multi Locale" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete French translation" })).not.toBeInTheDocument();
  });

  it("does not offer isolated Romanian translation deletion", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("RO Entry");
    renderWorkspace(ADMIN_ROUTES.KNOWLEDGE_BASE);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Entry" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Entry" }));
    await screen.findByRole("button", { name: "RO Entry" });

    expect(screen.queryByRole("button", { name: /Delete Romanian translation/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete entry in all languages" })).toBeInTheDocument();
  });

  it("warns that deleting an entry removes it in all languages", async () => {
    memoryApi.seedEntry({
      contentId: "sticky-resin",
      title: "Sticky resin",
      body: {
        ...emptyVariantBody("Sticky resin"),
        solution: ["Check ratio."],
      },
    });

    seedAdministrator();
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWorkspace(ADMIN_ROUTES.KNOWLEDGE_BASE);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sticky resin" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Delete entry in all languages" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("Romanian and every translation will be permanently deleted"),
    );
    expect(screen.getByRole("button", { name: "Sticky resin" })).toBeInTheDocument();
  });
});

describe("Admin navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_MOCK_ADMIN", "true");
    memoryApi.reset();
    vi.stubGlobal(
      "fetch",
      vi.fn((url, init) => {
        const global = handleGlobalReferenceSearch(url);
        if (global) {
          return global;
        }
        return memoryApi.handler(url, init?.method || "GET", init || {});
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("renders the knowledge base management workspace from admin navigation", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.ROOT);

    const adminNav = screen.getByRole("navigation", { name: "Administration navigation" });
    await user.click(within(adminNav).getByRole("link", { name: "Knowledge Base" }));

    expect(screen.getByRole("region", { name: "Knowledge base management" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add New Entry" })).toBeInTheDocument();
  });
});
