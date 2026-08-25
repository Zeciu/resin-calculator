import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockCapabilitiesFetch, seedDevicePreferences } from "../preferences/testHelpers.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";

const stylesSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../styles.css"),
  "utf8",
);

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const MOCK_USER = {
  id: "stub-user",
  email: "account@example.com",
  username: "accountuser",
};

function seedAuthenticatedSession(user = MOCK_USER) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user }));
}

function checkoutSessionCalls(fetchMock) {
  return fetchMock.mock.calls.filter(([url]) =>
    String(url).includes("/api/billing/checkout-session"),
  );
}

describe("My Account page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    mockCapabilitiesFetch();
    seedDevicePreferences({ interfaceLanguage: "en", lengthUnit: "mm", volumeUnit: "L" });
  });

  it("renders profile email and does not render the technical username", async () => {
    const cognitoUsername = "333438e2-2071-70e3-d6bd-5ec9feae7bdc";
    seedAuthenticatedSession({ ...MOCK_USER, username: cognitoUsername, role: "user" });
    renderWorkspace(ROUTES.ACCOUNT);

    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { name: "My Account" })).toBeInTheDocument();
    expect(within(main).queryByText("Username")).not.toBeInTheDocument();
    expect(within(main).queryByText(cognitoUsername)).not.toBeInTheDocument();
    expect(within(main).getByText("Email")).toBeInTheDocument();
    expect(within(main).getByText("account@example.com")).toBeInTheDocument();
  });

  it("shows subscription plan and subscribe action", async () => {
    seedAuthenticatedSession({ ...MOCK_USER, role: "user" });
    renderWorkspace(ROUTES.ACCOUNT);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Subscribe/i })).toBeInTheDocument();
    });
    expect(screen.getByText("Current plan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Refresh status/i })).toBeInTheDocument();
  });

  it("links from Subscription to the public Pricing page with sage primary-action styling", async () => {
    seedAuthenticatedSession({ ...MOCK_USER, role: "user" });
    renderWorkspace(ROUTES.ACCOUNT);

    const pricingCta = screen.getByRole("link", { name: "View plans and pricing" });
    expect(pricingCta).toHaveAttribute("href", ROUTES.PRICING);
    expect(pricingCta).toHaveClass("my-account-page__pricing-cta");
    expect(screen.getByRole("link", { name: "Application Preferences" })).toHaveClass(
      "my-account-page__preferences-cta",
    );

    const pricingBlock = stylesSource.match(/\.my-account-page__pricing-cta\s*\{([^}]+)\}/)?.[1];
    const pricingHoverBlock = stylesSource.match(
      /\.my-account-page__pricing-cta:hover\s*\{([^}]+)\}/,
    )?.[1];
    const preferencesBlock = stylesSource.match(
      /\.my-account-page__preferences-cta\s*\{([^}]+)\}/,
    )?.[1];

    expect(pricingBlock).toMatch(/--sidebar-primary-fill:\s*#e6eee4;/);
    expect(pricingBlock).toMatch(/--sidebar-primary-fill-strong:\s*#dbe6d8;/);
    expect(pricingBlock).toMatch(/--sidebar-primary-border:\s*#c2cdc0;/);
    expect(pricingBlock).toMatch(/--sidebar-primary-border-strong:\s*#9aab98;/);
    expect(pricingBlock).toMatch(/--sidebar-primary-text:\s*#3d4f3c;/);
    expect(pricingBlock).toMatch(/background:\s*var\(--sidebar-primary-fill\);/);
    expect(pricingHoverBlock).toMatch(/background:\s*var\(--sidebar-primary-fill-strong\);/);
    expect(stylesSource).toMatch(
      /\.my-account-page__pricing-cta:focus-visible\s*\{[^}]*outline:\s*2px solid #9d6c3b;/,
    );
    expect(preferencesBlock).toMatch(/background:\s*#5a3d20;/);
  });

  it("routes Subscribe to Pricing without starting checkout", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCapabilitiesFetch();
    seedAuthenticatedSession({ ...MOCK_USER, role: "user" });
    const { router } = renderWorkspace(ROUTES.ACCOUNT);

    const subscribe = await screen.findByRole("button", { name: /^Subscribe$/i });
    expect(subscribe).toHaveClass("my-account-page__billing-button");
    expect(subscribe).not.toHaveClass("my-account-page__pricing-cta");
    expect(screen.getByRole("link", { name: "View plans and pricing" })).toHaveAttribute(
      "href",
      ROUTES.PRICING,
    );

    await user.click(subscribe);

    expect(router.state.location.pathname).toBe(ROUTES.PRICING);
    expect(checkoutSessionCalls(fetchMock)).toHaveLength(0);
  });

  it("keeps refresh status and Preferences independent of Subscribe routing", async () => {
    const user = userEvent.setup();
    const fetchMock = mockCapabilitiesFetch();
    seedAuthenticatedSession({ ...MOCK_USER, role: "user" });
    renderWorkspace(ROUTES.ACCOUNT);

    const refresh = await screen.findByRole("button", { name: /Refresh status/i });
    await user.click(refresh);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Refresh status/i })).toBeEnabled();
    });

    const statusCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/api/billing/status"),
    );
    const capabilityCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/api/me/capabilities"),
    );
    expect(statusCalls.length).toBeGreaterThan(1);
    expect(capabilityCalls.length).toBeGreaterThan(1);
    expect(checkoutSessionCalls(fetchMock)).toHaveLength(0);

    expect(screen.getByRole("link", { name: "Application Preferences" })).toHaveAttribute(
      "href",
      ROUTES.PREFERENCES,
    );
    expect(screen.getByRole("button", { name: /^Subscribe$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View plans and pricing" })).toHaveAttribute(
      "href",
      ROUTES.PRICING,
    );
  });

  it("links to application preferences", () => {
    seedAuthenticatedSession({ ...MOCK_USER, role: "user" });
    renderWorkspace(ROUTES.ACCOUNT);

    expect(screen.getByRole("link", { name: "Application Preferences" })).toHaveAttribute(
      "href",
      ROUTES.PREFERENCES,
    );
  });

  it("logs out from the account page and returns to guest login mode", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession({ ...MOCK_USER, role: "user" });
    renderWorkspace(ROUTES.ACCOUNT);

    const main = screen.getByRole("main");
    await user.click(within(main).getByRole("button", { name: /Log out/i }));

    expect(screen.getByRole("heading", { name: /Log in to HFZWood/i })).toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole("button", { name: /New Project/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Log out/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Free Account" })).toBeInTheDocument();
  });
});
