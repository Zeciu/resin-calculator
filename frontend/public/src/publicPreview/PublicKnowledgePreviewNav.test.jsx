import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { expectNoAuthenticatedContentFetch, mockPublicPreviewFetch } from "./publicPreviewTestHelpers.js";

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

function getSidebar() {
  return screen.getByRole("navigation", { name: "Workspace navigation" });
}

describe("Public Knowledge Preview navigation and landing", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows a single guest sidebar entry in English", async () => {
    mockPublicPreviewFetch();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    const sidebar = getSidebar();
    const previewLink = within(sidebar).getByRole("link", { name: "Public Knowledge Preview" });
    expect(previewLink).toHaveAttribute("href", "/knowledge-preview");
    expect(previewLink).toHaveClass("workspace-sidebar__link--guest-explore");
    expect(previewLink).not.toHaveClass("workspace-sidebar__link--primary-action");
    expect(previewLink).not.toHaveClass("guest-home-onboarding__primary");
    expect(within(sidebar).queryByRole("link", { name: "Manual & Tutorials" })).not.toBeInTheDocument();
    expect(within(sidebar).getAllByRole("link", { name: "Public Knowledge Preview" })).toHaveLength(1);
  });

  it("shows a single guest sidebar entry in Romanian", async () => {
    mockPublicPreviewFetch();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(within(getSidebar()).getByRole("link", { name: "Previzualizare resurse" })).toHaveAttribute(
        "href",
        "/knowledge-preview",
      );
    });
  });

  it("does not duplicate the preview CTA for authenticated users", () => {
    mockPublicPreviewFetch();
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    expect(within(getSidebar()).queryByRole("link", { name: "Public Knowledge Preview" })).not.toBeInTheDocument();
  });

  it("keeps /knowledge-preview accessible for authenticated users without the sidebar CTA", async () => {
    mockPublicPreviewFetch();
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW);

    expect(within(getSidebar()).queryByRole("link", { name: "Public Knowledge Preview" })).not.toBeInTheDocument();
    const main = screen.getByRole("main");
    expect(
      within(main).getByRole("heading", { name: "Public Knowledge Preview", level: 1 }),
    ).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: /Manual & Tutorials/i })).toHaveAttribute(
      "href",
      "/knowledge-preview/manual",
    );
  });

  it("renders three resource choices on the landing page", async () => {
    const fetchMock = mockPublicPreviewFetch();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW);

    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { name: "Public Knowledge Preview", level: 1 })).toBeInTheDocument();
    expect(
      within(main).getByText("Explore a selection from the HFZWood learning resources before subscribing."),
    ).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: /Manual & Tutorials/i })).toHaveAttribute(
      "href",
      "/knowledge-preview/manual",
    );
    expect(within(main).getByRole("link", { name: /Knowledge Base/i })).toHaveAttribute(
      "href",
      "/knowledge-preview/knowledge-base",
    );
    expect(within(main).getByRole("link", { name: /Glossary/i })).toHaveAttribute(
      "href",
      "/knowledge-preview/glossary",
    );
    expectNoAuthenticatedContentFetch(fetchMock);
  });

  it("lets a guest open the landing from the sidebar", async () => {
    mockPublicPreviewFetch();
    seedDevicePreferences({ interfaceLanguage: "en" });
    const user = userEvent.setup();
    renderWorkspace(ROUTES.HOME);

    await user.click(within(getSidebar()).getByRole("link", { name: "Public Knowledge Preview" }));
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "Public Knowledge Preview", level: 1 }),
    ).toBeInTheDocument();
    const activePreview = within(getSidebar()).getByRole("link", { name: "Public Knowledge Preview" });
    expect(activePreview).toHaveClass("workspace-sidebar__link--guest-explore");
    expect(activePreview).toHaveClass("workspace-sidebar__link--active");
    expect(activePreview).toHaveAttribute("aria-current", "page");
  });
});
