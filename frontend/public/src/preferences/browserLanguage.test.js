import { describe, expect, it, vi } from "vitest";
import { detectBrowserInterfaceLanguage } from "./browserLanguage.js";

describe("detectBrowserInterfaceLanguage", () => {
  it("returns ro for Romanian browser languages", () => {
    vi.stubGlobal("navigator", { language: "ro-RO", languages: ["ro-RO", "en"] });
    expect(detectBrowserInterfaceLanguage()).toBe("ro");
  });

  it("returns en for English browser languages", () => {
    vi.stubGlobal("navigator", { language: "en-US", languages: ["en-US"] });
    expect(detectBrowserInterfaceLanguage()).toBe("en");
  });

  it("defaults to en for unsupported browser languages", () => {
    vi.stubGlobal("navigator", { language: "fr-FR", languages: ["fr-FR"] });
    expect(detectBrowserInterfaceLanguage()).toBe("en");
  });
});
