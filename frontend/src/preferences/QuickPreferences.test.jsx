import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { ROUTES } from "../workspace/routes.js";
import { DEVICE_PREFERENCES_STORAGE_KEY } from "./devicePreferencesStorage.js";
import {
  clearDevicePreferences,
  mockCapabilitiesFetch,
  seedDevicePreferences,
} from "./testHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedAuthenticatedSession() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: { id: "stub-user", email: "user@example.com", username: "user" },
    }),
  );
}

describe("Quick preferences controls", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
    mockCapabilitiesFetch();
  });

  it("shows compact language and unit controls on the authenticated Home sidebar", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({});
    renderWorkspace(ROUTES.HOME);

    const region = await screen.findByRole("region", { name: "Quick preferences" });
    expect(within(region).getAllByRole("combobox")).toHaveLength(3);
  });

  it("shows compact language and unit controls on the New Project workspace", async () => {
    seedAuthenticatedSession();
    seedDevicePreferences({});
    renderWorkspace(ROUTES.NEW_PROJECT);

    const region = await screen.findByRole("region", { name: "Quick preferences" });
    expect(within(region).getAllByRole("combobox")).toHaveLength(3);
  });

  it("updates and persists a unit change from the quick controls", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    seedDevicePreferences({ lengthUnit: "mm" });
    renderWorkspace(ROUTES.HOME);

    const region = await screen.findByRole("region", { name: "Quick preferences" });
    const [, lengthSelect] = within(region).getAllByRole("combobox");

    await user.selectOptions(lengthSelect, "cm");

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY)).lengthUnit).toBe("cm");
    });

    await waitFor(() => {
      expect(within(region).getAllByRole("combobox")[1]).toHaveValue("cm");
    });
  });

  it("switches the interface language from the quick controls", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    const region = await screen.findByRole("region", { name: "Quick preferences" });
    const [languageSelect] = within(region).getAllByRole("combobox");

    await user.selectOptions(languageSelect, "ro");

    expect(await screen.findByRole("region", { name: "Preferințe rapide" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY)).interfaceLanguage).toBe(
      "ro",
    );
  });
});
