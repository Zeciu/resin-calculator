import { describe, expect, it } from "vitest";
import { validateWebsiteEditorState } from "./websiteValidation.js";

describe("websiteValidation", () => {
  it("requires a page title", () => {
    expect(
      validateWebsiteEditorState({
        pageKind: "home",
        body: { pageKind: "home", publicTitle: "" },
      }),
    ).toBe("Page title cannot be empty.");
  });

  it("rejects invalid home CTA destination", () => {
    expect(
      validateWebsiteEditorState({
        pageKind: "home",
        body: {
          pageKind: "home",
          publicTitle: "Home",
          cta: { destination: "not a url" },
        },
      }),
    ).toBe("CTA destination must be a valid URL or site path.");
  });

  it("rejects duplicate section ids", () => {
    expect(
      validateWebsiteEditorState({
        pageKind: "privacy",
        body: {
          pageKind: "privacy",
          publicTitle: "Privacy",
          sections: [
            { id: "a", title: "One", blocks: [] },
            { id: "a", title: "Two", blocks: [] },
          ],
        },
      }),
    ).toBe("Duplicate section identifier: a");
  });

  it("preserves fixed pricing offer ids", () => {
    expect(
      validateWebsiteEditorState({
        pageKind: "pricing",
        body: {
          pageKind: "pricing",
          publicTitle: "Pricing",
          offers: [{ id: "free", title: "Free", ctaDestination: "/register" }],
        },
      }),
    ).toBe("Pricing plans must include Free, Subscriber, and Lifetime.");
  });

  it("rejects invalid contact email", () => {
    expect(
      validateWebsiteEditorState({
        pageKind: "contact",
        body: {
          pageKind: "contact",
          publicTitle: "Contact",
          supportEmail: "not-an-email",
        },
      }),
    ).toBe("Support email must be a valid email address.");
  });

  it("rejects invalid contact link url", () => {
    expect(
      validateWebsiteEditorState({
        pageKind: "contact",
        body: {
          pageKind: "contact",
          publicTitle: "Contact",
          links: [{ label: "Site", url: "bad url" }],
        },
      }),
    ).toBe("Each contact link must have a valid URL.");
  });

  it("rejects invalid official link urls", () => {
    expect(
      validateWebsiteEditorState({
        pageKind: "contact",
        body: {
          pageKind: "contact",
          publicTitle: "Contact",
          officialLinks: { youtube: "not a url" },
        },
      }),
    ).toBe("Official link URLs must be valid http(s) addresses or left empty.");
  });

  it("allows empty official link urls", () => {
    expect(
      validateWebsiteEditorState({
        pageKind: "contact",
        body: {
          pageKind: "contact",
          publicTitle: "Contact",
          officialLinks: {
            website: "",
            youtube: "https://www.youtube.com/@hfzwood",
          },
        },
      }),
    ).toBeNull();
  });
});
