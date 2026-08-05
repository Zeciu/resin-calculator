import { Node, mergeAttributes } from "@tiptap/core";

export const CALLOUT_VARIANTS = ["important", "warning", "tip", "note", "quote"];

export const ManualCallout = Node.create({
  name: "manualCallout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: { default: "note" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-manual-callout]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-manual-callout": node.attrs.variant,
        class: `manual-admin-editor__callout manual-admin-editor__callout--${node.attrs.variant}`,
      }),
      0,
    ];
  },
});
