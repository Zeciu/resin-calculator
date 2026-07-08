import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth/AuthContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { usePublishedContent } from "./usePublishedContent.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function wrapper({ children }) {
  return (
    <AuthProvider>
      <PreferencesProvider>{children}</PreferencesProvider>
    </AuthProvider>
  );
}

describe("usePublishedContent", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal("navigator", { language: "en-US", languages: ["en-US"] });
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (String(url).endsWith("/api/preferences")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            interfaceLanguage: "ro",
            lengthUnit: "mm",
            volumeUnit: "L",
            exists: true,
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "stub-user", email: "u@example.com", username: "user" } }),
    );
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
