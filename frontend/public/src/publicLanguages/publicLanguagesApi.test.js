import { describe, expect, it } from "vitest";
import { resolvePublicInterfaceLocale } from "./publicLanguagesApi.js";

describe("resolvePublicInterfaceLocale", () => {
  it("keeps an active locale", () => {
    expect(resolvePublicInterfaceLocale("ro", ["en", "ro"], "en")).toBe("ro");
  });

  it("falls back to the default when current locale is inactive", () => {
    expect(resolvePublicInterfaceLocale("ro", ["en"], "en")).toBe("en");
    expect(resolvePublicInterfaceLocale("de", ["en", "fr"], "en")).toBe("en");
  });
});
