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
});
