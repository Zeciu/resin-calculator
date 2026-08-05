import { Node, mergeAttributes } from "@tiptap/core";

export const ManualImage = Node.create({
  name: "manualImage",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-manual-image="true"]' }];
  },

  renderHTML({ node }) {
    const children = [
      ["img", { src: node.attrs.src, alt: node.attrs.alt }],
    ];
    if (node.attrs.caption) {
      children.push(["figcaption", { class: "manual-admin-editor__figure-caption" }, node.attrs.caption]);
    }
    return [
      "figure",
      mergeAttributes({
        "data-manual-image": "true",
        class: "manual-admin-editor__figure manual-admin-editor__figure--image",
      }),
      ...children,
    ];
  },
});
