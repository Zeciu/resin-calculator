import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { localeBundleHasOwnKey, translate } from "../i18n/translate.js";
import {
  GUEST_LOCKED_MESSAGE_KEYS,
  isGuestLockedNavItemSelected,
  WORKSPACE_NAV_ITEMS,
} from "./navigation.js";
import { ROUTES } from "./routes.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const LOCKED_SECTIONS = [
  {
    id: "new-project",
    label: "New Project",
    title: "Create your free HFZWood account to start a project.",
    body: /polygon of at most 4 points/i,
  },
  {
    id: "projects",
    label: "Projects",
    title: "Create your free HFZWood account to access your projects.",
    body: /remain yours and can be opened and edited/i,
  },
  {
    id: "manual-tutorials",
    label: "Manual & Tutorials",
    title: "Create your free HFZWood account to unlock the Manual and tutorials.",
    body: /complete HFZWood Manual and all tutorials are available even with a free account/i,
  },
  {
    id: "glossary",
    label: "Glossary",
    title: "Create your free HFZWood account to explore the Glossary.",
    body: /selection of Glossary terms/i,
  },
  {
    id: "knowledge-base",
    label: "Knowledge Base",
    title: "Create your free HFZWood account to explore the Knowledge Base.",
    body: /selection of practical Knowledge Base articles/i,
  },
];

function getSidebar() {
  return screen.getByRole("navigation", { name: "Workspace navigation" });
}

function getMain() {
  return screen.getByRole("main");
}

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

