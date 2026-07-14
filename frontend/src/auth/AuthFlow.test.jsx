import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function expectNewProjectLocked() {
  expect(screen.getByRole("button", { name: /New Project/i })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /New Project/i })).not.toBeInTheDocument();
}

function expectNewProjectUnlocked() {
  expect(screen.getByRole("link", { name: /New Project/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /New Project/i })).not.toBeInTheDocument();
}

function expectLoggedInHome() {
  expect(
    screen.getByText(/Welcome to HFZWood — your workspace for resin estimation/i),
  ).toBeInTheDocument();
}

async function submitLoginForm(user, email = "user@example.com", password = "password123") {
  await user.type(screen.getByRole("textbox", { name: /email or username/i }), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.click(screen.getByRole("button", { name: /^log in$/i }));
}

describe("Auth flow", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("login unlocks navigation", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.LOGIN);

    expectNewProjectLocked();

    await submitLoginForm(user);

    await waitFor(() => {
      expectLoggedInHome();
    });
    expectNewProjectUnlocked();
    expect(screen.getByRole("button", { name: /Log out/i })).toBeInTheDocument();
  });

  it("logout locks navigation again", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.LOGIN);

    await submitLoginForm(user);
    await waitFor(() => {
      expectNewProjectUnlocked();
    });

    await user.click(screen.getByRole("button", { name: /Log out/i }));

    expect(screen.getByRole("heading", { name: /Log in to HFZWood/i })).toBeInTheDocument();
    expectNewProjectLocked();
    expect(screen.queryByRole("button", { name: /Log out/i })).not.toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("restores authenticated navigation from sessionStorage", () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        user: {
          id: "stub-user",
          email: "restored@example.com",
          username: "restored",
        },
      }),
    );

    renderWorkspace(ROUTES.HOME);

    expectLoggedInHome();
    expectNewProjectUnlocked();
    expect(screen.getByRole("button", { name: /Log out/i })).toBeInTheDocument();
  });
});
