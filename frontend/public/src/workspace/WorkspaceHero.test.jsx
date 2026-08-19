import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { PublicLanguagesProvider } from "../publicLanguages/PublicLanguagesContext.jsx";
import WorkspaceHero from "./WorkspaceHero.jsx";

const stylesSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../styles.css"),
  "utf8",
);

function renderHero(marketing = null) {
  return render(
    <PublicLanguagesProvider>
      <PreferencesProvider>
        <I18nProvider>
          <WorkspaceHero marketing={marketing} />
        </I18nProvider>
      </PreferencesProvider>
    </PublicLanguagesProvider>,
  );
}

function extractHeroBlock() {
  const match = stylesSource.match(/\.workspace-hero\s*\{([^}]*)\}/);
  return match?.[1] ?? "";
}

describe("WorkspaceHero", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (String(url).includes("/api/content/public-languages")) {
        return {
          ok: true,
          json: async () => ({
            defaultPublicLocale: "en",
            activePublicLocales: ["en", "ro"],
          }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("uses i18n marketing copy by default", () => {
    renderHero();
    expect(
      screen.getByRole("heading", {
        name: "Professional Resin Calculator for Woodworking Projects",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("From Photo to Precise Resin Estimate")).toBeInTheDocument();
    expect(screen.getByText("HFZWood")).toBeInTheDocument();
  });

  it("uses CMS marketing copy when provided", () => {
    renderHero({
      publicTitle: "CMS Title",
      subtitle: "CMS Sub",
      image: { src: "/api/content/website/images/a.png", alt: "Alt", visible: true },
    });
    expect(screen.getByRole("heading", { name: "CMS Title", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("CMS Sub")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Alt" })).toBeInTheDocument();
    expect(
      screen.queryByText(/Professional Resin Calculator for Woodworking Projects/i),
    ).not.toBeInTheDocument();
  });

  it("uses a card-free hero asset with a native estimate card", () => {
    const { container } = renderHero();
    const hero = container.querySelector(".workspace-hero");
    const logo = screen.getByRole("img", { name: "HEFZECH logo" });
    const headline = screen.getByRole("heading", { level: 1 });

    expect(hero).toBeInTheDocument();
    expect(logo).toBeVisible();
    expect(headline).toBeVisible();

    const heroBlock = extractHeroBlock();
    expect(heroBlock).toContain('url("/hero-page-resin-geometry.png")');
    expect(heroBlock).toContain("background-size: cover");
    expect(heroBlock).not.toMatch(/linear-gradient|rgba|opacity|filter/i);
    expect(stylesSource).not.toMatch(/\.workspace-hero::before/);

    const estimate = screen.getByRole("complementary", { name: "Resin Estimate" });
    expect(estimate).toHaveTextContent("5.42 L");
    expect(estimate).toHaveTextContent("Estimate for 10 mm depth");
    expect(estimate.querySelectorAll("svg")).toHaveLength(4);
    expect(stylesSource).toContain("text-shadow: 0 1px 2px rgba(250, 247, 239, 0.95)");

    const heroComputed = window.getComputedStyle(hero);
    expect(heroComputed.textShadow).toMatch(/^(none)?$/i);
    expect(container.querySelector(".workspace-hero__text-box")).toBeNull();
    expect(headline.className).not.toMatch(/outline|glow|box/i);
  });

  it("preserves hero structure and CMS image placement", () => {
    const { container } = renderHero({
      publicTitle: "CMS Title",
      subtitle: "CMS Sub",
      image: { src: "/api/content/website/images/a.png", alt: "Workshop", visible: true },
    });
    const content = container.querySelector(".workspace-hero__content");
    const brand = container.querySelector(".workspace-hero__brand");
    const cmsImage = screen.getByRole("img", { name: "Workshop" });

    expect(brand.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(content.contains(cmsImage)).toBe(true);
    expect(screen.getByRole("img", { name: "HEFZECH logo" })).toBeVisible();
  });
});
