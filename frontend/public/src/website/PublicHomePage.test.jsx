import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import {
  buildPublishedHomeResponse,
  mockPublishedWebsiteFetch,
} from "./websiteTestHelpers.js";

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

function publishHome(bodyOverrides = {}) {
  return mockPublishedWebsiteFetch({
    pages: {
      home: buildPublishedHomeResponse(bodyOverrides),
    },
  });
}

describe("PublicHomePage CMS integration (Stage 6C)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("requests published CMS Home with page key home", async () => {
    const fetchMock = publishHome();
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/content/website/home?locale=en");
    });
  });

  it("replaces hero headline and subtitle with CMS fields", async () => {
    publishHome({
      publicTitle: "CMS Headline",
      subtitle: "CMS Subtitle",
      description: "CMS Description",
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "CMS Headline", level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByText("CMS Subtitle")).toBeInTheDocument();
    expect(
      screen.queryByText(/Professional Resin Calculator for Woodworking Projects/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/From Photo to Precise Resin Estimate/i)).not.toBeInTheDocument();
  });

  it("replaces guest marketing body with CMS description", async () => {
    publishHome({ description: "Shared CMS Description" });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByText("Shared CMS Description")).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/The first platform that gives woodworkers and resin enthusiasts/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login / Register" })).toBeInTheDocument();
  });

  it("renders blank-line separated CMS description as separate paragraphs", async () => {
    publishHome({ description: "First home paragraph.\n\nSecond home paragraph." });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByText("First home paragraph.")).toBeInTheDocument();
    });
    expect(screen.getByText("Second home paragraph.")).toBeInTheDocument();
    const first = screen.getByText("First home paragraph.");
    const second = screen.getByText("Second home paragraph.");
    expect(first.tagName).toBe("P");
    expect(second.tagName).toBe("P");
    expect(first).not.toBe(second);
  });

  it("replaces authenticated marketing body with the same CMS description", async () => {
    seedAuthenticatedSession();
    publishHome({ description: "Shared CMS Description" });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByText("Shared CMS Description")).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/Welcome to HFZWood — your workspace for resin estimation/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Account" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login / Register" })).not.toBeInTheDocument();
  });

  it("renders hero image only when visible", async () => {
    publishHome({
      image: {
        src: "/api/content/website/images/hero.png",
        alt: "Workshop hero",
        visible: true,
      },
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Workshop hero" })).toHaveAttribute(
        "src",
        "/api/content/website/images/hero.png",
      );
    });
  });

  it("does not render hero image when hidden", async () => {
    publishHome({
      image: {
        src: "/api/content/website/images/hero.png",
        alt: "Workshop hero",
        visible: false,
      },
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByText("CMS Home Description")).toBeInTheDocument();
    });
    expect(screen.queryByRole("img", { name: "Workshop hero" })).not.toBeInTheDocument();
  });

  it("renders internal CTA with SPA navigation", async () => {
    publishHome({
      cta: { label: "See pricing", destination: "/pricing", visible: true },
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "See pricing" })).toHaveAttribute("href", "/pricing");
    });
  });

  it("renders external CTA as a safe anchor", async () => {
    publishHome({
      cta: { label: "Learn more", destination: "https://example.com/guide", visible: true },
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "Learn more" });
      expect(link).toHaveAttribute("href", "https://example.com/guide");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("does not render incomplete or hidden CTA", async () => {
    publishHome({
      cta: { label: "Hidden", destination: "/pricing", visible: false },
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByText("CMS Home Description")).toBeInTheDocument();
    });
    expect(screen.queryByRole("link", { name: "Hidden" })).not.toBeInTheDocument();
  });

  it("does not render View Pricing when CMS visible is false", async () => {
    publishHome({
      cta: { label: "View Pricing", destination: "/pricing", visible: false },
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByText("CMS Home Description")).toBeInTheDocument();
    });
    expect(screen.queryByRole("link", { name: "View Pricing" })).not.toBeInTheDocument();
    expect(document.querySelector(".public-home__cta")).toBeNull();
  });

  it("renders supported visible video", async () => {
    publishHome({
      video: { url: "https://www.youtube.com/watch?v=abc123xyz", visible: true },
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByTitle("Home video")).toHaveAttribute(
        "src",
        "https://www.youtube.com/embed/abc123xyz",
      );
    });
  });

  it("hides invisible video", async () => {
    publishHome({
      video: { url: "https://www.youtube.com/watch?v=abc123xyz", visible: false },
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByText("CMS Home Description")).toBeInTheDocument();
    });
    expect(screen.queryByTitle("Home video")).not.toBeInTheDocument();
  });

  it("preserves guest i18n Home when CMS is unavailable", async () => {
    mockPublishedWebsiteFetch({ unavailableKeys: ["home"] });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(
        screen.getByText(/The first platform that gives woodworkers and resin enthusiasts/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
      /Professional Resin Calculator/i,
    );
  });

  it("preserves authenticated i18n Home when CMS is unavailable", async () => {
    seedAuthenticatedSession();
    mockPublishedWebsiteFetch({ unavailableKeys: ["home"] });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(
        screen.getByText(/Welcome to HFZWood — your workspace for resin estimation/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("preserves i18n Home on API error", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes("/api/content/public-languages")) {
        return {
          ok: true,
          json: async () => ({
            defaultPublicLocale: "en",
            activePublicLocales: ["en", "ro"],
          }),
        };
      }
      if (String(url).includes("/api/content/website/home")) {
        throw new Error("network down");
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(
        screen.getByText(/The first platform that gives woodworkers and resin enthusiasts/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps i18n Home when requested locale is unavailable even if English CMS exists", async () => {
    mockPublishedWebsiteFetch({
      unavailableKeys: ["home"],
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(
        screen.getByText(/The first platform that gives woodworkers and resin enthusiasts/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "View English version" })).not.toBeInTheDocument();
  });

  it("does not duplicate headline or description and keeps a single footer", async () => {
    publishHome({
      publicTitle: "One Headline",
      subtitle: "One Subtitle",
      description: "One Description",
    });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(screen.getByText("One Description")).toBeInTheDocument();
    });
    expect(screen.getAllByRole("heading", { name: "One Headline", level: 1 })).toHaveLength(1);
    expect(screen.getAllByText("One Description")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo", { name: "Website footer" })).toHaveLength(1);
  });

  it("keeps Manual dedicated module unaffected", async () => {
    seedAuthenticatedSession();
    mockPublishedWebsiteFetch();
    const { mockPublishedManualFetch } = await import("../manual/manualTestHelpers.js");
    mockPublishedManualFetch();
    renderWorkspace(ROUTES.MANUAL);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Manual & Tutorials", level: 1 })).toBeInTheDocument();
    });
    expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();
  });
});
