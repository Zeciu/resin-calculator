import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_ROUTES } from "../admin/adminRoutes.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { WEBSITE_FOOTER_LINKS, WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";
import { mockPublishedWebsiteFetch } from "./websiteTestHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const PUBLIC_PAGES = [
  { path: ROUTES.ABOUT, pageKey: WEBSITE_PAGE_KEYS.ABOUT, label: "About HFZWood" },
  { path: ROUTES.PRICING, pageKey: WEBSITE_PAGE_KEYS.PRICING, label: "Pricing" },
  { path: ROUTES.PRIVACY, pageKey: WEBSITE_PAGE_KEYS.PRIVACY, label: "Privacy Policy" },
  { path: ROUTES.TERMS, pageKey: WEBSITE_PAGE_KEYS.TERMS, label: "Terms of Service" },
  { path: ROUTES.CONTACT, pageKey: WEBSITE_PAGE_KEYS.CONTACT, label: "Contact" },
];

function seedAuthenticatedSession({ role = "user" } = {}) {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        id: "stub-user",
        email: "user@example.com",
        username: "user",
        role,
      },
    }),
  );
}

function expectFooter(container = document) {
  const footer = within(container instanceof HTMLElement ? container : document.body).getByRole(
    "contentinfo",
    { name: "Website footer" },
  );
  const links = within(footer).getAllByRole("link");
  expect(links).toHaveLength(5);
  expect(links.map((link) => link.getAttribute("href"))).toEqual(
    WEBSITE_FOOTER_LINKS.map((item) => item.path),
  );
  expect(links.map((link) => link.textContent)).toEqual([
    "About HFZWood",
    "Pricing",
    "Privacy Policy",
    "Terms of Service",
    "Contact",
  ]);
  return footer;
}

describe("Public Website infrastructure (Stage 6B)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
    mockPublishedWebsiteFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(PUBLIC_PAGES)("resolves $path publicly without AuthRouteGuard", async ({ path, pageKey, label }) => {
    const fetchMock = mockPublishedWebsiteFetch();
    renderWorkspace(path);

    expect(screen.queryByText(/Create your free HFZWood account to unlock this section/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: `Published ${pageKey}`, level: 1 })).toBeInTheDocument();
    });

    expect(screen.getByRole("article", { name: label })).toHaveAttribute("data-page-key", pageKey);
    expect(fetchMock).toHaveBeenCalledWith(`/api/content/website/${pageKey}?locale=en`);
    expectFooter();
  });

  it("shows ContentUnavailableMessage and English action when unavailable", async () => {
    mockPublishedWebsiteFetch({ unavailableKeys: ["about"] });
    renderWorkspace(ROUTES.ABOUT);

    await waitFor(() => {
      expect(
        screen.getByText(/This page is not yet available in the selected language/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "View English version" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("shows the footer on guest Home without changing Home content", async () => {
    renderWorkspace(ROUTES.HOME);

    expect(
      screen.getByText(/The first platform that gives woodworkers and resin enthusiasts/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform overview video placeholder/i)).toBeInTheDocument();
    expectFooter();
  });

  it("shows the footer on authenticated Home without changing Home content", async () => {
    seedAuthenticatedSession();
    renderWorkspace(ROUTES.HOME);

    expect(
      screen.getByText(/Welcome to HFZWood — your workspace for resin estimation/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform overview video placeholder/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Account" })).toBeInTheDocument();
    expectFooter();
  });

  it("does not show the Website footer in DedicatedModuleLayout", async () => {
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

  it("does not show the Website footer in Admin", async () => {
    seedAuthenticatedSession({ role: "administrator" });
    renderWorkspace(ADMIN_ROUTES.ROOT);

    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Administration navigation" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();
  });

  it("keeps Manual, Glossary and Knowledge Base routes unaffected", async () => {
    seedAuthenticatedSession();
    const { mockPublishedManualFetch } = await import("../manual/manualTestHelpers.js");
    mockPublishedManualFetch();
    renderWorkspace(ROUTES.MANUAL);

    expect(screen.queryByRole("contentinfo", { name: "Website footer" })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Manual & Tutorials", level: 1 })).toBeInTheDocument();
    });
  });
});
