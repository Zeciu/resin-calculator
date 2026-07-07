import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPublishedManualFetch } from "../manual/manualTestHelpers.js";
import { WORKSPACE_NAV_ITEMS } from "./navigation.js";
import { ROUTES } from "./routes.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";

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

function expectNoHomeHubSidebar() {
  expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
}

describe("Workspace navigation matrix — guest", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("shows workspace navigation and keeps protected modules locked", async () => {
    const user = userEvent.setup();
    renderWorkspace("/");

    for (const item of WORKSPACE_NAV_ITEMS) {
      if (item.requiresAuth) {
        expect(
          screen.getByRole("button", { name: new RegExp(item.label, "i") }),
        ).toBeInTheDocument();
      } else {
        expect(screen.getByRole("link", { name: item.label })).toBeInTheDocument();
      }
    }

    // Guest still has direct access to Login / Register.
    expect(screen.getByRole("link", { name: "Login / Register" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /New Project/i }));
    expect(
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
  });

  it("blocks direct /new-project URL access with LockedModuleMessage in dedicated layout", () => {
    renderWorkspace("/new-project");

    expectNoHomeHubSidebar();
    expect(screen.getByRole("banner", { name: "Module header" })).toBeInTheDocument();
    expect(screen.getByText("New Project")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Module navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/River Table & Woodworking Resin Calculator/i),
    ).not.toBeInTheDocument();
  });
});

describe("Workspace navigation matrix — authenticated", () => {
  beforeEach(() => {
    sessionStorage.clear();
    seedAuthenticatedSession();
    vi.restoreAllMocks();
    mockPublishedManualFetch();
  });

  it("shows unlocked module navigation and emphasizes New Project on the Home hub", () => {
    renderWorkspace("/");

    const newProjectLink = screen.getByRole("link", { name: "New Project" });
    expect(newProjectLink).toBeInTheDocument();
    expect(newProjectLink).toHaveClass("workspace-sidebar__link--primary-action");
    expect(screen.queryByRole("button", { name: /New Project/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My Account" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log out/i })).toBeInTheDocument();
  });

  it("opens New Project in the dedicated module layout with Home navigation", async () => {
    const user = userEvent.setup();
    renderWorkspace("/");

    await user.click(screen.getByRole("link", { name: "New Project" }));

    expectNoHomeHubSidebar();
    expect(screen.getByRole("banner", { name: "Module header" })).toBeInTheDocument();
    expect(screen.getByText("New Project")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Module navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import Project/i })).toBeInTheDocument();
    expect(screen.getByText("References")).toBeInTheDocument();
    expect(
      screen.queryByText(/River Table & Woodworking Resin Calculator/i),
    ).not.toBeInTheDocument();
  });

  it("returns to the Home hub from New Project via Home navigation", async () => {
    const user = userEvent.setup();
    renderWorkspace("/new-project");

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome to HFZWood — your workspace for resin estimation/i),
    ).toBeInTheDocument();
  });

  it("navigates to other module routes from the Home hub sidebar", async () => {
    const user = userEvent.setup();
    renderWorkspace("/");

    await user.click(screen.getByRole("link", { name: "Projects" }));
    expect(screen.getByRole("button", { name: "Open Project" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Manual & Tutorials" }));
    expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Table of contents" })).toBeInTheDocument();
    });
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "Manual & Tutorials", level: 1 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Glossary" }));
    expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search glossary" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Alphabetical index" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "Glossary", level: 1 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Knowledge Base" }));
    expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search knowledge base" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "Knowledge Base", level: 1 }),
    ).toBeInTheDocument();
  });

  it("still shows My Account on non-home authenticated hub routes", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.ACCOUNT);

    expect(screen.getByRole("link", { name: "My Account" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "My Account" }));
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "My Account" }),
    ).toBeInTheDocument();
  });
});
