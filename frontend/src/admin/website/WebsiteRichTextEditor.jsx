import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { createGlossaryEditorExtensions } from "../glossary/glossaryEditorExtensions.js";
import { documentsEqual } from "./websiteEditorAdapter.js";

function preventToolbarFocusLoss(event) {
  event.preventDefault();
}

/**
 * @param {{
 *   document: object;
 *   onDocumentChange: (document: object) => void;
 *   disabled?: boolean;
 *   placeholder?: string;
 *   ariaLabel?: string;
 * }} props
 */
export default function WebsiteRichTextEditor({
  document,
  onDocumentChange,
  disabled = false,
  placeholder = "Write content...",
  ariaLabel = "Rich text editor",
}) {
  const isApplyingContent = useRef(true);
  const baselineDocumentRef = useRef(document);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const editor = useEditor({
    editable: !disabled,
    autofocus: false,
    extensions: createGlossaryEditorExtensions(placeholder),
    content: document,
    onUpdate: ({ editor: currentEditor }) => {
      if (isApplyingContent.current) {
        return;
      }
      const nextDocument = currentEditor.getJSON();
      if (documentsEqual(nextDocument, baselineDocumentRef.current)) {
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
    if (documentsEqual(editor.getJSON(), document)) {
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
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="website-rich-text-editor" aria-label={ariaLabel}>
      <div className="website-rich-text-editor__toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" onMouseDown={preventToolbarFocusLoss} onClick={() => editor.chain().focus().toggleBold().run()} disabled={disabled}>
          Bold
        </button>
        <button type="button" onMouseDown={preventToolbarFocusLoss} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={disabled}>
          Italic
        </button>
        <button type="button" onMouseDown={preventToolbarFocusLoss} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={disabled}>
          Heading
        </button>
        <button type="button" onMouseDown={preventToolbarFocusLoss} onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled}>
          Bullets
        </button>
        <button type="button" onMouseDown={preventToolbarFocusLoss} onClick={() => editor.chain().focus().undo().run()} disabled={disabled || !historyState.canUndo}>
          Undo
        </button>
        <button type="button" onMouseDown={preventToolbarFocusLoss} onClick={() => editor.chain().focus().redo().run()} disabled={disabled || !historyState.canRedo}>
          Redo
        </button>
      </div>
      <EditorContent editor={editor} className="website-rich-text-editor__content" />
    </div>
  );
}
