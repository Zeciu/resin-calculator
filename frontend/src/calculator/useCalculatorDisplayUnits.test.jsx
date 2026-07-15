import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { useCalculatorDisplayUnits } from "./useCalculatorDisplayUnits.js";

function Probe() {
  const u = useCalculatorDisplayUnits();
  return (
    <div>
      <span data-testid="lengthLabel">{u.lengthLabel}</span>
      <span data-testid="volumeLabel">{u.volumeLabel}</span>
      <span data-testid="depth">{u.formatDepth(100)}</span>
      <span data-testid="volume">{u.formatVolume(1)}</span>
      <span data-testid="resinDepthLabel">{u.resinDepthLabel()}</span>
    </div>
  );
}

function renderProbe() {
  return render(
    <PreferencesProvider>
      <I18nProvider>
        <Probe />
      </I18nProvider>
    </PreferencesProvider>,
  );
}

describe("useCalculatorDisplayUnits", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows metric display units (cm/ml) and converts canonical values for display", () => {
    seedDevicePreferences({ interfaceLanguage: "en", lengthUnit: "cm", volumeUnit: "ml" });
    renderProbe();

    expect(screen.getByTestId("lengthLabel")).toHaveTextContent("cm");
    expect(screen.getByTestId("volumeLabel")).toHaveTextContent("ml");
    expect(screen.getByTestId("depth")).toHaveTextContent("10");
    expect(screen.getByTestId("volume")).toHaveTextContent("1000");
    expect(screen.getByTestId("resinDepthLabel")).toHaveTextContent("Resin depth (cm)");
  });

  it("shows imperial display units (in/fl oz) without changing canonical inputs", () => {
    seedDevicePreferences({ interfaceLanguage: "en", lengthUnit: "in", volumeUnit: "fl_oz" });
    renderProbe();

    expect(screen.getByTestId("lengthLabel")).toHaveTextContent("in");
    expect(screen.getByTestId("volumeLabel")).toHaveTextContent("fl oz");
    expect(screen.getByTestId("depth")).toHaveTextContent("3.94");
  });

  it("localizes the unit label when interface language is Romanian", async () => {
    seedDevicePreferences({ interfaceLanguage: "ro", lengthUnit: "cm", volumeUnit: "L" });
    renderProbe();

    await waitFor(() => {
      expect(screen.getByTestId("resinDepthLabel")).toHaveTextContent("Adâncime rășină (cm)");
    });
  });
});
