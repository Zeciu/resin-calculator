import { describe, expect, it } from "vitest";
import { ADMIN_EDITORIAL_LOCALES, isCanonicalSourceLocale } from "./editorialLocales.js";

describe("editorialLocales", () => {
  it("lists prepared admin locales with Romanian canonical", () => {
    expect(ADMIN_EDITORIAL_LOCALES[0]).toBe("ro");
    expect(ADMIN_EDITORIAL_LOCALES).toContain("en");
    expect(ADMIN_EDITORIAL_LOCALES).toContain("fr");
    expect(ADMIN_EDITORIAL_LOCALES).not.toContain("nl");
  });

  it("identifies the canonical source locale", () => {
    expect(isCanonicalSourceLocale("ro")).toBe(true);
    expect(isCanonicalSourceLocale("en")).toBe(false);
  });
});
