import { act, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockCapabilitiesFetch, seedDevicePreferences } from "../preferences/testHelpers.js";
import { mockPublishedKnowledgeBaseFetch } from "../knowledgeBase/knowledgeBaseTestHelpers.js";
import {
  isAuthFlowPath,
  isWorkspaceNavItemActive,
  WORKSPACE_NAV_ITEMS,
} from "./navigation.js";
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

function getSidebar() {
  return screen.getByRole("navigation", { name: "Workspace navigation" });
}

function newProjectNavItem() {
  return WORKSPACE_NAV_ITEMS.find((item) => item.id === "new-project");
}

function loginNavItem() {
  return WORKSPACE_NAV_ITEMS.find((item) => item.id === "login-register");
}

describe("isWorkspaceNavItemActive", () => {
  it("marks Login active across the auth flow paths", () => {
    expect(isAuthFlowPath(ROUTES.LOGIN)).toBe(true);
    expect(isWorkspaceNavItemActive(loginNavItem(), ROUTES.LOGIN)).toBe(true);
    expect(isWorkspaceNavItemActive(loginNavItem(), ROUTES.REGISTER)).toBe(true);
    expect(isWorkspaceNavItemActive(loginNavItem(), ROUTES.PASSWORD_RECOVERY)).toBe(true);
    expect(isWorkspaceNavItemActive(loginNavItem(), ROUTES.HOME)).toBe(false);
  });

  it("marks New Project active only on its own route", () => {
    expect(isWorkspaceNavItemActive(newProjectNavItem(), ROUTES.NEW_PROJECT)).toBe(true);
    expect(isWorkspaceNavItemActive(newProjectNavItem(), ROUTES.HOME)).toBe(false);
    expect(isWorkspaceNavItemActive(newProjectNavItem(), ROUTES.LOGIN)).toBe(false);
    expect(isWorkspaceNavItemActive(newProjectNavItem(), ROUTES.PREFERENCES)).toBe(false);
  });
});

describe("Workspace navigation active state — auth and preferences flow", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    mockCapabilitiesFetch();
    mockPublishedKnowledgeBaseFetch();
    seedDevicePreferences({ interfaceLanguage: "en" });
  });

  it("highlights Login and not New Project on the Login route", () => {
    renderWorkspace(ROUTES.LOGIN);
    const sidebar = getSidebar();

    const loginLink = within(sidebar).getByRole("link", { name: "Login / Register" });
    expect(loginLink).toHaveClass("workspace-sidebar__link--active");
    expect(loginLink).toHaveAttribute("aria-current", "page");

    const newProjectButton = within(sidebar).getByRole("button", { name: /New Project/i });
    expect(newProjectButton).not.toHaveClass("workspace-sidebar__link--active");
    expect(newProjectButton).not.toHaveClass("workspace-sidebar__link--primary-action");
  });

  it("keeps Login highlighted on the Register route", () => {
    renderWorkspace(ROUTES.REGISTER);
    expect(
      within(getSidebar()).getByRole("link", { name: "Login / Register" }),
    ).toHaveClass("workspace-sidebar__link--active");
  });

  it("keeps Login highlighted on the Password Recovery route", () => {
    renderWorkspace(ROUTES.PASSWORD_RECOVERY);
    expect(
      within(getSidebar()).getByRole("link", { name: "Login / Register" }),
    ).toHaveClass("workspace-sidebar__link--active");
  });

  it("does not highlight New Project during the preferences step", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.PREFERENCES);
    const sidebar = getSidebar();

    const newProjectLink = within(sidebar).getByRole("link", { name: "New Project" });
    expect(newProjectLink).not.toHaveClass("workspace-sidebar__link--active");
    expect(newProjectLink).not.toHaveClass("workspace-sidebar__link--primary-action");

    const accountLink = within(sidebar).getByRole("link", { name: "My Account" });
    expect(accountLink).toHaveClass("workspace-sidebar__link--active");
  });

  it("restores New Project primary emphasis on Home after the preferences step", async () => {
    seedAuthenticatedSession();
    const { router } = renderWorkspace(ROUTES.PREFERENCES);
    expect(
      within(getSidebar()).getByRole("link", { name: "New Project" }),
    ).not.toHaveClass("workspace-sidebar__link--primary-action");

    await act(async () => {
      await router.navigate(ROUTES.HOME);
    });

    const newProjectLink = within(getSidebar()).getByRole("link", { name: "New Project" });
    expect(newProjectLink).toHaveClass("workspace-sidebar__link--primary-action");
    expect(newProjectLink).not.toHaveClass("workspace-sidebar__link--active");
  });

  it("leaves Projects inactive on Home while New Project is the primary home emphasis", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);
    const sidebar = getSidebar();

    expect(within(sidebar).getByRole("link", { name: "New Project" })).toHaveClass(
      "workspace-sidebar__link--primary-action",
    );
    expect(within(sidebar).getByRole("link", { name: "Projects" })).not.toHaveClass(
      "workspace-sidebar__link--active",
    );
    expect(within(sidebar).getByRole("link", { name: "My Account" })).not.toHaveClass(
      "workspace-sidebar__link--active",
    );
  });
});
