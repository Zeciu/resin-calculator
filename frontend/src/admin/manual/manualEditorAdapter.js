const MAIN_SECTION_ID = "main";
const TEXT_ALIGNMENTS = new Set(["left", "center", "right", "justify"]);

function readAlignFromAttrs(attrs = {}) {
  const align = attrs?.textAlign;
  return align && TEXT_ALIGNMENTS.has(align) && align !== "left" ? { align } : {};
}

function textAlignAttrs(block) {
  return block.align && TEXT_ALIGNMENTS.has(block.align) && block.align !== "left"
    ? { textAlign: block.align }
    : {};
}

export function emptyDocument() {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

function chapterBlocks(variant) {
  return variant?.body?.sections?.[0]?.blocks ?? [];
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function tipTapInlineToHtml(content = []) {
  return content
    .map((node) => {
      if (node.type === "hardBreak") {
        return "<br>";
      }
      if (node.type !== "text") {
        return "";
      }

      let text = escapeHtml(node.text);
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") {
          text = `<strong>${text}</strong>`;
        }
        if (mark.type === "italic") {
          text = `<em>${text}</em>`;
        }
        if (mark.type === "link") {
          const href = escapeHtml(mark.attrs?.href ?? "");
          text = `<a href="${href}">${text}</a>`;
        }
      }
      return text;
    })
    .join("");
}

function htmlToTipTapInline(html) {
  const trimmed = html?.trim() ?? "";
  if (!trimmed) {
    return [];
  }
  if (!trimmed.includes("<")) {
    return [{ type: "text", text: trimmed }];
  }

  const template = document.createElement("template");
  template.innerHTML = trimmed;
  const nodes = [];

  function walk(domNode, activeMarks = []) {
    if (domNode.nodeType === 3) {
      const text = domNode.textContent;
      if (text) {
        nodes.push({
          type: "text",
          text,
          ...(activeMarks.length > 0 ? { marks: activeMarks } : {}),
        });
      }
      return;
    }

    if (domNode.nodeType !== 1) {
      return;
    }

    const tag = domNode.tagName.toLowerCase();
    if (tag === "br") {
      nodes.push({ type: "hardBreak" });
      return;
    }

    const nextMarks = [...activeMarks];
    if (tag === "strong" || tag === "b") {
      nextMarks.push({ type: "bold" });
    } else if (tag === "em" || tag === "i") {
      nextMarks.push({ type: "italic" });
    } else if (tag === "a") {
      nextMarks.push({ type: "link", attrs: { href: domNode.getAttribute("href") ?? "" } });
    }

    for (const child of domNode.childNodes) {
      walk(child, nextMarks);
    }
  }

  for (const child of template.content.childNodes) {
    walk(child);
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text: trimmed }];
}

function tipTapBlockToBackendBlocks(node) {
  switch (node.type) {
    case "paragraph": {
      const block = {
        type: "paragraph",
        text: tipTapInlineToHtml(node.content),
        ...readAlignFromAttrs(node.attrs),
      };
      return [block];
    }
    case "heading": {
      const block = {
        type: "heading",
        level: node.attrs?.level ?? 2,
        text: tipTapInlineToHtml(node.content),
        ...readAlignFromAttrs(node.attrs),
      };
      return [block];
    }
    case "manualImage":
      return [
        {
          type: "image",
          src: node.attrs?.src ?? "",
          alt: node.attrs?.alt ?? "",
          ...(node.attrs?.caption ? { caption: node.attrs.caption } : {}),
        },
      ];
    case "manualVideo":
      return [
        {
          type: "video",
          title: node.attrs?.title ?? "",
          embedUrl: node.attrs?.embedUrl ?? "",
          ...(node.attrs?.caption ? { caption: node.attrs.caption } : {}),
        },
      ];
    case "manualCallout": {
      const innerBlocks = [];
      for (const child of node.content ?? []) {
        innerBlocks.push(...tipTapBlockToBackendBlocks(child));
      }
      return [
        {
          type: "callout",
          variant: node.attrs?.variant ?? "note",
          blocks: innerBlocks,
        },
      ];
    }
    case "bulletList":
    case "orderedList": {
      const blocks = [];
      for (const listItem of node.content ?? []) {
        for (const child of listItem.content ?? []) {
          if (child.type === "paragraph") {
            const prefix = node.type === "orderedList" ? "1. " : "• ";
            const text = tipTapInlineToHtml(child.content);
            if (text) {
              blocks.push({ type: "paragraph", text: `${prefix}${text}` });
            }
          }
        }
      }
      return blocks;
    }
    default:
      return [];
  }
}

function backendBlockToTipTapNode(block) {
  switch (block.type) {
    case "paragraph": {
      const attrs = textAlignAttrs(block);
      return {
        type: "paragraph",
        ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
        content: htmlToTipTapInline(block.text),
      };
    }
    case "heading": {
      const attrs = {
        level: block.level ?? 2,
        ...textAlignAttrs(block),
      };
      return {
        type: "heading",
        attrs,
        content: htmlToTipTapInline(block.text),
      };
    }
    case "image":
      return {
        type: "manualImage",
        attrs: {
          src: block.src,
          alt: block.alt,
          caption: block.caption ?? "",
        },
      };
    case "video":
      return {
        type: "manualVideo",
        attrs: {
          embedUrl: block.embedUrl,
          title: block.title,
          caption: block.caption ?? "",
        },
      };
    case "callout":
      return {
        type: "manualCallout",
        attrs: { variant: block.variant ?? "note" },
        content: (block.blocks ?? []).flatMap((innerBlock) => backendBlockToTipTapNode(innerBlock)),
      };
    default:
      return null;
  }
}

export function blocksToDocument(blocks = []) {
  const content = blocks
    .map((block) => backendBlockToTipTapNode(block))
    .filter(Boolean);

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

export function documentToBlocks(document = emptyDocument()) {
  const blocks = [];
  for (const node of document.content ?? []) {
    blocks.push(...tipTapBlockToBackendBlocks(node));
  }
  return blocks;
}

export function variantToEditor(variant) {
  return {
    title: variant?.body?.title ?? "",
    document: blocksToDocument(chapterBlocks(variant)),
    status: variant?.status ?? "draft",
    editorialVisibility: variant?.editorialVisibility ?? "empty",
    exists: variant?.exists !== false,
  };
}

export function editorToVariantBody(title, document) {
  return {
    title: title.trim(),
    sections: [
      {
        id: MAIN_SECTION_ID,
        title: "",
        blocks: documentToBlocks(document),
      },
    ],
  };
}

export function documentsSemanticallyEqual(leftDocument, rightDocument) {
  const leftBlocks = documentToBlocks(leftDocument ?? emptyDocument());
  const rightBlocks = documentToBlocks(rightDocument ?? emptyDocument());
  return JSON.stringify(leftBlocks) === JSON.stringify(rightBlocks);
}

export function editorStatesEqual(left, right) {
  if ((left.title ?? "").trim() !== (right.title ?? "").trim()) {
    return false;
  }

  return documentsSemanticallyEqual(left.document, right.document);
}
