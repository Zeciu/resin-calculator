import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSupportedI18nLanguages,
  localeBundleHasOwnKey,
  translate,
  WORKSPACE_NAV_UI_KEYS,
} from "../i18n/translate.js";
import { CONFIGURED_PUBLIC_LANGUAGES } from "../preferences/preferencesConstants.js";
import {
  clearDevicePreferences,
  mockCapabilitiesFetch,
  seedDevicePreferences,
} from "../preferences/testHelpers.js";
import { ROUTES } from "./routes.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { WORKSPACE_NAV_ITEMS } from "./navigation.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const PRIMARY_NAV_KEYS = [
  "nav.newProject",
  "nav.projects",
  "nav.manualTutorials",
  "nav.glossary",
  "nav.knowledgeBase",
  "nav.myAccount",
];

function seedAuthenticatedSession() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        id: "stub-user",
        email: "user@example.com",
        username: "user",
      },
    }),
  );
}

function mockAllPublicLanguages() {
  mockCapabilitiesFetch({ activePublicLocales: [...CONFIGURED_PUBLIC_LANGUAGES] });
}

function expectSidebarLabels(language) {
  const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
  for (const key of PRIMARY_NAV_KEYS) {
    expect(within(sidebar).getByRole("link", { name: translate(language, key) })).toBeInTheDocument();
  }
}

describe("Workspace navigation localization", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
  });

  it("defines navigation keys in every supported locale bundle", () => {
    expect(getSupportedI18nLanguages().sort()).toEqual([...CONFIGURED_PUBLIC_LANGUAGES].sort());
    for (const language of CONFIGURED_PUBLIC_LANGUAGES) {
      for (const key of WORKSPACE_NAV_UI_KEYS) {
        expect(localeBundleHasOwnKey(language, key)).toBe(true);
        const value = translate(language, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }
    for (const key of PRIMARY_NAV_KEYS) {
      expect(translate("ro", key)).not.toBe(translate("en", key));
      expect(translate("fr", key)).not.toBe(translate("en", key));
      expect(translate("de", key)).not.toBe(translate("en", key));
      expect(translate("es", key)).not.toBe(translate("en", key));
    }
  });

  it("renders English workspace navigation labels", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "en" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expectSidebarLabels("en");
    });
  });

  it("renders Romanian workspace navigation labels", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expectSidebarLabels("ro");
    });
  });

  it("renders French workspace navigation labels", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "fr" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expectSidebarLabels("fr");
    });
  });

  it("renders German workspace navigation labels", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "de" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expectSidebarLabels("de");
    });
  });

  it("renders Spanish workspace navigation labels", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "es" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expectSidebarLabels("es");
    });
  });

  it("updates workspace navigation immediately when the language changes", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "en" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expectSidebarLabels("en");
    });

    const region = await screen.findByRole("region", { name: "Quick preferences" });
    const [languageSelect] = within(region).getAllByRole("combobox");
    await user.selectOptions(languageSelect, "fr");

    await waitFor(() => {
      expectSidebarLabels("fr");
    });
    expect(screen.queryByRole("link", { name: "New Project" })).not.toBeInTheDocument();
  });

  it("keeps WORKSPACE_NAV_ITEMS wired to translation keys only", () => {
    for (const item of WORKSPACE_NAV_ITEMS) {
      expect(item.labelKey.startsWith("nav.")).toBe(true);
      expect(WORKSPACE_NAV_UI_KEYS).toContain(item.labelKey);
    }
  });
});
