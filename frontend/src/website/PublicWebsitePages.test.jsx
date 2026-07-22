import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  });

  describe("Pricing", () => {
    it("renders offers in fixed free/subscriber/lifetime order and omits hidden offers", async () => {
      expect(
        orderVisiblePricingOffers([
          buildPricingOffer("lifetime"),
          buildPricingOffer("free"),
          buildPricingOffer("subscriber", { visible: false }),
        ]).map((offer) => offer.id),
      ).toEqual(["free", "lifetime"]);

      mockPublishedWebsiteFetch({
        pages: {
          pricing: buildPublishedPricingResponse({
            publicTitle: "Pricing Once",
            offers: [
              buildPricingOffer("lifetime", {
                title: "Lifetime",
                benefits: ["Forever access"],
                ctaLabel: "Ignored CMS label",
                ctaDestination: "https://example.com/lifetime",
              }),
              buildPricingOffer("free", {
                title: "Free",
                benefits: ["Basic tools"],
                ctaLabel: "Ignored free label",
                ctaDestination: "/manual",
              }),
              buildPricingOffer("subscriber", {
                visible: false,
                title: "Hidden Subscriber",
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
      expect(screen.queryByText("Hidden Subscriber")).not.toBeInTheDocument();

      const cards = screen.getAllByRole("article").filter((node) => node.dataset.offerId);
      expect(cards.map((card) => card.dataset.offerId)).toEqual(["free", "lifetime"]);

      const freeCard = cards[0];
      expect(within(freeCard).getByRole("list")).toBeInTheDocument();
      expect(within(freeCard).getByText("Basic tools")).toBeInTheDocument();
      expect(within(freeCard).getByRole("link", { name: "Start Free" })).toHaveAttribute("href", "/register");

      const lifetimeLink = within(cards[1]).getByRole("link", { name: "Buy Lifetime" });
      expect(lifetimeLink).toHaveAttribute("href", "/account");
      expect(lifetimeLink).not.toHaveAttribute("target");
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
              buildPricingOffer("subscriber", {
                visible: false,
                title: "Sub hidden",
              }),
              buildPricingOffer("lifetime", {
                visible: false,
                title: "Life hidden",
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

    it("uses approved CTA labels and routes for all three offers", async () => {
      mockPublishedWebsiteFetch({
        pages: {
          pricing: buildPublishedPricingResponse({
            offers: [
              buildPricingOffer("free", { title: "Free plan" }),
              buildPricingOffer("subscriber", { title: "Sub plan" }),
              buildPricingOffer("lifetime", { title: "Life plan" }),
            ],
          }),
        },
      });
      renderWorkspace(ROUTES.PRICING);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Free plan", level: 2 })).toBeInTheDocument();
      });
      expect(screen.getByRole("link", { name: "Start Free" })).toHaveAttribute("href", "/register");
      expect(screen.getByRole("link", { name: "Subscribe" })).toHaveAttribute("href", "/account");
      expect(screen.getByRole("link", { name: "Buy Lifetime" })).toHaveAttribute("href", "/account");
      expect(screen.getAllByRole("link").filter((link) => link.classList.contains("public-pricing__cta"))).toHaveLength(
        3,
      );
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
