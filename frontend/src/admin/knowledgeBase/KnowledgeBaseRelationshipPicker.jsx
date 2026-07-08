import { useEffect, useId, useState } from "react";
import { searchKnowledgeBaseReferences } from "./knowledgeBaseAdminApi.js";

/**
 * @param {{
 *   label: string;
 *   selected: Array<{ contentId: string; label: string; contentType?: string }>;
 *   onChange: (next: Array<{ contentId: string; label: string; contentType?: string }>) => void;
 *   locale?: string;
 *   excludeIds?: string[];
 *   allowTypes?: string[];
 * }} props
 */
export default function KnowledgeBaseRelationshipPicker({
  label,
  selected,
  onChange,
  locale = "en",
  excludeIds = [],
  allowTypes,
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchKnowledgeBaseReferences(query, locale);
        if (cancelled) {
          return;
        }
        const filtered = results.filter((option) => {
          if (excludeIds.includes(option.contentId)) {
            return false;
          }
          if (allowTypes && !allowTypes.includes(option.contentType)) {
            return false;
          }
          if (selected.some((item) => item.contentId === option.contentId)) {
            return false;
          }
          return true;
        });
        setOptions(filtered);
      } catch {
        if (!cancelled) {
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, locale, excludeIds, allowTypes, selected]);

  function addOption(option) {
    onChange([...selected, { contentId: option.contentId, label: option.label, contentType: option.contentType }]);
    setQuery("");
  }

  function removeOption(contentId) {
    onChange(selected.filter((item) => item.contentId !== contentId));
  }

  return (
    <div className="kb-admin__relationship-picker">
      <label className="kb-admin__field-label" htmlFor={`${listId}-search`}>
        {label}
      </label>
      <div className="kb-admin__relationship-selected">
        {selected.length === 0 ? (
          <p className="kb-admin__relationship-empty">None selected.</p>
        ) : (
          selected.map((item) => (
            <span key={item.contentId} className="kb-admin__relationship-chip">
              {item.label}
              <button type="button" onClick={() => removeOption(item.contentId)} aria-label={`Remove ${item.label}`}>
                ×
              </button>
            </span>
          ))
        )}
      </div>
      <input
        id={`${listId}-search`}
        type="search"
        className="kb-admin__relationship-search"
        placeholder="Search to add..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {isLoading ? <p className="kb-admin__relationship-status">Searching...</p> : null}
      {options.length > 0 ? (
        <ul className="kb-admin__relationship-options" aria-label={`${label} options`}>
          {options.map((option) => (
            <li key={`${option.contentType}-${option.contentId}`}>
              <button type="button" onClick={() => addOption(option)}>
                <span>{option.label}</span>
                <span className="kb-admin__relationship-option-detail">{option.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
