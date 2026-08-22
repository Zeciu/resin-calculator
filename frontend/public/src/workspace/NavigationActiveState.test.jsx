import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

const stylesSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../styles.css"),
  "utf8",
);

function knowledgePreviewNavItem() {
  return WORKSPACE_NAV_ITEMS.find((item) => item.id === "knowledge-preview");
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

  it("marks Public Knowledge Preview active on the landing and nested preview routes", () => {
    expect(isWorkspaceNavItemActive(knowledgePreviewNavItem(), ROUTES.KNOWLEDGE_PREVIEW)).toBe(true);
    expect(isWorkspaceNavItemActive(knowledgePreviewNavItem(), ROUTES.KNOWLEDGE_PREVIEW_MANUAL)).toBe(true);
    expect(isWorkspaceNavItemActive(knowledgePreviewNavItem(), ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY)).toBe(true);
    expect(isWorkspaceNavItemActive(knowledgePreviewNavItem(), ROUTES.HOME)).toBe(false);
    expect(isWorkspaceNavItemActive(knowledgePreviewNavItem(), ROUTES.MANUAL)).toBe(false);
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

    const loginLink = within(sidebar).getByRole("link", { name: "Already have an account? Log in" });
    expect(loginLink).toHaveAttribute("href", "/login");
    expect(loginLink).toHaveAttribute("aria-current", "page");
    expect(within(sidebar).getByRole("link", { name: "Create Free Account" })).not.toHaveAttribute(
      "aria-current",
    );

    const newProjectButton = within(sidebar).getByRole("button", { name: /New Project/i });
    expect(newProjectButton).not.toHaveClass("workspace-sidebar__link--active");
    expect(newProjectButton).not.toHaveClass("workspace-sidebar__link--primary-action");
  });

  it("keeps Login highlighted on the Register route", () => {
    renderWorkspace(ROUTES.REGISTER);
    const sidebar = getSidebar();
    expect(within(sidebar).getByRole("link", { name: "Create Free Account" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(sidebar).getByRole("link", { name: "Already have an account? Log in" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("keeps Login highlighted on the Password Recovery route", () => {
    renderWorkspace(ROUTES.PASSWORD_RECOVERY);
    expect(
      within(getSidebar()).getByRole("link", { name: "Already have an account? Log in" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("highlights Knowledge Base on its dedicated module route", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    const sidebar = getSidebar();

    const knowledgeBaseLink = within(sidebar).getByRole("link", { name: "Knowledge Base" });
    expect(knowledgeBaseLink).toHaveClass("workspace-sidebar__link--active");
    expect(knowledgeBaseLink).toHaveAttribute("aria-current", "page");

    const newProjectLink = within(sidebar).getByRole("link", { name: "New Project" });
    expect(newProjectLink).toHaveClass("workspace-sidebar__link--primary-action");
    expect(newProjectLink).not.toHaveClass("workspace-sidebar__link--active");
    expect(newProjectLink).not.toHaveAttribute("aria-current");
  });

  it("keeps New Project as the primary action while My Account is the current route", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.PREFERENCES);
    const sidebar = getSidebar();

    const newProjectLink = within(sidebar).getByRole("link", { name: "New Project" });
    expect(newProjectLink).toHaveClass("workspace-sidebar__link--primary-action");
    expect(newProjectLink).not.toHaveClass("workspace-sidebar__link--active");
    expect(newProjectLink).not.toHaveAttribute("aria-current");

    const accountLink = within(sidebar).getByRole("link", { name: "My Account" });
    expect(accountLink).toHaveClass("workspace-sidebar__link--active");
    expect(accountLink).toHaveAttribute("aria-current", "page");
  });

  it("keeps Home as the current route while New Project stays the primary action", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);
    const sidebar = getSidebar();

    const homeLink = within(sidebar).getByRole("link", { name: "Home" });
    expect(homeLink).toHaveClass("workspace-sidebar__link--active");
    expect(homeLink).toHaveAttribute("aria-current", "page");

    const newProjectLink = within(sidebar).getByRole("link", { name: "New Project" });
    expect(newProjectLink).toHaveClass("workspace-sidebar__link--primary-action");
    expect(newProjectLink).not.toHaveClass("workspace-sidebar__link--active");
    expect(newProjectLink).not.toHaveAttribute("aria-current");
  });

  it("keeps New Project primary on Home after leaving My Account", async () => {
    seedAuthenticatedSession();
    const { router } = renderWorkspace(ROUTES.PREFERENCES);
    expect(within(getSidebar()).getByRole("link", { name: "New Project" })).toHaveClass(
      "workspace-sidebar__link--primary-action",
    );

    await act(async () => {
      await router.navigate(ROUTES.HOME);
    });

    const sidebar = getSidebar();
    const newProjectLink = within(sidebar).getByRole("link", { name: "New Project" });
    expect(newProjectLink).toHaveClass("workspace-sidebar__link--primary-action");
    expect(newProjectLink).not.toHaveClass("workspace-sidebar__link--active");
    expect(within(sidebar).getByRole("link", { name: "Home" })).toHaveClass(
      "workspace-sidebar__link--active",
    );
  });

  it("marks New Project as both primary action and current route on its own page", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.NEW_PROJECT);
    const sidebar = getSidebar();

    const newProjectLink = within(sidebar).getByRole("link", { name: "New Project" });
    expect(newProjectLink).toHaveClass("workspace-sidebar__link--primary-action");
    expect(newProjectLink).toHaveClass("workspace-sidebar__link--active");
    expect(newProjectLink).toHaveAttribute("aria-current", "page");
    expect(within(sidebar).getByRole("link", { name: "Home" })).not.toHaveClass(
      "workspace-sidebar__link--active",
    );
  });

  it("leaves Projects inactive on Home while New Project is the primary action", () => {
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

describe("New Project primary-action visual contract", () => {
  it("uses a muted sage fill distinct from cream active navigation", () => {
    const primaryBlock = stylesSource.match(
      /\.workspace-sidebar__link\.workspace-sidebar__link--primary-action\s*\{([^}]+)\}/,
    )?.[1];
    const activeBlock = stylesSource.match(
      /\.workspace-sidebar__link\.workspace-sidebar__link--active,\s*\n\.workspace-sidebar__link\.workspace-sidebar__link--active:hover\s*\{([^}]+)\}/,
    )?.[1];

    expect(primaryBlock).toMatch(/--sidebar-primary-fill:\s*#e6eee4;/);
    expect(primaryBlock).toMatch(/background:\s*var\(--sidebar-primary-fill\);/);
    expect(primaryBlock).not.toMatch(/#f0e7d8/);
    expect(activeBlock).toMatch(/background:\s*#f0e7d8;/);

    expect(stylesSource).toMatch(
      /\.workspace-sidebar__link\.workspace-sidebar__link--primary-action:focus-visible\s*\{[^}]*outline:/,
    );
    expect(stylesSource).toMatch(
      /\.workspace-sidebar__link\.workspace-sidebar__link--primary-action\.workspace-sidebar__link--active/,
    );
  });
});
