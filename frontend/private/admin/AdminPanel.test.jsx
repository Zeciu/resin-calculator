import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ADMIN_ROUTES } from "./adminRoutes.js";
import { ROUTES } from "../../public/src/workspace/routes.js";
import { renderWorkspace } from "../../public/src/workspace/renderWorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedSession(user) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user }));
}

// Editorial routes are local-only and role-free: ordinary Cognito
// authentication is the single requirement, so every seeded user below is a
// standard user with no special role or entitlement.
function seedEditorialUser() {
  seedSession({
    id: "stub-user",
    email: "editor@example.com",
    username: "editor",
    role: "user",
  });
}

describe("Admin Panel foundation", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("with an authenticated user", () => {
    it("renders the admin dashboard", () => {
      seedEditorialUser();
      renderWorkspace(ADMIN_ROUTES.ROOT);

      expect(
        screen.getByRole("navigation", { name: "Administration navigation" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Public Languages" })).toBeInTheDocument();
      expect(screen.queryByRole("banner", { name: "Workspace hero" })).not.toBeInTheDocument();
    });

    it("does not show Admin Panel in workspace navigation", () => {
      seedEditorialUser();
      renderWorkspace(ROUTES.HOME);

      expect(screen.queryByRole("link", { name: "Admin Panel" })).not.toBeInTheDocument();
    });

    it("renders the manual management workspace", async () => {
      const user = userEvent.setup();
      seedEditorialUser();
      renderWorkspace(ADMIN_ROUTES.ROOT);

      const adminNav = screen.getByRole("navigation", { name: "Administration navigation" });
      await user.click(within(adminNav).getByRole("link", { name: "Manual & Tutorials" }));

      expect(screen.getByRole("region", { name: "Manual management" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add New Chapter" })).toBeInTheDocument();
    });

    it("keeps existing user-facing routes working", async () => {
      const user = userEvent.setup();
      seedEditorialUser();
      renderWorkspace(ROUTES.HOME);

      await user.click(screen.getByRole("link", { name: "Projects" }));

      const main = screen.getByRole("main");
      expect(within(main).getByRole("heading", { name: "Projects" })).toBeInTheDocument();
      expect(within(main).getByRole("button", { name: "Open Project" })).toBeInTheDocument();
    });
  });

  describe("without authentication", () => {
    it("blocks guests from admin routes", () => {
      renderWorkspace(ADMIN_ROUTES.ROOT);

      expect(screen.getByText(/Create your free HFZWood account/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: "Administration navigation" }),
      ).not.toBeInTheDocument();
    });
  });
});
