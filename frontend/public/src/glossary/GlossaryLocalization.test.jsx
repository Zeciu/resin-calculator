import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GlossarySearch from "./GlossarySearch.jsx";
import GlossaryEntryList from "./GlossaryEntryList.jsx";
import { mockPublishedGlossaryFetch } from "./glossaryTestHelpers.js";
import {
  getSupportedI18nLanguages,
  GLOSSARY_UI_KEYS,
  localeBundleHasOwnKey,
  translate,
} from "../i18n/translate.js";
import { CONFIGURED_PUBLIC_LANGUAGES } from "../preferences/preferencesConstants.js";
import {
  clearDevicePreferences,
  seedDevicePreferences,
} from "../preferences/testHelpers.js";
import { usePreferences } from "../preferences/PreferencesContext.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

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
  mockPublishedGlossaryFetch(undefined, {
    activePublicLocales: [...CONFIGURED_PUBLIC_LANGUAGES],
  });
}

function LanguageSwitcher({ targetLanguage, label }) {
  const { updatePreferences } = usePreferences();
  return (
    <button type="button" onClick={() => updatePreferences({ interfaceLanguage: targetLanguage })}>
      {label}
    </button>
  );
}

async function waitForSearchLabel(label) {
  await waitFor(() => {
    expect(screen.getByRole("searchbox", { name: label })).toBeInTheDocument();
  });
}

describe("Glossary public UI localization", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
  });

  it("defines Glossary UI keys in every supported locale bundle", () => {
    expect(getSupportedI18nLanguages().sort()).toEqual([...CONFIGURED_PUBLIC_LANGUAGES].sort());
    for (const language of CONFIGURED_PUBLIC_LANGUAGES) {
      for (const key of GLOSSARY_UI_KEYS) {
        expect(localeBundleHasOwnKey(language, key)).toBe(true);
        const value = translate(language, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }
  });

  it("renders English Glossary search and empty-state strings", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "en" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.GLOSSARY);

    await waitForSearchLabel("Search glossary");
    expect(screen.getByPlaceholderText("Search terms and definitions")).toBeInTheDocument();

    await userEvent.setup().type(screen.getByRole("searchbox", { name: "Search glossary" }), "zzzz-no-match");
    expect(screen.getByText("No glossary terms match your search.")).toBeInTheDocument();
    expect(screen.getByText("Try different keywords.")).toBeInTheDocument();
  });

  it("renders Romanian Glossary search and empty-state strings", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.GLOSSARY);

    await waitForSearchLabel("Caută în glosar");
    expect(screen.getByPlaceholderText("Caută termeni și definiții")).toBeInTheDocument();

    await userEvent.setup().type(screen.getByRole("searchbox", { name: "Caută în glosar" }), "zzzz-no-match");
    expect(screen.getByText("Niciun termen din glosar nu corespunde căutării.")).toBeInTheDocument();
    expect(screen.getByText("Încearcă alte cuvinte cheie.")).toBeInTheDocument();
  });

  it("updates Glossary labels when the selected language changes", async () => {
    seedDevicePreferences({ interfaceLanguage: "en" });
    mockAllPublicLanguages();
    const user = userEvent.setup();

    render(
      <TestProviders>
        <LanguageSwitcher targetLanguage="ro" label="Switch to Romanian" />
        <GlossarySearch value="" onChange={() => {}} />
        <GlossaryEntryList
          groups={[]}
          expandedEntryId={null}
          onToggleEntry={() => {}}
        />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: "Search glossary" })).toBeInTheDocument();
    });
    expect(screen.getByText("No glossary terms match your search.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch to Romanian" }));

    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: "Caută în glosar" })).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Caută termeni și definiții")).toBeInTheDocument();
    expect(screen.getByText("Niciun termen din glosar nu corespunde căutării.")).toBeInTheDocument();
    expect(screen.queryByText("No glossary terms match your search.")).not.toBeInTheDocument();
  });
});

describe("Glossary French labels (component-level)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
    mockAllPublicLanguages();
  });

  it("renders French search and empty-state labels", async () => {
    seedDevicePreferences({ interfaceLanguage: "fr" });
    render(
      <TestProviders>
        <GlossarySearch value="" onChange={() => {}} />
        <GlossaryEntryList groups={[]} expandedEntryId={null} onToggleEntry={() => {}} />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: "Rechercher dans le glossaire" })).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Rechercher termes et définitions")).toBeInTheDocument();
    expect(
      screen.getByText("Aucun terme du glossaire ne correspond à votre recherche."),
    ).toBeInTheDocument();
    expect(screen.getByText("Essayez d'autres mots-clés.")).toBeInTheDocument();
  });
});
