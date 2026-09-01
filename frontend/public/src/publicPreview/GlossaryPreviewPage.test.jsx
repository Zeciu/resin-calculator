import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import {
  ORDERED_GLOSSARY_PREVIEW_ENTRIES,
  buildGlossaryPreviewResponse,
  expectNoAuthenticatedContentFetch,
  mockPublicPreviewFetch,
  installPreviewGlossaryScrollMock,
} from "./publicPreviewTestHelpers.js";

function expectPreviewBackLink() {
  const back = screen.getByRole("link", { name: /Înapoi la Previzualizare resurse/ });
  expect(back).toHaveAttribute("href", "/knowledge-preview");
  expect(back).toHaveClass("module-home-nav__link");
}

describe("Glossary public preview", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
    seedDevicePreferences({ interfaceLanguage: "ro" });
  });

  it("renders every returned term and opens the first unlocked definition immediately", async () => {
    const fetchMock = mockPublicPreviewFetch();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY);

    await waitFor(
      () => {
        expect(screen.getByText("A two-part resin used in woodworking.")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
    const unlockedTerm = screen.getByRole("button", { name: /Rășină epoxidică/ });
    expectPreviewBackLink();
    expect(unlockedTerm).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Reacție exotermă/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bule de aer/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Termen blocat Blocat/ })).toBeInTheDocument();
    expect(screen.getAllByText("Disponibil în previzualizare").length).toBeGreaterThan(0);
    expect(unlockedTerm.closest(".knowledge-preview-available")).not.toBeNull();
    const previewImage = screen.getByRole("img", { name: "Epoxy resin preview" });
    expect(previewImage).toHaveAttribute("src", "/api/public-preview/glossary/images/preview-resin.png");
    expect(screen.getByRole("link", { name: "Prima turnare" })).toHaveAttribute(
      "href",
      "/knowledge-preview/manual#prima-turnare",
    );
    expect(document.activeElement).not.toBe(unlockedTerm);
    expectNoAuthenticatedContentFetch(fetchMock);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/public-preview\/glossary\?locale=/),
    );
  });

  it("keeps alphabetical grouping while auto-opening the first unlocked API term", async () => {
    mockPublicPreviewFetch({
      glossary: buildGlossaryPreviewResponse({
        locale: "ro",
        entries: ORDERED_GLOSSARY_PREVIEW_ENTRIES,
      }),
    });
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY);

    await waitFor(() => {
      expect(screen.getByText("First unlocked glossary definition from API order.")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Zahăr deblocat/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: /Alune deblocat/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      screen.queryByText("Alphabetically first unlocked term, not first in API order."),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "A",
      "M",
      "Z",
    ]);
    const termButtons = screen
      .getAllByRole("button")
      .map((button) => button.textContent)
      .filter((label) => /deblocat|blocat/.test(label));
    expect(termButtons[0]).toMatch(/Alune deblocat/);
    expect(termButtons[1]).toMatch(/Mango blocat/);
    expect(termButtons[2]).toMatch(/Zahăr deblocat/);
  });

  it("keeps related glossary targets inside the preview and shows the locked explanation", async () => {
    mockPublicPreviewFetch();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY);

    const expanded = await waitFor(() => {
      const definition = screen.getByText("A two-part resin used in woodworking.");
      return definition.closest("article");
    });
    await user.click(within(expanded).getByRole("button", { name: "Termen blocat" }));
    expect(
      screen.getByRole("heading", { name: "Disponibil cu un abonament HFZWood" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Acest termen face parte din Glosarul HFZWood complet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vezi planurile" })).toHaveAttribute("href", "/pricing");
  });

  it("does not reconstruct locked definitions", async () => {
    mockPublicPreviewFetch();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY);

    await user.click(await screen.findByRole("button", { name: /Termen blocat Blocat/ }));
    expect(screen.queryByText("A two-part resin used in woodworking.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Blocat")).toBeInTheDocument();
  });

  it("does not auto-open a locked definition when search hides the current unlocked term", async () => {
    mockPublicPreviewFetch();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY);

    await waitFor(() => {
      expect(screen.getByText("A two-part resin used in woodworking.")).toBeInTheDocument();
    });
    await user.type(screen.getByRole("searchbox", { name: "Filtrează lista" }), "Termen blocat");

    expect(screen.queryByText("A two-part resin used in woodworking.")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Disponibil cu un abonament HFZWood" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Termen blocat Blocat/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("scrolls the Glossary list scroller to the unlocked definition on initial auto-selection only", async () => {
    const viewport = installPreviewGlossaryScrollMock();
    try {
      mockPublicPreviewFetch();
      const user = userEvent.setup();
      renderWorkspace(ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY);

      await waitFor(() => {
        expect(screen.getByText("A two-part resin used in woodworking.")).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(viewport.listScrollTo).toHaveBeenCalledWith({
          top: expect.any(Number),
          behavior: "auto",
        });
      });
      expect(viewport.windowScrollTo).not.toHaveBeenCalled();
      const unlockedTerm = screen.getByRole("button", { name: /Rășină epoxidică/ });
      expect(document.activeElement).not.toBe(unlockedTerm);
      const initialCount = viewport.listScrollTo.mock.calls.length;

      await user.click(screen.getByRole("button", { name: /Bule de aer/ }));
      expect(viewport.listScrollTo.mock.calls.length).toBe(initialCount);

      await user.click(screen.getByRole("button", { name: /Termen blocat Blocat/ }));
      expect(
        screen.getByRole("heading", { name: "Disponibil cu un abonament HFZWood" }),
      ).toBeInTheDocument();
      expect(viewport.listScrollTo.mock.calls.length).toBe(initialCount);

      await user.type(screen.getByRole("searchbox", { name: "Filtrează lista" }), "bule");
      expect(viewport.listScrollTo.mock.calls.length).toBe(initialCount);
    } finally {
      viewport.restore();
    }
  });
});
