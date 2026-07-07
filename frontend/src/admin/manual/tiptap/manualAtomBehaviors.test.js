import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import {
  getSelectedMediaPosition,
  manualMediaKeyboardShortcuts,
  ManualMediaBehavior,
  removeMediaAtPosition,
  resolveMediaNodePosition,
} from "./manualAtomBehaviors.js";
import { ManualImage } from "./manualImageExtension.js";
import { ManualVideo } from "./manualVideoExtension.js";

function createMediaEditor(content) {
  return new Editor({
    extensions: [StarterKit, ManualImage, ManualVideo, ManualMediaBehavior],
    content,
  });
}

describe("manualAtomBehaviors", () => {
  it("resolves the media node position for a click inside a figure", () => {
    const editor = createMediaEditor({
      type: "doc",
      content: [
        { type: "paragraph" },
        { type: "manualImage", attrs: { src: "/a.png", alt: "A" } },
        { type: "manualImage", attrs: { src: "/b.png", alt: "B" } },
      ],
    });

    let secondImagePos = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "manualImage" && node.attrs.src === "/b.png") {
        secondImagePos = pos;
      }
    });

    expect(resolveMediaNodePosition(editor.state.doc, secondImagePos)).toBe(secondImagePos);
    editor.destroy();
  });

  it("removes only the selected media node", () => {
    const editor = createMediaEditor({
      type: "doc",
      content: [
        { type: "manualImage", attrs: { src: "/a.png", alt: "A" } },
        { type: "manualImage", attrs: { src: "/b.png", alt: "B" } },
      ],
    });

    let secondImagePos = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "manualImage" && node.attrs.src === "/b.png") {
        secondImagePos = pos;
      }
    });

    editor.commands.setNodeSelection(secondImagePos);
    expect(getSelectedMediaPosition(editor)).toBe(secondImagePos);
    removeMediaAtPosition(editor, secondImagePos);

    const remainingImages = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "manualImage") {
        remainingImages.push(node.attrs.src);
      }
    });
    expect(remainingImages).toEqual(["/a.png"]);
    editor.destroy();
  });

  it("removes only the selected video node", () => {
    const editor = createMediaEditor({
      type: "doc",
      content: [
        { type: "manualVideo", attrs: { embedUrl: "https://www.youtube.com/embed/a", title: "Video A" } },
        { type: "manualVideo", attrs: { embedUrl: "https://www.youtube.com/embed/b", title: "Video B" } },
      ],
    });

    let secondVideoPos = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "manualVideo" && node.attrs.embedUrl.includes("/b")) {
        secondVideoPos = pos;
      }
    });

    editor.storage.manualMediaBehavior.userSelectedMedia = true;
    editor.commands.setNodeSelection(secondVideoPos);
    removeMediaAtPosition(editor, secondVideoPos);

    const remainingVideos = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "manualVideo") {
        remainingVideos.push(node.attrs.embedUrl);
      }
    });
    expect(remainingVideos).toEqual(["https://www.youtube.com/embed/a"]);
    editor.destroy();
  });

  it("registers keyboard shortcuts for selected media", () => {
    const shortcuts = manualMediaKeyboardShortcuts();
    expect(shortcuts.Backspace).toBeTypeOf("function");
    expect(shortcuts.Delete).toBeTypeOf("function");
  });
});
