import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_ROUTES } from "../../../private/admin/adminRoutes.js";
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

function stubNavBreakpoint(isNarrow) {
  window.matchMedia = vi.fn((query) => ({
    matches: String(query).includes("max-width: 767px") ? isNarrow : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("Guest onboarding and Home navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
    stubNavBreakpoint(false);
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
    const registerLinks = screen.getAllByRole("link", { name: "Create Free Account" });
    const loginLinks = screen.getAllByRole("link", { name: "Already have an account? Log in" });
    expect(registerLinks).toHaveLength(2);
    expect(loginLinks).toHaveLength(2);
    expect(registerLinks[0]).toHaveAttribute("href", "/register");
    expect(loginLinks[0]).toHaveAttribute("href", "/login");
    expect(registerLinks[1]).toHaveAttribute("href", "/register");
    expect(loginLinks[1]).toHaveAttribute("href", "/login");

    const layout = document.querySelector(".home-hub-layout");
    expect(layout.querySelector(".guest-home-onboarding--compact")).toBeNull();
    const sidebar = getSidebar();
    expect(within(sidebar).getByRole("link", { name: "Create Free Account" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(
      within(sidebar).getByRole("link", { name: "Already have an account? Log in" }),
    ).toHaveAttribute("href", "/login");
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
    expect(within(getSidebar()).getByRole("link", { name: "Create Free Account" })).toHaveAttribute(
      "href",
      "/register",
    );

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
    expect(within(getSidebar()).getByRole("link", { name: "Try a demo project" })).toHaveAttribute(
      "href",
      "/demo",
    );
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
      "Public Knowledge Preview",
    ];
    const labels = within(sidebar)
      .getAllByRole("listitem")
      .map((item) => item.textContent.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    expect(labels.slice(0, expectedOrder.length)).toEqual(expectedOrder);
    const demoCta = within(sidebar).getByRole("link", { name: "Try a demo project" });
    const languageSelect = await within(sidebar).findByRole("combobox", { name: "Language" });
    const registerCta = within(sidebar).getByRole("link", { name: "Create Free Account" });
    const loginCta = within(sidebar).getByRole("link", { name: "Already have an account? Log in" });
    expect(demoCta).toHaveAttribute("href", "/demo");
    expect(demoCta).toHaveAttribute("data-nav", "demo-project");
    expect(demoCta).toHaveClass("guest-home-onboarding__demo");
    const previewCta = within(sidebar).getByRole("link", { name: "Public Knowledge Preview" });
    expect(previewCta).toHaveClass("workspace-sidebar__link--guest-explore");
    expect(previewCta).not.toHaveClass("guest-home-onboarding__primary");
    expect(within(sidebar).getByRole("link", { name: "Home" })).not.toHaveClass(
      "workspace-sidebar__link--guest-explore",
    );
    expect(within(demoCta).queryByLabelText("Locked feature")).not.toBeInTheDocument();
    expect(registerCta).toHaveAttribute("href", "/register");
    expect(registerCta).toHaveClass("guest-home-onboarding__primary");
    expect(demoCta).not.toHaveClass("guest-home-onboarding__primary");
    expect(previewCta).not.toHaveClass("guest-home-onboarding__demo");
    expect(loginCta).toHaveAttribute("href", "/login");
    expect(demoCta.compareDocumentPosition(languageSelect) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(languageSelect.compareDocumentPosition(registerCta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(registerCta.compareDocumentPosition(loginCta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(screen.getByRole("main")).queryByRole("link", { name: "Try a demo project" })).not.toBeInTheDocument();

    expect(within(sidebar).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(sidebar).getAllByLabelText("Locked feature")).toHaveLength(
      WORKSPACE_NAV_ITEMS.filter((item) => item.requiresAuth && item.id !== "my-account").length,
    );

    const lockedTitles = {
      "New Project": "Create your free HFZWood account to start a project.",
      Projects: "Create your free HFZWood account to access your projects.",
      "Manual & Tutorials": "Create your free HFZWood account to unlock the Manual and tutorials.",
      Glossary: "Create your free HFZWood account to explore the Glossary.",
      "Knowledge Base": "Create your free HFZWood account to explore the Knowledge Base.",
    };
    for (const label of Object.keys(lockedTitles)) {
      await user.click(within(sidebar).getByRole("button", { name: new RegExp(label, "i") }));
      const main = screen.getByRole("main");
      expect(within(main).getByRole("heading", { name: lockedTitles[label], level: 2 })).toBeInTheDocument();
      expect(within(main).getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
      expect(within(main).getByRole("link", { name: "Create Free Account" })).toHaveAttribute(
        "href",
        "/register",
      );
      expect(within(main).getByRole("link", { name: "View plans" })).toHaveAttribute("href", "/pricing");
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

  it("keeps Free, Monthly, and Annual CTA destinations aligned with pricing", async () => {
    mockPublishedWebsiteFetch({
      pages: {
        pricing: buildPublishedPricingResponse({
          offers: [
            buildPricingOffer("free"),
            buildPricingOffer("monthly"),
            buildPricingOffer("annual"),
          ],
        }),
      },
    });
    renderWorkspace(ROUTES.PRICING);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Start Free" })).toHaveAttribute("href", "/register");
    });
    expect(screen.getByRole("link", { name: "Choose monthly plan" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByRole("link", { name: "Choose annual plan" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.queryByRole("link", { name: /Lifetime/i })).not.toBeInTheDocument();
  });

  it("collapses guest workspace into a disclosure at narrow widths without hiding the CTA", async () => {
    const user = userEvent.setup();
    stubNavBreakpoint(true);
    renderWorkspace(ROUTES.HOME);
    const sidebar = getSidebar();
    const disclosure = sidebar.querySelector(".workspace-sidebar__disclosure");
    const summary = sidebar.querySelector(".workspace-sidebar__disclosure-summary");

    await waitFor(() => {
      expect(disclosure?.open).toBe(false);
      expect(within(sidebar).queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    });

    expect(summary).toHaveTextContent("HFZWood workspace");
    for (const name of [
      "New Project",
      "Projects",
      "Manual & Tutorials",
      "Glossary",
      "Knowledge Base",
    ]) {
      expect(summary).toHaveTextContent(name);
    }

    expect(within(sidebar).getByRole("link", { name: "Create Free Account" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(
      within(sidebar).getByRole("link", { name: "Already have an account? Log in" }),
    ).toHaveAttribute("href", "/login");
    const collapsedDemoCta = within(sidebar).getByRole("link", { name: "Try a demo project" });
    const languageSelect = await within(sidebar).findByRole("combobox", { name: "Language" });
    expect(collapsedDemoCta).toHaveAttribute("href", "/demo");
    expect(disclosure.contains(within(sidebar).getByRole("link", { name: "Create Free Account" }))).toBe(
      false,
    );
    expect(disclosure.contains(collapsedDemoCta)).toBe(false);
    expect(disclosure.contains(languageSelect)).toBe(false);
    expect(within(sidebar).queryByRole("button", { name: /New Project/i })).not.toBeInTheDocument();

    await user.click(summary);
    expect(disclosure?.open).toBe(true);
    expect(within(sidebar).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(sidebar).getByRole("button", { name: /New Project/i })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Create Free Account" })).toBeInTheDocument();
  });

  it("toggles the guest workspace disclosure with the keyboard", async () => {
    const user = userEvent.setup();
    stubNavBreakpoint(true);
    renderWorkspace(ROUTES.HOME);
    const sidebar = getSidebar();
    const disclosure = sidebar.querySelector(".workspace-sidebar__disclosure");
    const summary = sidebar.querySelector(".workspace-sidebar__disclosure-summary");

    await waitFor(() => {
      expect(disclosure?.open).toBe(false);
    });

    summary.focus();
    expect(summary).toHaveFocus();
    await user.click(summary);
    expect(disclosure?.open).toBe(true);
    expect(within(sidebar).getByRole("button", { name: /New Project/i })).toBeInTheDocument();
    await user.click(summary);
    expect(disclosure?.open).toBe(false);
    expect(within(sidebar).queryByRole("button", { name: /New Project/i })).not.toBeInTheDocument();
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