describe("Guest locked navigation messages and selected state", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it.each(LOCKED_SECTIONS)(
    "shows the $label-specific guest message with login, register, and pricing actions",
    async ({ label, title, body }) => {
      const user = userEvent.setup();
      renderWorkspace(ROUTES.HOME);

      await user.click(within(getSidebar()).getByRole("button", { name: new RegExp(label, "i") }));

      const main = getMain();
      expect(within(main).getByRole("heading", { name: title, level: 2 })).toBeInTheDocument();
      expect(within(main).getByText(body)).toBeInTheDocument();
      expect(within(main).getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
      expect(within(main).getByRole("link", { name: "Create Free Account" })).toHaveAttribute(
        "href",
        "/register",
      );
      expect(within(main).getByRole("link", { name: "View plans" })).toHaveAttribute(
        "href",
        "/pricing",
      );
      expect(
        within(main).queryByRole("link", { name: /Go to Login \/ Register/i }),
      ).not.toBeInTheDocument();
    },
  );

  it("keeps a persistent selected state independent of focus", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.HOME);
    const sidebar = getSidebar();
    const newProject = within(sidebar).getByRole("button", { name: /New Project/i });

    await user.click(newProject);
    newProject.blur();

    expect(newProject).toHaveClass("workspace-sidebar__link--active");
    expect(newProject).toHaveAttribute("aria-current", "true");
    expect(newProject).not.toHaveFocus();
    expect(within(sidebar).getByRole("link", { name: "Home" })).not.toHaveClass(
      "workspace-sidebar__link--active",
    );
    expect(within(sidebar).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("moves the selected locked section and restores Home afterward", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.HOME);
    const sidebar = getSidebar();
    const newProject = within(sidebar).getByRole("button", { name: /New Project/i });
    const projects = within(sidebar).getByRole("button", { name: /Projects/i });

    await user.click(newProject);
    expect(newProject).toHaveClass("workspace-sidebar__link--active");
    expect(projects).not.toHaveClass("workspace-sidebar__link--active");

    await user.click(projects);
    expect(projects).toHaveClass("workspace-sidebar__link--active");
    expect(newProject).not.toHaveClass("workspace-sidebar__link--active");
    expect(
      within(getMain()).getByRole("heading", {
        name: "Create your free HFZWood account to access your projects.",
        level: 2,
      }),
    ).toBeInTheDocument();

    await user.click(within(getSidebar()).getByRole("link", { name: "Home" }));
    const sidebarAfterHome = getSidebar();
    expect(within(sidebarAfterHome).getByRole("link", { name: "Home" })).toHaveClass(
      "workspace-sidebar__link--active",
    );
    expect(within(sidebarAfterHome).getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(sidebarAfterHome).getByRole("button", { name: /New Project/i })).not.toHaveClass(
      "workspace-sidebar__link--active",
    );
    expect(within(sidebarAfterHome).getByRole("button", { name: /Projects/i })).not.toHaveClass(
      "workspace-sidebar__link--active",
    );
    expect(
      screen.queryByRole("heading", {
        name: "Create your free HFZWood account to access your projects.",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not treat Public Knowledge Preview or Try a demo project as locked selections", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.HOME);
    const sidebar = getSidebar();

    await user.click(within(sidebar).getByRole("button", { name: /Glossary/i }));
    expect(within(sidebar).getByRole("button", { name: /Glossary/i })).toHaveClass(
      "workspace-sidebar__link--active",
    );
    expect(within(sidebar).getByRole("link", { name: "Public Knowledge Preview" })).not.toHaveClass(
      "workspace-sidebar__link--active",
    );
    expect(within(sidebar).getByRole("link", { name: "Try a demo project" })).not.toHaveClass(
      "workspace-sidebar__link--active",
    );

    await user.click(within(sidebar).getByRole("link", { name: "Public Knowledge Preview" }));
    expect(within(getSidebar()).getByRole("link", { name: "Public Knowledge Preview" })).toHaveClass(
      "workspace-sidebar__link--active",
    );
    expect(within(getSidebar()).getByRole("button", { name: /Glossary/i })).not.toHaveClass(
      "workspace-sidebar__link--active",
    );
  });

  it("leaves authenticated New Project as a real route instead of a locked message", async () => {
    seedAuthenticatedSession();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.HOME);

    await user.click(screen.getByRole("link", { name: "New Project" }));
    expect(
      screen.queryByRole("heading", {
        name: "Create your free HFZWood account to start a project.",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New Project" })).toHaveClass(
      "workspace-sidebar__link--active",
    );
  });

  it("selects New Project from the route when a guest opens /new-project directly", () => {
    renderWorkspace(ROUTES.NEW_PROJECT);
    const sidebar = getSidebar();
    const newProject = within(sidebar).getByRole("button", { name: /New Project/i });

    expect(
      within(getMain()).getByRole("heading", {
        name: "Create your free HFZWood account to start a project.",
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(newProject).toHaveClass("workspace-sidebar__link--active");
    expect(newProject).toHaveAttribute("aria-current", "true");
    expect(isGuestLockedNavItemSelected(
      WORKSPACE_NAV_ITEMS.find((item) => item.id === "new-project"),
      null,
      ROUTES.NEW_PROJECT,
    )).toBe(true);
  });

  it("resolves RO/EN/FR locked-section keys without falling back to the key name", () => {
    for (const keys of Object.values(GUEST_LOCKED_MESSAGE_KEYS)) {
      for (const language of ["ro", "en", "fr"]) {
        expect(localeBundleHasOwnKey(language, keys.titleKey)).toBe(true);
        expect(localeBundleHasOwnKey(language, keys.bodyKey)).toBe(true);
        expect(translate(language, keys.titleKey)).not.toBe(keys.titleKey);
        expect(translate(language, keys.bodyKey, { maxPoints: 4 })).not.toBe(keys.bodyKey);
      }
    }
    expect(translate("en", "locked.newProject.body", { maxPoints: 4 })).toContain("4");
    expect(translate("ro", "locked.newProject.body", { maxPoints: 4 })).toContain("4");
    expect(translate("fr", "locked.newProject.body", { maxPoints: 4 })).toContain("4");
    expect(translate("ro", "locked.newProject.title")).toBe(
      "Creează-ți un cont gratuit HFZWood pentru a începe un proiect.",
    );
    expect(translate("en", "register.logIn")).toBe("Log in");
    expect(translate("en", "home.onboardingRegister")).toBe("Create Free Account");
    expect(translate("en", "preview.viewPlans")).toBe("View plans");
    expect(translate("ro", "preview.viewPlans")).toBe("Vezi planurile");
    expect(translate("fr", "preview.viewPlans")).toBe("Voir les offres");
  });
});
