import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { getLoggedInHomeNavItems, WORKSPACE_NAV_ITEMS } from "./navigation.js";
import { ROUTES } from "./routes.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const PROTECTED_NAV_ITEMS = WORKSPACE_NAV_ITEMS.filter((item) => item.requiresAuth);
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
  expect(within(main).getByRole("button", { name: /Import Project/i })).toBeInTheDocument();
  expect(within(main).getByText("References")).toBeInTheDocument();
  expect(
    within(main).queryByText(/River Table & Woodworking Resin Calculator/i),
  ).not.toBeInTheDocument();
}

describe("Authenticated Mode navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("keeps protected module items locked for guests", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.LOGIN);

    for (const item of PROTECTED_NAV_ITEMS) {
      expect(
        screen.getByRole("button", { name: new RegExp(item.label, "i") }),
      ).toBeInTheDocument();
    }

    expect(screen.getAllByLabelText("Locked feature")).toHaveLength(
      PROTECTED_NAV_ITEMS.length,
    );
    expect(screen.getByRole("link", { name: "Login / Register" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /New Project/i }));
    expect(
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
  });

  it("unlocks protected module items for authenticated users without lock icons", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    for (const item of HOME_HUB_NAV_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: new RegExp(item.label, "i") }),
      ).not.toBeInTheDocument();
    }

    expect(screen.queryAllByLabelText("Locked feature")).toHaveLength(0);
    expect(screen.queryByRole("link", { name: "Login / Register" })).not.toBeInTheDocument();
  });

  it("shows Login / Register and locked My Account for guests", () => {
    renderWorkspace(ROUTES.LOGIN);
    expect(screen.getByRole("link", { name: "Login / Register" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /My Account/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My Account" })).not.toBeInTheDocument();
  });

  it("lets authenticated users navigate protected module routes from the sidebar", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    await user.click(screen.getByRole("link", { name: "New Project" }));
    expectCalculatorRoute();
    expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Projects" }));
    expectProjectsHub();
    expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();

    const placeholderModules = [
      { label: "Manual & Tutorials", title: "Manual & Tutorials" },
      { label: "Glossary", title: "Glossary" },
      { label: "Knowledge Base", title: "Knowledge Base" },
    ];

    for (const { label, title } of placeholderModules) {
      await user.click(screen.getByRole("link", { name: label }));
      const main = screen.getByRole("main");
      expect(within(main).getByRole("heading", { name: title })).toBeInTheDocument();
    }
  });
});
