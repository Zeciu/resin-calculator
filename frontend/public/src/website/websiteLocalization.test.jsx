import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import de from "../i18n/de.json";
import en from "../i18n/en.json";
import ro from "../i18n/ro.json";
import { clearDevicePreferences, seedDevicePreferences } from "../preferences/testHelpers.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { loadPublishedWebsitePages, mockPublishedWebsiteFetch } from "./websiteTestHelpers.js";
import { WEBSITE_FOOTER_LINKS, WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ACTIVE_WITH_GERMAN = ["en", "ro", "de"];
const WEBSITE_PAGES = [
  { path: ROUTES.ABOUT, pageKey: WEBSITE_PAGE_KEYS.ABOUT, germanTitle: "Über HFZWood" },
  { path: ROUTES.PRICING, pageKey: WEBSITE_PAGE_KEYS.PRICING, germanTitle: "Wählen Sie den passenden Tarif für Ihre Arbeitsweise" },
  { path: ROUTES.PRIVACY, pageKey: WEBSITE_PAGE_KEYS.PRIVACY, germanTitle: "Datenschutzerklärung" },
  { path: ROUTES.TERMS, pageKey: WEBSITE_PAGE_KEYS.TERMS, germanTitle: "Allgemeine Geschäftsbedingungen" },
  { path: ROUTES.CONTACT, pageKey: WEBSITE_PAGE_KEYS.CONTACT, germanTitle: "Wir sind für dich da, wenn du Hilfe brauchst" },
];
const GERMAN_FOOTER_LABELS = [
  "Über HFZWood",
  "Preise",
  "Datenschutz",
  "Nutzungsbedingungen",
  "Kontakt",
];
const ENGLISH_WEBSITE_CHROME = [
  "Back to Home",
  "Privacy Policy",
  "Terms of Service",
  "Write to us",
  "Start Free",
  "Choose monthly plan",
  "Choose annual plan",
  "Best value",
  "Paid plans remain available.",
  "You have full access to HFZWood free for 3 months.",
  "Follow the official HFZWood channels for tutorials, project examples, product updates and community news.",
  "We're currently opening HFZWood to woodworkers and resin makers while we continue improving the platform with real-world feedback. Future access options will be announced at a later date.",
];
const CMS_ONLY_GERMAN_SNIPPETS = [
  "Mehr als nur ein Rechner für Epoxidharz",
  "Auf praktischer Erfahrung aufgebaut",
  "Deine bestehenden Projekte bleiben dein Eigentum.",
  "Wir respektieren den Schutz deiner Daten",
  "Allgemeine Geschäftsbedingungen",
  "Wir sind für dich da, wenn du Hilfe brauchst",
];

function mockGermanPublishedWebsite() {
  return mockPublishedWebsiteFetch({
    usePublishedCorpus: true,
    activePublicLocales: ACTIVE_WITH_GERMAN,
  });
}

function renderGermanWebsite(path) {
  seedDevicePreferences({ interfaceLanguage: "de" });
  const fetchMock = mockGermanPublishedWebsite();
  const rendered = renderWorkspace(path);
  return { fetchMock, ...rendered };
}

function expectGermanSharedChrome() {
  expect(screen.getByRole("link", { name: "Zurück zur Startseite" })).toHaveAttribute("href", "/");
  expect(screen.queryByRole("link", { name: "Back to Home" })).not.toBeInTheDocument();
  const footer = screen.getByRole("contentinfo", { name: "Website-Fußzeile" });
  expect(within(footer).getAllByRole("link").map((link) => link.textContent)).toEqual(
    GERMAN_FOOTER_LABELS,
  );
  expect(screen.getByRole("link", { name: "Zum Inhalt springen" })).toBeInTheDocument();
}

function expectNoEnglishWebsiteChrome() {
  for (const text of ENGLISH_WEBSITE_CHROME) {
    expect(screen.queryByText(text), text).not.toBeInTheDocument();
  }
}

describe("German public website localization", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders German shared chrome on About from frontend i18n", async () => {
    const { fetchMock } = renderGermanWebsite(ROUTES.ABOUT);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Über HFZWood", level: 1 })).toBeInTheDocument();
    });
    expectGermanSharedChrome();
    expect(screen.getByRole("article", { name: "Über HFZWood" })).toHaveAttribute(
      "data-page-key",
      "about",
    );
    expect(screen.getByRole("heading", { name: "Mehr als nur ein Rechner für Epoxidharz", level: 2 })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/content/website/about?locale=de",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expectNoEnglishWebsiteChrome();
  });

  it("renders German Pricing without unintended English shared or promotional UI", async () => {
    renderGermanWebsite(ROUTES.PRICING);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Wählen Sie den passenden Tarif für Ihre Arbeitsweise",
          level: 1,
        }),
      ).toBeInTheDocument();
    });
    expectGermanSharedChrome();
    expect(screen.getByText("Sie haben 3 Monate lang kostenlosen Vollzugang zu HFZWood.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Wir öffnen HFZWood derzeit für Holzwerker und Harzverarbeiter, während wir die Plattform mit Rückmeldungen aus der Praxis weiter verbessern. Zukünftige Zugangsoptionen werden zu einem späteren Zeitpunkt bekannt gegeben.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/upgrade later/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/kostenlos starten und später/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/auf einen höheren Tarif umsteigen/i)).not.toBeInTheDocument();
    expectNoEnglishWebsiteChrome();
    expect(screen.getByRole("link", { name: "Kostenlos starten" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "Monatlichen Tarif wählen" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByRole("link", { name: "Jährlichen Tarif wählen" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByText("Bezahlte Tarife bleiben verfügbar.")).toBeInTheDocument();
    expect(screen.getByText("Deine bestehenden Projekte bleiben dein Eigentum.")).toBeInTheDocument();
  });

  it("keeps the same three German Pricing plans, prices, and order", async () => {
    renderGermanWebsite(ROUTES.PRICING);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Kostenloser Tarif", level: 2 })).toBeInTheDocument();
    });
    const cards = screen.getAllByRole("article").filter((node) => node.dataset.offerId);
    expect(cards.map((card) => card.dataset.offerId)).toEqual(["free", "monthly", "annual"]);
    expect(within(cards[0]).getByText("0 $")).toBeInTheDocument();
    expect(within(cards[1]).getByText("9,99 $")).toBeInTheDocument();
    expect(within(cards[2]).getByText("89,99 $")).toBeInTheDocument();
    expect(within(cards[0]).getByRole("heading", { name: "Kostenloser Tarif" })).toBeInTheDocument();
    expect(within(cards[1]).getByRole("heading", { name: "Monatstarif" })).toBeInTheDocument();
    expect(within(cards[2]).getByRole("heading", { name: "Jahresabo" })).toBeInTheDocument();
  });

  it("renders German Contact without unintended English shared labels or body chrome", async () => {
    renderGermanWebsite(ROUTES.CONTACT);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Wir sind für dich da, wenn du Hilfe brauchst", level: 1 }),
      ).toBeInTheDocument();
    });
    expectGermanSharedChrome();
    expect(screen.getByRole("heading", { name: "Schreiben Sie uns", level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Write to us" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Folgen Sie den offiziellen HFZWood-Kanälen für Tutorials, Projektbeispiele, Produktupdates und Community-Nachrichten.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Handbuch und Anleitungen" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Wissensdatenbank" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hefzech@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:hefzech@gmail.com",
    );
    expectNoEnglishWebsiteChrome();
  });

  it("renders German Privacy Policy shared chrome", async () => {
    renderGermanWebsite(ROUTES.PRIVACY);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Datenschutzerklärung", level: 1 })).toBeInTheDocument();
    });
    expectGermanSharedChrome();
    expect(screen.getByRole("article", { name: "Datenschutz" })).toHaveAttribute(
      "data-page-key",
      "privacy",
    );
    expect(screen.queryByRole("article", { name: "Privacy Policy" })).not.toBeInTheDocument();
    expectNoEnglishWebsiteChrome();
  });

  it("renders German Terms of Service shared chrome", async () => {
    renderGermanWebsite(ROUTES.TERMS);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Allgemeine Geschäftsbedingungen", level: 1 }),
      ).toBeInTheDocument();
    });
    expectGermanSharedChrome();
    expect(screen.getByRole("article", { name: "Nutzungsbedingungen" })).toHaveAttribute(
      "data-page-key",
      "terms",
    );
    expect(screen.queryByRole("article", { name: "Terms of Service" })).not.toBeInTheDocument();
    expectNoEnglishWebsiteChrome();
  });

  it("uses German Back to Home across public website pages", async () => {
    for (const page of WEBSITE_PAGES) {
      cleanup();
      renderGermanWebsite(page.path);
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: page.germanTitle, level: 1 })).toBeInTheDocument();
      });
      expect(screen.getByRole("link", { name: "Zurück zur Startseite" })).toHaveAttribute("href", "/");
      expect(screen.queryByRole("link", { name: "Back to Home" })).not.toBeInTheDocument();
    }
  });

  it("uses German footer navigation on every public website page", async () => {
    for (const page of WEBSITE_PAGES) {
      cleanup();
      renderGermanWebsite(page.path);
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: page.germanTitle, level: 1 })).toBeInTheDocument();
      });
      const footer = screen.getByRole("contentinfo", { name: "Website-Fußzeile" });
      const links = within(footer).getAllByRole("link");
      expect(links.map((link) => link.getAttribute("href"))).toEqual(
        WEBSITE_FOOTER_LINKS.map((item) => item.path),
      );
      expect(links.map((link) => link.textContent)).toEqual(GERMAN_FOOTER_LABELS);
    }
  });

  it("keeps English and Romanian website chrome and CMS titles unchanged", async () => {
    expect(en["website.backHome"]).toBe("Back to Home");
    expect(en["website.nav.about"]).toBe("About HFZWood");
    expect(en["website.nav.pricing"]).toBe("Pricing");
    expect(en["website.nav.privacy"]).toBe("Privacy Policy");
    expect(en["website.nav.terms"]).toBe("Terms of Service");
    expect(en["website.contact.writeToUs"]).toBe("Write to us");
    expect(en["website.pricing.promoLead"]).toBe("You have full access to HFZWood free for 3 months.");
    expect(ro["website.backHome"]).toBe("Înapoi la Acasă");
    expect(ro["website.nav.about"]).toBe("Despre HFZWood");
    expect(ro["website.nav.privacy"]).toBe("Politica de confidențialitate");
    expect(ro["website.contact.writeToUs"]).toBe("Scrie-ne");

    for (const corpus of ["public", "private"]) {
      const enPages = loadPublishedWebsitePages("en", corpus);
      const roPages = loadPublishedWebsitePages("ro", corpus);
      expect(enPages.pages.about.body.publicTitle).toBe("About HFZWood");
      expect(enPages.pages.pricing.body.intro).toBe("");
      expect(enPages.pages.pricing.body.footnote).toBe("Your existing projects remain yours.");
      expect(enPages.pages.pricing.body.offers.map((offer) => offer.id)).toEqual([
        "free",
        "monthly",
        "annual",
      ]);
      expect(enPages.pages.pricing.body.offers.map((offer) => offer.displayedPriceText)).toEqual([
        "$0",
        "$9.99",
        "$89.99",
      ]);
      expect(roPages.pages.about.body.publicTitle).toBe("Despre HFZWood");
      expect(roPages.pages.pricing.body.intro).toBe("");
      expect(roPages.pages.contact.body.publicTitle).toBe("Suntem aici dacă ai nevoie de ajutor");
    }

    seedDevicePreferences({ interfaceLanguage: "en" });
    mockPublishedWebsiteFetch({
      usePublishedCorpus: true,
      activePublicLocales: ["en", "ro"],
    });
    renderWorkspace(ROUTES.ABOUT);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "About HFZWood", level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Back to Home" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo", { name: "Website footer" })).toBeInTheDocument();

    cleanup();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    mockPublishedWebsiteFetch({
      usePublishedCorpus: true,
      activePublicLocales: ["en", "ro"],
    });
    renderWorkspace(ROUTES.ABOUT);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Despre HFZWood", level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Înapoi la Acasă" })).toBeInTheDocument();
  });

  it("keeps website editorial copy in the published CMS layer rather than frontend i18n", () => {
    const deValues = Object.values(de).join("\n");
    for (const snippet of CMS_ONLY_GERMAN_SNIPPETS) {
      expect(deValues, snippet).not.toContain(snippet);
    }
    expect(de["website.nav.about"]).toBe("Über HFZWood");
    expect(de["website.nav.privacy"]).toBe("Datenschutz");
    expect(de["website.nav.terms"]).toBe("Nutzungsbedingungen");

    for (const corpus of ["public", "private"]) {
      const pages = loadPublishedWebsitePages("de", corpus);
      expect(pages.pages.about.body.publicTitle).toBe("Über HFZWood");
      expect(pages.pages.about.body.sections[0].title).toBe("Mehr als nur ein Rechner für Epoxidharz");
      expect(pages.pages.privacy.body.publicTitle).toBe("Datenschutzerklärung");
      expect(pages.pages.terms.body.publicTitle).toBe("Allgemeine Geschäftsbedingungen");
      expect(pages.pages.contact.body.intro).toContain("Bevor du uns schreibst");
      expect(pages.pages.pricing.body.intro).toBe("");
      expect(pages.pages.pricing.body.footnote).toBe(
        "Deine bestehenden Projekte bleiben dein Eigentum.",
      );
    }
  });

  it("does not introduce German-specific website rendering branches", () => {
    const websiteDir = join(SRC_ROOT, "website");
    const sources = readdirSync(websiteDir)
      .filter((name) => name.endsWith(".js") || name.endsWith(".jsx"))
      .filter((name) => !name.includes(".test."))
      .map((name) => ({
        name,
        source: readFileSync(join(websiteDir, name), "utf8"),
      }));

    expect(sources.length).toBeGreaterThan(5);
    for (const file of sources) {
      expect(file.source, file.name).not.toMatch(/interfaceLanguage\s*===\s*["']de["']/);
      expect(file.source, file.name).not.toMatch(/locale\s*===\s*["']de["']/);
      expect(file.source, file.name).not.toMatch(/language\s*===\s*["']de["']/);
      expect(file.source, file.name).not.toMatch(/===\s*["']de["']/);
      expect(file.source, file.name).not.toMatch(/["']de["']\s*===/);
    }
  });
});
