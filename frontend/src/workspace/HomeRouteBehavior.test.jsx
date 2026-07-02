import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function renderHomeRoute() {
  return renderWorkspace("/");
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

describe("Workspace home route", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders GuestIntro for guests at /", () => {
    renderHomeRoute();

    expect(
      screen.getByText(/The first platform that gives woodworkers and resin enthusiasts/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform overview video placeholder/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/River Table & Woodworking Resin Calculator/i),
    ).not.toBeInTheDocument();
  });

  it("renders LoggedInHome for authenticated users at /", () => {
    seedAuthenticatedSession();
    renderHomeRoute();

    expect(
      screen.getByText(/Welcome to HFZWood — your workspace for resin estimation/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform overview video placeholder/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Create your free HFZWood account to unlock the complete platform/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login / Register" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My Account" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Start New Project/i })).not.toBeInTheDocument();
  });
});
