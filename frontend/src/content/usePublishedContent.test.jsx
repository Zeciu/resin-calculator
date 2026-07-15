import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { usePublishedContent } from "./usePublishedContent.js";

function wrapper({ children }) {
  return <PreferencesProvider>{children}</PreferencesProvider>;
}

describe("usePublishedContent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal("navigator", { language: "en-US", languages: ["en-US"] });
    seedDevicePreferences({
      interfaceLanguage: "ro",
      lengthUnit: "mm",
      volumeUnit: "L",
    });
  });

  it("offers explicit English fallback without auto-switching", async () => {
    const fetchContent = vi.fn(async (locale) => {
      if (locale === "ro") {
        return {
          available: false,
          englishAvailable: true,
          entries: [],
        };
      }
      return {
        available: true,
        englishAvailable: true,
        entries: [{ id: "one", title: "One" }],
      };
    });

    const { result } = renderHook(() => usePublishedContent(fetchContent), { wrapper });

    await waitFor(() => {
      expect(fetchContent).toHaveBeenCalledWith("ro");
      expect(result.current.loadState).toBe("unavailable");
    });

    result.current.viewEnglishVersion();

    await waitFor(() => {
      expect(result.current.loadState).toBe("ready");
    });
    expect(fetchContent).toHaveBeenLastCalledWith("en");
  });
});
