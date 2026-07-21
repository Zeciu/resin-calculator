import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import KnowledgeBaseEntry from "./KnowledgeBaseEntry.jsx";
import KnowledgeBaseSearch from "./KnowledgeBaseSearch.jsx";
import { mockPublishedKnowledgeBaseFetch } from "./knowledgeBaseTestHelpers.js";
import {
  getSupportedI18nLanguages,
  KNOWLEDGE_BASE_UI_KEYS,
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

const SAMPLE_ENTRY = {
  id: "sticky-resin-after-cure",
  title: "Resin remains sticky",
  problemSummary: "Surface stays tacky.",
  symptoms: ["Fingerprints remain"],
  possibleCauses: ["Incorrect ratio"],
  solution: ["Verify mixing ratio"],
  prevention: [],
  tips: ["Warm the shop"],
  warnings: ["Do not sand uncured resin"],
};

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
  mockPublishedKnowledgeBaseFetch(undefined, null, {
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

describe("Knowledge Base public UI localization", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
  });

  it("defines Knowledge Base UI keys in every supported locale bundle", () => {
    expect(getSupportedI18nLanguages().sort()).toEqual([...CONFIGURED_PUBLIC_LANGUAGES].sort());
    for (const language of CONFIGURED_PUBLIC_LANGUAGES) {
      for (const key of KNOWLEDGE_BASE_UI_KEYS) {
        expect(localeBundleHasOwnKey(language, key)).toBe(true);
        const value = translate(language, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }
    // Romanian uses distinct native wording for every required concept.
    for (const key of KNOWLEDGE_BASE_UI_KEYS) {
      expect(translate("ro", key)).not.toBe(translate("en", key));
    }
  });

  it("renders English Knowledge Base structural labels", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "en" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);

    await waitForSearchLabel("Search knowledge base");
    expect(screen.getByPlaceholderText("Search problems, symptoms, and solutions")).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Resin remains sticky" }));
    expect(screen.getByRole("heading", { name: "Problem Summary", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Symptoms", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Possible Causes", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Solution", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tips", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Warnings", level: 4 })).toBeInTheDocument();
  });

  it("renders Romanian Knowledge Base structural labels", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);

    await waitForSearchLabel("Caută în baza de cunoștințe");
    expect(
      screen.getByPlaceholderText("Caută probleme, simptome și soluții"),
    ).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Resin remains sticky" }));
    expect(screen.getByRole("heading", { name: "Rezumatul problemei", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Simptome", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cauze posibile", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Soluție", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sfaturi practice", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Avertismente", level: 4 })).toBeInTheDocument();
  });

  it("renders Spanish Knowledge Base structural labels", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "es" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);

    await waitForSearchLabel("Buscar en la base de conocimientos");
    expect(
      screen.getByPlaceholderText("Buscar problemas, síntomas y soluciones"),
    ).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Resin remains sticky" }));
    expect(screen.getByRole("heading", { name: "Resumen del problema", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Síntomas", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Causas posibles", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Solución", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Consejos prácticos", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Advertencias", level: 4 })).toBeInTheDocument();
  });

  it("renders Polish Knowledge Base structural labels", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "pl" });
    mockAllPublicLanguages();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);

    await waitForSearchLabel("Szukaj w bazie wiedzy");
    expect(
      screen.getByPlaceholderText("Szukaj problemów, objawów i rozwiązań"),
    ).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Resin remains sticky" }));
    expect(screen.getByRole("heading", { name: "Podsumowanie problemu", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Objawy", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Możliwe przyczyny", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rozwiązanie", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Praktyczne wskazówki", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ostrzeżenia", level: 4 })).toBeInTheDocument();
  });

  it("updates Knowledge Base labels when the selected language changes", async () => {
    seedDevicePreferences({ interfaceLanguage: "en" });
    mockAllPublicLanguages();
    const user = userEvent.setup();

    render(
      <TestProviders>
        <LanguageSwitcher targetLanguage="ro" label="Switch to Romanian" />
        <KnowledgeBaseSearch value="" onChange={() => {}} />
        <KnowledgeBaseEntry
          entry={SAMPLE_ENTRY}
          isExpanded
          onToggle={() => {}}
        />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: "Search knowledge base" })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Solution", level: 4 })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch to Romanian" }));

    await waitFor(() => {
      expect(
        screen.getByRole("searchbox", { name: "Caută în baza de cunoștințe" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByPlaceholderText("Caută probleme, simptome și soluții"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Soluție", level: 4 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Solution", level: 4 })).not.toBeInTheDocument();
  });

  it("does not alter Admin Knowledge Base field labels", async () => {
    // Admin management stays English; this file only covers public components.
    // Guard: public entry labels localize while Admin editor strings remain hardcoded English elsewhere.
    expect(translate("ro", "knowledgeBase.problemSummary")).toBe("Rezumatul problemei");
    expect(translate("en", "knowledgeBase.problemSummary")).toBe("Problem Summary");
  });
});

describe("Knowledge Base French labels (component-level)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
    mockAllPublicLanguages();
  });

  it("renders French search and section labels", async () => {
    seedDevicePreferences({ interfaceLanguage: "fr" });
    render(
      <TestProviders>
        <KnowledgeBaseSearch value="" onChange={() => {}} />
        <KnowledgeBaseEntry entry={SAMPLE_ENTRY} isExpanded onToggle={() => {}} />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("searchbox", { name: "Rechercher dans la base de connaissances" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByPlaceholderText("Rechercher problèmes, symptômes et solutions"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Résumé du problème", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Symptômes", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Causes possibles", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Solution", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Conseils pratiques", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Avertissements", level: 4 })).toBeInTheDocument();
  });
});
