import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockCapabilitiesFetch, seedDevicePreferences } from "../preferences/testHelpers.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const MOCK_USER = {
  id: "stub-user",
  email: "account@example.com",
  username: "accountuser",
};

function seedAuthenticatedSession(user = MOCK_USER) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user }));
}

describe("My Account page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.stubEnv("VITE_MOCK_ADMIN", "false");
    mockCapabilitiesFetch();
    seedDevicePreferences({ interfaceLanguage: "en", lengthUnit: "mm", volumeUnit: "L" });
  });

  it("renders mock profile information", async () => {
    seedAuthenticatedSession({ ...MOCK_USER, role: "user" });
    renderWorkspace(ROUTES.ACCOUNT);

    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { name: "My Account" })).toBeInTheDocument();
    expect(within(main).getByText("accountuser")).toBeInTheDocument();
    expect(within(main).getByText("account@example.com")).toBeInTheDocument();
  });

  it("shows subscription plan and subscribe action", async () => {
    seedAuthenticatedSession({ ...MOCK_USER, role: "user" });
    renderWorkspace(ROUTES.ACCOUNT);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Subscribe/i })).toBeInTheDocument();
    });
    expect(screen.getByText("Current plan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Refresh status/i })).toBeInTheDocument();
  });

  it("links to application preferences", () => {
    seedAuthenticatedSession({ ...MOCK_USER, role: "user" });
    renderWorkspace(ROUTES.ACCOUNT);

    expect(screen.getByRole("link", { name: "Application Preferences" })).toHaveAttribute(
      "href",
      ROUTES.PREFERENCES,
    );
  });

  it("logs out from the account page and returns to guest login mode", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession({ ...MOCK_USER, role: "user" });
    renderWorkspace(ROUTES.ACCOUNT);

    const main = screen.getByRole("main");
    await user.click(within(main).getByRole("button", { name: /Log out/i }));

    expect(screen.getByRole("heading", { name: /Log in to HFZWood/i })).toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole("button", { name: /New Project/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Log out/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login / Register" })).toBeInTheDocument();
  });
});
