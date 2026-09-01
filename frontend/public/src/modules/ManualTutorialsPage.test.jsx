import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPublishedManualFetch } from "../manual/manualTestHelpers.js";
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

function expectDedicatedManualShell() {
  const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
  expect(within(sidebar).getAllByText("Manual & Tutorials")[0]).toBeInTheDocument();
  const header = screen.getByRole("banner", { name: "Module header" });
  expect(within(header).getByText("Manual & Tutorials")).toBeInTheDocument();
  expect(within(sidebar).getByRole("link", { name: "Home" })).toBeInTheDocument();
}

describe("ManualTutorialsPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    mockPublishedManualFetch();
  });

  it("loads manual content from the public API", async () => {
    const fetchMock = mockPublishedManualFetch();
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Introduction", level: 2 })).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/content/manual?locale=en",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it("renders the dedicated manual module for authenticated users", async () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.MANUAL);

    expectDedicatedManualShell();
    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Table of contents" })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Manual & Tutorials", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Introduction", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Polygons and Volume", level: 2 })).toBeInTheDocument();
    expect(screen.getByTitle("Calibration walkthrough")).toBeInTheDocument();
    expect(screen.queryByText(/Coming in a future phase/i)).not.toBeInTheDocument();
  });

  it("shows all manual sections in one continuous document", async () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.MANUAL);

    const main = screen.getByRole("main");
    await waitFor(() => {
      expect(within(main).getByText(/HFZWood helps woodworkers estimate epoxy resin volume/i)).toBeInTheDocument();
    });
    expect(within(main).getByText(/Review the pouring plan and safety margin/i)).toBeInTheDocument();
  });

  it("renders inline figures for tutorial video and supporting images", async () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByTitle("Calibration walkthrough")).toBeInTheDocument();
    });
    expect(screen.getByRole("img", { name: "Wood and epoxy resin in a workshop setting" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Reference photographs anchor the workflow. The manual places supporting visuals directly beside the explanation they clarify./i,
      ),
    ).toBeInTheDocument();
  });

  it("jumps directly to a section when a table-of-contents item is clicked", async () => {
    seedAuthenticatedSession();
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    const user = userEvent.setup();
    renderWorkspace(ROUTES.MANUAL);

    const tocButton = await screen.findByRole("button", { name: "Polygons and Volume" });
    await user.click(tocButton);

    const section = document.getElementById("polygons-and-volume");
    expect(section).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("blocks guest access in the dedicated module layout", () => {
    renderWorkspace(ROUTES.MANUAL);

    expectDedicatedManualShell();
    expect(
      screen.getByText(/Create your free HFZWood account to unlock this section/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Table of contents" })).not.toBeInTheDocument();
  });

  it("shows unavailable copy when the EN published payload has no chapters", async () => {
    mockPublishedManualFetch([], { available: false, englishAvailable: false });
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.MANUAL);

    expect(
      await screen.findByText("Manual content is not yet available in the selected language."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Table of contents" })).not.toBeInTheDocument();
  });

  it("renders published EN chapters instead of the unavailable message", async () => {
    const enSections = Array.from({ length: 18 }, (_, index) => ({
      id: `chapter-${index + 1}`,
      title: `Chapter ${index + 1}`,
      blocks: [{ type: "paragraph", text: `Body ${index + 1}.` }],
    }));
    mockPublishedManualFetch(enSections, { available: true, englishAvailable: true });
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.MANUAL);

    expect(await screen.findByRole("heading", { name: "Chapter 1", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chapter 18", level: 2 })).toBeInTheDocument();
    expect(
      screen.queryByText("Manual content is not yet available in the selected language."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Table of contents" })).toBeInTheDocument();
  });

  it("shows a load error instead of unavailable copy when the API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        const requestUrl = String(url);
        if (requestUrl.includes("/api/content/public-languages")) {
          return {
            ok: true,
            json: async () => ({
              defaultPublicLocale: "en",
              activePublicLocales: ["en", "ro", "fr"],
            }),
          };
        }
        return { ok: false, status: 401 };
      }),
    );
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.MANUAL);

    expect(
      await screen.findByText("Manual content could not be loaded. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Manual content is not yet available in the selected language."),
    ).not.toBeInTheDocument();
  });
});
