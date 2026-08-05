import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { documentsSemanticallyEqual } from "./manualEditorAdapter.js";
import { uploadManualImage } from "./manualAdminApi.js";
import { CALLOUT_VARIANTS } from "./tiptap/manualCalloutExtension.js";
import {
  getSelectedMediaPosition,
  removeMediaAtPosition,
} from "./tiptap/manualAtomBehaviors.js";
import {
  createManualEditorExtensions,
  MANUAL_TEXT_ALIGNMENTS,
} from "./tiptap/manualEditorExtensions.js";
import { deriveVideoTitle, normalizeVideoEmbedUrl } from "./videoEmbed.js";

const IMAGE_INPUT_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";

function promptValue(label, defaultValue = "") {
  const value = window.prompt(label, defaultValue);
  if (value === null) {
    return null;
  }
  return value.trim();
}

function defaultAltText(file) {
  const stem = file.name.replace(/\.[^.]+$/, "").trim();
  return stem || "Manual illustration";
}

function isImageFile(file) {
  return file?.type?.startsWith("image/") ?? false;
}

function preventToolbarFocusLoss(event) {
  event.preventDefault();
}

export default function ManualChapterEditor({
  document,
  onDocumentChange,
  disabled = false,
}) {
  const isApplyingContent = useRef(true);
  const baselineDocumentRef = useRef(document);
  const selectedMediaPosRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedMediaPos, setSelectedMediaPos] = useState(null);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const editor = useEditor({
    editable: !disabled,
    autofocus: false,
    extensions: createManualEditorExtensions(),
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
      syncSelectedMedia(currentEditor);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      syncSelectedMedia(currentEditor);
    },
    onTransaction: ({ editor: currentEditor }) => {
      setHistoryState({
        canUndo: currentEditor.can().undo(),
        canRedo: currentEditor.can().redo(),
      });
    },
  });

  function syncSelectedMedia(currentEditor) {
    const nextPos = currentEditor ? getSelectedMediaPosition(currentEditor, true) : null;
    selectedMediaPosRef.current = nextPos;
    setSelectedMediaPos(nextPos);
  }

  function resetMediaSelection(currentEditor) {
    if (currentEditor?.storage?.manualMediaBehavior) {
      currentEditor.storage.manualMediaBehavior.userSelectedMedia = false;
    }
    selectedMediaPosRef.current = null;
    setSelectedMediaPos(null);
  }

  useEffect(() => {
    baselineDocumentRef.current = document;
    if (!editor) {
      return;
    }
    if (documentsSemanticallyEqual(editor.getJSON(), document)) {
      isApplyingContent.current = false;
      resetMediaSelection(editor);
      return;
    }
    isApplyingContent.current = true;
    resetMediaSelection(editor);
    editor.commands.setContent(document, false);
    queueMicrotask(() => {
      isApplyingContent.current = false;
      syncSelectedMedia(editor);
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
      syncSelectedMedia(editor);
    });
  }, [editor]);

  if (!editor) {
    return null;
  }

  function insertLink() {
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = promptValue("Link URL", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function insertUploadedImage(file) {
    if (!isImageFile(file)) {
      window.alert("Only image files can be inserted.");
      return;
    }

    try {
      const { url } = await uploadManualImage(file);
      const alt = promptValue("Alt text", defaultAltText(file)) ?? defaultAltText(file);
      const caption = promptValue("Caption (optional)") ?? "";
      editor
        .chain()
        .focus()
        .insertContent({
          type: "manualImage",
          attrs: { src: url, alt, caption },
        })
        .run();
    } catch (error) {
      window.alert(error.message || "Image upload failed.");
    }
  }

  function openImagePicker() {
    fileInputRef.current?.click();
  }

  async function handleImageInputChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    await insertUploadedImage(file);
  }

  async function handleImageDrop(event) {
    event.preventDefault();
    if (disabled) {
      return;
    }
    const file = Array.from(event.dataTransfer?.files ?? []).find(isImageFile);
    if (!file) {
      return;
    }
    await insertUploadedImage(file);
  }

  function insertVideo() {
    const url = promptValue("Video URL (YouTube, Vimeo, or embed URL)");
    if (!url) {
      return;
    }
    const embedUrl = normalizeVideoEmbedUrl(url);
    editor
      .chain()
      .focus()
      .insertContent({
        type: "manualVideo",
        attrs: {
          embedUrl,
          title: deriveVideoTitle(url, embedUrl),
        },
      })
      .run();
  }

  function removeSelectedMedia() {
    const mediaPos = selectedMediaPosRef.current;
    if (mediaPos === null) {
      return;
    }
    const removed = removeMediaAtPosition(editor, mediaPos);
    if (removed) {
      resetMediaSelection(editor);
    }
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
    <div className="manual-admin-editor" aria-label="Chapter document">
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_INPUT_ACCEPT}
        className="manual-admin-editor__file-input"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleImageInputChange}
      />
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
        {MANUAL_TEXT_ALIGNMENTS.map((alignment) => (
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
        <button type="button" onMouseDown={preventToolbarFocusLoss} onClick={openImagePicker} disabled={disabled}>
          Image
        </button>
        <button type="button" onMouseDown={preventToolbarFocusLoss} onClick={insertVideo} disabled={disabled}>
          Video
        </button>
        <button
          type="button"
          onMouseDown={preventToolbarFocusLoss}
          onClick={removeSelectedMedia}
          disabled={disabled || selectedMediaPos === null}
          aria-disabled={disabled || selectedMediaPos === null}
        >
          Remove media
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
      <div
        className="manual-admin-editor__content"
        onDragOver={(event) => {
          if (!disabled && Array.from(event.dataTransfer?.items ?? []).some((item) => item.kind === "file")) {
            event.preventDefault();
          }
        }}
        onDrop={handleImageDrop}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
