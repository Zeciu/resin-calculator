import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { WORKSPACE_NAV_ITEMS } from "./navigation.js";
import WorkspaceRouter from "./WorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function renderWorkspace(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <WorkspaceRouter />
    </MemoryRouter>,
  );
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

  it("blocks direct /new-project URL access with LockedModuleMessage", () => {
    renderWorkspace("/new-project");

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

  it("navigates to Phase 1 module routes from the Home hub", async () => {
    const user = userEvent.setup();
    renderWorkspace("/");
    const main = screen.getByRole("main");

    await user.click(screen.getByRole("link", { name: "New Project" }));
    expect(
      within(main).getByText("River Table & Woodworking Resin Calculator"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Projects" }));
    expect(within(main).getByRole("heading", { name: "Projects" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Manual & Tutorials" }));
    expect(within(main).getByRole("heading", { name: "Manual & Tutorials" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Glossary" }));
    expect(within(main).getByRole("heading", { name: "Glossary" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Knowledge Base" }));
    expect(within(main).getByRole("heading", { name: "Knowledge Base" })).toBeInTheDocument();
  });

  it("still shows My Account on non-home authenticated routes", async () => {
    const user = userEvent.setup();
    renderWorkspace("/projects");

    expect(screen.getByRole("link", { name: "My Account" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "My Account" }));
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "My Account" }),
    ).toBeInTheDocument();
  });
});
