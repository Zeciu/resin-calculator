import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPublicPreviewFetch } from "../publicPreview/publicPreviewTestHelpers.js";
import {
  clearDevicePreferences,
  seedDevicePreferences,
} from "../preferences/testHelpers.js";
import { mockPublishedWebsiteFetch } from "../website/websiteTestHelpers.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import {
  GUEST_PUBLIC_SHELL_UI_KEYS,
  localeBundleHasOwnKey,
  translate,
} from "./translate.js";
import {
  SRC_ROOT,
  collectLiteralKeysFromFiles,
  extractLiteralI18nKeys,
  loadActivePublicLocales,
} from "./publicLocalizationTestUtils.js";

const GUEST_PUBLIC_SHELL_SOURCE_FILES = [
  "workspace/WorkspaceSidebar.jsx",
  "demo/DemoProjectNavLink.jsx",
  "workspace/GuestHomeOnboarding.jsx",
  "workspace/GuestIntro.jsx",
  "workspace/WorkspaceHero.jsx",
  "workspace/LockedModuleMessage.jsx",
  "workspace/DemoWorkspace.jsx",
  "workspace/DemoFollowUp.jsx",
  "preferences/PublicLanguageSelector.jsx",
  "i18n/DocumentChrome.jsx",
  "auth/RegisterPage.jsx",
  "auth/LoginPage.jsx",
  "auth/PasswordRecoveryPage.jsx",
  "content/ContentUnavailableMessage.jsx",
  "website/NotFoundPage.jsx",
  "website/PublicWebsiteLayout.jsx",
  "website/PublicWebsitePageShell.jsx",
  "website/PublicWebsiteFooter.jsx",
  "website/PublicPricingPage.jsx",
  "website/OfficialCommunityLinks.jsx",
];

const GUEST_CTA_KEYS = [
  "demo.cta",
  "home.onboardingRegister",
  "home.onboardingLogin",
  "publicLanguage.label",
];

function collectLiteralKeysFromGuestSources() {
  const keys = new Set(collectLiteralKeysFromFiles(GUEST_PUBLIC_SHELL_SOURCE_FILES));
  const previewDir = join(SRC_ROOT, "publicPreview");
  for (const fileName of readdirSync(previewDir)) {
    if (!fileName.endsWith(".jsx") || fileName.includes(".test.")) {
      continue;
    }
    const source = readFileSync(join(previewDir, fileName), "utf8");
    for (const key of extractLiteralI18nKeys(source)) {
      keys.add(key);
    }
  }
  return [...keys].sort();
}

function getSidebar() {
  return screen.getByRole("navigation", { name: "Workspace navigation" });
}

describe("Guest/public shell localization completeness", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
  });

  it("covers literal t() keys used by guest/public shell sources", () => {
    const extracted = collectLiteralKeysFromGuestSources();
    expect(extracted.length).toBeGreaterThan(0);
    for (const key of extracted) {
      expect(GUEST_PUBLIC_SHELL_UI_KEYS).toContain(key);
    }
  });

  it("requires every guest/public shell key in each active public locale bundle", () => {
    const activePublicLocales = loadActivePublicLocales();
    const uniqueKeys = [...new Set(GUEST_PUBLIC_SHELL_UI_KEYS)];

    for (const locale of activePublicLocales) {
      for (const key of uniqueKeys) {
        expect(localeBundleHasOwnKey(locale, key), `${locale} missing ${key}`).toBe(true);
        const value = translate(locale, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }

    for (const locale of activePublicLocales.filter((code) => code !== "en")) {
      for (const key of GUEST_CTA_KEYS) {
        expect(translate(locale, key)).not.toBe(translate("en", key));
      }
    }
  });

  it("renders English guest sidebar and home chrome from owned keys", async () => {
    mockPublishedWebsiteFetch();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    const sidebar = getSidebar();
    expect(within(sidebar).getByRole("link", { name: "Try a demo project" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Create Free Account" })).toBeInTheDocument();
    expect(
      within(sidebar).getByRole("link", { name: "Already have an account? Log in" }),
    ).toBeInTheDocument();
    expect(await within(sidebar).findByRole("combobox", { name: "Language" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ready to try HFZWood?", level: 2 }),
    ).toBeInTheDocument();
  });

  it("renders Romanian guest sidebar and home chrome from owned keys", async () => {
    mockPublishedWebsiteFetch();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.HOME);

    const sidebar = getSidebar();
    expect(
      await within(sidebar).findByRole("link", { name: "Încearcă un proiect demo" }),
    ).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Creează cont gratuit" })).toBeInTheDocument();
    expect(
      within(sidebar).getByRole("link", { name: "Ai deja un cont? Autentifică-te" }),
    ).toBeInTheDocument();
    expect(await within(sidebar).findByRole("combobox", { name: "Limbă" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Acasă" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ești gata să încerci HFZWood?", level: 2 }),
    ).toBeInTheDocument();
    expect(within(sidebar).queryByRole("link", { name: "Try a demo project" })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole("link", { name: "Create Free Account" })).not.toBeInTheDocument();
  });

  it("renders a fully French guest sidebar without English CTA fallback", async () => {
    mockPublishedWebsiteFetch();
    seedDevicePreferences({ interfaceLanguage: "fr" });
    renderWorkspace(ROUTES.HOME);

    const sidebar = getSidebar();
    expect(
      await within(sidebar).findByRole("link", { name: "Essayer un projet de démonstration" }),
    ).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Créer un compte gratuit" })).toBeInTheDocument();
    expect(
      within(sidebar).getByRole("link", { name: "Vous avez déjà un compte ? Se connecter" }),
    ).toBeInTheDocument();
    expect(await within(sidebar).findByRole("combobox", { name: "Langue" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Accueil" })).toBeInTheDocument();
    expect(
      within(sidebar).getByRole("link", { name: "Aperçu des ressources" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Prêt à essayer HFZWood ?", level: 2 }),
    ).toBeInTheDocument();

    expect(within(sidebar).queryByRole("link", { name: "Try a demo project" })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole("link", { name: "Create Free Account" })).not.toBeInTheDocument();
    expect(
      within(sidebar).queryByRole("link", { name: "Already have an account? Log in" }),
    ).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole("combobox", { name: "Language" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ready to try HFZWood?", level: 2 })).not.toBeInTheDocument();
  });

  it("renders French Resource Preview landing chrome without English fallback", async () => {
    mockPublicPreviewFetch({ activePublicLocales: ["en", "ro", "fr"] });
    seedDevicePreferences({ interfaceLanguage: "fr" });
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW);

    const main = screen.getByRole("main");
    await waitFor(() => {
      expect(
        within(main).getByRole("heading", { name: "Aperçu des ressources", level: 1 }),
      ).toBeInTheDocument();
    });
    expect(
      within(main).getByText(
        "Explorez une sélection des ressources pédagogiques HFZWood avant de vous abonner.",
      ),
    ).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: /Manuel et tutoriels/i })).toHaveAttribute(
      "href",
      "/knowledge-preview/manual",
    );
    expect(within(main).getByRole("link", { name: /Base de connaissances/i })).toHaveAttribute(
      "href",
      "/knowledge-preview/knowledge-base",
    );
    expect(within(main).getByRole("link", { name: /Glossaire/i })).toHaveAttribute(
      "href",
      "/knowledge-preview/glossary",
    );
    expect(
      within(main).queryByText(
        "Explore a selection from the HFZWood learning resources before subscribing.",
      ),
    ).not.toBeInTheDocument();
    expect(within(main).queryByRole("heading", { name: "Public Knowledge Preview", level: 1 })).not.toBeInTheDocument();
  });
});
