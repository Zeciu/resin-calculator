import { useRef } from "react";
import { uploadKnowledgeBaseImage } from "./knowledgeBaseAdminApi.js";
import { KB_CATEGORIES, KB_DIFFICULTIES } from "./knowledgeBaseEditorAdapter.js";
import KeywordListEditor from "./KeywordListEditor.jsx";
import StringListEditor from "./StringListEditor.jsx";
import { deriveVideoTitle, normalizeVideoEmbedUrl } from "../manual/videoEmbed.js";

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
  return stem || "Knowledge base illustration";
}

function isImageFile(file) {
  return file?.type?.startsWith("image/") ?? false;
}

/**
 * @param {{
 *   editorState: import("./knowledgeBaseEditorAdapter.js").ReturnType<typeof import("./knowledgeBaseEditorAdapter.js").emptyEditorState>;
 *   onChange: (patch: object) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function KnowledgeBaseEntryEditor({ editorState, onChange, disabled = false }) {
  const fileInputRef = useRef(null);

  function patch(next) {
    onChange(next);
  }

  async function insertUploadedImage(file) {
    if (!isImageFile(file)) {
      window.alert("Only image files can be uploaded.");
      return;
    }

    try {
      const { url } = await uploadKnowledgeBaseImage(file);
      const alt = promptValue("Alt text", defaultAltText(file)) ?? defaultAltText(file);
      const caption = promptValue("Caption (optional)") ?? "";
      patch({
        media: [
          ...(editorState.media ?? []),
          {
            type: "image",
            src: url,
            alt,
            ...(caption ? { caption } : {}),
          },
        ],
      });
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

  function insertVideo() {
    const url = promptValue("Video URL (YouTube, Vimeo, or embed URL)");
    if (!url) {
      return;
    }
    const embedUrl = normalizeVideoEmbedUrl(url);
    const title = deriveVideoTitle(url, embedUrl);
    const caption = promptValue("Caption (optional)") ?? "";
    patch({
      media: [
        ...(editorState.media ?? []),
        {
          type: "video",
          title,
          embedUrl,
          ...(caption ? { caption } : {}),
        },
      ],
    });
  }

  function removeMedia(index) {
    patch({
      media: (editorState.media ?? []).filter((_, itemIndex) => itemIndex !== index),
    });
  }

  return (
    <div className="kb-admin__structured-editor" aria-label="Knowledge base entry fields">
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_INPUT_ACCEPT}
        className="manual-admin-editor__file-input"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleImageInputChange}
      />

      <div className="kb-admin__field-row">
        <label className="kb-admin__field">
          <span className="kb-admin__field-label">Category</span>
          <select
            value={editorState.category}
            onChange={(event) => patch({ category: event.target.value })}
            disabled={disabled}
            aria-label="Category"
          >
            {KB_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="kb-admin__field">
          <span className="kb-admin__field-label">Difficulty</span>
          <select
            value={editorState.difficulty}
            onChange={(event) => patch({ difficulty: event.target.value })}
            disabled={disabled}
            aria-label="Difficulty"
          >
            {KB_DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="kb-admin__field kb-admin__field--wide">
        <span className="kb-admin__field-label">Problem Summary</span>
        <textarea
          rows={3}
          value={editorState.problemSummary}
          onChange={(event) => patch({ problemSummary: event.target.value })}
          disabled={disabled}
          aria-label="Problem summary"
        />
      </label>

      <StringListEditor
        label="Symptoms"
        items={editorState.symptoms}
        onChange={(symptoms) => patch({ symptoms })}
        disabled={disabled}
      />
      <StringListEditor
        label="Possible Causes"
        items={editorState.possibleCauses}
        onChange={(possibleCauses) => patch({ possibleCauses })}
        disabled={disabled}
      />
      <StringListEditor
        label="Solution"
        items={editorState.solution}
        onChange={(solution) => patch({ solution })}
        disabled={disabled}
      />
      <StringListEditor
        label="Prevention"
        items={editorState.prevention}
        onChange={(prevention) => patch({ prevention })}
        disabled={disabled}
      />
      <StringListEditor
        label="Tips"
        items={editorState.tips}
        onChange={(tips) => patch({ tips })}
        disabled={disabled}
      />
      <StringListEditor
        label="Warnings"
        items={editorState.warnings}
        onChange={(warnings) => patch({ warnings })}
        disabled={disabled}
      />

      <KeywordListEditor
        label="Search Keywords"
        keywords={editorState.searchKeywords}
        onChange={(searchKeywords) => patch({ searchKeywords })}
        disabled={disabled}
      />

      <label className="kb-admin__field kb-admin__field--wide">
        <span className="kb-admin__field-label">Estimated Repair Time</span>
        <input
          type="text"
          value={editorState.estimatedRepairTime}
          onChange={(event) => patch({ estimatedRepairTime: event.target.value })}
          disabled={disabled}
          aria-label="Estimated repair time"
          placeholder="e.g. 30 minutes"
        />
      </label>

      <StringListEditor
        label="Required Tools"
        items={editorState.requiredTools}
        onChange={(requiredTools) => patch({ requiredTools })}
        disabled={disabled}
      />
      <StringListEditor
        label="Required Materials"
        items={editorState.requiredMaterials}
        onChange={(requiredMaterials) => patch({ requiredMaterials })}
        disabled={disabled}
      />

      <div className="kb-admin__media-panel" aria-label="Knowledge base media">
        <div className="kb-admin__media-toolbar">
          <span className="kb-admin__field-label">Media</span>
          <div className="kb-admin__media-actions">
            <button type="button" onClick={openImagePicker} disabled={disabled}>
              Add image
            </button>
            <button type="button" onClick={insertVideo} disabled={disabled}>
              Add video
            </button>
          </div>
        </div>
        {(editorState.media ?? []).length === 0 ? (
          <p className="kb-admin__relationship-empty">No media attached.</p>
        ) : (
          <ul className="kb-admin__media-list">
            {(editorState.media ?? []).map((block, index) => (
              <li key={`${block.type}-${index}`} className="kb-admin__media-item">
                <span>{block.type === "image" ? block.alt || "Image" : block.title || "Video"}</span>
                <button type="button" onClick={() => removeMedia(index)} disabled={disabled}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
