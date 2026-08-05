import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_ROUTES } from "./adminRoutes.js";
import { ADMIN_EDITORIAL_LOCALES, ADMIN_LOCALE_LABELS } from "../editorial/editorialLocales.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { ROUTES } from "../workspace/routes.js";
import { seedDevicePreferences } from "../preferences/testHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const ALL_LANGUAGES = ADMIN_EDITORIAL_LOCALES.map((locale) => ({
  locale,
  label: ADMIN_LOCALE_LABELS[locale],
  translationStatus: "Not generated",
  publishedContentStatus: "Not published",
  publicVisibility: locale === "en" ? "Active" : "Inactive",
  isDefault: locale === "en",
  canDeactivate: false,
}));

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

function seedUser() {
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

function mockPublicLanguagesAdminApi(initialActive = ["en"]) {
  let active = [...initialActive];

  return vi.spyOn(global, "fetch").mockImplementation(async (url, init = {}) => {
    const path = String(url);
    const method = (init.method ?? "GET").toUpperCase();

    if (path.endsWith("/api/content/public-languages")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          defaultPublicLocale: "en",
          activePublicLocales: [...active],
        }),
      };
    }

    if (path.endsWith("/api/me/capabilities")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          role: "administrator",
          accessTier: "administrator_unlimited",
          catalogVersion: 1,
          capabilities: {},
        }),
      };
    }

    if (path.endsWith("/api/admin/public-languages") && method === "GET") {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          defaultPublicLocale: "en",
          activePublicLocales: [...active],
          languages: ALL_LANGUAGES.map((row) => ({
            ...row,
            publicVisibility: active.includes(row.locale) ? "Active" : "Inactive",
            canDeactivate: active.includes(row.locale) && row.locale !== "en",
          })),
        }),
      };
    }

    const activateMatch = path.match(/\/api\/admin\/public-languages\/([^/]+)\/activate$/);
    if (activateMatch && method === "POST") {
      const locale = decodeURIComponent(activateMatch[1]);
      if (!active.includes(locale)) {
        active.push(locale);
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          defaultPublicLocale: "en",
          activePublicLocales: [...active],
          languages: ALL_LANGUAGES.map((row) => ({
            ...row,
            publicVisibility: active.includes(row.locale) ? "Active" : "Inactive",
            canDeactivate: active.includes(row.locale) && row.locale !== "en",
          })),
        }),
      };
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
          languages: ALL_LANGUAGES.map((row) => ({
            ...row,
            publicVisibility: active.includes(row.locale) ? "Active" : "Inactive",
            canDeactivate: active.includes(row.locale) && row.locale !== "en",
          })),
        }),
      };
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({ detail: `Unhandled ${path}` }),
    };
  });
}

describe("Admin Public Languages dashboard", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_MOCK_ADMIN", "true");
    vi.restoreAllMocks();
    seedDevicePreferences({ interfaceLanguage: "en" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the Public Languages table with all configured languages", async () => {
    seedAdministrator();
    mockPublicLanguagesAdminApi(["en"]);
    renderWorkspace(ADMIN_ROUTES.ROOT);

    expect(await screen.findByRole("heading", { name: "Public Languages" })).toBeInTheDocument();
    const table = screen.getByRole("table");
    for (const locale of ADMIN_EDITORIAL_LOCALES) {
      expect(within(table).getByText(ADMIN_LOCALE_LABELS[locale])).toBeInTheDocument();
    }
    expect(within(table).getAllByText("Active").length).toBeGreaterThanOrEqual(1);
    expect(within(table).getAllByText("Inactive").length).toBeGreaterThanOrEqual(1);
  });

  it("activates and deactivates a non-default language", async () => {
    const user = userEvent.setup();
    seedAdministrator();
    mockPublicLanguagesAdminApi(["en"]);
    renderWorkspace(ADMIN_ROUTES.ROOT);

    const table = await screen.findByRole("table");
    const romanianRow = within(table).getByText("Romanian").closest("tr");
    await user.click(within(romanianRow).getByRole("button", { name: "Activate" }));

    await waitFor(() => {
      expect(within(romanianRow).getByText("Active")).toBeInTheDocument();
      expect(within(romanianRow).getByRole("button", { name: "Deactivate" })).toBeInTheDocument();
    });

    await user.click(within(romanianRow).getByRole("button", { name: "Deactivate" }));
    await waitFor(() => {
      expect(within(romanianRow).getByText("Inactive")).toBeInTheDocument();
      expect(within(romanianRow).getByRole("button", { name: "Activate" })).toBeInTheDocument();
    });
  });

  it("does not allow deactivating English", async () => {
    seedAdministrator();
    mockPublicLanguagesAdminApi(["en"]);
    renderWorkspace(ADMIN_ROUTES.ROOT);

    const table = await screen.findByRole("table");
    const englishRow = within(table).getByText("English").closest("tr");
    const deactivate = within(englishRow).getByRole("button", { name: "Deactivate" });
    expect(deactivate).toBeDisabled();
  });
});

describe("Public language selector activation", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    seedDevicePreferences({ interfaceLanguage: "en" });
    seedUser();
  });

  it("shows only active languages in the public selector", async () => {
    let active = ["en"];
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const path = String(url);
      if (path.endsWith("/api/content/public-languages")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            defaultPublicLocale: "en",
            activePublicLocales: [...active],
          }),
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
      return { ok: false, status: 404, json: async () => ({}) };
    });

    renderWorkspace(ROUTES.HOME);
    const region = await screen.findByRole("region", { name: "Quick preferences" });
    const languageSelect = within(region).getAllByRole("combobox")[0];
    const optionValues = within(languageSelect)
      .getAllByRole("option")
      .map((option) => option.value);
    expect(optionValues).toEqual(["en"]);
    expect(optionValues).not.toContain("ro");
    expect(optionValues).not.toContain("de");
  });

  it("includes Romanian after activation is reflected in public config", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const path = String(url);
      if (path.endsWith("/api/content/public-languages")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            defaultPublicLocale: "en",
            activePublicLocales: ["en", "ro"],
          }),
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
      return { ok: false, status: 404, json: async () => ({}) };
    });

    renderWorkspace(ROUTES.HOME);
    const region = await screen.findByRole("region", { name: "Quick preferences" });
    const languageSelect = within(region).getAllByRole("combobox")[0];
    const optionValues = within(languageSelect)
      .getAllByRole("option")
      .map((option) => option.value);
    expect(optionValues).toEqual(["en", "ro"]);
    expect(optionValues).not.toContain("de");
  });
});
