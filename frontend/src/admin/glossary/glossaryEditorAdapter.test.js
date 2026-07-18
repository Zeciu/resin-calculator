import { describe, expect, it } from "vitest";
import { editorToVariantBody, variantToEditor } from "./glossaryEditorAdapter.js";

describe("glossaryEditorAdapter HTML entities (Observation 004)", () => {
  it("decodes definition block entities through the shared Manual adapter", () => {
    const editor = variantToEditor({
      status: "draft",
      exists: true,
      body: {
        term: "Humidité",
        definitionBlocks: [{ type: "paragraph", text: "Il s&#x27;agit d&#x27;humidité." }],
        media: [],
        relatedTermIds: [],
        synonymTermIds: [],
        seeAlso: [],
      },
    });

    expect(editor.document.content[0].content[0].text).toBe("Il s'agit d'humidité.");

    const body = editorToVariantBody(editor);
    expect(body.definitionBlocks[0].text).not.toContain("&amp;#");

    const reopened = variantToEditor({
      status: "draft",
      exists: true,
      body,
    });
    expect(reopened.document.content[0].content[0].text).toBe("Il s'agit d'humidité.");
  });
});
