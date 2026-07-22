import { cleanup, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_ROUTES } from "../admin/adminRoutes.js";
import { mockPublishedGlossaryFetch } from "../glossary/glossaryTestHelpers.js";
import { mockPublishedKnowledgeBaseFetch } from "../knowledgeBase/knowledgeBaseTestHelpers.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { WEBSITE_FOOTER_LINKS, WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";
import {
  buildPublishedAboutResponse,
  buildPublishedContactResponse,
  buildPublishedDocumentResponse,
  buildPublishedHomeResponse,
  buildPublishedPricingResponse,
  buildPricingOffer,
  mockPublishedWebsiteFetch,
} from "./websiteTestHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedAuthenticatedSession({ role = "user" } = {}) {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        id: "stub-user",
        email: "user@example.com",
        username: "user",
        role,
      },
    }),
  );
}

function expectExactFooterOnce() {
  const footers = screen.getAllByRole("contentinfo", { name: "Website footer" });
  expect(footers).toHaveLength(1);
  const links = within(footers[0]).getAllByRole("link");
  expect(links.map((link) => link.getAttribute("href"))).toEqual(
    WEBSITE_FOOTER_LINKS.map((item) => item.path),
  );
  expect(links.map((link) => link.textContent)).toEqual([
    "About HFZWood",
    "Pricing",
    "Privacy Policy",
    "Terms of Service",
    "Contact",
  ]);
  return footers[0];
}

