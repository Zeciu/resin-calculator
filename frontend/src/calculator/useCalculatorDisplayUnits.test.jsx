import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProviderForTests } from "../auth/AuthContext.jsx";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { useCalculatorDisplayUnits } from "./useCalculatorDisplayUnits.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedAuthenticatedSession() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ user: { id: "stub-user", email: "u@example.com", username: "u" } }),
  );
}

function mockPreferences(prefs) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      if (String(url).includes("/api/preferences")) {
        return { ok: true, json: async () => ({ exists: true, ...prefs }) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    }),
  );
}

function Probe() {
  const u = useCalculatorDisplayUnits();
  return (
    <div>
      <span data-testid="lengthLabel">{u.lengthLabel}</span>
      <span data-testid="volumeLabel">{u.volumeLabel}</span>
      {/* 100 mm canonical -> display; 1 L canonical -> display */}
      <span data-testid="depth">{u.formatDepth(100)}</span>
      <span data-testid="volume">{u.formatVolume(1)}</span>
      <span data-testid="resinDepthLabel">{u.resinDepthLabel()}</span>
    </div>
  );
}

function renderProbe() {
  return render(
    <AuthProviderForTests>
      <PreferencesProvider>
        <I18nProvider>
          <Probe />
        </I18nProvider>
      </PreferencesProvider>
    </AuthProviderForTests>,
  );
}

describe("useCalculatorDisplayUnits", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    seedAuthenticatedSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows metric display units (cm/ml) and converts canonical values for display", async () => {
    mockPreferences({ interfaceLanguage: "en", lengthUnit: "cm", volumeUnit: "ml" });
    renderProbe();

    await waitFor(() => {
      expect(screen.getByTestId("lengthLabel")).toHaveTextContent("cm");
    });
    expect(screen.getByTestId("volumeLabel")).toHaveTextContent("ml");
    // 100 mm canonical == 10 cm displayed; 1 L canonical == 1000 ml displayed.
    expect(screen.getByTestId("depth")).toHaveTextContent("10");
    expect(screen.getByTestId("volume")).toHaveTextContent("1000");
    expect(screen.getByTestId("resinDepthLabel")).toHaveTextContent("Resin depth (cm)");
  });

  it("shows imperial display units (in/fl oz) without changing canonical inputs", async () => {
    mockPreferences({ interfaceLanguage: "en", lengthUnit: "in", volumeUnit: "fl_oz" });
    renderProbe();

    await waitFor(() => {
      expect(screen.getByTestId("lengthLabel")).toHaveTextContent("in");
    });
    expect(screen.getByTestId("volumeLabel")).toHaveTextContent("fl oz");
    // 100 mm == 3.94 in (canonical mm is the input; display converts only).
    expect(screen.getByTestId("depth")).toHaveTextContent("3.94");
  });

  it("localizes the unit label when interface language is Romanian", async () => {
    mockPreferences({ interfaceLanguage: "ro", lengthUnit: "cm", volumeUnit: "L" });
    renderProbe();

    await waitFor(() => {
      expect(screen.getByTestId("resinDepthLabel")).toHaveTextContent("Adâncime rășină (cm)");
    });
  });
});
