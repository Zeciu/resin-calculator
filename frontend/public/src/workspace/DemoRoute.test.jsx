import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-project-kind='demo']")).not.toBeInTheDocument();
  });

  it("keeps /projects protected for anonymous visitors", () => {
    renderWorkspace(ROUTES.PROJECTS);
    expect(
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
  });

  it("lets authenticated users visit /demo directly without the sidebar Demo CTA", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.DEMO);

    expect(screen.getByRole("banner", { name: "Module header" })).toHaveTextContent("Demo project");
    expect(document.querySelector("[data-project-kind='demo']")).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Workspace navigation" })).queryByRole("link", {
        name: "Try a demo project",
      }),
    ).not.toBeInTheDocument();
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
  });

  it("discards demo state silently when leaving /demo", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.DEMO);

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(screen.queryByText(/You have unsaved changes/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Discard Changes" })).not.toBeInTheDocument();
  });
});
