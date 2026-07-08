import { useEffect, useId, useState } from "react";
import { searchGlossaryReferences } from "./glossaryAdminApi.js";

/**
 * @param {{
 *   label: string;
 *   selected: Array<{ contentId: string; label: string; contentType?: string }>;
 *   onChange: (next: Array<{ contentId: string; label: string; contentType?: string; targetType?: string }>) => void;
 *   locale?: string;
 *   excludeIds?: string[];
 *   allowTypes?: string[];
 *   seeAlsoMode?: boolean;
 * }} props
 */
export default function RelationshipPicker({
  label,
  selected,
  onChange,
  locale = "en",
  excludeIds = [],
  allowTypes,
  seeAlsoMode = false,
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
        const results = await searchGlossaryReferences(query, locale);
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
    if (seeAlsoMode) {
      onChange([
        ...selected,
        {
          contentId: option.contentId,
          label: option.label,
          contentType: option.contentType,
          targetType: option.contentType,
        },
      ]);
    } else {
      onChange([...selected, { contentId: option.contentId, label: option.label }]);
    }
    setQuery("");
  }

  function removeOption(contentId) {
    onChange(selected.filter((item) => item.contentId !== contentId));
  }

  return (
    <div className="glossary-admin__relationship-picker">
      <label className="glossary-admin__field-label" htmlFor={`${listId}-search`}>
        {label}
      </label>
      <div className="glossary-admin__relationship-selected">
        {selected.length === 0 ? (
          <p className="glossary-admin__relationship-empty">None selected.</p>
        ) : (
          selected.map((item) => (
            <span key={item.contentId} className="glossary-admin__relationship-chip">
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
        className="glossary-admin__relationship-search"
        placeholder="Search to add..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {isLoading ? <p className="glossary-admin__relationship-status">Searching...</p> : null}
      {options.length > 0 ? (
        <ul className="glossary-admin__relationship-options" aria-label={`${label} options`}>
          {options.map((option) => (
            <li key={`${option.contentType}-${option.contentId}`}>
              <button type="button" onClick={() => addOption(option)}>
                <span>{option.label}</span>
                <span className="glossary-admin__relationship-option-detail">{option.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
