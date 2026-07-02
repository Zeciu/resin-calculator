import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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
    sessionStorage.clear();
  });

  it("renders mock profile information", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.ACCOUNT);

    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { name: "My Account" })).toBeInTheDocument();
    expect(within(main).getByText("accountuser")).toBeInTheDocument();
    expect(within(main).getByText("account@example.com")).toBeInTheDocument();
  });

  it("shows the subscription placeholder", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.ACCOUNT);

    expect(
      screen.getByText(
        /Free plan — billing and subscription management will be added in a later phase/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows the settings placeholder", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.ACCOUNT);

    expect(screen.getByText("Account preferences (coming soon)")).toBeInTheDocument();
    expect(screen.getByText("Notification settings (coming soon)")).toBeInTheDocument();
  });

  it("logs out from the account page and returns to guest login mode", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
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
