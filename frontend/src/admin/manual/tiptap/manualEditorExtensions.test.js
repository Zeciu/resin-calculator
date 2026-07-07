import { Editor } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { createManualEditorExtensions } from "./manualEditorExtensions.js";

function createEditor(content) {
  return new Editor({
    extensions: createManualEditorExtensions(),
    content,
  });
}

describe("manualEditorExtensions", () => {
  it("inserts a hard break on Shift+Enter and keeps a single paragraph", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Line one" }],
        },
      ],
    });

    editor.commands.focus("end");
    editor.commands.keyboardShortcut("Shift-Enter");
    editor.commands.insertContent("Line two");

    expect(editor.state.doc.childCount).toBe(1);
    const paragraph = editor.state.doc.child(0);
    expect(paragraph.type.name).toBe("paragraph");
    expect(paragraph.childCount).toBe(3);
    expect(paragraph.child(1).type.name).toBe("hardBreak");
    editor.destroy();
  });

  it("creates a new paragraph on Enter", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First paragraph" }],
        },
      ],
    });

    editor.commands.focus("end");
    editor.commands.keyboardShortcut("Enter");
    editor.commands.insertContent("Second paragraph");

    expect(editor.state.doc.childCount).toBe(2);
    expect(editor.state.doc.child(0).textContent).toBe("First paragraph");
    expect(editor.state.doc.child(1).textContent).toBe("Second paragraph");
    editor.destroy();
  });

  it("applies text alignment to paragraphs and headings", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Heading" }],
        },
      ],
    });

    let headingPos = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        headingPos = pos;
      }
    });

    editor.commands.setTextSelection(2);
    editor.commands.setTextAlign("center");
    editor.commands.setTextSelection(headingPos + 1);
    editor.commands.setTextAlign("right");

    const paragraph = editor.state.doc.child(0);
    const heading = editor.state.doc.child(1);
    expect(paragraph.attrs.textAlign).toBe("center");
    expect(heading.attrs.textAlign).toBe("right");
    editor.destroy();
  });

  it("supports undo and redo for typing changes", () => {
    const editor = createEditor({
      type: "doc",
      content: [{ type: "paragraph" }],
    });

    editor.commands.focus("end");
    editor.commands.insertContent("Draft text");
    expect(editor.state.doc.textContent).toBe("Draft text");
    expect(editor.can().undo()).toBe(true);

    editor.commands.undo();
    expect(editor.state.doc.textContent).toBe("");
    expect(editor.can().redo()).toBe(true);

    editor.commands.redo();
    expect(editor.state.doc.textContent).toBe("Draft text");
    editor.destroy();
  });
});
