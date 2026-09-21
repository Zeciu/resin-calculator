import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_ROUTES } from "./adminRoutes.js";
import { ADMIN_EDITORIAL_LOCALES, ADMIN_LOCALE_LABELS } from "../editorial/editorialLocales.js";
import { renderWorkspace } from "../../public/src/workspace/renderWorkspaceRouter.jsx";
import { seedDevicePreferences } from "../../public/src/preferences/testHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedEditorialUser() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        id: "stub-user",
        email: "editor@example.com",
        username: "editor",
        role: "user",
      },
    }),
  );
}

function completeLayer(required) {
  return {
    status: "complete",
    required_count: required,
    present_count: required,
    missing: [],
    extra: [],
  };
}

function incompleteLayer(required, present, missing) {
  return {
    status: present === 0 && missing.length === required ? "missing" : "incomplete",
    required_count: required,
    present_count: present,
    missing,
    extra: [],
  };
}

function storeDiagnostic(canonical, published, extras = {}) {
  return {
    canonical_count: canonical,
    published_count: published,
    draft_count: extras.draft_count ?? 0,
    no_variant_count: extras.no_variant_count ?? 0,
    draft_ids: extras.draft_ids ?? [],
    no_variant_ids: extras.no_variant_ids ?? [],
  };
}

function readinessRow(locale, overrides = {}) {
  return {
    locale,
    label: ADMIN_LOCALE_LABELS[locale],
    ui: completeLayer(567),
    website_preview: completeLayer(6),
    website_production: completeLayer(6),
    manual_preview: completeLayer(18),
    manual_production: completeLayer(18),
    glossary_preview: completeLayer(173),
    glossary_production: completeLayer(173),
    knowledge_base_preview: completeLayer(112),
    knowledge_base_production: completeLayer(112),
    preview_ready: true,
    production_ready: true,
    store: {
      manual: storeDiagnostic(18, 18),
      glossary: storeDiagnostic(173, 173),
      knowledge_base: storeDiagnostic(112, 112),
    },
    ...overrides,
  };
}

function defaultReadinessLocales() {
  const largeUiMissing = Array.from({ length: 30 }, (_, index) => `key.${String(index).padStart(3, "0")}`);
  return ADMIN_EDITORIAL_LOCALES.map((locale) => {
    if (locale === "de") {
      return readinessRow("de", {
        production_ready: false,
        manual_production: {
          status: "missing",
          required_count: 18,
          present_count: 0,
          missing: ["chapter-a"],
          extra: [],
        },
        glossary_production: incompleteLayer(173, 0, largeUiMissing.slice(0, 20)),
        knowledge_base_production: incompleteLayer(112, 0, largeUiMissing.slice(0, 20)),
      });
    }
    if (locale === "fr") {
      return readinessRow("fr", {
        preview_ready: false,
        production_ready: false,
        ui: incompleteLayer(567, 509, largeUiMissing),
      });
    }
    if (locale === "ro") {
      return readinessRow("ro", {
        production_ready: false,
        glossary_production: incompleteLayer(173, 172, ["contur-exterior"]),
        store: {
          manual: storeDiagnostic(18, 18),
          glossary: storeDiagnostic(173, 173),
          knowledge_base: storeDiagnostic(112, 112),
        },
      });
    }
    return readinessRow(locale);
  });
}

const LANGUAGE_ROWS = ADMIN_EDITORIAL_LOCALES.map((locale) => ({
  locale,
  label: ADMIN_LOCALE_LABELS[locale],
  translationStatus: "Not generated",
  publishedContentStatus: "Not published",
  publicVisibility: locale === "en" ? "Active" : "Inactive",
  isDefault: locale === "en",
  canDeactivate: false,
}));

