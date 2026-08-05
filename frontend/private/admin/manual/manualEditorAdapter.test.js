import { describe, expect, it } from "vitest";
import {
  blocksToDocument,
  documentToBlocks,
  documentsSemanticallyEqual,
  editorStatesEqual,
  editorToVariantBody,
  variantToEditor,
} from "./manualEditorAdapter.js";

describe("manualEditorAdapter", () => {
  it("round-trips plain paragraphs", () => {
    const blocks = [{ type: "paragraph", text: "First paragraph." }];
    const document = blocksToDocument(blocks);
    expect(documentToBlocks(document)).toEqual(blocks);
  });

  it("round-trips empty paragraphs for natural spacing", () => {
    const blocks = [
      { type: "paragraph", text: "First paragraph." },
      { type: "paragraph", text: "" },
      { type: "paragraph", text: "Second paragraph." },
    ];
    expect(documentToBlocks(blocksToDocument(blocks))).toEqual(blocks);
  });

  it("round-trips line breaks inside paragraphs", () => {
    const blocks = [{ type: "paragraph", text: "Line one<br>Line two" }];
    expect(documentToBlocks(blocksToDocument(blocks))).toEqual(blocks);
  });

  it("round-trips paragraph and heading alignment", () => {
    const blocks = [
      { type: "paragraph", text: "Centered text.", align: "center" },
      { type: "heading", level: 2, text: "Right heading", align: "right" },
    ];
    expect(documentToBlocks(blocksToDocument(blocks))).toEqual(blocks);
  });

  it("round-trips rich text marks as HTML", () => {
    const blocks = [{ type: "paragraph", text: "Bold <strong>text</strong> and <em>italic</em>." }];
    const roundTrip = documentToBlocks(blocksToDocument(blocks));
    expect(roundTrip).toEqual(blocks);
  });

  it("round-trips headings, images, and videos", () => {
    const blocks = [
      { type: "heading", level: 2, text: "Calibration" },
      { type: "paragraph", text: "Intro text." },
      {
        type: "image",
        src: "/header-wood-epoxy.png",
        alt: "Wood and epoxy resin in a workshop setting",
        caption: "Reference photograph.",
      },
      {
        type: "video",
        title: "Calibration walkthrough",
        embedUrl: "https://www.youtube.com/embed/EngW7tLk6R8",
      },
    ];

    expect(documentToBlocks(blocksToDocument(blocks))).toEqual(blocks);
  });

  it("round-trips callout blocks", () => {
    const blocks = [
      {
        type: "callout",
        variant: "warning",
        blocks: [{ type: "paragraph", text: "Check the calibration line." }],
      },
    ];

    expect(documentToBlocks(blocksToDocument(blocks))).toEqual(blocks);
  });

  it("maps variants to and from editor state", () => {
    const variant = {
      status: "draft",
      exists: true,
      body: {
        title: "Chapter",
        sections: [
          {
            id: "main",
            title: "",
            blocks: [{ type: "paragraph", text: "Saved body." }],
          },
        ],
      },
    };

    const editor = variantToEditor(variant);
    const body = editorToVariantBody(editor.title, editor.document);
    expect(body.title).toBe("Chapter");
    expect(body.sections[0].blocks).toEqual([{ type: "paragraph", text: "Saved body." }]);
  });

  it("compares editor state by title and document JSON", () => {
    const left = variantToEditor({
      body: {
        title: "Chapter",
        sections: [{ id: "main", title: "", blocks: [{ type: "paragraph", text: "A" }] }],
      },
    });
    const right = { ...left, document: blocksToDocument([{ type: "paragraph", text: "B" }]) };
    expect(editorStatesEqual(left, right)).toBe(false);
  });

  it("treats semantically identical TipTap documents as equal", () => {
    const left = {
      title: "Chapter",
      document: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Saved body." }] }],
      },
    };
    const right = {
      title: "Chapter",
      document: blocksToDocument([{ type: "paragraph", text: "Saved body." }]),
    };
    expect(editorStatesEqual(left, right)).toBe(true);
  });

  it("compares documents by semantic blocks", () => {
    const left = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Saved body." }] }],
    };
    const right = blocksToDocument([{ type: "paragraph", text: "Saved body." }]);
    expect(documentsSemanticallyEqual(left, right)).toBe(true);
  });

  describe("HTML entity load/save round-trip (Observation 004)", () => {
    function paragraphText(blocks) {
      return blocks[0]?.text ?? "";
    }

    function editorTextFromBlocks(blocks) {
      const document = blocksToDocument(blocks);
      return document.content[0]?.content?.[0]?.text ?? "";
    }

    it("decodes plain hexadecimal apostrophe entities into editor text", () => {
      const blocks = [{ type: "paragraph", text: "Il s&#x27;agit" }];
      expect(editorTextFromBlocks(blocks)).toBe("Il s'agit");
    });

    it("round-trips apostrophe entities without double-escaping", () => {
      const blocks = [{ type: "paragraph", text: "d&#x27;humidité" }];
      expect(editorTextFromBlocks(blocks)).toBe("d'humidité");

      const saved = documentToBlocks(blocksToDocument(blocks));
      expect(paragraphText(saved)).not.toContain("&amp;#");
      expect(editorTextFromBlocks(saved)).toBe("d'humidité");
    });

    it("decodes named ampersand entities and keeps a single safe escape on save", () => {
      const blocks = [{ type: "paragraph", text: "A &amp; B" }];
      expect(editorTextFromBlocks(blocks)).toBe("A & B");

      const saved = documentToBlocks(blocksToDocument(blocks));
      expect(paragraphText(saved)).toBe("A &amp; B");
      expect(editorTextFromBlocks(saved)).toBe("A & B");
    });

    it("decodes quotation entities", () => {
      const blocks = [{ type: "paragraph", text: "&quot;test&quot;" }];
      expect(editorTextFromBlocks(blocks)).toBe('"test"');

      const saved = documentToBlocks(blocksToDocument(blocks));
      expect(paragraphText(saved)).toBe("&quot;test&quot;");
      expect(editorTextFromBlocks(saved)).toBe('"test"');
    });

    it("does not progressively double-encode non-breaking spaces", () => {
      const blocks = [{ type: "paragraph", text: "a&nbsp;b" }];
      expect(editorTextFromBlocks(blocks)).toBe("a\u00a0b");

      const once = documentToBlocks(blocksToDocument(blocks));
      const twice = documentToBlocks(blocksToDocument(once));
      expect(paragraphText(once)).not.toContain("&amp;nbsp");
      expect(paragraphText(twice)).not.toContain("&amp;nbsp");
      expect(editorTextFromBlocks(once)).toBe("a\u00a0b");
      expect(editorTextFromBlocks(twice)).toBe("a\u00a0b");
    });

    it("preserves inline markup while decoding text-node entities", () => {
      const blocks = [
        {
          type: "paragraph",
          text: 'See <strong>d&#x27;humidité</strong> and <a href="/docs">L&#x27;utilisation</a>.',
        },
      ];
      const document = blocksToDocument(blocks);
      const texts = (document.content[0].content ?? [])
        .filter((node) => node.type === "text")
        .map((node) => node.text);
      expect(texts.join("")).toBe("See d'humidité and L'utilisation.");

      const saved = documentToBlocks(document);
      expect(paragraphText(saved)).toContain("<strong>");
      expect(paragraphText(saved)).toContain('<a href="/docs">');
      expect(paragraphText(saved)).not.toContain("&amp;#");
      expect(
        (blocksToDocument(saved).content[0].content ?? [])
          .filter((node) => node.type === "text")
          .map((node) => node.text)
          .join(""),
      ).toBe("See d'humidité and L'utilisation.");
    });

    it("survives repeated open → save → open cycles without progressive corruption", () => {
      let blocks = [{ type: "paragraph", text: "Il s&#x27;agit d&#x27;humidité &amp; plus" }];
      for (let i = 0; i < 3; i += 1) {
        blocks = documentToBlocks(blocksToDocument(blocks));
        expect(paragraphText(blocks)).not.toContain("&amp;#");
        expect(paragraphText(blocks)).not.toContain("&amp;amp;");
        expect(editorTextFromBlocks(blocks)).toBe("Il s'agit d'humidité & plus");
      }
    });

    it("leaves ordinary text without entities unchanged", () => {
      const blocks = [{ type: "paragraph", text: "Ordinary calibration text." }];
      expect(editorTextFromBlocks(blocks)).toBe("Ordinary calibration text.");
      expect(documentToBlocks(blocksToDocument(blocks))).toEqual(blocks);
    });

    it("does not turn encoded angle brackets into active markup", () => {
      const blocks = [{ type: "paragraph", text: "&lt;strong&gt;safe&lt;/strong&gt;" }];
      const document = blocksToDocument(blocks);
      expect(document.content[0].content).toEqual([
        { type: "text", text: "<strong>safe</strong>" },
      ]);
      const saved = documentToBlocks(document);
      expect(paragraphText(saved)).toBe("&lt;strong&gt;safe&lt;/strong&gt;");
    });
  });
});
