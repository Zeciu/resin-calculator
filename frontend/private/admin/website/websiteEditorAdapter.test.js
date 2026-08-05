import { describe, expect, it } from "vitest";
import {
  DEFAULT_KNOWLEDGE_BASE_LINK_LABEL,
  DEFAULT_MANUAL_LINK_LABEL,
} from "./websiteConstants.js";
import {
  editorToVariantBody,
  pricingOfferLabel,
  splitAboutSections,
  variantToEditor,
} from "./websiteEditorAdapter.js";
import { mergeAboutSections } from "./websiteSectionUtils.js";

describe("websiteEditorAdapter", () => {
  it("maps variant body into editor state", () => {
    const editor = variantToEditor({
      pageKey: "pricing",
      pageKind: "pricing",
      status: "draft",
      exists: true,
      body: {
        pageKind: "pricing",
        publicTitle: "Prețuri",
        intro: "Intro",
        offers: [
          {
            id: "free",
            title: "Gratuit",
            displayedPriceText: "0",
            benefits: ["A"],
            ctaLabel: "Go",
            ctaDestination: "/r",
            visible: false,
          },
          { id: "subscriber", title: "Sub", displayedPriceText: "10", benefits: [], ctaLabel: "", ctaDestination: "" },
          { id: "lifetime", title: "Life", displayedPriceText: "100", benefits: [], ctaLabel: "", ctaDestination: "" },
        ],
        footnote: "",
      },
    });

    expect(editor.body.publicTitle).toBe("Prețuri");
    expect(editor.body.offers.map((offer) => offer.id)).toEqual(["free", "subscriber", "lifetime"]);
    expect(editor.body.offers[0].visible).toBe(false);
    expect(editor.body.offers[1].visible).toBe(true);
  });

  it("normalizes pricing offers on save", () => {
    const body = editorToVariantBody(
      variantToEditor({
        pageKey: "pricing",
        pageKind: "pricing",
        body: {
          pageKind: "pricing",
          publicTitle: "Pricing",
          intro: "",
          offers: [
            { id: "lifetime", title: "Lifetime", displayedPriceText: "99", benefits: [], ctaLabel: "", ctaDestination: "/buy" },
            { id: "free", title: "Free", displayedPriceText: "0", benefits: [], ctaLabel: "", ctaDestination: "/register", visible: false },
            { id: "subscriber", title: "Sub", displayedPriceText: "10", benefits: [], ctaLabel: "", ctaDestination: "/sub" },
          ],
          footnote: "",
        },
      }),
    );

    expect(body.offers.map((offer) => offer.id)).toEqual(["free", "subscriber", "lifetime"]);
    expect(body.offers[0].visible).toBe(false);
  });

  it("normalizes about section images on load and save", () => {
    const editor = variantToEditor({
      pageKey: "about",
      pageKind: "about",
      body: {
        pageKind: "about",
        publicTitle: "About",
        sections: [
          {
            id: "hero",
            title: "Hero",
            blocks: [{ type: "paragraph", text: "Intro" }],
          },
          {
            id: "story",
            title: "Story",
            blocks: [{ type: "paragraph", text: "Body" }],
            image: { src: "/api/content/website/images/story.png", alt: "Story alt" },
          },
        ],
      },
    });

    const { contentSections } = splitAboutSections(editor.body.sections);
    expect(contentSections[0].image).toEqual({
      src: "/api/content/website/images/story.png",
      alt: "Story alt",
    });

    const saved = editorToVariantBody(editor);
    expect(saved.sections[1].image.src).toContain("story.png");
    expect(saved.sections[1].image.alt).toBe("Story alt");
  });

  it("applies contact label defaults for legacy variants", () => {
    const editor = variantToEditor({
      pageKey: "contact",
      pageKind: "contact",
      body: {
        pageKind: "contact",
        publicTitle: "Contact",
        intro: "",
        supportEmail: "",
        links: [],
        showManualLink: true,
        showKnowledgeBaseLink: true,
      },
    });

    expect(editor.body.manualLinkLabel).toBe(DEFAULT_MANUAL_LINK_LABEL);
    expect(editor.body.knowledgeBaseLinkLabel).toBe(DEFAULT_KNOWLEDGE_BASE_LINK_LABEL);
    expect(editor.body.officialLinks).toEqual({
      website: "",
      youtube: "",
      facebook: "",
      instagram: "",
      tiktok: "",
      linkedin: "",
    });
  });

  it("splits and merges about hero section", () => {
    const sections = mergeAboutSections(
      { id: "hero", title: "Hero", blocks: [{ type: "paragraph", text: "Intro" }] },
      [{ id: "story", title: "Story", blocks: [{ type: "paragraph", text: "Body" }] }],
    );
    const { hero, contentSections } = splitAboutSections(sections);
    expect(hero.title).toBe("Hero");
    expect(contentSections).toHaveLength(1);
    expect(pricingOfferLabel("free")).toBe("Free");
  });
});
