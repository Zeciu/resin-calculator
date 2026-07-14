import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "../../workspace/renderWorkspaceRouter.jsx";
import { ADMIN_ROUTES } from "../adminRoutes.js";
import { handleGlobalReferenceSearch, isAdministratorFetchRequest, withEditorialVisibility } from "../test/editorialTestHelpers.js";

const { getNextDocumentText, setNextDocumentText } = vi.hoisted(() => {
  let nextDocumentText = "Edited chapter body.";
  return {
    getNextDocumentText: () => nextDocumentText,
    setNextDocumentText: (value) => {
      nextDocumentText = value;
    },
  };
});

function documentPlainText(document) {
  if (!document?.content) {
    return "";
  }

  const parts = [];
  for (const node of document.content) {
    if (node.type === "paragraph") {
      const text = node.content?.map((child) => child.text ?? "").join("") ?? "";
      if (text) {
        parts.push(text);
      }
    }
  }
  return parts.join("\n\n");
}

function makeDocumentFromText(text) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

vi.mock("./ManualChapterEditor.jsx", () => ({
  default: function MockManualChapterEditor({ document, onDocumentChange }) {
    return (
      <>
        <textarea
          readOnly
          aria-label="Chapter document"
          value={documentPlainText(document)}
        />
        <button
          type="button"
          aria-label="Simulate document edit"
          onClick={() => onDocumentChange(makeDocumentFromText(getNextDocumentText()))}
        >
          Simulate document edit
        </button>
      </>
    );
  },
}));

async function editDocument(user, text) {
  setNextDocumentText(text);
  await user.click(screen.getByRole("button", { name: "Simulate document edit" }));
}

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const API_ROOT = "/api/admin/manual/chapters";

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

function seedStandardUser() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        id: "stub-user",
        email: "user@example.com",
        username: "user",
        role: "user",
      },
    }),
  );
}

function emptyVariantBody(title = "") {
  return {
    title,
    sections: [{ id: "main", title: "", blocks: [] }],
  };
}

function createInMemoryManualApi() {
  const chapters = new Map();
  const variants = new Map();
  let sortOrder = 100;

  function variantKey(contentId, locale) {
    return `${contentId}:${locale}`;
  }

  function chapterListTitle(contentId) {
    for (const locale of ["en", "ro"]) {
      const variant = variants.get(variantKey(contentId, locale));
      const title = variant?.body?.title?.trim();
      if (title) {
        return title;
      }
    }
    return chapters.get(contentId)?.title ?? "";
  }

  return {
    reset() {
      chapters.clear();
      variants.clear();
      sortOrder = 100;
    },
    seedChapter({ contentId, title, sortOrder: chapterSortOrder, body, status = "draft", locale = "en" }) {
      chapters.set(contentId, {
        contentId,
        title,
        sortOrder: chapterSortOrder,
      });
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
        const locale = parsed.searchParams.get("locale") || "en";
        const items = [...chapters.values()]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          // Only chapters with a saved variant in the active locale appear.
          .filter((chapter) => variants.has(variantKey(chapter.contentId, locale)))
          .map((chapter) => {
            const activeVariant = variants.get(variantKey(chapter.contentId, locale));
            return {
              contentId: chapter.contentId,
              title: activeVariant?.body?.title?.trim() || chapterListTitle(chapter.contentId),
              sortOrder: chapter.sortOrder,
              variants: {
                en: { status: variants.get(variantKey(chapter.contentId, "en"))?.status || "draft" },
                ro: { status: variants.get(variantKey(chapter.contentId, "ro"))?.status || "draft" },
              },
            };
          });
        return Promise.resolve({ ok: true, status: 200, json: async () => items });
      }

      if (path === "/" && method === "POST") {
        const payload = JSON.parse(init.body);
        const createLocale = payload.locale || "en";
        const contentId = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        sortOrder += 100;
        chapters.set(contentId, {
          contentId,
          title: payload.title,
          sortOrder,
        });
        variants.set(variantKey(contentId, createLocale), {
          contentId,
          locale: createLocale,
          status: "draft",
          body: emptyVariantBody(payload.title),
        });
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            contentId,
            contentType: "manual_chapter",
            sortOrder,
            createdAt: "2026-01-01T00:00:00+00:00",
            updatedAt: "2026-01-01T00:00:00+00:00",
          }),
        });
      }

      const chapterDeleteMatch = path.match(/^\/([^/]+)$/);
      if (chapterDeleteMatch && method === "DELETE") {
        const [, contentId] = chapterDeleteMatch;
        if (!chapters.has(contentId)) {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: async () => ({ detail: "Not found" }),
          });
        }
        chapters.delete(contentId);
        for (const key of [...variants.keys()]) {
          if (key.startsWith(`${contentId}:`)) {
            variants.delete(key);
          }
        }
        return Promise.resolve({ ok: true, status: 204, json: async () => null });
      }

      const variantMatch = path.match(/^\/([^/]+)\/variants\/([^/]+)$/);
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
        if (!variant?.body?.title?.trim()) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ detail: "Chapter title cannot be empty." }),
          });
        }
        const hasBody = variant.body.sections.some((section) =>
          section.blocks.some((block) => {
            if (block.type === "paragraph" || block.type === "heading") {
              return Boolean(block.text?.trim());
            }
            if (block.type === "image") {
              return Boolean(block.src?.trim() && block.alt?.trim());
            }
            if (block.type === "video") {
              return Boolean(block.title?.trim() && block.embedUrl?.trim());
            }
            return false;
          }),
        );
        if (!hasBody) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ detail: "Chapter body cannot be empty." }),
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
            snapshotKey: `published/manual/${locale}/document.json`,
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

