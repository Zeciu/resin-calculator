import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { PublicLanguagesProvider } from "../publicLanguages/PublicLanguagesContext.jsx";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { usePublishedContent } from "./usePublishedContent.js";

function wrapper({ children }) {
  return (
    <PublicLanguagesProvider>
      <PreferencesProvider>{children}</PreferencesProvider>
    </PublicLanguagesProvider>
  );
}

describe("usePublishedContent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal("navigator", { language: "en-US", languages: ["en-US"] });
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (String(url).includes("/api/content/public-languages")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            defaultPublicLocale: "en",
            activePublicLocales: ["en", "ro"],
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });
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

  it("resolves inactive current locale to English", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (String(url).includes("/api/content/public-languages")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            defaultPublicLocale: "en",
            activePublicLocales: ["en"],
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    const fetchContent = vi.fn(async () => ({
      available: true,
      englishAvailable: true,
      entries: [],
    }));

    const { result } = renderHook(() => usePublishedContent(fetchContent), { wrapper });

    await waitFor(() => {
      expect(fetchContent).toHaveBeenCalledWith("en");
      expect(result.current.locale).toBe("en");
      expect(result.current.loadState).toBe("ready");
    });
    expect(fetchContent).not.toHaveBeenCalledWith("ro");
  });
});
