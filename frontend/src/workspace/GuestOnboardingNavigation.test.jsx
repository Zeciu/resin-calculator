import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_ROUTES } from "../admin/adminRoutes.js";
import { mockPublishedKnowledgeBaseFetch } from "../knowledgeBase/knowledgeBaseTestHelpers.js";
import {
  buildPublishedHomeResponse,
  buildPublishedPricingResponse,
  buildPricingOffer,
  mockPublishedWebsiteFetch,
} from "../website/websiteTestHelpers.js";
import { getLoggedInHomeNavItems, WORKSPACE_NAV_ITEMS } from "./navigation.js";
import { ROUTES } from "./routes.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";

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

function getSidebar() {
  return screen.getByRole("navigation", { name: "Workspace navigation" });
}

describe("Guest onboarding and Home navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
    mockPublishedWebsiteFetch();
    mockPublishedKnowledgeBaseFetch();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("lets guests land on public Home without redirecting to Login", async () => {
    const { router } = renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(screen.queryByRole("heading", { name: /Log in to HFZWood/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/The first platform that gives woodworkers and resin enthusiasts/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ready to try HFZWood?", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Free Account" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "Already have an account? Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("keeps onboarding on CMS Home for guests and hides it when authenticated", async () => {
    mockPublishedWebsiteFetch({
      pages: {
        home: buildPublishedHomeResponse({
          publicTitle: "CMS Onboarding Home",
          description: "CMS body",
        }),
      },
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "CMS Onboarding Home", level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Ready to try HFZWood?", level: 2 })).toBeInTheDocument();

    cleanup();
    seedAuthenticatedSession();
    mockPublishedWebsiteFetch({
      pages: {
        home: buildPublishedHomeResponse({
          publicTitle: "CMS Auth Home",
          description: "Auth body",
        }),
      },
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "CMS Auth Home", level: 1 })).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "Ready to try HFZWood?", level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create Free Account" })).not.toBeInTheDocument();
  });

  it("shows locked protected modules and intentional auth CTA for guests", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.HOME);
    const sidebar = getSidebar();

    const expectedOrder = [
      "Home",
      "New Project",
      "Projects",
      "Manual & Tutorials",
      "Glossary",
      "Knowledge Base",
      "Login / Register",
      "My Account",
    ];
    const labels = within(sidebar)
      .getAllByRole("listitem")
      .map((item) => item.textContent.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    expect(labels.slice(0, expectedOrder.length)).toEqual(expectedOrder);

    expect(within(sidebar).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(sidebar).getAllByLabelText("Locked feature")).toHaveLength(
      WORKSPACE_NAV_ITEMS.filter((item) => item.requiresAuth).length,
    );

    for (const label of [
      "New Project",
      "Projects",
      "Manual & Tutorials",
      "Glossary",
      "Knowledge Base",
      "My Account",
    ]) {
      await user.click(within(sidebar).getByRole("button", { name: new RegExp(label, "i") }));
      expect(
        screen.getByText(/Create your free HFZWood account to unlock this section/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Go to Login \/ Register/i })).toHaveAttribute(
        "href",
        "/login",
      );
    }
  });

  it("keeps authenticated Home first and navigable from My Account and Preferences", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    const homeItems = getLoggedInHomeNavItems();
    expect(homeItems.map((item) => item.id)).toEqual([
      "home",
      "new-project",
      "projects",
      "manual-tutorials",
      "glossary",
      "knowledge-base",
      "my-account",
    ]);
    expect(homeItems.filter((item) => item.id === "home")).toHaveLength(1);

    const sidebar = getSidebar();
    const homeLink = within(sidebar).getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveAttribute("aria-current", "page");
    expect(within(sidebar).queryAllByRole("link", { name: "Home" })).toHaveLength(1);

    await user.click(within(sidebar).getByRole("link", { name: "My Account" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "My Account", level: 2 })).toBeInTheDocument();
    });
    await user.click(within(getSidebar()).getByRole("link", { name: "Home" }));
    await waitFor(() => {
      expect(within(getSidebar()).getByRole("link", { name: "Home" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    await user.click(within(getSidebar()).getByRole("link", { name: "My Account" }));
    await user.click(screen.getByRole("link", { name: "Application Preferences" }));
    await waitFor(() => {
      expect(within(getSidebar()).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    });
    await user.click(within(getSidebar()).getByRole("link", { name: "Home" }));
    await waitFor(() => {
      expect(within(getSidebar()).getByRole("link", { name: "Home" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });
  });

  it("keeps Pricing CTA destinations and auth access unchanged", async () => {
    mockPublishedWebsiteFetch({
      pages: {
        pricing: buildPublishedPricingResponse({
          offers: [
            buildPricingOffer("free"),
            buildPricingOffer("subscriber"),
            buildPricingOffer("lifetime"),
          ],
        }),
      },
    });
    renderWorkspace(ROUTES.PRICING);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Start Free" })).toHaveAttribute("href", "/register");
    });
    expect(screen.getByRole("link", { name: "Subscribe" })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: "Buy Lifetime" })).toHaveAttribute("href", "/account");
  });

  it("keeps Admin navigation unaffected", async () => {
    seedAuthenticatedSession({ role: "administrator" });
    renderWorkspace(ADMIN_ROUTES.ROOT);

    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Administration navigation" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
  });
});