const memoryApi = createInMemoryManualApi();

function getUnsavedChangesDialog() {
  return screen.getByRole("dialog", { name: "You have unsaved changes." });
}

describe("Manual management workspace (Task 59B)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_MOCK_ADMIN", "true");
    setNextDocumentText("Edited chapter body.");
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

  it("opens with an empty chapter list", async () => {
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
      expect(screen.getByText(/Manual chapter editor/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Introduction" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Project Workflow" })).not.toBeInTheDocument();
  });

  it("shows only chapter navigation in the left column", async () => {
    seedAdministrator();
    memoryApi.seedChapter({
      contentId: "media-chapter",
      title: "Media Chapter",
      sortOrder: 100,
      body: {
        title: "Media Chapter",
        sections: [
          {
            id: "main",
            title: "",
            blocks: [
              { type: "paragraph", text: "Workflow intro." },
              {
                type: "image",
                src: "/header-wood-epoxy.png",
                alt: "Wood and epoxy resin in a workshop setting",
              },
            ],
          },
        ],
      },
      status: "published",
    });

    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Media Chapter" })).toBeInTheDocument();
    });

    expect(screen.getByRole("complementary", { name: "Manual chapters" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /section/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "main" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Table of contents" })).not.toBeInTheDocument();
  });

  it("loads admin chapter content with embedded image blocks", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    memoryApi.seedChapter({
      contentId: "media-chapter",
      title: "Media Chapter",
      sortOrder: 100,
      body: {
        title: "Media Chapter",
        sections: [
          {
            id: "main",
            title: "",
            blocks: [
              { type: "paragraph", text: "Workflow intro." },
              {
                type: "image",
                src: "/header-wood-epoxy.png",
                alt: "Wood and epoxy resin in a workshop setting",
              },
              { type: "paragraph", text: "Workflow outro." },
            ],
          },
        ],
      },
      status: "published",
    });

    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Media Chapter" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Media Chapter" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Chapter title" })).toHaveValue("Media Chapter");
      expect(screen.getByRole("textbox", { name: "Chapter document" })).toHaveValue(
        "Workflow intro.\n\nWorkflow outro.",
      );
    });
    expect(screen.queryByText(/validation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/failed to load chapter/i)).not.toBeInTheDocument();
  });

  it("renders /admin/manual for administrators", async () => {
    seedAdministrator();
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    expect(screen.getByRole("region", { name: "Manual management" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
  });

  it("blocks standard users from /admin/manual", () => {
    vi.stubEnv("VITE_MOCK_ADMIN", "false");
    seedStandardUser();
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    expect(
      screen.getByRole("heading", {
        name: /Welcome to HFZWood — your workspace for resin estimation and woodworking knowledge/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Manual management" })).not.toBeInTheDocument();
  });

  it("loads chapters from the backend and opens a created chapter", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Calibration Basics");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));

    expect(await screen.findByRole("button", { name: "Calibration Basics" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Chapter title" })).toHaveValue("Calibration Basics");
  });

  it("does not autosave while typing", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Sample Chapter");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "Sample Chapter" });

    const putCallsBefore = global.fetch.mock.calls.filter(([, init]) => init?.method === "PUT").length;
    await editDocument(user, "Typing only.");
    const putCallsAfter = global.fetch.mock.calls.filter(([, init]) => init?.method === "PUT").length;

    expect(putCallsAfter).toBe(putCallsBefore);
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("saves only when Save is clicked", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Sample Chapter");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "Sample Chapter" });
    await editDocument(user, "Saved on Save click.");

    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    });

    const putCalls = global.fetch.mock.calls.filter(([, init]) => init?.method === "PUT");
    expect(putCalls.length).toBeGreaterThan(0);
  });

  it("publishes when Publish is clicked", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Publish Chapter");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "Publish Chapter" });
    await editDocument(user, "Ready to publish.");
    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(screen.getByText("Live (EN)")).toBeInTheDocument();
    });

    const publishCalls = global.fetch.mock.calls.filter(
      ([url, init]) => init?.method === "POST" && String(url).includes("/publish"),
    );
    expect(publishCalls.length).toBeGreaterThan(0);
  });

  it("stays on the current chapter when Cancel is chosen in the unsaved changes dialog", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Chapter One").mockReturnValueOnce("Chapter Two");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await user.click(screen.getByRole("button", { name: "Chapter One" }));
    await editDocument(user, "Unsaved text.");
    await user.click(screen.getByRole("button", { name: "Chapter Two" }));

    const dialog = getUnsavedChangesDialog();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "You have unsaved changes." })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Chapter document" })).toHaveValue("Unsaved text.");
    expect(screen.getByRole("button", { name: "Chapter One" })).toHaveClass("editorial-sidebar__item--active");
  });

  it("continues navigation after Discard is chosen in the unsaved changes dialog", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Chapter One").mockReturnValueOnce("Chapter Two");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await user.click(screen.getByRole("button", { name: "Chapter One" }));
    await editDocument(user, "Unsaved text.");
    await user.click(screen.getByRole("button", { name: "Chapter Two" }));

    const dialog = getUnsavedChangesDialog();
    await user.click(within(dialog).getByRole("button", { name: "Discard" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Chapter Two" })).toHaveClass(
        "editorial-sidebar__item--active",
      );
    });
    expect(screen.getByRole("textbox", { name: "Chapter document" })).not.toHaveValue("Unsaved text.");
  });

  it("saves and continues navigation when Save is chosen in the unsaved changes dialog", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Chapter One").mockReturnValueOnce("Chapter Two");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await user.click(screen.getByRole("button", { name: "Chapter One" }));
    await editDocument(user, "Saved before switch.");
    await user.click(screen.getByRole("button", { name: "Chapter Two" }));

    const dialog = getUnsavedChangesDialog();
    await user.click(within(dialog).getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Chapter Two" })).toHaveClass(
        "editorial-sidebar__item--active",
      );
    });

    const putCalls = global.fetch.mock.calls.filter(([, init]) => init?.method === "PUT");
    expect(putCalls.length).toBeGreaterThan(0);
  });

  it("stays on the current locale when Cancel is chosen in the unsaved changes dialog", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Locale Chapter");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "Locale Chapter" });
    await editDocument(user, "Locale content.");
    await user.click(screen.getByRole("button", { name: "RO" }));

    const dialog = getUnsavedChangesDialog();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "EN" })).toHaveClass("editorial-topbar__locale-button--active");
    expect(screen.getByRole("textbox", { name: "Chapter document" })).toHaveValue("Locale content.");
  });

  it("loads an empty RO variant instead of keeping EN content", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("English Chapter");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "English Chapter" });
    await editDocument(user, "English body.");
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => {
      expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "RO" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Chapter title" })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Chapter document" })).toHaveValue("");
    });
    expect(screen.getByText(/No RO content saved yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/English body/i)).not.toBeInTheDocument();
  });

  it("hides EN-only chapters from the RO sidebar and shows an empty state", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("English Chapter");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "English Chapter" });
    await editDocument(user, "English body.");
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => {
      expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "RO" }));

    // The EN-only chapter must not appear in the RO sidebar.
    const sidebar = screen.getByRole("complementary", { name: "Manual chapters" });
    await waitFor(() => {
      expect(within(sidebar).queryByRole("button", { name: "English Chapter" })).not.toBeInTheDocument();
    });
    expect(within(sidebar).getByText("No Romanian chapters yet.")).toBeInTheDocument();
  });

  it("does not ask to save again after Save when adding a new chapter", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    const promptSpy = vi
      .spyOn(window, "prompt")
      .mockReturnValueOnce("Chapter One")
      .mockReturnValueOnce("Chapter Two");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "Chapter One" });
    await editDocument(user, "Saved body.");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));

    expect(screen.queryByRole("dialog", { name: "You have unsaved changes." })).not.toBeInTheDocument();
    expect(promptSpy).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole("button", { name: "Chapter Two" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Chapter document" })).toHaveValue("");
  });

  it("saves the current chapter before prompting for a new chapter title", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    const promptSpy = vi
      .spyOn(window, "prompt")
      .mockReturnValueOnce("Chapter One")
      .mockReturnValueOnce("Chapter Two");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "Chapter One" });
    await editDocument(user, "Unsaved body.");
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));

    const dialog = getUnsavedChangesDialog();
    await user.click(within(dialog).getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Chapter Two" })).toBeInTheDocument();
    });

    expect(promptSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("textbox", { name: "Chapter document" })).toHaveValue("");

    const postCalls = global.fetch.mock.calls.filter(([, init]) => init?.method === "POST");
    const createCalls = postCalls.filter(([url]) => String(url).endsWith("/api/admin/manual/chapters"));
    expect(createCalls).toHaveLength(2);

    const putCalls = global.fetch.mock.calls.filter(([, init]) => init?.method === "PUT");
    expect(putCalls).toHaveLength(1);
    expect(JSON.parse(putCalls[0][1].body).body.sections[0].blocks[0].text).toBe("Unsaved body.");
  });

  it("does not prompt when switching chapters without edits", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt")
      .mockReturnValueOnce("Chapter One")
      .mockReturnValueOnce("Chapter Two");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await user.click(screen.getByRole("button", { name: "Chapter Two" }));

    expect(screen.queryByRole("dialog", { name: "You have unsaved changes." })).not.toBeInTheDocument();
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chapter Two" })).toHaveClass(
      "editorial-sidebar__item--active",
    );
  });

  it("never creates a chapter when Save is clicked", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Only Chapter");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "Only Chapter" });
    await editDocument(user, "Saved once.");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    });

    const postCalls = global.fetch.mock.calls.filter(
      ([url, init]) => init?.method === "POST" && String(url).endsWith("/api/admin/manual/chapters"),
    );
    expect(postCalls).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Only Chapter" })).toHaveLength(1);
  });

  it("deletes the selected chapter after confirmation", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt")
      .mockReturnValueOnce("Chapter One")
      .mockReturnValueOnce("Chapter Two");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await user.click(screen.getByRole("button", { name: "Chapter One" }));
    await user.click(screen.getByRole("button", { name: "Delete Chapter" }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Chapter One" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Chapter Two" })).toHaveClass(
        "editorial-sidebar__item--active",
      );
    });
  });

  it("saves document edits without creating a new chapter", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValueOnce("Media Chapter");
    memoryApi.seedChapter({
      contentId: "media-chapter",
      title: "Media Chapter",
      sortOrder: 100,
      body: {
        title: "Media Chapter",
        sections: [
          {
            id: "main",
            title: "",
            blocks: [
              { type: "paragraph", text: "Intro." },
              { type: "image", src: "/a.png", alt: "Image A" },
              { type: "image", src: "/b.png", alt: "Image B" },
            ],
          },
        ],
      },
    });

    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Media Chapter" })).toBeInTheDocument();
    });

    setNextDocumentText("Intro only.");
    await editDocument(user, "Intro only.");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    });

    expect(promptSpy).toHaveBeenCalledTimes(0);
    const postCalls = global.fetch.mock.calls.filter(
      ([url, init]) => init?.method === "POST" && String(url).endsWith("/api/admin/manual/chapters"),
    );
    expect(postCalls).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "Media Chapter" })).toHaveLength(1);
  });

  it("creates the RO variant (not EN) when adding a chapter on the RO tab", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Capitol Nou");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "RO" }));
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));

    // RO editor is populated with the created title.
    await screen.findByRole("button", { name: "Capitol Nou" });
    expect(screen.getByRole("textbox", { name: "Chapter title" })).toHaveValue("Capitol Nou");

    // The RO chapter is listed in the RO sidebar.
    const sidebar = screen.getByRole("complementary", { name: "Manual chapters" });
    expect(within(sidebar).getByRole("button", { name: "Capitol Nou" })).toBeInTheDocument();

    // The create request targeted the RO locale.
    const createCall = global.fetch.mock.calls.find(
      ([url, init]) => init?.method === "POST" && String(url).endsWith("/api/admin/manual/chapters"),
    );
    expect(JSON.parse(createCall[1].body).locale).toBe("ro");

    // EN did not receive the text, and the chapter is absent from the EN sidebar.
    await user.click(screen.getByRole("button", { name: "EN" }));
    await waitFor(() => {
      expect(within(sidebar).queryByRole("button", { name: "Capitol Nou" })).not.toBeInTheDocument();
    });
    expect(within(sidebar).getByText("No English chapters yet.")).toBeInTheDocument();
  });

  it("creates the EN variant (not RO) when adding a chapter on the EN tab", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("English Only Chapter");
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "English Only Chapter" });
    expect(screen.getByRole("textbox", { name: "Chapter title" })).toHaveValue("English Only Chapter");

    const createCall = global.fetch.mock.calls.find(
      ([url, init]) => init?.method === "POST" && String(url).endsWith("/api/admin/manual/chapters"),
    );
    expect(JSON.parse(createCall[1].body).locale).toBe("en");

    await user.click(screen.getByRole("button", { name: "RO" }));
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Chapter title" })).toHaveValue("");
    });
    const sidebar = screen.getByRole("complementary", { name: "Manual chapters" });
    expect(
      within(sidebar).queryByRole("button", { name: "English Only Chapter" }),
    ).not.toBeInTheDocument();
    expect(within(sidebar).getByText("No Romanian chapters yet.")).toBeInTheDocument();
  });

  it("warns that deleting a chapter removes it in all languages", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    vi.spyOn(window, "prompt").mockReturnValueOnce("Deletable Chapter");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWorkspace(ADMIN_ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add New Chapter" }));
    await screen.findByRole("button", { name: "Deletable Chapter" });

    await user.click(screen.getByRole("button", { name: "Delete Chapter" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("This deletes this chapter in all languages."),
    );
    // Cancelled (confirm returned false) — chapter remains.
    expect(screen.getByRole("button", { name: "Deletable Chapter" })).toBeInTheDocument();
  });
});
