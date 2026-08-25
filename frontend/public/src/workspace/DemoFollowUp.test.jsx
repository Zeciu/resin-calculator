import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DemoFollowUp from "./DemoFollowUp.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { localeBundleHasOwnKey, translate } from "../i18n/translate.js";

const DEMO_P01_KEYS = [
  "demo.accountCta",
  "demo.reset",
  "demo.projectNote",
  "demo.valueHeadline",
  "demo.valueBody",
  "demo.useHeadline",
  "demo.useBody",
  "demo.seePlans",
  "demo.learnHeadline",
  "demo.learnBody",
  "demo.exploreKnowledgePreview",
  "register.comparePlansLead",
  "preview.viewPlans",
  "calculator.modifyProject",
  "calculator.modifyProjectActive",
];

const stylesSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../styles.css"),
  "utf8",
);

function renderFollowUp() {
  return render(
    <MemoryRouter>
      <TestProviders>
        <DemoFollowUp />
      </TestProviders>
    </MemoryRouter>,
  );
}

describe("DemoFollowUp", () => {
  it("renders the value message and routes the two next-path CTAs", () => {
    renderFollowUp();

    expect(
      screen.getByRole("heading", { name: "Know what you need before you pour." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ready to calculate your own project?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "HFZWood is more than a calculator." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("link", { name: "Explore resources" })).toHaveAttribute(
      "href",
      "/knowledge-preview",
    );
    expect(screen.getByText(/Find practical explanations/i)).toBeInTheDocument();
    expect(screen.queryByText(/included with Free/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/part of a subscription/i)).not.toBeInTheDocument();
  });

  it("keeps public locale keys and interpolates the reset label into the demo note", () => {
    for (const language of ["en", "ro", "fr"]) {
      for (const key of DEMO_P01_KEYS) {
        expect(localeBundleHasOwnKey(language, key)).toBe(true);
      }
    }

    expect(translate("en", "demo.projectNote", { reset: "Reset demo" })).toContain("Reset demo");
    expect(translate("ro", "demo.projectNote", { reset: "Resetează demo-ul" })).toContain(
      "Resetează demo-ul",
    );
    expect(translate("ro", "demo.valueHeadline")).toBe("Află de ce ai nevoie înainte să torni.");
    expect(translate("en", "demo.valueHeadline")).toBe("Know what you need before you pour.");
    expect(translate("ro", "demo.exploreKnowledgePreview")).toBe("Explorează resursele");
    expect(translate("en", "demo.learnBody")).not.toMatch(/included with Free/i);
    expect(translate("ro", "demo.learnBody")).not.toMatch(/varianta gratuită/i);
  });

  it("stacks the next-path cards on the existing 760px workspace breakpoint", () => {
    expect(stylesSource).toMatch(
      /\.demo-follow-up__paths\s*\{[^}]*grid-template-columns:\s*1fr 1fr;/,
    );
    expect(stylesSource).toMatch(
      /@media \(max-width:\s*760px\)\s*\{[\s\S]*?\.demo-follow-up__paths\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
    );
    expect(stylesSource).toMatch(/\.register-page__hint\s*\{/);
    expect(stylesSource).toMatch(
      /\.register-page__secondary\s*\{[^}]*background:\s*var\(--surface-ivory\);/,
    );
    expect(stylesSource).toMatch(
      /\.register-page__secondary\s*\{[^}]*border:\s*1px solid var\(--border-warm\);/,
    );
  });
});
