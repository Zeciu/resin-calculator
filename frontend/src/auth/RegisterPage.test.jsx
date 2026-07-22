import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { mockPublishedWebsiteFetch } from "../website/websiteTestHelpers.js";

describe("RegisterPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
    mockPublishedWebsiteFetch();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  async function fillBaseFields(user, { email = "new@example.com", username = "newuser" } = {}) {
    await user.type(screen.getByLabelText(/^email$/i), email);
    await user.type(screen.getByLabelText(/^username$/i), username);
  }

  it("allows typing password and confirm password without throwing", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.REGISTER);

    expect(screen.getByRole("heading", { name: /Create your HFZWood account/i })).toBeInTheDocument();
    await fillBaseFields(user);

    await expect(user.type(screen.getByLabelText(/^password$/i), "password123")).resolves.toBeUndefined();
    await expect(
      user.type(screen.getByLabelText(/^confirm password$/i), "password123"),
    ).resolves.toBeUndefined();

    expect(screen.queryByText(/Cannot read properties of null/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reading 'reset'/i)).not.toBeInTheDocument();
  });

  it("shows intended validation messages for short and mismatched passwords", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.REGISTER);

    await fillBaseFields(user);
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/^confirm password$/i), "different");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(screen.queryByText(/Cannot read properties of null/i)).not.toBeInTheDocument();
  });

  it("submits valid registration without rendering raw runtime reset errors", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.REGISTER);

    await fillBaseFields(user);
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Welcome to HFZWood — your workspace for resin estimation/i),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/Cannot read properties of null/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reading 'reset'/i)).not.toBeInTheDocument();
  });

  it("resets safely after async confirmation-required registration", async () => {
    const user = userEvent.setup();
    const { mockAuthAdapter } = await import("./authAdapter.js");
    vi.spyOn(mockAuthAdapter, "register").mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ needsConfirmation: true, email: "confirm@example.com" });
          }, 20);
        }),
    );

    renderWorkspace(ROUTES.REGISTER);
    await fillBaseFields(user, { email: "confirm@example.com", username: "confirmuser" });
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Confirm your HFZWood account/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/Cannot read properties of null/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reading 'reset'/i)).not.toBeInTheDocument();
  });

  it("keeps Login flow unaffected", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.LOGIN);

    await user.type(screen.getByRole("textbox", { name: /email or username/i }), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Welcome to HFZWood — your workspace for resin estimation/i),
      ).toBeInTheDocument();
    });
  });

  it("keeps /register route publicly reachable for guests", () => {
    renderWorkspace(ROUTES.REGISTER);
    expect(screen.getByRole("heading", { name: /Create your HFZWood account/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Already have an account\? Log in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
