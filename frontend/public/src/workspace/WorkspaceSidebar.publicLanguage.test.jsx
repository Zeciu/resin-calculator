import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEVICE_PREFERENCES_STORAGE_KEY } from "../preferences/devicePreferencesStorage.js";
import {
  clearDevicePreferences,
  seedDevicePreferences,
} from "../preferences/testHelpers.js";
import { mockPublicPreviewFetch } from "../publicPreview/publicPreviewTestHelpers.js";
import { mockPublishedWebsiteFetch } from "../website/websiteTestHelpers.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { ROUTES } from "./routes.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedAuthenticatedSession() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: { id: "stub-user", email: "user@example.com", username: "user" },
    }),
  );
}

function getSidebar() {
  return screen.getByRole("navigation", { name: "Workspace navigation" });
}

describe("Public sidebar language selector", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
  });

  it("renders English, Română, and Français between Try Demo and Create Free Account", async () => {
    mockPublishedWebsiteFetch();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    const sidebar = getSidebar();
    const demoCta = within(sidebar).getByRole("link", { name: "Try a demo project" });
    const languageSelect = await within(sidebar).findByRole("combobox", { name: "Language" });
    await waitFor(() => {
      expect(languageSelect).toBeEnabled();
      expect(within(languageSelect).getByRole("option", { name: "Français" })).toBeInTheDocument();
    });
    const registerCta = within(sidebar).getByRole("link", { name: "Create Free Account" });

    expect(demoCta.compareDocumentPosition(languageSelect) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(languageSelect.compareDocumentPosition(registerCta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(languageSelect).getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(within(languageSelect).getByRole("option", { name: "Română" })).toBeInTheDocument();
    expect(within(languageSelect).getByRole("option", { name: "Français" })).toBeInTheDocument();
    expect(within(sidebar).queryByLabelText(/length unit/i)).not.toBeInTheDocument();
    expect(within(sidebar).queryByLabelText(/volume unit/i)).not.toBeInTheDocument();
    expect(within(sidebar).queryByText("Quick preferences")).not.toBeInTheDocument();
  });

  it("updates public copy immediately and persists the language preference", async () => {
    const user = userEvent.setup();
    mockPublishedWebsiteFetch();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    const sidebar = getSidebar();
    const languageSelect = await within(sidebar).findByRole("combobox", { name: "Language" });
    await waitFor(() => {
      expect(languageSelect).toBeEnabled();
      expect(within(languageSelect).getByRole("option", { name: "Română" })).toBeInTheDocument();
    });
    await user.selectOptions(languageSelect, "ro");

    expect(await within(sidebar).findByRole("combobox", { name: "Limbă" })).toHaveValue("ro");
    expect(within(sidebar).getByRole("link", { name: "Încearcă un proiect demo" })).toHaveAttribute(
      "href",
      "/demo",
    );
    expect(within(sidebar).getByRole("link", { name: "Creează cont gratuit" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(within(sidebar).getByRole("link", { name: "Previzualizare resurse" })).toHaveAttribute(
      "href",
      "/knowledge-preview",
    );
    expect(JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY)).interfaceLanguage).toBe(
      "ro",
    );
  });

  it("keeps the selected language when navigating public pages", async () => {
    const user = userEvent.setup();
    mockPublicPreviewFetch({ activePublicLocales: ["en", "ro", "fr"] });
    seedDevicePreferences({ interfaceLanguage: "en" });
    const { router } = renderWorkspace(ROUTES.HOME);

    const sidebar = getSidebar();
    const languageSelect = await within(sidebar).findByRole("combobox", { name: "Language" });
    await waitFor(() => {
      expect(languageSelect).toBeEnabled();
      expect(within(languageSelect).getByRole("option", { name: "Română" })).toBeInTheDocument();
    });
    await user.selectOptions(languageSelect, "ro");
    await user.click(within(sidebar).getByRole("link", { name: "Previzualizare resurse" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(ROUTES.KNOWLEDGE_PREVIEW);
    });
    expect(await within(getSidebar()).findByRole("combobox", { name: "Limbă" })).toHaveValue("ro");
    expect(
      within(screen.getByRole("main")).getByRole("heading", {
        name: "Previzualizare resurse",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY)).interfaceLanguage).toBe(
      "ro",
    );
  });

  it("reuses a stored language preference on first public render", async () => {
    mockPublishedWebsiteFetch();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.HOME);

    const languageSelect = await within(getSidebar()).findByRole("combobox", { name: "Limbă" });
    await waitFor(() => {
      expect(languageSelect).toBeEnabled();
    });
    expect(languageSelect).toHaveValue("ro");
    expect(JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY)).interfaceLanguage).toBe(
      "ro",
    );
  });

  it("does not add the public language selector to the authenticated sidebar", async () => {
    mockPublishedWebsiteFetch();
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    await screen.findByRole("region", { name: "Quick preferences" });
    expect(within(getSidebar()).queryByRole("combobox", { name: "Language" })).not.toBeInTheDocument();
  });
});
