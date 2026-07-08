import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPublishedGlossaryFetch } from "../glossary/glossaryTestHelpers.js";
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

function expectDedicatedGlossaryShell() {
  expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
  const header = screen.getByRole("banner", { name: "Module header" });
  expect(within(header).getByText("Glossary")).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Module navigation" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
}

describe("GlossaryPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    mockPublishedGlossaryFetch();
  });

  it("renders the dedicated glossary module for authenticated users", async () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.GLOSSARY);

    expectDedicatedGlossaryShell();
    expect(screen.getByRole("heading", { name: "Glossary", level: 1 })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: "Search glossary" })).toBeInTheDocument();
    });
    expect(screen.getByRole("navigation", { name: "Alphabetical index" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Epoxy resin" })).toBeInTheDocument();
    expect(screen.queryByText(/Coming in a future phase/i)).not.toBeInTheDocument();
  });

  it("filters glossary entries immediately from the search field", async () => {
    seedAuthenticatedSession();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.GLOSSARY);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Epoxy resin" })).toBeInTheDocument();
    });

    await user.type(screen.getByRole("searchbox", { name: "Search glossary" }), "bubble");

    expect(screen.getByRole("button", { name: "Bubble removal" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Epoxy resin" })).not.toBeInTheDocument();
  });

  it("expands a single dictionary entry with a plus/minus indicator", async () => {
    seedAuthenticatedSession();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.GLOSSARY);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Epoxy resin" })).toBeInTheDocument();
    });

    const epoxyToggle = screen.getByRole("button", { name: "Epoxy resin" });
    expect(epoxyToggle).toHaveAttribute("aria-expanded", "false");
    await user.click(epoxyToggle);

    expect(screen.getByRole("button", { name: "Epoxy resin" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      screen.getByText(/A two-component polymer system that cures when resin and hardener are mixed/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Wood and epoxy resin in a workshop setting" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hardener" }));
    expect(screen.getByRole("button", { name: "Epoxy resin" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "Hardener" })).toHaveAttribute("aria-expanded", "true");
  });

  it("jumps directly to a letter section from the A–Z index", async () => {
    seedAuthenticatedSession();
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    const user = userEvent.setup();
    renderWorkspace(ROUTES.GLOSSARY);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "F" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "F" }));

    expect(document.getElementById("glossary-letter-f")).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("opens and scrolls to the first matching entry when Enter is pressed in search", async () => {
    seedAuthenticatedSession();
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    const user = userEvent.setup();
    renderWorkspace(ROUTES.GLOSSARY);

    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: "Search glossary" })).toBeInTheDocument();
    });

    const search = screen.getByRole("searchbox", { name: "Search glossary" });
    await user.type(search, "epoxy{Enter}");

    expect(search).toHaveValue("epoxy");
    expect(search).toHaveFocus();
    expect(screen.getByRole("button", { name: "Epoxy resin" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(document.getElementById("glossary-entry-epoxy-resin")).toBeTruthy();
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
    });
  });

  it("shows a loading state before glossary content is available", () => {
    seedAuthenticatedSession();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderWorkspace(ROUTES.GLOSSARY);

    expect(screen.getByText(/Loading glossary/i)).toBeInTheDocument();
  });

  it("renders discreet relationship rows when expanded", async () => {
    seedAuthenticatedSession();
    const user = userEvent.setup();
    mockPublishedGlossaryFetch([
      {
        id: "resin",
        term: "Resin",
        definition: ["Base polymer component."],
        media: [],
        relatedTerms: [{ id: "hardener", term: "Hardener" }],
        synonyms: [{ id: "epoxy-resin", term: "Epoxy resin" }],
        seeAlso: [
          {
            targetType: "manual_chapter",
            targetId: "mixing",
            label: "Mixing basics",
            href: "/manual#mixing",
          },
        ],
      },
      {
        id: "hardener",
        term: "Hardener",
        definition: ["Curing agent."],
        media: [],
        relatedTerms: [],
        synonyms: [],
        seeAlso: [],
      },
    ]);

    renderWorkspace(ROUTES.GLOSSARY);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Resin" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Resin" }));

    expect(screen.getByText(/Also called:/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Epoxy resin" })).toBeInTheDocument();
    expect(screen.getByText(/Related:/i)).toBeInTheDocument();
    const resinEntry = document.getElementById("glossary-entry-resin");
    expect(within(resinEntry).getByRole("button", { name: "Hardener" })).toBeInTheDocument();
    expect(screen.getByText(/See also:/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mixing basics" })).toHaveAttribute("href", "/manual#mixing");
  });

  it("blocks guest access in the dedicated module layout", () => {
    renderWorkspace(ROUTES.GLOSSARY);

    expectDedicatedGlossaryShell();
    expect(
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Login / Register" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: "Search glossary" })).not.toBeInTheDocument();
  });
});
