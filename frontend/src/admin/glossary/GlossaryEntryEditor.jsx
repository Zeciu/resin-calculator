import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import EditorialMediaPanel from "../../editorial/EditorialMediaPanel.jsx";
import { documentsSemanticallyEqual } from "./glossaryEditorAdapter.js";
import { uploadGlossaryImage } from "./glossaryAdminApi.js";
import { CALLOUT_VARIANTS } from "../manual/tiptap/manualCalloutExtension.js";
import {
  createGlossaryEditorExtensions,
  GLOSSARY_TEXT_ALIGNMENTS,
} from "./glossaryEditorExtensions.js";

function preventToolbarFocusLoss(event) {
  event.preventDefault();
}

/**
 * @param {{
 *   document: object;
 *   onDocumentChange: (document: object) => void;
 *   media?: import("../../glossary/glossaryContent.js").GlossaryMediaBlock[];
 *   onMediaChange?: (media: import("../../glossary/glossaryContent.js").GlossaryMediaBlock[]) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function GlossaryEntryEditor({
  document,
  onDocumentChange,
  media = [],
  onMediaChange,
  disabled = false,
}) {
  const isApplyingContent = useRef(true);
  const baselineDocumentRef = useRef(document);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const editor = useEditor({
    editable: !disabled,
    autofocus: false,
    extensions: createGlossaryEditorExtensions(),
    content: document,
    onUpdate: ({ editor: currentEditor }) => {
      if (isApplyingContent.current) {
        return;
      }
      const nextDocument = currentEditor.getJSON();
      if (documentsSemanticallyEqual(nextDocument, baselineDocumentRef.current)) {
        return;
      }
      onDocumentChange(nextDocument);
    },
    onTransaction: ({ editor: currentEditor }) => {
      setHistoryState({
        canUndo: currentEditor.can().undo(),
        canRedo: currentEditor.can().redo(),
      });
    },
  });

  useEffect(() => {
    baselineDocumentRef.current = document;
    if (!editor) {
      return;
    }
    if (documentsSemanticallyEqual(editor.getJSON(), document)) {
      isApplyingContent.current = false;
      return;
    }
    isApplyingContent.current = true;
    editor.commands.setContent(document, false);
    queueMicrotask(() => {
      isApplyingContent.current = false;
    });
  }, [document, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    setHistoryState({
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    queueMicrotask(() => {
      isApplyingContent.current = false;
    });
  }, [editor]);

  if (!editor) {
    return null;
  }

  function insertLink() {
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Link URL", previousUrl);
    if (url === null) {
      return;
    }
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  function insertCallout(variant) {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "manualCallout",
        attrs: { variant },
        content: [{ type: "paragraph" }],
      })
      .run();
  }

  function setTextAlignment(alignment) {
    editor.chain().focus().setTextAlign(alignment).run();
  }

  const alignmentLabels = {
    left: "Align left",
    center: "Align center",
    right: "Align right",
    justify: "Justify",
  };

  return (
    <div className="manual-admin-editor glossary-admin-editor" aria-label="Glossary definition">
      <div className="manual-admin-editor__toolbar" role="toolbar" aria-label="Formatting">
        <button
          type="button"
          onMouseDown={preventToolbarFocusLoss}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !historyState.canUndo}
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          type="button"
          onMouseDown={preventToolbarFocusLoss}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !historyState.canRedo}
          aria-label="Redo"
        >
          Redo
        </button>
        <button
          type="button"
          className={editor.isActive("bold") ? "is-active" : ""}
          onMouseDown={preventToolbarFocusLoss}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        >
          Bold
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? "is-active" : ""}
          onMouseDown={preventToolbarFocusLoss}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        >
          Italic
        </button>
        {GLOSSARY_TEXT_ALIGNMENTS.map((alignment) => (
          <button
            key={alignment}
            type="button"
            className={editor.isActive({ textAlign: alignment }) ? "is-active" : ""}
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => setTextAlignment(alignment)}
            disabled={disabled}
            aria-label={alignmentLabels[alignment]}
          >
            {alignmentLabels[alignment]}
          </button>
        ))}
        <button
          type="button"
          className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
          onMouseDown={preventToolbarFocusLoss}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
        >
          H2
        </button>
        <button
          type="button"
          className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
          onMouseDown={preventToolbarFocusLoss}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
        >
          H3
        </button>
        <button
          type="button"
          className={editor.isActive("bulletList") ? "is-active" : ""}
          onMouseDown={preventToolbarFocusLoss}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        >
          Bullets
        </button>
        <button
          type="button"
          className={editor.isActive("orderedList") ? "is-active" : ""}
          onMouseDown={preventToolbarFocusLoss}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        >
          Numbered
        </button>
        <button type="button" onMouseDown={preventToolbarFocusLoss} onClick={insertLink} disabled={disabled}>
          Link
        </button>
        {CALLOUT_VARIANTS.map((variant) => (
          <button
            key={variant}
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => insertCallout(variant)}
            disabled={disabled}
          >
            {variant[0].toUpperCase() + variant.slice(1)}
          </button>
        ))}
      </div>
      <div className="manual-admin-editor__content">
        <EditorContent editor={editor} />
      </div>

      <EditorialMediaPanel
        media={media}
        onMediaChange={onMediaChange}
        onUploadImage={uploadGlossaryImage}
        disabled={disabled}
        ariaLabel="Glossary media"
      />
    </div>
  );
}
