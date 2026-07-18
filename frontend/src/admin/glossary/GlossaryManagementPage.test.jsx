import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "../../workspace/renderWorkspaceRouter.jsx";
import { ADMIN_ROUTES } from "../adminRoutes.js";
import { handleGlobalReferenceSearch, isAdministratorFetchRequest, withEditorialVisibility } from "../test/editorialTestHelpers.js";

vi.mock("./GlossaryEntryEditor.jsx", () => ({
  default: function MockGlossaryEntryEditor({ onDocumentChange }) {
    return (
      <button
        type="button"
        aria-label="Simulate definition edit"
        onClick={() =>
          onDocumentChange({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Edited glossary definition." }],
              },
            ],
          })
        }
      >
        Simulate definition edit
      </button>
    );
  },
}));

vi.mock("../../editorial/CrossReferencePicker.jsx", () => ({
  default: function MockCrossReferencePicker({ label }) {
    return <div aria-label={label}>Relationship picker</div>;
  },
}));

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const API_ROOT = "/api/admin/glossary/entries";

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

function emptyVariantBody(term = "") {
  return {
    term,
    definitionBlocks: [{ type: "paragraph", text: "" }],
    media: [],
    relatedTermIds: [],
    synonymTermIds: [],
    seeAlso: [],
  };
}

function createInMemoryGlossaryApi() {
  const entries = new Map();
  const variants = new Map();
  let sortOrder = 100;

  function variantKey(contentId, locale) {
    return `${contentId}:${locale}`;
  }

  function entryListTerm(contentId) {
    for (const locale of ["ro", "en"]) {
      const variant = variants.get(variantKey(contentId, locale));
      const term = variant?.body?.term?.trim();
      if (term) {
        return term;
      }
    }
    return entries.get(contentId)?.term ?? "";
  }

  return {
    reset() {
      entries.clear();
      variants.clear();
      sortOrder = 100;
    },
    seedEntry({ contentId, term, body, status = "draft", locale = "ro" }) {
      entries.set(contentId, { contentId, term, sortOrder: entries.size * 100 + 100 });
      variants.set(variantKey(contentId, locale), {
        contentId,
        locale,
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
            term: entryListTerm(entry.contentId),
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
        const contentId = payload.term
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        sortOrder += 100;
        entries.set(contentId, { contentId, term: payload.term, sortOrder });
        variants.set(variantKey(contentId, "ro"), {
          contentId,
          locale: "ro",
          status: "draft",
          exists: true,
          body: emptyVariantBody(payload.term),
        });
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            contentId,
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
        const variant = variants.get(variantKey(contentId, locale));
        if (!variant) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              contentId,
              locale,
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
        const saved = {
          contentId,
          locale,
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
        if (!variant?.body?.term?.trim()) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ detail: "Glossary term cannot be empty." }),
          });
        }
        const hasBody = variant.body.definitionBlocks.some((block) => Boolean(block.text?.trim()));
        if (!hasBody) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ detail: "Glossary definition cannot be empty." }),
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
            snapshotKey: `published/glossary/${locale}/document.json`,
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

const memoryApi = createInMemoryGlossaryApi();

describe("Glossary management workspace (Task 60)", () => {
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
    vi.spyOn(window, "prompt").mockImplementation(() => "Calibration");
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("opens with an empty entry list", async () => {
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.GLOSSARY);

    expect(screen.getByRole("region", { name: "Glossary management" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add New Entry" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Add an entry to begin writing/i)).toBeInTheDocument();
    });
  });

  it("creates, saves, and publishes a glossary entry", async () => {
    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.GLOSSARY);

    await user.click(screen.getByRole("button", { name: "Add New Entry" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Calibration" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Simulate definition edit" }));
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => {
      expect(screen.queryByText(/Unsaved changes/i)).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() => {
      expect(screen.getByText(/Live \(RO\)|Draft \(RO\)|Draft changes \(RO\)/i)).toBeInTheDocument();
    });
  });

  it("deletes the selected glossary entry", async () => {
    memoryApi.seedEntry({
      contentId: "pot-life",
      term: "Pot life",
      body: {
        ...emptyVariantBody("Pot life"),
        definitionBlocks: [{ type: "paragraph", text: "Working time." }],
      },
    });

    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.GLOSSARY);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Pot life" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Delete entry in all languages" }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Pot life" })).not.toBeInTheDocument();
    });
  });

  it("switches locale without leaving the admin glossary workspace", async () => {
    memoryApi.seedEntry({
      contentId: "sealing",
      term: "Sealing",
      body: {
        ...emptyVariantBody("Sealing"),
        definitionBlocks: [{ type: "paragraph", text: "Thin coat." }],
      },
      status: "published",
    });

    seedAdministrator();
    const user = userEvent.setup();
    renderWorkspace(ADMIN_ROUTES.GLOSSARY);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sealing" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByText(/Live \(EN\)|Draft \(EN\)|Draft changes \(EN\)|No EN content yet/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Related terms")).toBeInTheDocument();
  });

  it("deletes only the active non-RO translation and keeps the entry selected", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    memoryApi.seedEntry({
      contentId: "multi-locale",
      term: "Multi Locale",
      locale: "ro",
      body: { ...emptyVariantBody("Multi Locale"), definitionBlocks: [{ type: "paragraph", text: "RO." }] },
    });
    memoryApi.seedEntry({
      contentId: "multi-locale",
      term: "Multi Locale EN",
      locale: "en",
      body: { ...emptyVariantBody("Multi Locale EN"), definitionBlocks: [{ type: "paragraph", text: "EN." }] },
    });
    memoryApi.seedEntry({
      contentId: "multi-locale",
      term: "Multi Locale FR",
      locale: "fr",
      body: { ...emptyVariantBody("Multi Locale FR"), definitionBlocks: [{ type: "paragraph", text: "FR." }] },
    });

    renderWorkspace(ADMIN_ROUTES.GLOSSARY);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Multi Locale" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "FR" }));
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Glossary term" })).toHaveValue("Multi Locale FR");
    });

    await user.click(screen.getByRole("button", { name: "Delete French translation" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Delete the French translation[\s\S]*Only this language will be removed/i),
    );

    const localeDeleteCalls = global.fetch.mock.calls.filter(
      ([url, init]) =>
        init?.method === "DELETE" &&
        String(url).endsWith("/api/admin/glossary/entries/multi-locale/variants/fr"),
    );
    const entityDeleteCalls = global.fetch.mock.calls.filter(
      ([url, init]) =>
        init?.method === "DELETE" && String(url).endsWith("/api/admin/glossary/entries/multi-locale"),
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
    renderWorkspace(ADMIN_ROUTES.GLOSSARY);

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
      contentId: "pot-life",
      term: "Pot life",
      body: {
        ...emptyVariantBody("Pot life"),
        definitionBlocks: [{ type: "paragraph", text: "Working time." }],
      },
    });

    seedAdministrator();
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWorkspace(ADMIN_ROUTES.GLOSSARY);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Pot life" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Delete entry in all languages" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("Romanian and every translation will be permanently deleted"),
    );
    expect(screen.getByRole("button", { name: "Pot life" })).toBeInTheDocument();
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

  it("renders the glossary management workspace from admin navigation", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.ROOT);

    const adminNav = screen.getByRole("navigation", { name: "Administration navigation" });
    await user.click(within(adminNav).getByRole("link", { name: "Glossary" }));

    expect(screen.getByRole("region", { name: "Glossary management" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add New Entry" })).toBeInTheDocument();
  });
});