describe("Public Website Stage 6E closure", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("keeps one footer with exact order on guest and authenticated Home", async () => {
    mockPublishedWebsiteFetch({
      pages: { home: buildPublishedHomeResponse({ publicTitle: "CMS Guest Home" }) },
    });
    renderWorkspace(ROUTES.HOME);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "CMS Guest Home", level: 1 })).toBeInTheDocument();
    });
    expectExactFooterOnce();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    cleanup();
    seedAuthenticatedSession();
    mockPublishedWebsiteFetch({
      pages: { home: buildPublishedHomeResponse({ publicTitle: "CMS Auth Home" }) },
    });
    renderWorkspace(ROUTES.HOME);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "CMS Auth Home", level: 1 })).toBeInTheDocument();
    });
    expectExactFooterOnce();
    expect(screen.getByText("CMS Home Description")).toBeInTheDocument();
  });

  it("keeps Home i18n fallback without unavailable messaging", async () => {
    mockPublishedWebsiteFetch({ unavailableKeys: ["home"] });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(
        screen.getByText(/The first platform that gives woodworkers and resin enthusiasts/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/This page is not yet available in the selected language/i),
    ).not.toBeInTheDocument();
    expectExactFooterOnce();
  });

  it.each([
    {
      path: ROUTES.ABOUT,
      pageKey: WEBSITE_PAGE_KEYS.ABOUT,
      response: buildPublishedAboutResponse({ publicTitle: "About Closure" }),
      title: "About Closure",
    },
    {
      path: ROUTES.PRICING,
      pageKey: WEBSITE_PAGE_KEYS.PRICING,
      response: buildPublishedPricingResponse({
        publicTitle: "Pricing Closure",
        offers: [
          buildPricingOffer("free", { title: "Free" }),
          buildPricingOffer("subscriber", { title: "Subscriber" }),
          buildPricingOffer("lifetime", { title: "Lifetime" }),
        ],
      }),
      title: "Pricing Closure",
    },
    {
      path: ROUTES.PRIVACY,
      pageKey: WEBSITE_PAGE_KEYS.PRIVACY,
      response: buildPublishedDocumentResponse("privacy", { publicTitle: "Privacy Closure" }),
      title: "Privacy Closure",
    },
    {
      path: ROUTES.TERMS,
      pageKey: WEBSITE_PAGE_KEYS.TERMS,
      response: buildPublishedDocumentResponse("terms", { publicTitle: "Terms Closure" }),
      title: "Terms Closure",
    },
    {
      path: ROUTES.CONTACT,
      pageKey: WEBSITE_PAGE_KEYS.CONTACT,
      response: buildPublishedContactResponse({ publicTitle: "Contact Closure" }),
      title: "Contact Closure",
    },
  ])("renders $pageKey once with a single h1 and footer for guests", async ({ path, pageKey, response, title }) => {
    mockPublishedWebsiteFetch({ pages: { [pageKey]: response } });
    renderWorkspace(path);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: title, level: 1 })).toBeInTheDocument();
    });
    expect(screen.getAllByRole("heading", { name: title, level: 1 })).toHaveLength(1);
    expectExactFooterOnce();
    expect(screen.queryByText(/Create your free HFZWood account to unlock this section/i)).not.toBeInTheDocument();
  });

  it("keeps authenticated access to public Website pages", async () => {
    seedAuthenticatedSession();
    mockPublishedWebsiteFetch({
      pages: {
        contact: buildPublishedContactResponse({ publicTitle: "Auth Contact" }),
      },
    });
    renderWorkspace(ROUTES.CONTACT);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Auth Contact", level: 1 })).toBeInTheDocument();
    });
    expectExactFooterOnce();
    expect(document.querySelector("form")).toBeNull();
  });

  it("does not show Website footer on My Account or Preferences", async () => {
    seedAuthenticatedSession();
    mockPublishedWebsiteFetch();
    renderWorkspace(ROUTES.ACCOUNT);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "My Account", level: 2 })).toBeInTheDocument();
    });
    expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();

    cleanup();
    seedAuthenticatedSession();
    mockPublishedWebsiteFetch();
    renderWorkspace(ROUTES.PREFERENCES);
    await waitFor(() => {
      expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();
    });
  });

  it("does not show Website footer on dedicated modules or Admin", async () => {
    seedAuthenticatedSession();
    mockPublishedWebsiteFetch();
    const { mockPublishedManualFetch } = await import("../manual/manualTestHelpers.js");
    mockPublishedManualFetch();

    renderWorkspace(ROUTES.NEW_PROJECT);
    expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();

    cleanup();
    seedAuthenticatedSession();
    mockPublishedWebsiteFetch();
    renderWorkspace(ROUTES.PROJECTS);
    await waitFor(() => {
      expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();
    });

    cleanup();
    seedAuthenticatedSession();
    mockPublishedWebsiteFetch();
    mockPublishedManualFetch();
    renderWorkspace(ROUTES.MANUAL);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Manual & Tutorials", level: 1 })).toBeInTheDocument();
    });
    expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();

    cleanup();
    seedAuthenticatedSession();
    mockPublishedGlossaryFetch();
    renderWorkspace(ROUTES.GLOSSARY);
    await waitFor(() => {
      expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();
    });

    cleanup();
    seedAuthenticatedSession();
    mockPublishedKnowledgeBaseFetch();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitFor(() => {
      expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();
    });

    cleanup();
    seedAuthenticatedSession({ role: "administrator" });
    renderWorkspace(ADMIN_ROUTES.ROOT);
    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Administration navigation" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();
  });

  it("keeps pricing all-hidden layout structural without inventing offers", async () => {
    mockPublishedWebsiteFetch({
      pages: {
        pricing: buildPublishedPricingResponse({
          publicTitle: "Empty Offers",
          intro: "Intro remains",
          footnote: "Footnote remains",
          offers: [
            buildPricingOffer("free", { visible: false }),
            buildPricingOffer("subscriber", { visible: false }),
            buildPricingOffer("lifetime", { visible: false }),
          ],
        }),
      },
    });
    renderWorkspace(ROUTES.PRICING);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Empty Offers", level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByText("Intro remains")).toBeInTheDocument();
    expect(screen.getByText("Footnote remains")).toBeInTheDocument();
    expect(document.querySelector(".public-pricing__grid")).toBeNull();
    expect(screen.getByRole("status")).toHaveAttribute("data-offers-empty", "true");
    expect(screen.queryByText(/recommended|stripe|subscribe now/i)).not.toBeInTheDocument();
  });
});
