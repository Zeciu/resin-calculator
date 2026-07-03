import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";

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

function expectDedicatedManualShell() {
  expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
  const header = screen.getByRole("banner", { name: "Module header" });
  expect(within(header).getByText("Manual & Tutorials")).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Module navigation" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
}

describe("ManualTutorialsPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the dedicated manual module for authenticated users", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.MANUAL);

    expectDedicatedManualShell();
    expect(screen.getByRole("navigation", { name: "Table of contents" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Manual & Tutorials", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Introduction", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Polygons and Volume", level: 2 })).toBeInTheDocument();
    expect(screen.getByTitle("Calibration walkthrough")).toBeInTheDocument();
    expect(screen.queryByText(/Coming in a future phase/i)).not.toBeInTheDocument();
  });

  it("shows all manual sections in one continuous document", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.MANUAL);

    const main = screen.getByRole("main");
    expect(within(main).getByText(/HFZWood helps woodworkers estimate epoxy resin volume/i)).toBeInTheDocument();
    expect(within(main).getByText(/Review the pouring plan and safety margin/i)).toBeInTheDocument();
  });

  it("jumps directly to a section when a table-of-contents item is clicked", async () => {
    seedAuthenticatedSession();
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    const user = userEvent.setup();
    renderWorkspace(ROUTES.MANUAL);

    await user.click(screen.getByRole("button", { name: "Polygons and Volume" }));

    const section = document.getElementById("polygons-and-volume");
    expect(section).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("blocks guest access in the dedicated module layout", () => {
    renderWorkspace(ROUTES.MANUAL);

    expectDedicatedManualShell();
    expect(
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Table of contents" })).not.toBeInTheDocument();
  });
});
