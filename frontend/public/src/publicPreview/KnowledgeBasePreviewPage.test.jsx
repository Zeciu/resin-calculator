import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import {
  LOCKED_FIRST_KB_ENTRIES,
  buildKnowledgeBasePreviewResponse,
  expectNoAuthenticatedContentFetch,
  mockPublicPreviewFetch,
  installPreviewDocumentScrollMock,
} from "./publicPreviewTestHelpers.js";

function expectPreviewBackLink() {
  const back = screen.getByRole("link", { name: /Înapoi la Previzualizare resurse/ });
  expect(back).toHaveAttribute("href", "/knowledge-preview");
  expect(back).toHaveClass("module-home-nav__link");
}

describe("Knowledge Base public preview", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
    seedDevicePreferences({ interfaceLanguage: "ro" });
  });

  it("renders every returned title and opens the first unlocked article immediately", async () => {
    const fetchMock = mockPublicPreviewFetch();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE);

    const titleButton = await screen.findByRole(
      "button",
      { name: /Cum calculez cantitatea de rasina/ },
      { timeout: 5000 },
    );
    expectPreviewBackLink();
    await waitFor(() => {
      expect(titleButton).toHaveAttribute("aria-expanded", "true");
    });
    expect(screen.getByRole("button", { name: /De ce apar bulele de aer/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cum se amesteca rasina/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Articol blocat/ })).toBeInTheDocument();
    expect(screen.getAllByText("Need the right resin volume.").length).toBeGreaterThan(0);
    expect(screen.getByText("Measure the cavity, then calculate.")).toBeInTheDocument();
    expect(screen.getAllByText("Disponibil în preview").length).toBeGreaterThan(0);
    expect(titleButton.closest(".knowledge-preview-available")).not.toBeNull();
    expect(titleButton.closest(".knowledge-preview-available--selected")).not.toBeNull();
    expect(document.activeElement).not.toBe(titleButton);
    expect(screen.queryByText("searchKeywords")).not.toBeInTheDocument();
    expectNoAuthenticatedContentFetch(fetchMock);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/public-preview\/knowledge-base\?locale=/),
    );
  });

  it("does not auto-select a locked article merely because it is first in the API list", async () => {
    mockPublicPreviewFetch({
      knowledgeBase: buildKnowledgeBasePreviewResponse({
        locale: "ro",
        entries: LOCKED_FIRST_KB_ENTRIES,
      }),
    });
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE);

    const unlocked = await screen.findByRole("button", { name: /Primul articol deblocat/ });
    expect(unlocked).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Read this first.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Articol blocat primul/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      screen.queryByRole("heading", { name: "Disponibil cu un abonament HFZWood" }),
    ).not.toBeInTheDocument();
  });

  it("shows the subscription explanation for locked articles and keeps related links inside preview", async () => {
    mockPublicPreviewFetch();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE);

    await waitFor(() => {
      expect(screen.getByText("Measure the cavity, then calculate.")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Locked related term" })).toHaveAttribute(
      "href",
      "/knowledge-preview/glossary#glossary-entry-locked-glossary-term",
    );
    expect(screen.getByRole("link", { name: "Prima turnare" })).toHaveAttribute(
      "href",
      "/knowledge-preview/manual#prima-turnare",
    );

    await user.click(screen.getByRole("button", { name: "Locked related article" }));
    expect(
      screen.getByRole("heading", { name: "Disponibil cu un abonament HFZWood" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Acest articol face parte din Knowledge Base HFZWood complet."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vezi planurile" })).toHaveAttribute("href", "/pricing");
  });

  it("does not expose a locked article body", async () => {
    mockPublicPreviewFetch();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE);

    await user.click(await screen.findByRole("button", { name: /Articol blocat/ }));
    expect(screen.queryByText("Need the right resin volume.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Blocat")).toBeInTheDocument();
  });

  it("does not auto-open a locked body when search hides the current unlocked article", async () => {
    mockPublicPreviewFetch();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE);

    await waitFor(() => {
      expect(screen.getByText("Measure the cavity, then calculate.")).toBeInTheDocument();
    });
    await user.type(screen.getByRole("searchbox", { name: "Filtrează lista" }), "Articol blocat");

    expect(screen.queryByText("Measure the cavity, then calculate.")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Disponibil cu un abonament HFZWood" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Articol blocat/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("selects the first remaining unlocked article when search removes the current selection", async () => {
    mockPublicPreviewFetch();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE);

    await waitFor(() => {
      expect(screen.getByText("Measure the cavity, then calculate.")).toBeInTheDocument();
    });
    await user.type(screen.getByRole("searchbox", { name: "Filtrează lista" }), "bulele");

    expect(screen.queryByText("Measure the cavity, then calculate.")).not.toBeInTheDocument();
    expect(screen.getAllByText("Air bubbles during pouring.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /De ce apar bulele de aer/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("scrolls the document owner to the unlocked article on initial auto-selection only", async () => {
    const viewport = installPreviewDocumentScrollMock();
    try {
      mockPublicPreviewFetch();
      const user = userEvent.setup();
      renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE);

      await waitFor(() => {
        expect(screen.getByText("Measure the cavity, then calculate.")).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(viewport.scrollTo).toHaveBeenCalledWith({
          top: expect.any(Number),
          behavior: "auto",
        });
      });
      const unlockedTitle = screen.getByRole("button", { name: /Cum calculez cantitatea de rasina/ });
      expect(document.activeElement).not.toBe(unlockedTitle);
      const initialCount = viewport.scrollTo.mock.calls.length;

      await user.click(screen.getByRole("button", { name: /De ce apar bulele de aer/ }));
      expect(viewport.scrollTo.mock.calls.length).toBe(initialCount);

      await user.click(screen.getByRole("button", { name: /Articol blocat/ }));
      expect(
        screen.getByRole("heading", { name: "Disponibil cu un abonament HFZWood" }),
      ).toBeInTheDocument();
      expect(viewport.scrollTo.mock.calls.length).toBe(initialCount);

      await user.type(screen.getByRole("searchbox", { name: "Filtrează lista" }), "bulele");
      expect(viewport.scrollTo.mock.calls.length).toBe(initialCount);
    } finally {
      viewport.restore();
    }
  });
});
