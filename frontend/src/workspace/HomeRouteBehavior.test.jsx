import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import WorkspaceRouter from "./WorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function renderHomeRoute() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
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

  it("renders GuestIntro for authenticated users at /", () => {
    seedAuthenticatedSession();
    renderHomeRoute();

    expect(
      screen.getByText(/The first platform that gives woodworkers and resin enthusiasts/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/River Table & Woodworking Resin Calculator/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login / Register" })).not.toBeInTheDocument();
  });
});
