import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { mockPublishedWebsiteFetch } from "../website/websiteTestHelpers.js";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { localeBundleHasOwnKey, translate } from "../i18n/translate.js";

const REGISTER_COPY_KEYS = [
  "register.title",
  "register.promoNote",
  "register.viewSubscriptionPlans",
  "register.email",
  "register.username",
  "register.password",
  "register.confirmPassword",
  "register.submit",
  "register.submitting",
  "register.alreadyHaveAccount",
  "register.logIn",
  "preview.viewPlans",
];

describe("RegisterPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
    mockPublishedWebsiteFetch();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  async function fillBaseFields(user, { email = "new@example.com", username = "newuser" } = {}) {
    await user.type(screen.getByLabelText(/^email$/i), email);
    await user.type(screen.getByLabelText(/^username$/i), username);
  }

  it("allows typing password and confirm password without throwing", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.REGISTER);

    expect(screen.getByRole("heading", { name: /Create your HFZWood account/i })).toBeInTheDocument();
    await fillBaseFields(user);

    await expect(user.type(screen.getByLabelText(/^password$/i), "password123")).resolves.toBeUndefined();
    await expect(
      user.type(screen.getByLabelText(/^confirm password$/i), "password123"),
    ).resolves.toBeUndefined();

    expect(screen.queryByText(/Cannot read properties of null/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reading 'reset'/i)).not.toBeInTheDocument();
  });

  it("shows intended validation messages for short and mismatched passwords", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.REGISTER);

    await fillBaseFields(user);
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/^confirm password$/i), "different");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(screen.queryByText(/Cannot read properties of null/i)).not.toBeInTheDocument();
  });

  it("submits valid registration without rendering raw runtime reset errors", async () => {
    const user = userEvent.setup();
    renderWorkspace(ROUTES.REGISTER);

    await fillBaseFields(user);
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Welcome to HFZWood — your workspace for resin estimation/i),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/Cannot read properties of null/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reading 'reset'/i)).not.toBeInTheDocument();
  });

  it("resets safely after async confirmation-required registration", async () => {
    const user = userEvent.setup();
    const { sessionStorageTestAuthAdapter } = await import("../test/sessionStorageTestAuthAdapter.js");
    vi.spyOn(sessionStorageTestAuthAdapter, "register").mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ needsConfirmation: true, email: "confirm@example.com" });
          }, 20);
        }),
    );

    renderWorkspace(ROUTES.REGISTER);
    await fillBaseFields(user, { email: "confirm@example.com", username: "confirmuser" });
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Confirm your HFZWood account/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/Cannot read properties of null/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reading 'reset'/i)).not.toBeInTheDocument();
  });

  it("keeps /register route publicly reachable for guests", () => {
    renderWorkspace(ROUTES.REGISTER);
    expect(screen.getByRole("heading", { name: /Create your HFZWood account/i })).toBeInTheDocument();
    const loginLinks = screen.getAllByRole("link", { name: /Already have an account\? Log in/i });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    loginLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/login");
    });
  });

  it("shows the promo note and a new-tab View subscription plans link at the top, above the form", () => {
    renderWorkspace(ROUTES.REGISTER);

    const createAccountButton = screen.getByRole("button", { name: /^create account$/i });
    const heading = screen.getByRole("heading", { name: /Create your HFZWood account/i });
    const promo = screen.getByText(
      "Register now and get full access free for 3 months. No credit card required.",
    );
    const viewAllPlansLink = screen.getByRole("link", { name: "View subscription plans" });
    const emailInput = screen.getByLabelText(/^email$/i);

    expect(screen.queryByText(/Want to compare Free and subscription options/i)).not.toBeInTheDocument();
    expect(promo.closest("form")).toBeNull();
    expect(viewAllPlansLink).toHaveAttribute("href", "/pricing");
    expect(viewAllPlansLink).toHaveAttribute("target", "_blank");
    expect(viewAllPlansLink.getAttribute("rel")).toMatch(/noopener/);
    expect(viewAllPlansLink.getAttribute("rel")).toMatch(/noreferrer/);
    expect(screen.queryByRole("button", { name: /view (all )?plans/i })).not.toBeInTheDocument();
    expect(createAccountButton.className).toMatch(/register-page__submit/);

    const follows = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(heading, promo)).toBe(true);
    expect(follows(promo, viewAllPlansLink)).toBe(true);
    expect(follows(viewAllPlansLink, emailInput)).toBe(true);
  });

  it("renders Register page copy from the active locale instead of mixed English", () => {
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.REGISTER);

    expect(screen.getByRole("heading", { name: "Creează-ți contul HFZWood" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Înregistrează-te acum și obții acces complet gratuit timp de 3 luni. Nu este necesar niciun card.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Nume de utilizator")).toBeInTheDocument();
    expect(screen.getByLabelText("Parolă")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmă parola")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Creează cont" })).toBeInTheDocument();
    const loginLinks = screen.getAllByRole("link", { name: /Ai deja un cont\? Autentifică-te/ });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    loginLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/login");
    });
    expect(screen.getByRole("link", { name: "Vezi planurile de abonament" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.getByRole("link", { name: "Vezi planurile de abonament" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.queryByRole("heading", { name: /Create your HFZWood account/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^create account$/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument();
  });

  it("keeps Register copy keys in the public locales", () => {
    for (const language of ["en", "ro", "fr"]) {
      for (const key of REGISTER_COPY_KEYS) {
        expect(localeBundleHasOwnKey(language, key)).toBe(true);
      }
    }
    expect(translate("en", "register.title")).toBe("Create your HFZWood account");
    expect(translate("ro", "register.title")).toBe("Creează-ți contul HFZWood");
    expect(translate("fr", "register.title")).toBe("Créez votre compte HFZWood");
  });
});
