import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "./en.json";
import { localeBundleHasOwnKey, translate } from "./translate.js";
import {
  listActiveInterfaceLanguages,
  CONFIGURED_PUBLIC_LANGUAGES,
} from "../preferences/preferencesConstants.js";
import {
  clearDevicePreferences,
  mockCapabilitiesFetch,
  seedDevicePreferences,
} from "../preferences/testHelpers.js";
import { mockPublishedWebsiteFetch } from "../website/websiteTestHelpers.js";
import { mockPublishedManualFetch } from "../manual/manualTestHelpers.js";
import { mockPublishedGlossaryFetch } from "../glossary/glossaryTestHelpers.js";
import { mockPublishedKnowledgeBaseFetch } from "../knowledgeBase/knowledgeBaseTestHelpers.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { ROUTES } from "../workspace/routes.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const ACTIVE_WITH_GERMAN = ["en", "ro", "de"];

function seedAuthenticatedSession() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        id: "stub-user",
        email: "account@example.com",
        username: "accountuser",
      },
    }),
  );
}

function getSidebar() {
  return screen.getByRole("navigation", { name: "Workspace navigation" });
}

describe("Public application localization", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
  });

  it("lists Active public locales without a hard-coded EN/RO/FR allowlist", () => {
    expect(listActiveInterfaceLanguages(["en", "ro", "de"], "en")).toEqual(["en", "ro", "de"]);
    expect(listActiveInterfaceLanguages(["en", "ro"], "en")).toEqual(["en", "ro"]);
    expect(listActiveInterfaceLanguages(["en", "ro"], "en")).not.toContain("de");
    expect(listActiveInterfaceLanguages(["en", "es"], "en")).toEqual(["en", "es"]);
    expect(listActiveInterfaceLanguages(["en", "xx"], "en")).toEqual(["en"]);
    expect(CONFIGURED_PUBLIC_LANGUAGES).toEqual(
      expect.arrayContaining(["es", "pt", "pl", "cs", "it", "fr"]),
    );
  });

  it("requires German and Romanian bundles to own every English UI key", () => {
    for (const locale of ["de", "ro"]) {
      for (const key of Object.keys(en)) {
        expect(localeBundleHasOwnKey(locale, key), `${locale} missing ${key}`).toBe(true);
        expect(translate(locale, key), `${locale} empty ${key}`).toBeTruthy();
        expect(translate(locale, key)).not.toBe(key);
      }
    }
    expect(translate("de", "demo.cta")).not.toBe(translate("en", "demo.cta"));
    expect(translate("de", "account.title")).not.toBe(translate("en", "account.title"));
    expect(translate("de", "content.manualTitle")).toBe(translate("de", "nav.manualTutorials"));
    expect(translate("de", "content.glossaryTitle")).toBe(translate("de", "nav.glossary"));
    expect(translate("de", "content.knowledgeBaseTitle")).toBe(translate("de", "nav.knowledgeBase"));
  });

  it("renders German shared navigation and common UI", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "de" });
    mockCapabilitiesFetch({ activePublicLocales: ACTIVE_WITH_GERMAN });
    renderWorkspace(ROUTES.HOME);

    const sidebar = getSidebar();
    await waitFor(() => {
      expect(within(sidebar).getByRole("link", { name: "Neues Projekt" })).toBeInTheDocument();
    });
    expect(within(sidebar).getByRole("link", { name: "Startseite" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Projekte" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Handbuch & Tutorials" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Glossar" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Wissensdatenbank" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Mein Konto" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Ein Demoprojekt ausprobieren" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("button", { name: "Abmelden" })).toBeInTheDocument();
    expect(within(sidebar).getByText("Schnelleinstellungen")).toBeInTheDocument();
    expect(within(sidebar).getByText("Oberflächensprache")).toBeInTheDocument();
    expect(within(sidebar).getByText("Bevorzugte Längeneinheit")).toBeInTheDocument();
    expect(within(sidebar).getByText("Bevorzugte Volumeneinheit")).toBeInTheDocument();
    expect(within(sidebar).queryByRole("link", { name: "Try a demo project" })).not.toBeInTheDocument();
    expect(within(sidebar).queryByText("Quick preferences")).not.toBeInTheDocument();
  });

  it("renders German My Account user-facing UI", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "de" });
    mockCapabilitiesFetch({ activePublicLocales: ACTIVE_WITH_GERMAN });
    renderWorkspace(ROUTES.ACCOUNT);

    const main = screen.getByRole("main");
    expect(await within(main).findByRole("heading", { name: "Mein Konto" })).toBeInTheDocument();
    expect(within(main).getByRole("heading", { name: "Profil" })).toBeInTheDocument();
    expect(within(main).getByText("E-Mail")).toBeInTheDocument();
    expect(within(main).getByRole("heading", { name: "Anwendungseinstellungen" })).toBeInTheDocument();
    expect(
      within(main).getByText(
        "Wählen Sie Ihre Oberflächensprache sowie die bevorzugten Längen- und Volumeneinheiten. Diese Einstellungen ändern nur, wie Dinge für Sie angezeigt werden.",
      ),
    ).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: /Anwendungseinstellungen/ })).toBeInTheDocument();
    expect(within(main).getByRole("heading", { name: "Abo" })).toBeInTheDocument();
    expect(within(main).getByText("Aktueller Tarif")).toBeInTheDocument();
    expect(within(main).getByText("Status")).toBeInTheDocument();
    expect(await within(main).findByText("Kein aktives Abo")).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: "Tarife und Preise ansehen" })).toBeInTheDocument();
    expect(within(main).getByRole("button", { name: "Abonnieren" })).toBeInTheDocument();
    expect(within(main).getByRole("button", { name: "Status aktualisieren" })).toBeInTheDocument();
    expect(within(main).getByRole("heading", { name: "Einstellungen" })).toBeInTheDocument();
    expect(within(main).getByText(/Passwort- und Sicherheitseinstellungen/)).toBeInTheDocument();
    expect(within(main).getByText(/Benachrichtigungseinstellungen/)).toBeInTheDocument();
    expect(within(main).getByRole("button", { name: "Abmelden" })).toBeInTheDocument();
    expect(within(main).queryByRole("heading", { name: "My Account" })).not.toBeInTheDocument();
    expect(within(main).queryByText("No active subscription")).not.toBeInTheDocument();
  });

  it("renders German Projects page UI", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "de" });
    mockCapabilitiesFetch({ activePublicLocales: ACTIVE_WITH_GERMAN });
    renderWorkspace(ROUTES.PROJECTS);

    const main = screen.getByRole("main");
    expect(await within(main).findByRole("heading", { name: "Projekte", level: 1 })).toBeInTheDocument();
    expect(
      within(main).getByText(
        "Ihre Projekte werden als .hfzproject-Dateien auf Ihrem Gerät gespeichert. Öffnen Sie eine Projektdatei, um die Arbeit im Anwendungs-Arbeitsbereich fortzusetzen.",
      ),
    ).toBeInTheDocument();
    expect(within(main).getByRole("button", { name: "Projekt öffnen" })).toBeInTheDocument();
    expect(within(main).getByRole("heading", { name: "Zuletzt verwendete Projekte" })).toBeInTheDocument();
    expect(within(main).getByText("Noch keine zuletzt verwendeten Projekte.")).toBeInTheDocument();
    expect(
      within(main).getByText(
        "Verwenden Sie Projekt öffnen, um eine gespeicherte .hfzproject-Datei von Ihrem Gerät auszuwählen.",
      ),
    ).toBeInTheDocument();
    expect(within(main).queryByRole("heading", { name: "Projects", level: 1 })).not.toBeInTheDocument();
    expect(within(main).queryByText("No recent projects yet.")).not.toBeInTheDocument();
  });

  it("keeps Manual H1 and contents chrome German without changing published chapter titles", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "de" });
    mockPublishedManualFetch(
      [
        {
          id: "einfuehrung",
          title: "Einführung ins Harzgießen",
          blocks: [{ type: "paragraph", text: "Veröffentlichter deutscher Kapiteltext." }],
        },
      ],
      { locale: "de", activePublicLocales: ACTIVE_WITH_GERMAN },
    );
    renderWorkspace(ROUTES.MANUAL);

    const main = screen.getByRole("main");
    expect(
      await within(main).findByRole("heading", { name: "Handbuch & Tutorials", level: 1 }),
    ).toBeInTheDocument();
    expect(
      await within(main).findByRole("heading", { name: "Einführung ins Harzgießen", level: 2 }),
    ).toBeInTheDocument();
    expect(within(main).getByRole("heading", { name: "Inhalt", level: 2 })).toBeInTheDocument();
    expect(
      within(main).getByRole("navigation", { name: "Inhaltsverzeichnis" }),
    ).toBeInTheDocument();
    expect(
      within(main).getByRole("heading", { name: "Einführung ins Harzgießen", level: 2 }),
    ).toBeInTheDocument();
    expect(within(main).getByText("Veröffentlichter deutscher Kapiteltext.")).toBeInTheDocument();
    expect(within(main).queryByRole("heading", { name: "Manual & Tutorials", level: 1 })).not.toBeInTheDocument();
    expect(within(main).queryByRole("heading", { name: "Contents", level: 2 })).not.toBeInTheDocument();
  });

  it("renders the German Glossary H1 from the same title source as the sidebar", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "de" });
    mockPublishedGlossaryFetch(undefined, { activePublicLocales: ACTIVE_WITH_GERMAN });
    renderWorkspace(ROUTES.GLOSSARY);

    const main = screen.getByRole("main");
    expect(await within(main).findByRole("heading", { name: "Glossar", level: 1 })).toBeInTheDocument();
    expect(within(getSidebar()).getByRole("link", { name: "Glossar" })).toBeInTheDocument();
    expect(within(main).queryByRole("heading", { name: "Glossary", level: 1 })).not.toBeInTheDocument();
  });

  it("renders the German Knowledge Base H1 from the same title source as the sidebar", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "de" });
    mockPublishedKnowledgeBaseFetch(undefined, null, { activePublicLocales: ACTIVE_WITH_GERMAN });
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);

    const main = screen.getByRole("main");
    expect(
      await within(main).findByRole("heading", { name: "Wissensdatenbank", level: 1 }),
    ).toBeInTheDocument();
    expect(within(getSidebar()).getByRole("link", { name: "Wissensdatenbank" })).toBeInTheDocument();
    expect(
      within(main).queryByRole("heading", { name: "Knowledge Base", level: 1 }),
    ).not.toBeInTheDocument();
  });

  it("shows an Active German locale in the public language selector", async () => {
    mockPublishedWebsiteFetch({ activePublicLocales: ACTIVE_WITH_GERMAN });
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    const languageSelect = await within(getSidebar()).findByRole("combobox", { name: "Language" });
    await waitFor(() => {
      expect(languageSelect).toBeEnabled();
    });
    expect(within(languageSelect).getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(within(languageSelect).getByRole("option", { name: "Română" })).toBeInTheDocument();
    expect(within(languageSelect).getByRole("option", { name: "Deutsch" })).toBeInTheDocument();
  });

  it("does not show an inactive prepared locale in the public selector", async () => {
    mockPublishedWebsiteFetch({ activePublicLocales: ACTIVE_WITH_GERMAN });
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    const languageSelect = await within(getSidebar()).findByRole("combobox", { name: "Language" });
    await waitFor(() => {
      expect(languageSelect).toBeEnabled();
    });
    const optionValues = within(languageSelect)
      .getAllByRole("option")
      .map((option) => option.value);
    expect(optionValues).toEqual(["en", "ro", "de"]);
    expect(optionValues).not.toContain("es");
    expect(optionValues).not.toContain("fr");
    expect(within(languageSelect).queryByRole("option", { name: "Español" })).not.toBeInTheDocument();
    expect(within(languageSelect).queryByRole("option", { name: "Français" })).not.toBeInTheDocument();
  });

  it("keeps English and Romanian public chrome intact", async () => {
    mockPublishedWebsiteFetch({ activePublicLocales: ["en", "ro"] });
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    const sidebar = getSidebar();
    expect(within(sidebar).getByRole("link", { name: "Try a demo project" })).toBeInTheDocument();
    const languageSelect = await within(sidebar).findByRole("combobox", { name: "Language" });
    await waitFor(() => {
      expect(languageSelect).toBeEnabled();
    });
    expect(within(languageSelect).getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(within(languageSelect).getByRole("option", { name: "Română" })).toBeInTheDocument();
    expect(within(languageSelect).queryByRole("option", { name: "Deutsch" })).not.toBeInTheDocument();

    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.LOGIN);
    expect(
      await screen.findByRole("heading", { name: "Autentificare în HFZWood", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Log in to HFZWood", level: 2 })).not.toBeInTheDocument();
  });
});
