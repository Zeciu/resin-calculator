import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPublishedKnowledgeBaseFetch } from "../knowledgeBase/knowledgeBaseTestHelpers.js";
import { FREE_CAPABILITIES } from "../capabilities/capabilityDefaults.js";
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

function expectDedicatedKnowledgeBaseShell() {
  const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
  expect(within(sidebar).getByText("Knowledge Base")).toBeInTheDocument();
  const header = screen.getByRole("banner", { name: "Module header" });
  expect(within(header).getByText("Knowledge Base")).toBeInTheDocument();
  expect(within(sidebar).getByRole("link", { name: "Home" })).toBeInTheDocument();
}

async function waitForKnowledgeBaseReady() {
  await waitFor(() => {
    expect(screen.getByRole("searchbox", { name: "Search knowledge base" })).toBeInTheDocument();
  });
}

describe("KnowledgeBasePage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    mockPublishedKnowledgeBaseFetch();
  });

  it("shows a loading state before entries are ready", () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    expect(screen.getByRole("status")).toHaveTextContent(/Loading knowledge base/i);
  });

  it("renders the dedicated knowledge base module for authenticated users", async () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);

    await waitForKnowledgeBaseReady();

    expectDedicatedKnowledgeBaseShell();
    expect(screen.getByRole("heading", { name: "Knowledge Base", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search knowledge base" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bubbles after curing" })).toBeInTheDocument();
    expect(screen.queryByText(/Coming in a future phase/i)).not.toBeInTheDocument();
  });

  it("renders the server-provided entries without a client-side limit", async () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    expect(screen.getByRole("button", { name: "Sanding scratches visible through finish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pour overheating" })).toBeInTheDocument();
  });

  it("shows the free preview message with the server-provided subset", async () => {
    mockPublishedKnowledgeBaseFetch([
      {
        id: "free-entry",
        title: "Free article",
        problemSummary: "Preview content.",
        symptoms: [],
        possibleCauses: [],
        solution: ["Preview solution."],
      },
    ]);
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    expect(screen.getByRole("button", { name: "Free article" })).toBeInTheDocument();
    expect(
      screen.getByText(/You are viewing a selection of Knowledge Base articles/i),
    ).toBeInTheDocument();
  });

  it("shows unlimited articles for subscriber accounts", async () => {
    seedAuthenticatedSession();
    mockPublishedKnowledgeBaseFetch(undefined, {
      role: "user",
      accessTier: "subscriber",
      catalogVersion: 1,
      capabilities: {
        ...FREE_CAPABILITIES,
        "knowledgeBase.maxArticles": null,
      },
    });
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    expect(screen.getByRole("button", { name: "Pour overheating" })).toBeInTheDocument();
    expect(
      screen.queryByText(/You are viewing a selection of Knowledge Base articles/i),
    ).not.toBeInTheDocument();
  });

  it("shows an accessible back-to-top button after page scrolling and returns to the top", async () => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0, writable: true });
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", { configurable: true, value: scrollTo, writable: true });
    seedAuthenticatedSession();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    expect(screen.queryByRole("button", { name: "Back to top" })).not.toBeInTheDocument();

    window.scrollY = 601;
    fireEvent.scroll(window);
    const backToTop = screen.getByRole("button", { name: "Back to top" });
    expect(backToTop).toHaveAttribute("title", "Back to top");

    await user.click(backToTop);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

    window.scrollY = 0;
    fireEvent.scroll(window);
    expect(screen.queryByRole("button", { name: "Back to top" })).not.toBeInTheDocument();
  });

  it("filters entries immediately from the search field", async () => {
    seedAuthenticatedSession();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    await user.type(screen.getByRole("searchbox", { name: "Search knowledge base" }), "sticky");

    expect(screen.getByRole("button", { name: "Resin remains sticky" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bubbles after curing" })).not.toBeInTheDocument();
  });

  it("shows a friendly empty state when no entries match", async () => {
    seedAuthenticatedSession();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    await user.type(
      screen.getByRole("searchbox", { name: "Search knowledge base" }),
      "zzzz-no-match",
    );

    expect(screen.getByText("No matching entries found.")).toBeInTheDocument();
    expect(screen.getByText("Try different keywords.")).toBeInTheDocument();
  });

  it("expands a single troubleshooting entry with structured sections", async () => {
    seedAuthenticatedSession();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    const toggle = screen.getByRole("button", { name: "Resin remains sticky" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);

    expect(screen.getByRole("button", { name: "Resin remains sticky" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Solution", level: 3 })).toBeInTheDocument();
    expect(screen.getByText(/Verify the manufacturer mixing ratio/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cloudy epoxy" }));
    expect(screen.getByRole("button", { name: "Resin remains sticky" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "Cloudy epoxy" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("renders optional image and video media inside expanded entries", async () => {
    seedAuthenticatedSession();
    mockPublishedKnowledgeBaseFetch(undefined, {
      role: "user",
      accessTier: "subscriber",
      catalogVersion: 1,
      capabilities: {
        ...FREE_CAPABILITIES,
        "knowledgeBase.maxArticles": null,
      },
    });
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    await user.click(screen.getByRole("button", { name: "Sanding scratches visible through finish" }));
    expect(
      screen.getByRole("img", { name: "Finished wood and epoxy surface in a workshop" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Project import problems" }));
    expect(
      screen.getByTitle("Working with saved HFZWood projects"),
    ).toBeInTheDocument();
  });

  it("opens and scrolls to the first matching entry when Enter is pressed in search", async () => {
    seedAuthenticatedSession();
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    const search = screen.getByRole("searchbox", { name: "Search knowledge base" });
    await user.type(search, "cloudy{Enter}");

    expect(search).toHaveValue("cloudy");
    expect(search).toHaveFocus();
    expect(screen.getByRole("button", { name: "Cloudy epoxy" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(document.getElementById("knowledge-base-entry-cloudy-epoxy")).toBeTruthy();
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
    });
  });

  it("renders discreet relationship links inside expanded entries", async () => {
    mockPublishedKnowledgeBaseFetch([
      {
        id: "sticky-resin-after-cure",
        title: "Resin remains sticky",
        problemSummary: "Surface stays tacky.",
        symptoms: [],
        possibleCauses: [],
        solution: ["Check mixing ratio."],
        prevention: [],
        tips: [],
        warnings: [],
        relatedKbArticles: [{ id: "cloudy-epoxy", label: "Cloudy epoxy" }],
        relatedGlossaryTerms: [{ id: "pot-life", label: "Pot life" }],
        relatedManualChapters: [{ id: "mixing-basics", label: "Mixing basics" }],
      },
      {
        id: "cloudy-epoxy",
        title: "Cloudy epoxy",
        problemSummary: "Hazy finish.",
        symptoms: [],
        possibleCauses: [],
        solution: ["Warm the resin."],
        prevention: [],
        tips: [],
        warnings: [],
      },
    ]);

    seedAuthenticatedSession();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    await user.click(screen.getByRole("button", { name: "Resin remains sticky" }));
    const expandedEntry = document.getElementById("knowledge-base-entry-sticky-resin-after-cure");
    expect(within(expandedEntry).getByRole("heading", { name: "Related Articles", level: 3 })).toBeInTheDocument();
    expect(within(expandedEntry).getByRole("heading", { name: "Glossary", level: 3 })).toBeInTheDocument();
    expect(within(expandedEntry).getByRole("heading", { name: "Manual", level: 3 })).toBeInTheDocument();
    expect(within(expandedEntry).getByRole("button", { name: "Cloudy epoxy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pot life" })).toHaveAttribute(
      "href",
      "/glossary#glossary-entry-pot-life",
    );
    expect(screen.getByRole("link", { name: "Mixing basics" })).toBeInTheDocument();
  });

  it("uses populated semantic cards and omits cards without content", async () => {
    mockPublishedKnowledgeBaseFetch([
      {
        id: "solution-only",
        title: "Solution-only article",
        problemSummary: "",
        symptoms: [],
        possibleCauses: [],
        solution: ["Use the existing solution."],
        prevention: [],
        tips: [],
        warnings: [],
      },
    ]);
    seedAuthenticatedSession();
    const user = userEvent.setup();
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    await user.click(screen.getByRole("button", { name: "Solution-only article" }));

    const article = document.getElementById("knowledge-base-entry-solution-only");
    expect(within(article).getByRole("heading", { name: "Solution", level: 3 })).toBeInTheDocument();
    expect(article.querySelectorAll(".knowledge-base-entry__card")).toHaveLength(1);
    expect(within(article).queryByRole("heading", { name: "Possible Causes", level: 3 })).not.toBeInTheDocument();
    expect(within(article).queryByRole("heading", { name: "Prevention", level: 3 })).not.toBeInTheDocument();
  });

  it("navigates from a related glossary term to the exact glossary entry", async () => {
    mockPublishedKnowledgeBaseFetch([
      {
        id: "min-thickness",
        title: "Why is a minimum resin thickness recommended?",
        problemSummary: "Thin pours can fail to cure evenly.",
        symptoms: [],
        possibleCauses: [],
        solution: ["Follow recommended thickness."],
        prevention: [],
        tips: [],
        warnings: [],
        relatedGlossaryTerms: [{ id: "exothermic-reaction", label: "Exothermic reaction" }],
      },
    ]);

    seedAuthenticatedSession();
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.KNOWLEDGE_BASE);
    await waitForKnowledgeBaseReady();

    await user.click(
      screen.getByRole("button", { name: "Why is a minimum resin thickness recommended?" }),
    );
    await user.click(screen.getByRole("link", { name: "Exothermic reaction" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Glossary", level: 1 })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Exothermic reaction" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });
    expect(router.state.location.pathname).toBe(ROUTES.GLOSSARY);
    expect(router.state.location.hash).toBe("#glossary-entry-exothermic-reaction");
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
    });

    router.navigate(-1);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Knowledge Base", level: 1 })).toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe(ROUTES.KNOWLEDGE_BASE);
  });

  it("blocks guest access in the dedicated module layout", () => {
    renderWorkspace(ROUTES.KNOWLEDGE_BASE);

    expectDedicatedKnowledgeBaseShell();
    expect(
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: "Search knowledge base" })).not.toBeInTheDocument();
  });
});
