import { Node, mergeAttributes } from "@tiptap/core";

export const ManualVideo = Node.create({
  name: "manualVideo",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      embedUrl: { default: "" },
      title: { default: "" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-manual-video="true"]' }];
  },

  renderHTML({ node }) {
    const children = [
      [
        "div",
        { class: "manual-admin-editor__video-frame" },
        [
          "iframe",
          {
            src: node.attrs.embedUrl,
            title: node.attrs.title,
            tabindex: "-1",
          },
        ],
        ["div", { class: "manual-admin-editor__video-overlay", "aria-hidden": "true" }],
      ],
    ];
    if (node.attrs.caption) {
      children.push(["figcaption", { class: "manual-admin-editor__figure-caption" }, node.attrs.caption]);
    }
    return [
      "figure",
      mergeAttributes({
        "data-manual-video": "true",
        class: "manual-admin-editor__figure manual-admin-editor__figure--video",
      }),
      ...children,
    ];
  },
});