function mockAdminDashboardApis(options = {}) {
  const readinessHandler =
    options.readiness ?? (async () => ({ locales: defaultReadinessLocales() }));
  const prepareHandler = options.prepare;
  const activateHandler = options.activate;
  const uiPreviewHandler = options.uiPreview;
  const uiGenerateHandler = options.uiGenerate;
  let active = options.active ?? ["en"];
  const activateCalls = [];
  const prepareCalls = [];
  const uiPreviewCalls = [];
  const uiGenerateCalls = [];

  const spy = vi.spyOn(global, "fetch").mockImplementation(async (url, init = {}) => {
    const path = String(url);
    const method = (init.method ?? "GET").toUpperCase();

    if (path.endsWith("/api/content/public-languages")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ defaultPublicLocale: "en", activePublicLocales: [...active] }),
      };
    }
    if (path.endsWith("/api/me/capabilities")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          role: "user",
          accessTier: "free",
          catalogVersion: 1,
          capabilities: {},
        }),
      };
    }
    if (path.endsWith("/api/admin/public-languages/readiness") && method === "GET") {
      try {
        const payload = await readinessHandler();
        return { ok: true, status: 200, json: async () => payload };
      } catch (error) {
        return {
          ok: false,
          status: 500,
          json: async () => ({ detail: error instanceof Error ? error.message : "Readiness failed." }),
        };
      }
    }
    if (path.endsWith("/api/admin/public-languages") && method === "GET") {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          defaultPublicLocale: "en",
          activePublicLocales: [...active],
          languages: LANGUAGE_ROWS.map((row) => ({
            ...row,
            publicVisibility: active.includes(row.locale) ? "Active" : "Inactive",
            canDeactivate: active.includes(row.locale) && row.locale !== "en",
          })),
        }),
      };
    }
    const prepareMatch = path.match(/\/api\/admin\/public-languages\/([^/]+)\/prepare-production$/);
    if (prepareMatch && method === "POST") {
      const locale = decodeURIComponent(prepareMatch[1]);
      prepareCalls.push(locale);
      try {
        const payload = prepareHandler
          ? await prepareHandler(locale)
          : {
              locale,
              prepared: true,
              modules: ["manual", "knowledge-base", "glossary"],
              preview_ready: true,
              production_ready: true,
              warning: null,
            };
        return { ok: true, status: 200, json: async () => payload };
      } catch (error) {
        return {
          ok: false,
          status: 400,
          json: async () => ({
            detail: error instanceof Error ? error.message : "Prepare failed.",
          }),
        };
      }
    }
    const activateMatch = path.match(/\/api\/admin\/public-languages\/([^/]+)\/activate$/);
    if (activateMatch && method === "POST") {
      const locale = decodeURIComponent(activateMatch[1]);
      activateCalls.push(locale);
      if (activateHandler) {
        try {
          await activateHandler(locale);
        } catch (error) {
          return {
            ok: false,
            status: error.status ?? 409,
            json: async () => ({
              detail: error instanceof Error ? error.message : "Activation refused.",
            }),
          };
        }
      }
      if (!active.includes(locale)) {
        active.push(locale);
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          defaultPublicLocale: "en",
          activePublicLocales: [...active],
          languages: LANGUAGE_ROWS.map((row) => ({
            ...row,
            publicVisibility: active.includes(row.locale) ? "Active" : "Inactive",
            canDeactivate: active.includes(row.locale) && row.locale !== "en",
          })),
        }),
      };
    }
    const uiPreviewMatch = path.match(/\/api\/admin\/ui-translations\/([^/]+)\/preview$/);
    if (uiPreviewMatch && method === "GET") {
      const locale = decodeURIComponent(uiPreviewMatch[1]);
      uiPreviewCalls.push(locale);
      const payload = uiPreviewHandler
        ? await uiPreviewHandler(locale)
        : {
            locale,
            required_count: 567,
            present_count: 509,
            missing_count: 58,
            missing_keys: ["key.000"],
          };
      return { ok: true, status: 200, json: async () => payload };
    }
    const uiGenerateMatch = path.match(/\/api\/admin\/ui-translations\/([^/]+)\/generate-missing$/);
    if (uiGenerateMatch && method === "POST") {
      const locale = decodeURIComponent(uiGenerateMatch[1]);
      uiGenerateCalls.push(locale);
      try {
        const payload = uiGenerateHandler
          ? await uiGenerateHandler(locale)
          : {
              locale,
              required_count: 567,
              present_count_before: 509,
              present_count_after: 567,
              generated_count: 58,
              preserved_count: 509,
              failed: [],
              provider_called: true,
            };
        return { ok: true, status: 200, json: async () => payload };
      } catch (error) {
        return {
          ok: false,
          status: 400,
          json: async () => ({
            detail: error instanceof Error ? error.message : "UI translation failed.",
          }),
        };
      }
    }
    const deactivateMatch = path.match(/\/api\/admin\/public-languages\/([^/]+)\/deactivate$/);
    if (deactivateMatch && method === "POST") {
      const locale = decodeURIComponent(deactivateMatch[1]);
      if (locale === "en") {
        return {
          ok: false,
          status: 400,
          json: async () => ({
            detail: "Cannot deactivate the default public language (en).",
          }),
        };
      }
      active = active.filter((item) => item !== locale);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          defaultPublicLocale: "en",
          activePublicLocales: [...active],
          languages: LANGUAGE_ROWS.map((row) => ({
            ...row,
            publicVisibility: active.includes(row.locale) ? "Active" : "Inactive",
            canDeactivate: active.includes(row.locale) && row.locale !== "en",
          })),
        }),
      };
    }
    return { ok: false, status: 404, json: async () => ({ detail: `Unhandled ${path}` }) };
  });
  spy.activateCalls = activateCalls;
  spy.prepareCalls = prepareCalls;
  spy.uiPreviewCalls = uiPreviewCalls;
  spy.uiGenerateCalls = uiGenerateCalls;
  return spy;
}

