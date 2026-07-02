import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import GuestIntro from "./GuestIntro.jsx";
import { WORKSPACE_NAV_ITEMS } from "./navigation.js";
import { ROUTES } from "./routes.js";
import { renderWorkspace as renderGuestWorkspace } from "./renderWorkspaceRouter.jsx";

describe("Guest Mode", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("shows all workspace navigation items", () => {
    renderGuestWorkspace();

    for (const item of WORKSPACE_NAV_ITEMS) {
      if (item.requiresAuth) {
        expect(
          screen.getByRole("button", { name: new RegExp(item.label, "i") }),
        ).toBeInTheDocument();
      } else {
        expect(screen.getByRole("link", { name: item.label })).toBeInTheDocument();
      }
    }
  });

  it("shows LockedModuleMessage when a guest clicks a locked sidebar item", async () => {
    const user = userEvent.setup();
    renderGuestWorkspace();

    await user.click(screen.getByRole("button", { name: /New Project/i }));

    expect(
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Go to Login \/ Register/i)).toBeInTheDocument();
  });

  it("includes the guest intro platform overview video placeholder", () => {
    render(<GuestIntro />);

    expect(
      screen.getByLabelText(/Platform overview video placeholder/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Platform overview video")).toBeInTheDocument();
  });
});
