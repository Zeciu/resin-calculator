import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DOCUMENT_METADATA_UI_KEYS,
  getSupportedI18nLanguages,
  localeBundleHasOwnKey,
} from "./translate.js";
import { ROUTES } from "../workspace/routes.js";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import {
  clearDevicePreferences,
  mockCapabilitiesFetch,
  seedDevicePreferences,
} from "../preferences/testHelpers.js";

const stylesSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../styles.css"),
  "utf8",
);

describe("Document chrome", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearDevicePreferences();
    vi.restoreAllMocks();
    mockCapabilitiesFetch();
  });

  afterEach(() => {
    cleanup();
    document.documentElement.lang = "en";
    document.title = "";
    vi.restoreAllMocks();
    clearDevicePreferences();
  });

  it("exposes skip, title, metadata, and estimate chrome keys in every locale bundle", () => {
    for (const language of getSupportedI18nLanguages()) {
      for (const key of DOCUMENT_METADATA_UI_KEYS) {
        expect(localeBundleHasOwnKey(language, key)).toBe(true);
      }
      expect(localeBundleHasOwnKey(language, "a11y.skipToContent")).toBe(true);
      expect(localeBundleHasOwnKey(language, "hero.estimate.title")).toBe(true);
      expect(localeBundleHasOwnKey(language, "hero.estimate.depth")).toBe(true);
    }
  });

  it("sets document language and title from the active public locale", async () => {
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("en");
    });
    expect(document.title).toBe("HFZWood");
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(document.getElementById("main-content")).toBeTruthy();
  });

  it("follows Romanian when that public locale is active", async () => {
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.HOME);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ro");
    });
    expect(document.title).toBe("HFZWood");
    expect(screen.getByRole("link", { name: "Sari la conținut" })).toHaveAttribute(
      "href",
      "#main-content",
    );
  });

  it("keeps keyboard focus treatment on skip, sidebar, and primary onboarding", () => {
    expect(stylesSource).toMatch(/\.skip-to-content:focus-visible/);
    expect(stylesSource).toMatch(/\.workspace-sidebar__link:focus-visible/);
    expect(stylesSource).toMatch(/\.guest-home-onboarding__primary:focus-visible \{[\s\S]*?outline:/);
    expect(stylesSource).not.toMatch(/\.workspace-sidebar__link:focus \{/);
    expect(stylesSource).not.toMatch(/\.guest-home-onboarding__primary:focus \{/);
  });
});
