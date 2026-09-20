import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import WebsiteSectionBlocks from "./WebsiteSectionBlocks.jsx";
import { orderVisiblePricingOffers } from "./PublicPricingPage.jsx";
import {
  buildAboutSection,
  buildDocumentSection,
  buildPricingOffer,
  buildPublishedAboutResponse,
  buildPublishedContactResponse,
  buildPublishedDocumentResponse,
  buildPublishedPricingResponse,
  mockPublishedWebsiteFetch,
} from "./websiteTestHelpers.js";

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

function expectSingleFooter() {
  expect(screen.getAllByRole("contentinfo", { name: "Website footer" })).toHaveLength(1);
}

describe("WebsiteSectionBlocks", () => {
  it("renders supported editorial blocks in authored order", () => {
    render(
      <MemoryRouter>
        <WebsiteSectionBlocks
          sections={[
            {
              id: "first",
              title: "First section",
              blocks: [
                { type: "heading", level: 3, text: "Block heading" },
                { type: "paragraph", text: "<p>First paragraph</p>" },
              ],
            },
            {
              id: "second",
              title: "Second section",
              blocks: [{ type: "paragraph", text: "<p>Second paragraph</p>" }],
            },
          ]}
        />
      </MemoryRouter>,
    );

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((node) => node.textContent)).toEqual(["First section", "Second section"]);
    expect(screen.getByRole("heading", { name: "Block heading", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("First paragraph")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph")).toBeInTheDocument();
  });

  it("does not render unknown block types or translation metadata", () => {
    const { container } = render(
      <MemoryRouter>
        <WebsiteSectionBlocks
          sections={[
            {
              id: "meta",
              title: "Visible title",
              translationStatus: "needs_review",
              blocks: [
                { type: "paragraph", text: "<p>Visible copy</p>" },
                { type: "mystery", text: "should not appear" },
                { type: "callout", variant: "note", blocks: [] },
              ],
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Visible copy")).toBeInTheDocument();
    expect(screen.queryByText("should not appear")).not.toBeInTheDocument();
    expect(screen.queryByText("needs_review")).not.toBeInTheDocument();
    expect(container.querySelector("[data-translation-status]")).toBeNull();
  });
});

describe("Public Website fixed pages (Stage 6D)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("About", () => {
    it("renders publicTitle once with ordered sections, blocks, and optional image", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          about: buildPublishedAboutResponse({
            publicTitle: "About Title Once",
            sections: [
              buildAboutSection({
                id: "hero",
                title: "Hero section",
                blocks: [{ type: "paragraph", text: "<p>Hero copy</p>" }],
                image: { src: "", alt: "" },
              }),
              buildAboutSection({
                id: "story",
                title: "Story section",
                blocks: [{ type: "paragraph", text: "<p>Story copy</p>" }],
                image: {
                  src: "/api/content/website/images/story.png",
                  alt: "Workshop bench",
                },
              }),
            ],
          }),
        },
      });
      renderWorkspace(ROUTES.ABOUT);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "About Title Once", level: 1 })).toBeInTheDocument();
      });

      expect(screen.getAllByRole("heading", { name: "About Title Once", level: 1 })).toHaveLength(1);
      const sectionTitles = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent);
      expect(sectionTitles).toEqual(["Hero section", "Story section"]);
      expect(screen.getByText("Hero copy")).toBeInTheDocument();
      expect(screen.getByText("Story copy")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Workshop bench" })).toHaveAttribute(
        "src",
        "/api/content/website/images/story.png",
      );
      expect(screen.queryByRole("img", { name: "" })).not.toBeInTheDocument();
      expectSingleFooter();
    });

    it("omits section image when src is absent", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          about: buildPublishedAboutResponse({
            sections: [
              buildAboutSection({
                title: "No image section",
                image: { src: "   ", alt: "Unused alt" },
              }),
            ],
          }),
        },
      });
      renderWorkspace(ROUTES.ABOUT);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "No image section", level: 2 })).toBeInTheDocument();
      });
      const page = screen.getByRole("article", { name: "About HFZWood" });
      expect(within(page).queryByRole("img")).not.toBeInTheDocument();
    });

    it("emphasizes the hero experience copy and groups later sections in pairs", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          about: buildPublishedAboutResponse({
            publicTitle: "About HFZWood",
            sections: [
              buildAboutSection({
                id: "hero",
                title: "More than just an epoxy resin calculator",
                blocks: [
                  { type: "paragraph", text: "<p><strong>Built on real-world experience</strong></p>" },
                  { type: "paragraph", text: "<p>Over fifteen years of workshop practice.</p>" },
                  { type: "paragraph", text: "<p>Supporting intro copy remains visible.</p>" },
                  { type: "paragraph", text: "" },
                ],
                image: { src: "", alt: "" },
              }),
              buildAboutSection({
                id: "why",
                title: "Why We Created HFZWood",
                blocks: [{ type: "paragraph", text: "<p>Why copy.</p>" }],
              }),
              buildAboutSection({
                id: "who",
                title: "Who It Is For",
                blocks: [{ type: "paragraph", text: "<p>Who copy.</p>" }],
              }),
              buildAboutSection({
                id: "more",
                title: "More Than a Calculator",
                blocks: [{ type: "paragraph", text: "<p>More copy.</p>" }],
              }),
              buildAboutSection({
                id: "philosophy",
                title: "Our Philosophy",
                blocks: [{ type: "paragraph", text: "<p>Philosophy copy.</p>" }],
              }),
            ],
          }),
        },
      });
      renderWorkspace(ROUTES.ABOUT);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", {
            name: "More than just an epoxy resin calculator",
            level: 2,
          }),
        ).toHaveClass("public-about__proposition");
      });

      const experience = document.querySelector(".public-about__experience");
      expect(experience).not.toBeNull();
      expect(within(experience).getByText("Built on real-world experience")).toBeInTheDocument();
      expect(within(experience).getByText("Over fifteen years of workshop practice.")).toBeInTheDocument();
      expect(within(experience).queryByText("Supporting intro copy remains visible.")).not.toBeInTheDocument();
      expect(screen.getByText("Supporting intro copy remains visible.")).toBeInTheDocument();

      const clusters = document.querySelectorAll(".public-about__cluster");
      expect(clusters).toHaveLength(2);
      expect(clusters[0]).toHaveClass("public-about__cluster--ivory");
      expect(clusters[1]).toHaveClass("public-about__cluster--green");
      expect(within(clusters[0]).getByRole("heading", { name: "Why We Created HFZWood" })).toBeInTheDocument();
      expect(within(clusters[0]).getByRole("heading", { name: "Who It Is For" })).toBeInTheDocument();
      expect(within(clusters[1]).getByRole("heading", { name: "More Than a Calculator" })).toBeInTheDocument();
      expect(within(clusters[1]).getByRole("heading", { name: "Our Philosophy" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
    });
  });

  describe("Pricing", () => {
    it("uses the validated pricing grid breakpoints and tablet 2+1 placement", () => {
      const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../styles.css"), "utf8");
      expect(css).toContain("@media (min-width: 768px) and (max-width: 1023px)");
      expect(css).toContain("min(1040px, calc(100vw - 32px))");
      expect(css).toContain("grid-column: 1 / 3");
      expect(css).toContain("grid-column: 3 / 5");
      expect(css).toContain("grid-column: 2 / 4");
      expect(css).not.toContain("@media (min-width: 768px) and (max-width: 1050px)");
      expect(css).toMatch(
        /\.public-website-page\[data-page-key="pricing"\] \.public-website-page__title\s*\{[^}]*font-weight:\s*400;/,
      );
    });

    it("renders offers in fixed free/monthly/annual order and omits hidden offers", async () => {
      expect(
        orderVisiblePricingOffers([
          buildPricingOffer("annual"),
          buildPricingOffer("free"),
          buildPricingOffer("monthly", { visible: false }),
        ]).map((offer) => offer.id),
      ).toEqual(["free", "annual"]);

      mockPublishedWebsiteFetch({
        pages: {
          pricing: buildPublishedPricingResponse({
            publicTitle: "Pricing Once",
            offers: [
              buildPricingOffer("annual", {
                title: "Annual",
                displayedPriceText: "$89.99",
                benefits: ["Complete subscriber access"],
                ctaLabel: "Ignored CMS label",
                ctaDestination: "https://example.com/annual",
              }),
              buildPricingOffer("free", {
                title: "Free",
                benefits: ["Basic tools"],
                ctaLabel: "Ignored free label",
                ctaDestination: "/manual",
              }),
              buildPricingOffer("monthly", {
                visible: false,
                title: "Hidden Monthly",
                benefits: ["Should not render"],
              }),
            ],
          }),
        },
      });
      renderWorkspace(ROUTES.PRICING);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Pricing Once", level: 1 })).toBeInTheDocument();
      });

      expect(screen.getAllByRole("heading", { name: "Pricing Once", level: 1 })).toHaveLength(1);
      expect(screen.queryByText("Hidden Monthly")).not.toBeInTheDocument();

      const cards = screen.getAllByRole("article").filter((node) => node.dataset.offerId);
      expect(cards.map((card) => card.dataset.offerId)).toEqual(["free", "annual"]);

      const freeCard = cards[0];
      expect(within(freeCard).getByRole("list")).toBeInTheDocument();
      expect(within(freeCard).getByText("Basic tools")).toBeInTheDocument();
      expect(within(freeCard).getByRole("link", { name: "Start Free" })).toHaveAttribute("href", "/register");

      const annualLink = within(cards[1]).getByRole("link", { name: "Choose annual plan" });
      expect(annualLink).toHaveAttribute("href", "/account");
      expect(annualLink).not.toHaveAttribute("target");
      expect(within(cards[1]).getByText("Save $29.89 (25%)")).toBeInTheDocument();
      expect(screen.queryByText(/lifetime|perpetual/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/stripe/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/entitlement/i)).not.toBeInTheDocument();
    });

    it("shows empty offer area when all offers are hidden", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          pricing: buildPublishedPricingResponse({
            publicTitle: "All Hidden Pricing",
            intro: "Still show intro",
            offers: [
              buildPricingOffer("free", {
                visible: false,
                title: "Free hidden",
              }),
              buildPricingOffer("monthly", {
                visible: false,
                title: "Monthly hidden",
              }),
              buildPricingOffer("annual", {
                visible: false,
                title: "Annual hidden",
              }),
            ],
          }),
        },
      });
      renderWorkspace(ROUTES.PRICING);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "All Hidden Pricing", level: 1 })).toBeInTheDocument();
      });
      expect(screen.getByText("Still show intro")).toBeInTheDocument();
      expect(screen.queryByText("Free hidden")).not.toBeInTheDocument();
      expect(document.querySelector(".public-pricing__grid")).toBeNull();
      expect(document.querySelector('[data-offers-empty="true"]')).toBeInTheDocument();
      expect(document.querySelector("form")).toBeNull();
    });

    it("shows the 3-month explainer after the page heading and before the pricing cards", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          pricing: buildPublishedPricingResponse({
            publicTitle: "Choose the plan that fits your work style",
            intro: "",
            offers: [
              buildPricingOffer("free", { title: "Free", displayedPriceText: "$0" }),
              buildPricingOffer("monthly", { title: "Monthly", displayedPriceText: "$9.99" }),
              buildPricingOffer("annual", { title: "Annual", displayedPriceText: "$89.99" }),
            ],
          }),
        },
      });
      renderWorkspace(ROUTES.PRICING);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Free", level: 2 })).toBeInTheDocument();
      });

      const heading = screen.getByRole("heading", {
        name: "Choose the plan that fits your work style",
        level: 1,
      });
      const explainer = screen.getByText("You have full access to HFZWood free for 3 months.");
      const cards = screen.getAllByRole("article").filter((node) => node.dataset.offerId);
      expect(cards.map((card) => card.dataset.offerId)).toEqual(["free", "monthly", "annual"]);
      expect(within(cards[0]).getByText("$0")).toBeInTheDocument();
      expect(within(cards[1]).getByText("$9.99")).toBeInTheDocument();
      expect(within(cards[2]).getByText("$89.99")).toBeInTheDocument();
      expect(heading.compareDocumentPosition(explainer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(
        explainer.compareDocumentPosition(cards[0]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        screen.queryByText(
          "Monthly and Annual include the same functionality; only the billing period and price differ.",
        ),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/upgrade later/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/upgrade any time/i)).not.toBeInTheDocument();
      expect(screen.getByText("Paid plans remain available.")).toBeInTheDocument();
    });

    it("does not present contradictory upgrade-now copy in published EN/RO/FR/DE Pricing content", () => {
      const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../");
      const corpora = ["backend/public/content/published/website", "backend/private/content/published/website"];
      for (const corpus of corpora) {
        for (const locale of ["en", "ro", "fr", "de"]) {
          const pages = JSON.parse(
            readFileSync(join(repoRoot, corpus, locale, "pages.json"), "utf8"),
          );
          const intro = String(pages.pages?.pricing?.body?.intro ?? pages.pricing?.body?.intro ?? "");
          const footnote = String(
            pages.pages?.pricing?.body?.footnote ?? pages.pricing?.body?.footnote ?? "",
          );
          const haystack = `${intro} ${footnote}`.toLowerCase();
          expect(haystack, `${corpus} ${locale}`).not.toMatch(/upgrade later/);
          expect(haystack, `${corpus} ${locale}`).not.toMatch(/upgrade to a higher plan/);
          expect(haystack, `${corpus} ${locale}`).not.toMatch(/trece ulterior la acces complet/);
          expect(haystack, `${corpus} ${locale}`).not.toMatch(/trece la un plan superior/);
          expect(haystack, `${corpus} ${locale}`).not.toMatch(/passez à l’accès abonné/);
          expect(haystack, `${corpus} ${locale}`).not.toMatch(/passer à une formule supérieure/);
          expect(haystack, `${corpus} ${locale}`).not.toMatch(/später auf den vollen abonnenten-zugang/);
          expect(haystack, `${corpus} ${locale}`).not.toMatch(/auf einen höheren tarif umsteigen/);
          if (locale === "en" || locale === "ro" || locale === "de") {
            expect(intro.trim(), `${corpus} ${locale} intro`).toBe("");
            expect(haystack, `${corpus} ${locale}`).not.toMatch(
              /monthly and annual include the same functionality/,
            );
            expect(haystack, `${corpus} ${locale}`).not.toMatch(
              /planul lunar .* planul anual includ aceeași funcționalitate/,
            );
            expect(haystack, `${corpus} ${locale}`).not.toMatch(
              /monats- und der jahresplan umfassen denselben funktionsumfang/,
            );
          }
        }
      }
    });

    it("uses approved CTA labels and routes for all three offers", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          pricing: buildPublishedPricingResponse({
            offers: [
              buildPricingOffer("free", {
                title: "Free plan",
                benefits: ["Up to 4 points per polygon — ideal for simple project shapes."],
              }),
              buildPricingOffer("monthly", { title: "Monthly plan", displayedPriceText: "$9.99" }),
              buildPricingOffer("annual", { title: "Annual plan", displayedPriceText: "$89.99" }),
            ],
          }),
        },
      });
      renderWorkspace(ROUTES.PRICING);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Free plan", level: 2 })).toBeInTheDocument();
      });
      expect(screen.getByRole("link", { name: "Start Free" })).toHaveAttribute("href", "/register");
      expect(screen.getByRole("link", { name: "Choose monthly plan" })).toHaveAttribute("href", "/account");
      expect(screen.getByRole("link", { name: "Choose annual plan" })).toHaveAttribute("href", "/account");
      expect(screen.getByText("Up to 4 points per polygon — ideal for simple project shapes.")).toBeInTheDocument();
      expect(screen.getByText("Equivalent to $7.50 / month")).toBeInTheDocument();
      expect(document.querySelector('[data-offer-id="free"]')).toHaveClass("public-pricing__card--free");
      expect(document.querySelector('[data-offer-id="monthly"]')).toHaveClass("public-pricing__card--monthly");
      expect(document.querySelector('[data-offer-id="annual"]')).toHaveClass("public-pricing__card--annual");
      expect(screen.getByRole("link", { name: "Start Free" })).toHaveClass(
        "public-pricing__cta--secondary",
      );
      expect(screen.getAllByRole("link").filter((link) => link.classList.contains("public-pricing__cta"))).toHaveLength(
        3,
      );
    });

    it("renders the verified Free Preview and subscriber capability claims", async () => {
      const subscriberBenefits = [
        "Complete access to HFZWood tools and resources.",
        "Unlimited polygon points and complex-project tools.",
        "PDF export and pour-layer planning.",
        "Full access to the Glossary and Knowledge Base.",
      ];
      mockPublishedWebsiteFetch({
        pages: {
          pricing: buildPublishedPricingResponse({
            offers: [
              buildPricingOffer("free", {
                benefits: [
                  "Up to 4 points per polygon — ideal for simple project shapes.",
                  "Save and reopen your projects on your device.",
                  "Full access to the Manual and all video tutorials.",
                  "Access to the curated free Glossary and Knowledge Base selection.",
                ],
              }),
              buildPricingOffer("monthly", { benefits: subscriberBenefits }),
              buildPricingOffer("annual", { benefits: subscriberBenefits }),
            ],
          }),
        },
      });
      renderWorkspace(ROUTES.PRICING);

      await waitFor(() => {
        expect(screen.getByText("Full access to the Manual and all video tutorials.")).toBeInTheDocument();
      });
      expect(screen.getByText("Up to 4 points per polygon — ideal for simple project shapes.")).toBeInTheDocument();
      expect(screen.getByText("Access to the curated free Glossary and Knowledge Base selection.")).toBeInTheDocument();
      expect(screen.getAllByText("Full access to the Glossary and Knowledge Base.")).toHaveLength(2);
      expect(screen.getAllByText("Complete access to HFZWood tools and resources.")).toHaveLength(2);
      expect(screen.queryByText(/CSV/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/up to 3 projects/i)).not.toBeInTheDocument();
    });
  });

  describe("Privacy and Terms", () => {
    it.each([
      {
        path: ROUTES.PRIVACY,
        pageKey: "privacy",
        title: "Privacy Policy Once",
      },
      {
        path: ROUTES.TERMS,
        pageKey: "terms",
        title: "Terms Once",
      },
    ])("renders authored $pageKey sections without generated Section N labels", async ({ path, pageKey, title }) => {
      mockPublishedWebsiteFetch({
        pages: {
          [pageKey]: buildPublishedDocumentResponse(pageKey, {
            publicTitle: title,
            sections: [
              buildDocumentSection({
                id: "a",
                title: "Authored first",
                blocks: [{ type: "paragraph", text: "<p>First clause</p>" }],
              }),
              buildDocumentSection({
                id: "b",
                title: "Authored second",
                blocks: [{ type: "paragraph", text: "<p>Second clause</p>" }],
              }),
            ],
          }),
        },
      });
      renderWorkspace(path);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: title, level: 1 })).toBeInTheDocument();
      });
      expect(screen.getAllByRole("heading", { name: title, level: 1 })).toHaveLength(1);
      expect(screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent)).toEqual([
        "Authored first",
        "Authored second",
      ]);
      expect(screen.queryByText(/Section 1/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Section 2/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/jurisdiction/i)).not.toBeInTheDocument();
      expect(screen.getByText("First clause")).toBeInTheDocument();
      expect(screen.getByText("Second clause")).toBeInTheDocument();
    });
  });

  describe("Contact", () => {
    it("renders mailto, built-in links, and additional links with visibility rules", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          contact: buildPublishedContactResponse({
            publicTitle: "Contact Once",
            supportEmail: "help@hfzwood.test",
            showManualLink: true,
            showKnowledgeBaseLink: true,
            manualLinkLabel: "Open Manual",
            knowledgeBaseLinkLabel: "Open KB",
            links: [
              { label: "Internal help", url: "/about", visible: true },
              { label: "External help", url: "https://example.com/help", visible: true },
              { label: "Hidden link", url: "/pricing", visible: false },
              { label: "", url: "/terms", visible: true },
              { label: "Empty url", url: "", visible: true },
              { label: "Bad protocol", url: "javascript:alert(1)", visible: true },
            ],
          }),
        },
      });
      renderWorkspace(ROUTES.CONTACT);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Contact Once", level: 1 })).toBeInTheDocument();
      });

      expect(screen.getAllByRole("heading", { name: "Contact Once", level: 1 })).toHaveLength(1);
      expect(screen.getByRole("link", { name: "help@hfzwood.test" })).toHaveAttribute(
        "href",
        "mailto:help@hfzwood.test",
      );
      expect(screen.getByRole("link", { name: "Open Manual" })).toHaveAttribute("href", "/manual");
      expect(screen.getByRole("link", { name: "Open KB" })).toHaveAttribute("href", "/knowledge-base");
      expect(screen.getByRole("link", { name: "Internal help" })).toHaveAttribute("href", "/about");
      const external = screen.getByRole("link", { name: "External help" });
      expect(external).toHaveAttribute("href", "https://example.com/help");
      expect(external).toHaveAttribute("rel", "noopener noreferrer");
      expect(screen.queryByRole("link", { name: "Hidden link" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Empty url" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Bad protocol" })).not.toBeInTheDocument();
      expect(document.querySelector("form")).toBeNull();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /submit|send/i })).not.toBeInTheDocument();
    });

    it("places direct contact after the lead and groups published help and feedback copy", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          contact: buildPublishedContactResponse({
            publicTitle: "We're here if you need help",
            intro: [
              "We're here if you need help",
              "If you have questions about the app, contact us using the information below.",
              "",
              "Before you contact us",
              "The answer may already be in the app.",
              "Glossary explanations are mentioned in this published text.",
              "",
              "Feedback",
              "User ideas help improve HFZWood.",
              "",
              "Thank you for choosing HFZWood.",
            ].join("\n"),
            supportEmail: "hefzech@gmail.com",
            showManualLink: true,
            showKnowledgeBaseLink: true,
            manualLinkLabel: "Manual and tutorials",
            knowledgeBaseLinkLabel: "Knowledge Base",
            links: [],
          }),
        },
      });
      renderWorkspace(ROUTES.CONTACT);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "We're here if you need help", level: 1 }),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText("If you have questions about the app, contact us using the information below."),
      ).toHaveClass("public-contact__lead");
      const direct = document.querySelector(".public-contact__direct");
      expect(direct).not.toBeNull();
      expect(within(direct).getByRole("heading", { name: "Write to us", level: 2 })).toBeInTheDocument();
      expect(within(direct).getByRole("link", { name: "hefzech@gmail.com" })).toHaveAttribute(
        "href",
        "mailto:hefzech@gmail.com",
      );
      expect(
        screen.getByRole("heading", { name: "Before you contact us", level: 2 }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Glossary explanations are mentioned/i)).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /glossary/i })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Manual and tutorials" })).toHaveAttribute("href", "/manual");
      expect(screen.getByRole("link", { name: "Knowledge Base" })).toHaveAttribute(
        "href",
        "/knowledge-base",
      );
      expect(screen.getByRole("heading", { name: "Feedback", level: 3 })).toBeInTheDocument();
      expect(screen.getByText("Thank you for choosing HFZWood.")).toBeInTheDocument();
    });

    it("hides built-in Manual and Knowledge Base links when visibility is false", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          contact: buildPublishedContactResponse({
            showManualLink: false,
            showKnowledgeBaseLink: false,
            manualLinkLabel: "Manual hidden",
            knowledgeBaseLinkLabel: "KB hidden",
            supportEmail: "",
            links: [],
          }),
        },
      });
      renderWorkspace(ROUTES.CONTACT);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Contact", level: 1 })).toBeInTheDocument();
      });
      expect(screen.queryByRole("link", { name: "Manual hidden" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "KB hidden" })).not.toBeInTheDocument();
    });

    it("hides Community icons when official links are empty", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          contact: buildPublishedContactResponse({
            officialLinks: {
              website: "",
              youtube: "",
              facebook: "",
              instagram: "",
              tiktok: "",
              linkedin: "",
            },
          }),
        },
      });
      renderWorkspace(ROUTES.CONTACT);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Contact", level: 1 })).toBeInTheDocument();
      });
      expect(screen.queryByRole("heading", { name: "Community", level: 2 })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "YouTube" })).not.toBeInTheDocument();
    });

    it("renders a single official YouTube icon for the launch scenario", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          contact: buildPublishedContactResponse({
            showManualLink: false,
            showKnowledgeBaseLink: false,
            supportEmail: "",
            links: [],
            officialLinks: {
              youtube: "https://www.youtube.com/@hfzwood",
            },
          }),
        },
      });
      renderWorkspace(ROUTES.CONTACT);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Community", level: 2 })).toBeInTheDocument();
      });
      expect(
        screen.getByText(/Follow the official HFZWood channels for tutorials/i),
      ).toBeInTheDocument();
      const youtube = screen.getByRole("link", { name: "YouTube" });
      expect(youtube).toHaveAttribute("href", "https://www.youtube.com/@hfzwood");
      expect(youtube).toHaveAttribute("target", "_blank");
      expect(youtube).toHaveAttribute("rel", "noopener noreferrer");
      expect(youtube).toHaveAttribute("data-official-link", "youtube");
      expect(screen.queryByRole("link", { name: "Website" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Facebook" })).not.toBeInTheDocument();
    });

    it("renders official community icons in fixed channel order", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          contact: buildPublishedContactResponse({
            officialLinks: {
              linkedin: "https://www.linkedin.com/company/hfzwood",
              tiktok: "https://www.tiktok.com/@hfzwood",
              instagram: "https://www.instagram.com/hfzwood",
              facebook: "https://www.facebook.com/hfzwood",
              youtube: "https://www.youtube.com/@hfzwood",
              website: "https://hfzwood.com",
            },
          }),
        },
      });
      renderWorkspace(ROUTES.CONTACT);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Community", level: 2 })).toBeInTheDocument();
      });

      const icons = Array.from(document.querySelectorAll("[data-official-link]")).map((node) =>
        node.getAttribute("data-official-link"),
      );
      expect(icons).toEqual([
        "website",
        "youtube",
        "facebook",
        "instagram",
        "tiktok",
        "linkedin",
      ]);

      for (const label of ["Website", "YouTube", "Facebook", "Instagram", "TikTok", "LinkedIn"]) {
        const link = screen.getByRole("link", { name: label });
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
    });
  });

  describe("shared states and access", () => {
    it("shows loading then ready content without inventing copy", async () => {
      let resolveFetch;
      const deferred = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url) => {
          if (String(url).includes("/api/content/website/about")) {
            await deferred;
            return {
              ok: true,
              status: 200,
              json: async () =>
                buildPublishedAboutResponse({
                  publicTitle: "Loaded About",
                  sections: [],
                }),
            };
          }
          return { ok: false, status: 404, json: async () => ({}) };
        }),
      );

      renderWorkspace(ROUTES.ABOUT);
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();

      resolveFetch();
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Loaded About", level: 1 })).toBeInTheDocument();
      });
    });

    it("uses ContentUnavailableMessage with English action when englishAvailable", async () => {
      mockPublishedWebsiteFetch({ unavailableKeys: ["contact"] });
      renderWorkspace(ROUTES.CONTACT);

      await waitFor(() => {
        expect(
          screen.getByText(/This page is not yet available in the selected language/i),
        ).toBeInTheDocument();
      });
      const englishButton = screen.getByRole("button", { name: "View English version" });
      expect(englishButton).toBeInTheDocument();
      await userEvent.click(englishButton);
      expectSingleFooter();
    });

    it("uses safe unavailable UI on API error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: false,
          status: 500,
          json: async () => ({ detail: "boom" }),
        })),
      );
      renderWorkspace(ROUTES.PRIVACY);

      await waitFor(() => {
        expect(
          screen.getByText(/This page is not yet available in the selected language/i),
        ).toBeInTheDocument();
      });
      expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    });

    it("remains accessible to guests and authenticated users", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          about: buildPublishedAboutResponse({ publicTitle: "Guest About" }),
        },
      });
      renderWorkspace(ROUTES.ABOUT);
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Guest About", level: 1 })).toBeInTheDocument();
      });
      expect(screen.queryByText(/Create your free HFZWood account to unlock this section/i)).not.toBeInTheDocument();

      cleanup();
      seedAuthenticatedSession();
      mockPublishedWebsiteFetch({
        pages: {
          about: buildPublishedAboutResponse({ publicTitle: "Auth About" }),
        },
      });
      renderWorkspace(ROUTES.ABOUT);
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Auth About", level: 1 })).toBeInTheDocument();
      });
      expect(screen.queryByText(/Create your free HFZWood account to unlock this section/i)).not.toBeInTheDocument();
      expect(screen.getByRole("article", { name: "About HFZWood" })).toBeInTheDocument();
    });
  });
});
