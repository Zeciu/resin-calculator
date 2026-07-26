import { useEffect, useId, useState } from "react";
import { searchEditorialReferences } from "./editorialAdminApi.js";

/**
 * @param {{
 *   label: string;
 *   selected: Array<{ contentId: string; label: string; contentType?: string; targetType?: string }>;
 *   onChange: (next: Array<{ contentId: string; label: string; contentType?: string; targetType?: string }>) => void;
 *   locale?: string;
 *   excludeIds?: string[];
 *   allowTypes?: string[];
 *   seeAlsoMode?: boolean;
 *   publishedOnly?: boolean;
 * }} props
 */
export default function CrossReferencePicker({
  label,
  selected,
  onChange,
  locale = "ro",
  excludeIds = [],
  allowTypes,
  seeAlsoMode = false,
  publishedOnly = false,
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Stabilize effect deps: parent pages often pass fresh array literals for
  // excludeIds / allowTypes / selected on every render (including Save Draft
  // isSaving toggles). Re-searching on identity-only changes flooded the API
  // and contended with content-store writes.
  const excludeKey = excludeIds.join("\0");
  const allowKey = allowTypes ? allowTypes.join("\0") : "";
  const selectedKey = selected.map((item) => item.contentId).join("\0");

  useEffect(() => {
    let cancelled = false;
    const excludeSet = new Set(excludeKey ? excludeKey.split("\0") : []);
    const allowSet = allowKey ? new Set(allowKey.split("\0")) : null;
    const selectedSet = new Set(selectedKey ? selectedKey.split("\0") : []);
    const handle = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchEditorialReferences(query, locale, { publishedOnly });
        if (cancelled) {
          return;
        }
        const filtered = results.filter((option) => {
          if (excludeSet.has(option.contentId)) {
            return false;
          }
          if (allowSet && !allowSet.has(option.contentType)) {
            return false;
          }
          if (selectedSet.has(option.contentId)) {
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
  }, [query, locale, excludeKey, allowKey, selectedKey, publishedOnly]);

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
      onChange([...selected, { contentId: option.contentId, label: option.label, contentType: option.contentType }]);
    }
    setQuery("");
  }

  function removeOption(contentId) {
    onChange(selected.filter((item) => item.contentId !== contentId));
  }

  return (
    <div className="editorial-reference-picker">
      <label className="editorial-reference-picker__label" htmlFor={`${listId}-search`}>
        {label}
      </label>
      <div className="editorial-reference-picker__selected">
        {selected.length === 0 ? (
          <p className="editorial-reference-picker__empty">None selected.</p>
        ) : (
          selected.map((item) => (
            <span key={item.contentId} className="editorial-reference-picker__chip">
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
        className="editorial-reference-picker__search"
        placeholder="Search to add..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {isLoading ? <p className="editorial-reference-picker__status">Searching...</p> : null}
      {options.length > 0 ? (
        <ul className="editorial-reference-picker__options" aria-label={`${label} options`}>
          {options.map((option) => (
            <li key={`${option.contentType}-${option.contentId}`}>
              <button type="button" onClick={() => addOption(option)}>
                <span>{option.label}</span>
                <span className="editorial-reference-picker__option-detail">{option.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