describe("Admin Locale Readiness overview", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    seedDevicePreferences({ interfaceLanguage: "en" });
    seedEditorialUser();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders configured locales with distinct preview and production readiness", async () => {
    mockAdminDashboardApis();
    renderWorkspace(ADMIN_ROUTES.ROOT);

    expect(await screen.findByRole("heading", { name: "Locale Readiness" })).toBeInTheDocument();
    const table = await screen.findByRole("table", { name: "Locale readiness" });
    for (const locale of ADMIN_EDITORIAL_LOCALES) {
      expect(within(table).getByText(ADMIN_LOCALE_LABELS[locale])).toBeInTheDocument();
    }
    const germanRow = within(table).getByText("German").closest("tr");
    const cells = within(germanRow).getAllByRole("cell");
    expect(cells[1]).toHaveTextContent(/^Ready$/);
    expect(within(cells[2]).getByText(/^Not ready$/)).toBeInTheDocument();
    expect(within(germanRow).getByText(/MISSING 0\/18/)).toBeInTheDocument();
    expect(within(germanRow).getByText(/INCOMPLETE 0\/173/)).toBeInTheDocument();
    expect(within(germanRow).getByText(/INCOMPLETE 0\/112/)).toBeInTheDocument();
  });

  it("shows complete counts and inspectable small missing lists", async () => {
    mockAdminDashboardApis();
    renderWorkspace(ADMIN_ROUTES.ROOT);

    const table = await screen.findByRole("table", { name: "Locale readiness" });
    const englishRow = within(table).getByText("English").closest("tr");
    expect(within(englishRow).getByText("COMPLETE 567/567")).toBeInTheDocument();
    expect(within(englishRow).getAllByText("Ready")).toHaveLength(2);

    const romanianRow = within(table).getByText("Romanian").closest("tr");
    expect(within(romanianRow).getByText("missing: contur-exterior")).toBeInTheDocument();

    const user = userEvent.setup();
    const romanianSummary = screen.getByText("Romanian details — missing items");
    await user.click(romanianSummary);
    const romanianDetails = romanianSummary.closest("details");
    expect(within(romanianDetails).getByText(/Store diagnostics/)).toBeInTheDocument();
    expect(
      within(romanianDetails).getByText(/Glossary: published 173 \/ draft 0 \/ no variant 0/),
    ).toBeInTheDocument();
  });

  it("does not flood the overview with large missing lists", async () => {
    mockAdminDashboardApis();
    renderWorkspace(ADMIN_ROUTES.ROOT);

    const table = await screen.findByRole("table", { name: "Locale readiness" });
    expect(within(table).queryByText("key.000")).not.toBeInTheDocument();
    expect(within(table).getByText("INCOMPLETE 509/567")).toBeInTheDocument();

    const user = userEvent.setup();
    const frenchSummary = screen.getByText("French details — missing items");
    await user.click(frenchSummary);
    const frenchDetails = frenchSummary.closest("details");
    const missingSummary = within(frenchDetails).getByText("Missing (30)");
    expect(missingSummary).toBeInTheDocument();
    expect(within(table).queryByText("key.000")).not.toBeInTheDocument();
    await user.click(missingSummary);
    expect(await within(frenchDetails).findByText("key.000")).toBeInTheDocument();
  });

  it("handles a loading state", async () => {
    let resolveReadiness;
    const deferred = new Promise((resolve) => {
      resolveReadiness = resolve;
    });
    mockAdminDashboardApis({
      readiness: async () => deferred,
    });
    renderWorkspace(ADMIN_ROUTES.ROOT);

    expect(await screen.findByText("Loading locale readiness…")).toBeInTheDocument();
    resolveReadiness({ locales: defaultReadinessLocales() });
    expect(await screen.findByRole("table", { name: "Locale readiness" })).toBeInTheDocument();
  });

  it("handles an API error state", async () => {
    mockAdminDashboardApis({
      readiness: async () => {
        throw new Error("Readiness unavailable.");
      },
    });
    renderWorkspace(ADMIN_ROUTES.ROOT);
    expect(await screen.findByRole("alert")).toHaveTextContent("Readiness unavailable.");
  });

  it("disables Activate when Production Ready is NO and keeps Prepare available", async () => {
    mockAdminDashboardApis();
    renderWorkspace(ADMIN_ROUTES.ROOT);

    const languages = await screen.findByRole("table", { name: "Public languages" });
    const germanLangRow = within(languages).getByText("German").closest("tr");
    const romanianLangRow = within(languages).getByText("Romanian").closest("tr");
    const frenchLangRow = within(languages).getByText("French").closest("tr");
    expect(within(germanLangRow).getByRole("button", { name: "Activate" })).toBeDisabled();
    expect(within(germanLangRow).getByText("Production not ready")).toBeInTheDocument();
    expect(within(romanianLangRow).getByRole("button", { name: "Activate" })).toBeDisabled();
    expect(within(frenchLangRow).getByRole("button", { name: "Activate" })).toBeDisabled();

    const readinessTable = screen.getByRole("table", { name: "Locale readiness" });
    const germanReadyRow = within(readinessTable).getByText("German").closest("tr");
    const frenchReadyRow = within(readinessTable).getByText("French").closest("tr");
    expect(
      within(germanReadyRow).getByRole("button", { name: "Prepare for Production" }),
    ).toBeEnabled();
    expect(
      within(frenchReadyRow).queryByRole("button", { name: "Prepare for Production" }),
    ).not.toBeInTheDocument();
  });

  it("refresh reloads readiness data", async () => {
    const user = userEvent.setup();
    let version = 1;
    mockAdminDashboardApis({
      readiness: async () => ({
        locales: [
          readinessRow("en", {
            ui:
              version === 1
                ? incompleteLayer(567, 566, ["nav.home"])
                : completeLayer(567),
            preview_ready: version !== 1,
            production_ready: version !== 1,
          }),
        ],
      }),
    });
    renderWorkspace(ADMIN_ROUTES.ROOT);

    const table = await screen.findByRole("table", { name: "Locale readiness" });
    expect(within(table).getByText("INCOMPLETE 566/567")).toBeInTheDocument();
    version = 2;
    await user.click(screen.getByRole("button", { name: "Refresh readiness" }));
    await waitFor(() => {
      expect(within(table).getByText("COMPLETE 567/567")).toBeInTheDocument();
    });
  });

  it("offers Prepare only when Preview is ready and Production is not", async () => {
    mockAdminDashboardApis();
    renderWorkspace(ADMIN_ROUTES.ROOT);
    const table = await screen.findByRole("table", { name: "Locale readiness" });
    const germanRow = within(table).getByText("German").closest("tr");
    const romanianRow = within(table).getByText("Romanian").closest("tr");
    const frenchRow = within(table).getByText("French").closest("tr");
    const englishRow = within(table).getByText("English").closest("tr");
    expect(within(germanRow).getByRole("button", { name: "Prepare for Production" })).toBeEnabled();
    expect(within(romanianRow).getByRole("button", { name: "Prepare for Production" })).toBeEnabled();
    expect(within(frenchRow).queryByRole("button", { name: "Prepare for Production" })).not.toBeInTheDocument();
    expect(within(englishRow).queryByRole("button", { name: "Prepare for Production" })).not.toBeInTheDocument();
  });

  it("requires confirmation and refreshes readiness after successful prepare", async () => {
    const user = userEvent.setup();
    let prepared = false;
    const spy = mockAdminDashboardApis({
      readiness: async () => ({
        locales: defaultReadinessLocales().map((row) =>
          row.locale === "ro" && prepared
            ? {
                ...row,
                production_ready: true,
                glossary_production: completeLayer(173),
              }
            : row,
        ),
      }),
      prepare: async (locale) => {
        prepared = true;
        return {
          locale,
          prepared: true,
          modules: ["manual", "knowledge-base", "glossary"],
          preview_ready: true,
          production_ready: true,
          warning: null,
        };
      },
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWorkspace(ADMIN_ROUTES.ROOT);
    const table = await screen.findByRole("table", { name: "Locale readiness" });
    const romanianRow = within(table).getByText("Romanian").closest("tr");
    await user.click(within(romanianRow).getByRole("button", { name: "Prepare for Production" }));
    expect(confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(within(romanianRow).getAllByText(/^Ready$/)).toHaveLength(2);
      expect(
        within(romanianRow).queryByRole("button", { name: "Prepare for Production" }),
      ).not.toBeInTheDocument();
    });
    expect(spy.activateCalls).toEqual([]);
    expect(spy.prepareCalls).toEqual(["ro"]);
    const languages = screen.getByRole("table", { name: "Public languages" });
    const romanianLangRow = within(languages).getByText("Romanian").closest("tr");
    expect(romanianLangRow).toHaveTextContent("Inactive");
    expect(within(romanianLangRow).getByRole("button", { name: "Activate" })).toBeEnabled();
    expect(within(romanianLangRow).queryByText("Production not ready")).not.toBeInTheDocument();
  });

  it("does not call prepare when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const prepare = vi.fn();
    mockAdminDashboardApis({ prepare });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWorkspace(ADMIN_ROUTES.ROOT);
    const table = await screen.findByRole("table", { name: "Locale readiness" });
    const germanRow = within(table).getByText("German").closest("tr");
    await user.click(within(germanRow).getByRole("button", { name: "Prepare for Production" }));
    expect(prepare).not.toHaveBeenCalled();
  });

  it("shows prepare errors and prevents duplicate requests", async () => {
    const user = userEvent.setup();
    let resolvePrepare;
    mockAdminDashboardApis({
      prepare: () =>
        new Promise((_, reject) => {
          resolvePrepare = () => reject(new Error("Packaging refused."));
        }),
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWorkspace(ADMIN_ROUTES.ROOT);
    const table = await screen.findByRole("table", { name: "Locale readiness" });
    const germanRow = within(table).getByText("German").closest("tr");
    await user.click(within(germanRow).getByRole("button", { name: "Prepare for Production" }));
    expect(await screen.findByRole("button", { name: "Preparing…" })).toBeDisabled();
    resolvePrepare();
    expect(await screen.findByRole("alert")).toHaveTextContent("Packaging refused.");
  });

  it("offers Update missing UI translations only for incomplete non-source locales", async () => {
    mockAdminDashboardApis();
    renderWorkspace(ADMIN_ROUTES.ROOT);
    const table = await screen.findByRole("table", { name: "Locale readiness" });
    const frenchRow = within(table).getByText("French").closest("tr");
    const englishRow = within(table).getByText("English").closest("tr");
    const romanianRow = within(table).getByText("Romanian").closest("tr");
    const germanRow = within(table).getByText("German").closest("tr");
    expect(
      within(frenchRow).getByRole("button", { name: "Update missing UI translations" }),
    ).toBeEnabled();
    expect(
      within(englishRow).queryByRole("button", { name: "Update missing UI translations" }),
    ).not.toBeInTheDocument();
    expect(
      within(romanianRow).queryByRole("button", { name: "Update missing UI translations" }),
    ).not.toBeInTheDocument();
    expect(
      within(germanRow).queryByRole("button", { name: "Update missing UI translations" }),
    ).not.toBeInTheDocument();
  });

  it("requires confirmation and refreshes UI completeness after generating missing translations", async () => {
    const user = userEvent.setup();
    let generated = false;
    const spy = mockAdminDashboardApis({
      readiness: async () => ({
        locales: defaultReadinessLocales().map((row) =>
          row.locale === "fr" && generated
            ? { ...row, ui: completeLayer(567) }
            : row,
        ),
      }),
      uiGenerate: async (locale) => {
        generated = true;
        return {
          locale,
          required_count: 567,
          present_count_before: 509,
          present_count_after: 567,
          generated_count: 58,
          preserved_count: 509,
          failed: [],
          provider_called: true,
        };
      },
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWorkspace(ADMIN_ROUTES.ROOT);
    const table = await screen.findByRole("table", { name: "Locale readiness" });
    const frenchRow = within(table).getByText("French").closest("tr");
    await user.click(
      within(frenchRow).getByRole("button", { name: "Update missing UI translations" }),
    );
    await waitFor(() => {
      expect(confirm).toHaveBeenCalled();
    });
    expect(confirm.mock.calls[0][0]).toMatch(/UI: 509 \/ 567/);
    expect(confirm.mock.calls[0][0]).toMatch(/58 missing/);
    await waitFor(() => {
      expect(within(frenchRow).getByText("COMPLETE 567/567")).toBeInTheDocument();
      expect(
        within(frenchRow).queryByRole("button", { name: "Update missing UI translations" }),
      ).not.toBeInTheDocument();
    });
    expect(spy.uiPreviewCalls).toEqual(["fr"]);
    expect(spy.uiGenerateCalls).toEqual(["fr"]);
    expect(spy.prepareCalls).toEqual([]);
    expect(spy.activateCalls).toEqual([]);
  });

  it("does not generate missing UI translations when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const spy = mockAdminDashboardApis();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWorkspace(ADMIN_ROUTES.ROOT);
    const table = await screen.findByRole("table", { name: "Locale readiness" });
    const frenchRow = within(table).getByText("French").closest("tr");
    await user.click(
      within(frenchRow).getByRole("button", { name: "Update missing UI translations" }),
    );
    await waitFor(() => {
      expect(spy.uiPreviewCalls).toEqual(["fr"]);
    });
    expect(spy.uiGenerateCalls).toEqual([]);
  });

  it("does not send Prepare when Activate is used on a production-ready locale", async () => {
    const user = userEvent.setup();
    const spy = mockAdminDashboardApis({
      readiness: async () => ({
        locales: defaultReadinessLocales().map((row) =>
          row.locale === "cs" ? { ...row, preview_ready: true, production_ready: true } : row,
        ),
      }),
    });
    renderWorkspace(ADMIN_ROUTES.ROOT);
    const languages = await screen.findByRole("table", { name: "Public languages" });
    const czechRow = within(languages).getByText("Czech").closest("tr");
    expect(within(czechRow).getByRole("button", { name: "Activate" })).toBeEnabled();
    await user.click(within(czechRow).getByRole("button", { name: "Activate" }));
    await waitFor(() => {
      expect(within(czechRow).getByText("Active")).toBeInTheDocument();
    });
    expect(spy.activateCalls).toEqual(["cs"]);
    expect(spy.prepareCalls).toEqual([]);
  });

  it("keeps Deactivate available for an active non-default locale regardless of readiness", async () => {
    const user = userEvent.setup();
    mockAdminDashboardApis({ active: ["en", "de"] });
    renderWorkspace(ADMIN_ROUTES.ROOT);
    const languages = await screen.findByRole("table", { name: "Public languages" });
    const germanRow = within(languages).getByText("German").closest("tr");
    const deactivate = within(germanRow).getByRole("button", { name: "Deactivate" });
    expect(deactivate).toBeEnabled();
    await user.click(deactivate);
    await waitFor(() => {
      expect(within(germanRow).getByText("Inactive")).toBeInTheDocument();
      expect(within(germanRow).getByRole("button", { name: "Activate" })).toBeDisabled();
    });
  });

  it("surfaces a backend activation error when frontend readiness is stale", async () => {
    const user = userEvent.setup();
    const spy = mockAdminDashboardApis({
      readiness: async () => ({
        locales: defaultReadinessLocales().map((row) =>
          row.locale === "de" ? { ...row, production_ready: true } : row,
        ),
      }),
      activate: async () => {
        const error = new Error(
          "German is not Production Ready. See Locale Readiness, then Prepare for Production if Preview is ready.",
        );
        error.status = 409;
        throw error;
      },
    });
    renderWorkspace(ADMIN_ROUTES.ROOT);
    const languages = await screen.findByRole("table", { name: "Public languages" });
    const germanRow = within(languages).getByText("German").closest("tr");
    expect(within(germanRow).getByRole("button", { name: "Activate" })).toBeEnabled();
    await user.click(within(germanRow).getByRole("button", { name: "Activate" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("not Production Ready");
    expect(within(germanRow).getByText("Inactive")).toBeInTheDocument();
    expect(spy.activateCalls).toEqual(["de"]);
    expect(spy.prepareCalls).toEqual([]);
  });
});
