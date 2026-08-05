import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import { ManualCallout } from "../manual/tiptap/manualCalloutExtension.js";

export const GLOSSARY_TEXT_ALIGNMENTS = ["left", "center", "right", "justify"];

export function createGlossaryEditorExtensions(placeholder = "Write the definition...") {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      hardBreak: {
        keepMarks: true,
      },
      link: {
        openOnClick: false,
        autolink: true,
      },
    }),
    Placeholder.configure({
      placeholder,
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: GLOSSARY_TEXT_ALIGNMENTS,
      defaultAlignment: "left",
    }),
    ManualCallout,
  ];
}
