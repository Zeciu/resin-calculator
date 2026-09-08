import { describe, expect, it } from "vitest";
import { partitionContactIntro } from "./contactIntroLayout.js";

describe("partitionContactIntro", () => {
  it("treats a single paragraph as lead copy", () => {
    expect(partitionContactIntro("Contact intro", "Contact")).toEqual({
      lead: { heading: "", body: "Contact intro" },
      resources: null,
      feedbackBlocks: [],
    });
  });

  it("strips a duplicated public title from the lead and groups later CMS blocks", () => {
    const intro = [
      "We're here if you need help",
      "Lead sentence one.",
      "Lead sentence two.",
      "",
      "Before you contact us",
      "Check the manual first.",
      "Glossary is mentioned here.",
      "",
      "Feedback",
      "User ideas help us improve.",
      "",
      "Thank you for using HFZWood.",
    ].join("\n");

    expect(partitionContactIntro(intro, "We're here if you need help")).toEqual({
      lead: { heading: "", body: "Lead sentence one. Lead sentence two." },
      resources: {
        heading: "Before you contact us",
        body: "Check the manual first. Glossary is mentioned here.",
      },
      feedbackBlocks: [
        { heading: "Feedback", body: "User ideas help us improve." },
        { heading: "", body: "Thank you for using HFZWood." },
      ],
    });
  });
});
