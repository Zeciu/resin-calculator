import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import {
  expectNoAuthenticatedContentFetch,
  mockPublicPreviewFetch,
  SAMPLE_MANUAL_CHAPTERS,
} from "./publicPreviewTestHelpers.js";

function expectPreviewBackLink(name = /Înapoi la Previzualizare resurse/) {
  const back = screen.getByRole("link", { name });
  expect(back).toHaveAttribute("href", "/knowledge-preview");
  expect(back).toHaveClass("module-home-nav__link");
}

describe("Manual public preview", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    seedDevicePreferences({ interfaceLanguage: "ro" });
  });

  it("renders every returned title, opens the unlocked chapter, and keeps locked chapters body-free", async () => {
    const fetchMock = mockPublicPreviewFetch();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_MANUAL);

    await waitFor(() => {
      expect(screen.getByText("Unlocked chapter body for the first pour.")).toBeInTheDocument();
    });
    expectPreviewBackLink();
    const unlockedChapter = screen.getByRole("button", { name: /Prima turnare/ });
    await waitFor(() => {
      expect(unlockedChapter).toHaveAttribute("aria-current", "true");
    });
    expect(unlockedChapter).toHaveClass("knowledge-preview-toc__link--available");
    expect(screen.getByText("Disponibil în previzualizare")).toBeInTheDocument();
    expect(screen.queryByText("searchKeywords")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/public-preview\/manual\?locale=/),
    );
    expectNoAuthenticatedContentFetch(fetchMock);

    await user.click(screen.getByRole("button", { name: /Capitol blocat/ }));
    expect(
      screen.getByRole("heading", { name: "Disponibil cu un abonament HFZWood" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Acest capitol face parte din Manualul HFZWood complet.")).toBeInTheDocument();
    expect(screen.queryByText("Unlocked chapter body for the first pour.")).not.toBeInTheDocument();
    expect(SAMPLE_MANUAL_CHAPTERS.find((chapter) => chapter.id === "locked-chapter")?.blocks).toBeUndefined();

    const pricing = screen.getByRole("link", { name: "Vezi planurile" });
    expect(pricing).toHaveAttribute("href", "/pricing");
  });

  it("is keyboard accessible for locked chapters", async () => {
    mockPublicPreviewFetch();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_MANUAL);

    const locked = await screen.findByRole("button", { name: /Capitol blocat/ });
    locked.focus();
    expect(locked).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("heading", { name: "Disponibil cu un abonament HFZWood" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Blocat")).toBeInTheDocument();
  });

  it("shows the empty educational state for a non-RO locale", async () => {
    const fetchMock = mockPublicPreviewFetch();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_MANUAL);

    await waitFor(() => {
      expect(
        screen.getByText("Educational content for this language is not available yet."),
      ).toBeInTheDocument();
    });
    expectPreviewBackLink(/Back to Public Knowledge Preview/);
    expect(screen.queryByRole("button", { name: /Prima turnare/ })).not.toBeInTheDocument();
    expectNoAuthenticatedContentFetch(fetchMock);
  });
});
