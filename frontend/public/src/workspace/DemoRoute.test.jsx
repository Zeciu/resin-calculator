import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ROUTES } from "./routes.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { RECENT_PROJECTS_STORAGE_KEY } from "./recentProjectsIndex.js";

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

describe("Demo route", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("mounts DemoWorkspace for anonymous visitors without AuthRouteGuard", async () => {
    renderWorkspace(ROUTES.DEMO);

    expect(screen.getByRole("banner", { name: "Module header" })).toHaveTextContent("Demo project");
    expect(document.querySelector("[data-project-kind='demo']")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset demo" })).toBeInTheDocument();
    expect(
      screen.queryByText(/Create your free HFZWood account to unlock this section/i),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Could not load the demo project/i);
    });
  });

  it("keeps /new-project protected for anonymous visitors", () => {
    renderWorkspace(ROUTES.NEW_PROJECT);
    expect(
      screen.getByRole("heading", {
        name: "Create your free HFZWood account to start a project.",
      }),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-project-kind='demo']")).not.toBeInTheDocument();
  });

  it("keeps /projects protected for anonymous visitors", () => {
    renderWorkspace(ROUTES.PROJECTS);
    expect(
      screen.getByRole("heading", {
        name: "Create your free HFZWood account to access your projects.",
      }),
    ).toBeInTheDocument();
  });

  it("lets authenticated users visit /demo from the shared sidebar Demo CTA", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    const demoCta = within(screen.getByRole("navigation", { name: "Workspace navigation" })).getByRole(
      "link",
      { name: "Try a demo project" },
    );
    expect(demoCta).toHaveAttribute("href", "/demo");
    expect(demoCta).toHaveAttribute("data-nav", "demo-project");
    expect(demoCta).not.toHaveClass("workspace-sidebar__link--primary-action");

    await user.click(demoCta);

    expect(screen.getByRole("banner", { name: "Module header" })).toHaveTextContent("Demo project");
    expect(document.querySelector("[data-project-kind='demo']")).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Workspace navigation" })).getByRole("link", {
        name: "Try a demo project",
      }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("navigates guests from the sidebar Demo CTA to /demo", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.HOME);

    await user.click(
      within(screen.getByRole("navigation", { name: "Workspace navigation" })).getByRole("link", {
        name: "Try a demo project",
      }),
    );

    expect(screen.getByRole("banner", { name: "Module header" })).toHaveTextContent("Demo project");
    expect(
      within(screen.getByRole("navigation", { name: "Workspace navigation" })).getByRole("link", {
        name: "Try a demo project",
      }),
    ).toHaveAttribute("data-nav", "demo-project");
  });

  it("does not write demo work into Recent Projects for authenticated users", async () => {
    const user = userEvent.setup();
    const seededRecents = JSON.stringify({
      version: 1,
      items: [
        {
          id: "existing-recent",
          projectId: "existing-project",
          projectName: "Existing Table",
          lastOpenedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    localStorage.setItem(RECENT_PROJECTS_STORAGE_KEY, seededRecents);
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    await user.click(
      within(screen.getByRole("navigation", { name: "Workspace navigation" })).getByRole("link", {
        name: "Try a demo project",
      }),
    );

    expect(document.querySelector("[data-project-kind='demo']")).toBeInTheDocument();
    expect(localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY)).toBe(seededRecents);
    expect(screen.queryByRole("button", { name: /Save Project/i })).not.toBeInTheDocument();
  });

  it("discards demo state silently when leaving /demo", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.DEMO);

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(screen.queryByText(/You have unsaved changes/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Discard Changes" })).not.toBeInTheDocument();
  });
});
