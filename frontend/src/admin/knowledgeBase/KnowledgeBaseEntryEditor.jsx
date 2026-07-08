import EditorialMediaPanel from "../../editorial/EditorialMediaPanel.jsx";
import { uploadKnowledgeBaseImage } from "./knowledgeBaseAdminApi.js";
import { KB_CATEGORIES, KB_DIFFICULTIES } from "./knowledgeBaseEditorAdapter.js";
import KeywordListEditor from "./KeywordListEditor.jsx";
import StringListEditor from "./StringListEditor.jsx";

/**
 * @param {{
 *   editorState: import("./knowledgeBaseEditorAdapter.js").ReturnType<typeof import("./knowledgeBaseEditorAdapter.js").emptyEditorState>;
 *   onChange: (patch: object) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function KnowledgeBaseEntryEditor({ editorState, onChange, disabled = false }) {
  function patch(next) {
    onChange(next);
  }

  return (
    <div className="kb-admin__structured-editor" aria-label="Knowledge base entry fields">
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

      <EditorialMediaPanel
        media={editorState.media ?? []}
        onMediaChange={(media) => patch({ media })}
        onUploadImage={uploadKnowledgeBaseImage}
        disabled={disabled}
        ariaLabel="Knowledge base media"
      />
    </div>
  );
}
