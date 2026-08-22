import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../styles.css"),
  "utf8",
);

describe("Public Knowledge Preview layout contract", () => {
  it("keeps the landing page as a readable document, not a 100vh app shell", () => {
    expect(stylesSource).toMatch(
      /\.knowledge-preview-landing\s*\{[^}]*max-width:\s*42rem;/,
    );
    expect(stylesSource).toMatch(
      /\.knowledge-preview-landing\s*\{[^}]*overflow-x:\s*clip;/,
    );
    expect(stylesSource).not.toMatch(
      /\.knowledge-preview-landing\s*\{[^}]*height:\s*100vh;/,
    );
  });

  it("gives locked rows a lock indicator, selected state, and visible focus", () => {
    expect(stylesSource).toMatch(/\.knowledge-preview-item__lock\s*\{/);
    expect(stylesSource).toMatch(
      /\.knowledge-preview-toc__link--selected\s*\{[^}]*background:\s*#efe8dc;/,
    );
    expect(stylesSource).toMatch(
      /\.knowledge-preview-item__button:focus-visible\s*\{[^}]*outline:\s*2px solid #9d6c3b;/,
    );
    expect(stylesSource).toMatch(
      /\.knowledge-preview-locked__cta:focus-visible\s*\{[^}]*outline:\s*2px solid #9d6c3b;/,
    );
  });

  it("stacks landing resources and locked copy on small screens", () => {
    expect(stylesSource).toMatch(
      /\.knowledge-preview-landing__list\s*\{[^}]*flex-direction:\s*column;/,
    );
    expect(stylesSource).toMatch(
      /@media \(max-width:\s*560px\)\s*\{[\s\S]*?\.knowledge-preview-item__button[\s\S]*?min-height:\s*44px;/,
    );
  });

  it("styles the guest Public Knowledge Preview nav item in the Demo CTA sage family", () => {
    const exploreBlock = stylesSource.match(
      /\.workspace-sidebar__link\.workspace-sidebar__link--guest-explore\s*\{([^}]+)\}/,
    )?.[1];
    const demoBlock = stylesSource.match(
      /\.workspace-sidebar__guest-auth \.guest-home-onboarding__demo\s*\{([^}]+)\}/,
    )?.[1];

    expect(exploreBlock).toMatch(/background:\s*#f4f7f3;/);
    expect(exploreBlock).toMatch(/border-color:\s*#9aab98;/);
    expect(exploreBlock).toMatch(/color:\s*#3d4f3c;/);
    expect(demoBlock).toMatch(/background:\s*#f4f7f3;/);
    expect(demoBlock).toMatch(/border:\s*1px solid #9aab98;/);
    expect(stylesSource).toMatch(
      /\.guest-home-onboarding__primary\s*\{[^}]*background:\s*#3f5d3a;/,
    );
    expect(exploreBlock).not.toMatch(/#3f5d3a/);
    expect(exploreBlock).not.toMatch(/color:\s*#fff;/);
    expect(stylesSource).toMatch(
      /\.workspace-sidebar__link\.workspace-sidebar__link--guest-explore:focus-visible\s*\{[^}]*outline:\s*2px solid #9d6c3b;/,
    );
    expect(stylesSource).toMatch(
      /\.workspace-sidebar__link\.workspace-sidebar__link--guest-explore\.workspace-sidebar__link--active/,
    );
  });

  it("makes the preview Back control a visible secondary nav pill with a focus ring", () => {
    expect(stylesSource).toMatch(
      /\.knowledge-preview-back__link\s*\{[^}]*display:\s*inline-flex;/,
    );
    expect(stylesSource).toMatch(
      /\.knowledge-preview-back__link:focus-visible\s*\{[^}]*outline:\s*2px solid #9d6c3b;/,
    );
    expect(stylesSource).toMatch(
      /\.manual-module\.knowledge-preview-module\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\);/,
    );
    expect(stylesSource).toMatch(
      /\.knowledge-preview-module\s*>\s*\.knowledge-preview-back\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/,
    );
  });

  it("distinguishes unlocked preview rows in the sage family without the Create Account fill", () => {
    const availableBlock = stylesSource.match(/\.knowledge-preview-available\s*\{([^}]+)\}/)?.[1];
    expect(availableBlock).toMatch(/background:\s*#f4f7f3;/);
    expect(availableBlock).toMatch(/border:\s*1px solid #c2cdc0;/);
    expect(availableBlock).not.toMatch(/#3f5d3a/);
    expect(stylesSource).toMatch(/\.knowledge-preview-available__badge\s*\{/);
    expect(stylesSource).toMatch(
      /\.knowledge-preview-available--selected\s*\{[^}]*background:\s*#e6eee4;/,
    );
    expect(stylesSource).toMatch(
      /\[data-preview-unlocked-content\]\s*\{[^}]*scroll-margin-top:/,
    );
    expect(stylesSource).toMatch(
      /\.knowledge-preview-module\s*\{[^}]*overflow-x:\s*clip;/,
    );
  });
});
