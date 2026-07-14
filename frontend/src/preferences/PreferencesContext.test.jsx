import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProviderForTests } from "../auth/AuthContext.jsx";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider, usePreferences } from "./PreferencesContext.jsx";
import { mockPreferencesFetch } from "./testHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function PreferencesProbe() {
  const { preferences, isLoading, updatePreferences } = usePreferences();
  return (
    <div>
      <span data-testid="language">{preferences.interfaceLanguage}</span>
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
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal("navigator", { language: "en-US", languages: ["en-US"] });
  });

  it("loads stored preferences after login", async () => {
    mockPreferencesFetch({
      interfaceLanguage: "ro",
      lengthUnit: "cm",
      volumeUnit: "ml",
      exists: true,
    });
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a" } }),
    );

    renderPreferencesTree();

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("ro");
    });
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });

  it("uses browser language before the first saved preference exists", async () => {
    vi.stubGlobal("navigator", { language: "ro-RO", languages: ["ro-RO"] });
    mockPreferencesFetch({
      interfaceLanguage: "en",
      lengthUnit: "mm",
      volumeUnit: "L",
      exists: false,
    });
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a" } }),
    );

    renderPreferencesTree();

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("ro");
    });
  });

  it("resets to defaults after logout", async () => {
    mockPreferencesFetch({
      interfaceLanguage: "ro",
      lengthUnit: "cm",
      volumeUnit: "ml",
      exists: true,
    });
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a" } }),
    );

    const { unmount } = renderPreferencesTree();
    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("ro");
    });

    sessionStorage.clear();
    unmount();
    renderPreferencesTree();
    expect(screen.getByTestId("language")).toHaveTextContent("en");
  });

  it("saves updated preferences", async () => {
    const fetchMock = mockPreferencesFetch({
      interfaceLanguage: "en",
      lengthUnit: "mm",
      volumeUnit: "L",
      exists: false,
    });
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-a", email: "a@example.com", username: "a" } }),
    );
    const user = userEvent.setup();
    renderPreferencesTree();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await user.click(screen.getByRole("button", { name: "Save Romanian" }));

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("ro");
    });
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(true);
  });
});
