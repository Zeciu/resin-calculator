import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import { ManualMediaBehavior } from "./manualAtomBehaviors.js";
import { ManualCallout } from "./manualCalloutExtension.js";
import { ManualImage } from "./manualImageExtension.js";
import { ManualVideo } from "./manualVideoExtension.js";

export const MANUAL_TEXT_ALIGNMENTS = ["left", "center", "right", "justify"];

export function createManualEditorExtensions(placeholder = "Start writing this chapter...") {
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
      alignments: MANUAL_TEXT_ALIGNMENTS,
      defaultAlignment: "left",
    }),
    ManualImage,
    ManualVideo,
    ManualCallout,
    ManualMediaBehavior,
  ];
}
