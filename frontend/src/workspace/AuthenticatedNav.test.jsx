import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { WORKSPACE_NAV_ITEMS } from "./navigation.js";
import { ROUTES } from "./routes.js";
import WorkspaceRouter from "./WorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const PROTECTED_NAV_ITEMS = WORKSPACE_NAV_ITEMS.filter((item) => item.requiresAuth);

function renderWorkspace(initialPath = ROUTES.LOGIN) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
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

function expectRoutePlaceholder(title) {
  const main = screen.getByRole("main");
  expect(within(main).getByRole("heading", { name: title })).toBeInTheDocument();
}

describe("Authenticated Mode navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("keeps protected module items locked for guests", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.LOGIN);

    for (const item of PROTECTED_NAV_ITEMS) {
      expect(
        screen.getByRole("button", { name: new RegExp(item.label, "i") }),
      ).toBeInTheDocument();
    }

    expect(screen.getAllByLabelText("Locked feature")).toHaveLength(
      PROTECTED_NAV_ITEMS.length,
    );
    expect(screen.getByRole("link", { name: "Login / Register" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /New Project/i }));
    expect(
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
  });

  it("unlocks protected module items for authenticated users without lock icons", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.PROJECTS);

    for (const item of PROTECTED_NAV_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: new RegExp(item.label, "i") }),
      ).not.toBeInTheDocument();
    }

    expect(screen.queryAllByLabelText("Locked feature")).toHaveLength(0);
    expect(screen.getByRole("link", { name: "Login / Register" })).toBeInTheDocument();
  });

  it("lets authenticated users navigate protected module routes from the sidebar", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.PROJECTS);

    const navigableModules = [
      { label: "New Project", title: "New Project" },
      { label: "Manual & Tutorials", title: "Manual & Tutorials" },
      { label: "Glossary", title: "Glossary" },
      { label: "Knowledge Base", title: "Knowledge Base" },
    ];

    for (const { label, title } of navigableModules) {
      await user.click(screen.getByRole("link", { name: label }));
      expectRoutePlaceholder(title);
    }
  });
});
