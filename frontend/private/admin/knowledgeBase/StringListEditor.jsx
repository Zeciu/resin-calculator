/**
 * Lightweight list editor for troubleshooting bullet rows.
 */

/**
 * @param {{
 *   label: string;
 *   items: string[];
 *   onChange: (items: string[]) => void;
 *   disabled?: boolean;
 *   addLabel?: string;
 * }} props
 */
export default function StringListEditor({
  label,
  items,
  onChange,
  disabled = false,
  addLabel = "Add row",
}) {
  function updateItem(index, value) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function addRow() {
    onChange([...items, ""]);
  }

  function removeRow(index) {
    if (items.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="kb-admin__list-editor">
      <div className="kb-admin__list-editor-header">
        <span className="kb-admin__field-label">{label}</span>
        <button type="button" onClick={addRow} disabled={disabled}>
          {addLabel}
        </button>
      </div>
      <ul className="kb-admin__list-editor-rows">
        {items.map((item, index) => (
          <li key={`${label}-${index}`}>
            <input
              type="text"
              aria-label={`${label} row ${index + 1}`}
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              disabled={disabled}
            />
            <button
              type="button"
              aria-label={`Remove ${label} row ${index + 1}`}
              onClick={() => removeRow(index)}
              disabled={disabled}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
