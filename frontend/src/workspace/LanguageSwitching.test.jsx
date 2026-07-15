import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "./routes.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import {
  DEVICE_PREFERENCES_STORAGE_KEY,
} from "../preferences/devicePreferencesStorage.js";
import {
  clearDevicePreferences,
  mockCapabilitiesFetch,
  seedDevicePreferences,
} from "../preferences/testHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedAuthenticatedSession(userId = "stub-user") {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: { id: userId, email: "user@example.com", username: "user" },
    }),
  );
}

describe("Preferences reachability and language switching", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
    mockCapabilitiesFetch();
  });

  it("reaches Application Preferences from Home and applies a language change", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    const myAccountLink = await screen.findByRole("link", { name: "My Account" });
    await user.click(myAccountLink);

    await user.click(await screen.findByRole("link", { name: "Application Preferences" }));
    expect(
      await screen.findByRole("heading", { name: "Application Preferences" }),
    ).toBeInTheDocument();

    const languageSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(languageSelect, "ro");
    await user.click(screen.getByRole("button", { name: /Save preferences/i }));

    expect(
      await screen.findByRole("heading", { name: "Preferințe aplicație" }),
    ).toBeInTheDocument();
    const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
    expect(within(sidebar).getByRole("link", { name: "Proiect nou" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Contul meu" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/Preferences saved\.|Preferințele au fost salvate\./);
    expect(JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY)).interfaceLanguage).toBe(
      "ro",
    );
  });

  it("renders Home and navigation in Romanian when the stored language is ro", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.HOME);

    expect(
      await screen.findByText(
        /Bine ai venit la HFZWood — spațiul tău de lucru/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Calculator profesional de rășină/i,
      }),
    ).toBeInTheDocument();

    const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
    expect(within(sidebar).getByRole("link", { name: "Manual și tutoriale" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Contul meu" })).toBeInTheDocument();
  });

  it("saves length and volume unit preferences and persists them locally", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    seedDevicePreferences({ lengthUnit: "mm", volumeUnit: "L" });
    renderWorkspace(ROUTES.PREFERENCES);

    await screen.findByRole("heading", { name: "Application Preferences" });

    const [, lengthSelect, volumeSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(lengthSelect, "cm");
    await user.selectOptions(volumeSelect, "ml");
    await user.click(screen.getByRole("button", { name: /Save preferences/i }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY))).toMatchObject({
        lengthUnit: "cm",
        volumeUnit: "ml",
      });
    });

    await waitFor(() => {
      expect(screen.getAllByRole("combobox")[1]).toHaveValue("cm");
      expect(screen.getAllByRole("combobox")[2]).toHaveValue("ml");
    });
  });

  it("keeps My Account reachable from a dedicated module page", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.NEW_PROJECT);

    const header = await screen.findByRole("banner", { name: "Module header" });
    expect(within(header).getByRole("link", { name: "My Account" })).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});
