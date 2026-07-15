import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProviderForTests } from "../auth/AuthContext.jsx";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import {
  DEVICE_PREFERENCES_STORAGE_KEY,
  loadDevicePreferences,
} from "./devicePreferencesStorage.js";
import { PreferencesProvider, usePreferences } from "./PreferencesContext.jsx";
import {
  assertNoPreferencesApiCalls,
  clearDevicePreferences,
  mockCapabilitiesFetch,
  seedDevicePreferences,
} from "./testHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function PreferencesProbe() {
  const { preferences, isLoading, updatePreferences } = usePreferences();
  return (
    <div>
      <span data-testid="language">{preferences.interfaceLanguage}</span>
      <span data-testid="length-unit">{preferences.lengthUnit}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <button type="button" onClick={() => updatePreferences({ interfaceLanguage: "ro" })}>
        Save Romanian
      </button>
    </div>
  );
}

function renderPreferencesTree() {
  return render(
    <AuthProviderForTests>
      <PreferencesProvider>
        <I18nProvider>
          <PreferencesProbe />
        </I18nProvider>
      </PreferencesProvider>
    </AuthProviderForTests>,
  );
}

describe("PreferencesProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal("navigator", { language: "en-US", languages: ["en-US"] });
  });

  it("loads saved device preferences on startup without network access", async () => {
    const fetchMock = mockCapabilitiesFetch();
    seedDevicePreferences({
      interfaceLanguage: "ro",
      lengthUnit: "cm",
      volumeUnit: "ml",
    });
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a" } }),
    );

    renderPreferencesTree();

    expect(screen.getByTestId("language")).toHaveTextContent("ro");
    expect(screen.getByTestId("length-unit")).toHaveTextContent("cm");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    assertNoPreferencesApiCalls(fetchMock);
  });

  it("uses browser language before the first saved preference exists", () => {
    vi.stubGlobal("navigator", { language: "ro-RO", languages: ["ro-RO"] });
    const fetchMock = mockCapabilitiesFetch();

    renderPreferencesTree();

    expect(screen.getByTestId("language")).toHaveTextContent("ro");
    expect(screen.getByTestId("length-unit")).toHaveTextContent("mm");
    assertNoPreferencesApiCalls(fetchMock);
  });

  it("preserves device preferences after logout", async () => {
    seedDevicePreferences({
      interfaceLanguage: "ro",
      lengthUnit: "cm",
      volumeUnit: "ml",
    });
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a" } }),
    );

    const { unmount } = renderPreferencesTree();
    expect(screen.getByTestId("language")).toHaveTextContent("ro");

    sessionStorage.clear();
    unmount();
    renderPreferencesTree();
    expect(screen.getByTestId("language")).toHaveTextContent("ro");
    expect(screen.getByTestId("length-unit")).toHaveTextContent("cm");
  });

  it("does not replace device preferences when another user logs in", () => {
    seedDevicePreferences({
      interfaceLanguage: "ro",
      lengthUnit: "cm",
      volumeUnit: "ml",
    });
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a" } }),
    );

    const { unmount } = renderPreferencesTree();
    expect(screen.getByTestId("language")).toHaveTextContent("ro");

    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-b", email: "b@example.com", username: "b" } }),
    );
    unmount();
    renderPreferencesTree();

    expect(screen.getByTestId("language")).toHaveTextContent("ro");
    expect(screen.getByTestId("length-unit")).toHaveTextContent("cm");
  });

  it("saves updated preferences to localStorage without calling the backend", async () => {
    const fetchMock = mockCapabilitiesFetch();
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a" } }),
    );
    const user = userEvent.setup();
    renderPreferencesTree();

    await user.click(screen.getByRole("button", { name: "Save Romanian" }));

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("ro");
    });
    expect(JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY))).toMatchObject({
      interfaceLanguage: "ro",
    });
    assertNoPreferencesApiCalls(fetchMock);
  });

  it("preserves saved values after remount", () => {
    seedDevicePreferences({ interfaceLanguage: "ro", lengthUnit: "cm", volumeUnit: "ml" });

    const { unmount } = renderPreferencesTree();
    expect(screen.getByTestId("language")).toHaveTextContent("ro");
    unmount();

    renderPreferencesTree();
    expect(screen.getByTestId("language")).toHaveTextContent("ro");
    expect(loadDevicePreferences().lengthUnit).toBe("cm");
  });
});
