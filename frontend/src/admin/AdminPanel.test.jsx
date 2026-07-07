import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_ROUTES } from "./adminRoutes.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedSession(user) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user }));
}

function seedStandardUser() {
  seedSession({
    id: "stub-user",
    email: "user@example.com",
    username: "user",
    role: "user",
  });
}

function seedAdministrator() {
  seedSession({
    id: "stub-user",
    email: "admin@example.com",
    username: "admin",
    role: "administrator",
  });
}

function expectLoggedInHome() {
  expect(
    screen.getByRole("heading", {
      name: /Welcome to HFZWood — your workspace for resin estimation and woodworking knowledge/i,
    }),
  ).toBeInTheDocument();
}

describe("Admin Panel foundation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("with mock administrator enabled", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_MOCK_ADMIN", "true");
    });

    it("renders the admin dashboard for an administrator", () => {
      seedAdministrator();
      renderWorkspace(ADMIN_ROUTES.ROOT);

      expect(
        screen.getByRole("navigation", { name: "Administration navigation" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
      expect(screen.getByText(/reserved for HFZWood product administration/i)).toBeInTheDocument();
      expect(screen.queryByRole("banner", { name: "Workspace hero" })).not.toBeInTheDocument();
    });

    it("does not show Admin Panel in workspace navigation", () => {
      seedAdministrator();
      renderWorkspace(ROUTES.HOME);

      expect(screen.queryByRole("link", { name: "Admin Panel" })).not.toBeInTheDocument();
    });

    it("renders a manual placeholder with the Task 59 message", async () => {
      const user = userEvent.setup();
      seedAdministrator();
      renderWorkspace(ADMIN_ROUTES.ROOT);

      const adminNav = screen.getByRole("navigation", { name: "Administration navigation" });
      await user.click(within(adminNav).getByRole("link", { name: "Manual & Tutorials" }));

      expect(
        screen.getByRole("heading", { name: "Manual & Tutorials management" }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Manual content management begins in Task 59/i)).toBeInTheDocument();
    });
  });

  describe("with standard user", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_MOCK_ADMIN", "false");
    });

    it("redirects standard users away from admin routes", () => {
      seedStandardUser();
      renderWorkspace(ADMIN_ROUTES.ROOT);

      expectLoggedInHome();
      expect(
        screen.queryByRole("navigation", { name: "Administration navigation" }),
      ).not.toBeInTheDocument();
    });

    it("redirects guests away from admin routes", () => {
      renderWorkspace(ADMIN_ROUTES.ROOT);

      expect(screen.getByText(/Create your free HFZWood account/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: "Administration navigation" }),
      ).not.toBeInTheDocument();
    });

    it("does not show Admin Panel in workspace navigation", () => {
      seedStandardUser();
      renderWorkspace(ROUTES.HOME);

      expect(screen.queryByRole("link", { name: "Admin Panel" })).not.toBeInTheDocument();
    });

    it("keeps existing user-facing routes working for standard users", async () => {
      const user = userEvent.setup();
      seedStandardUser();
      renderWorkspace(ROUTES.HOME);

      await user.click(screen.getByRole("link", { name: "Projects" }));

      const main = screen.getByRole("main");
      expect(within(main).getByRole("heading", { name: "Projects" })).toBeInTheDocument();
      expect(within(main).getByRole("button", { name: "Open Project" })).toBeInTheDocument();
    });
  });
});
