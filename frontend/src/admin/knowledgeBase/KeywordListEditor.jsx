import { useState } from "react";

/**
 * @param {{
 *   label: string;
 *   keywords: string[];
 *   onChange: (keywords: string[]) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function KeywordListEditor({ label, keywords, onChange, disabled = false }) {
  const [draft, setDraft] = useState("");

  function addKeyword() {
    const value = draft.trim();
    if (!value || keywords.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...keywords, value]);
    setDraft("");
  }

  function removeKeyword(value) {
    onChange(keywords.filter((item) => item !== value));
  }

  return (
    <div className="kb-admin__keyword-editor">
      <span className="kb-admin__field-label">{label}</span>
      <div className="kb-admin__keyword-selected">
        {keywords.length === 0 ? (
          <p className="kb-admin__relationship-empty">No keywords yet.</p>
        ) : (
          keywords.map((keyword) => (
            <span key={keyword} className="kb-admin__keyword-chip">
              {keyword}
              <button type="button" onClick={() => removeKeyword(keyword)} disabled={disabled} aria-label={`Remove ${keyword}`}>
                ×
              </button>
            </span>
          ))
        )}
      </div>
      <div className="kb-admin__keyword-input-row">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addKeyword();
            }
          }}
          placeholder="Add search keyword"
          disabled={disabled}
        />
        <button type="button" onClick={addKeyword} disabled={disabled}>
          Add
        </button>
      </div>
    </div>
  );
}
