import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPublishedKnowledgeBaseFetch } from "../knowledgeBase/knowledgeBaseTestHelpers.js";
import { getLoggedInHomeNavItems, WORKSPACE_NAV_ITEMS } from "./navigation.js";
import { translate } from "../i18n/translate.js";
import { ROUTES } from "./routes.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { mockCapabilitiesFetch, seedDevicePreferences } from "../preferences/testHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const GUEST_LOCKED_NAV_ITEMS = WORKSPACE_NAV_ITEMS.filter(
  (item) => item.requiresAuth && item.id !== "my-account",
);
const HOME_HUB_NAV_ITEMS = getLoggedInHomeNavItems();

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

function expectProjectsHub() {
  const main = screen.getByRole("main");
  expect(within(main).getByRole("heading", { name: "Projects" })).toBeInTheDocument();
  expect(within(main).getByRole("button", { name: "Open Project" })).toBeInTheDocument();
}

function expectCalculatorRoute() {
  const main = screen.getByRole("main");
  expect(within(main).getByText("References")).toBeInTheDocument();
  expect(within(main).queryByRole("button", { name: /Import Project/i })).not.toBeInTheDocument();
  expect(
    within(main).queryByText(/River Table & Woodworking Resin Calculator/i),
  ).not.toBeInTheDocument();
}

describe("Authenticated Mode navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    mockPublishedKnowledgeBaseFetch();
  });

  it("keeps protected module items locked for guests", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.LOGIN);

    for (const item of GUEST_LOCKED_NAV_ITEMS) {
      const label = translate("en", item.labelKey);
      expect(
        screen.getByRole("button", { name: new RegExp(label, "i") }),
      ).toBeInTheDocument();
    }

    expect(screen.queryAllByLabelText("Locked feature")).toHaveLength(
      GUEST_LOCKED_NAV_ITEMS.length,
    );
    expect(screen.getByRole("link", { name: "Create Free Account" })).toHaveAttribute(
      "href",
      "/register",
    );

    await user.click(screen.getByRole("button", { name: /New Project/i }));
    expect(
      screen.getByRole("heading", { name: "Create your free HFZWood account to start a project." }),
    ).toBeInTheDocument();
  });

  it("unlocks protected module items for authenticated users without lock icons", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    for (const item of HOME_HUB_NAV_ITEMS) {
      const label = translate("en", item.labelKey);
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: new RegExp(label, "i") }),
      ).not.toBeInTheDocument();
    }

    expect(screen.queryAllByLabelText("Locked feature")).toHaveLength(0);
    expect(screen.queryByRole("link", { name: "Create Free Account" })).not.toBeInTheDocument();
    const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
    const demoCta = within(sidebar).getByRole("link", { name: "Try a demo project" });
    expect(demoCta).toHaveAttribute("href", "/demo");
    expect(demoCta).toHaveAttribute("data-nav", "demo-project");
    expect(demoCta).toHaveClass("workspace-sidebar__link");
    expect(demoCta).not.toHaveClass("workspace-sidebar__link--primary-action");
    expect(demoCta).not.toHaveClass("guest-home-onboarding__demo");
    expect(demoCta).not.toHaveClass("guest-home-onboarding__primary");
    expect(screen.getByRole("link", { name: "New Project" })).toHaveClass(
      "workspace-sidebar__link--primary-action",
    );
    expect(within(sidebar).getByRole("button", { name: /Log out/i })).toBeInTheDocument();
  });

  it("shows guest register and login actions but no My Account control for guests", () => {
    renderWorkspace(ROUTES.LOGIN);
    expect(screen.getByRole("link", { name: "Create Free Account" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Already have an account? Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try a demo project" })).toHaveAttribute("href", "/demo");
    expect(screen.queryByRole("button", { name: /My Account/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My Account" })).not.toBeInTheDocument();
  });

  it("lets authenticated users navigate protected module routes from the sidebar", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    await user.click(screen.getByRole("link", { name: "New Project" }));
    expectCalculatorRoute();
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Projects" }));
    expectProjectsHub();
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();

    const dedicatedModules = [
      { label: "Manual & Tutorials", navName: "Table of contents" },
      { label: "Glossary", navName: "Alphabetical index" },
      { label: "Knowledge Base", searchName: "Search knowledge base" },
    ];

    for (const { label, navName, searchName } of dedicatedModules) {
      await user.click(screen.getByRole("link", { name: label }));
      expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
      if (navName) {
        await waitFor(() => {
          expect(screen.getByRole("navigation", { name: navName })).toBeInTheDocument();
        });
      }
      if (searchName) {
        expect(screen.getByRole("searchbox", { name: searchName })).toBeInTheDocument();
      }
      expect(
        within(screen.getByRole("main")).getByRole("heading", { name: label, level: 1 }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("link", { name: "Home" }));
      expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();
    }
  });

  it("places Try a demo project after Quick preferences and before Log out", async () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
    const preferences = await within(sidebar).findByRole("region", { name: "Quick preferences" });
    const demoCta = within(sidebar).getByRole("link", { name: "Try a demo project" });
    const logout = within(sidebar).getByRole("button", { name: /Log out/i });

    expect(preferences.compareDocumentPosition(demoCta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(demoCta.compareDocumentPosition(logout) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps Try a demo project before Log out on dedicated module pages", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.NEW_PROJECT);

    const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
    const demoCta = within(sidebar).getByRole("link", { name: "Try a demo project" });
    const logout = within(sidebar).getByRole("button", { name: /Log out/i });
    expect(demoCta.compareDocumentPosition(logout) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(sidebar).queryByRole("region", { name: "Quick preferences" })).not.toBeInTheDocument();
  });

  it("shows Try a demo project for authenticated Free users", () => {
    mockCapabilitiesFetch();
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
    expect(within(sidebar).getByRole("link", { name: "Try a demo project" })).toHaveAttribute(
      "href",
      "/demo",
    );
  });

  it("localizes the authenticated demo entry in Romanian", () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.HOME);

    const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
    expect(within(sidebar).getByRole("link", { name: "Încearcă un proiect demo" })).toHaveAttribute(
      "href",
      "/demo",
    );
    expect(within(sidebar).queryByRole("link", { name: "Try a demo project" })).not.toBeInTheDocument();
  });

  it("keeps sidebar Log out working after the demo entry is added", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    await user.click(
      within(screen.getByRole("navigation", { name: "Workspace navigation" })).getByRole(
        "button",
        { name: /Log out/i },
      ),
    );

    expect(screen.queryByRole("button", { name: /Log out/i })).not.toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(
      within(screen.getByRole("navigation", { name: "Workspace navigation" })).getByRole("link", {
        name: "Try a demo project",
      }),
    ).toHaveClass("guest-home-onboarding__demo");
  });
});
