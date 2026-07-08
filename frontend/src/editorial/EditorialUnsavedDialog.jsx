/**
 * @param {{
 *   isOpen: boolean;
 *   isSaving?: boolean;
 *   titleId?: string;
 *   onSave: () => void;
 *   onDiscard: () => void;
 *   onCancel: () => void;
 * }} props
 */
export default function EditorialUnsavedDialog({
  isOpen,
  isSaving = false,
  titleId = "editorial-unsaved-title",
  onSave,
  onDiscard,
  onCancel,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="editorial-unsaved-overlay">
      <div
        className="editorial-unsaved-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <p id={titleId} className="editorial-unsaved-dialog__message">
          You have unsaved changes.
        </p>
        <div className="editorial-unsaved-dialog__actions">
          <button type="button" onClick={onSave} disabled={isSaving}>
            Save draft
          </button>
          <button type="button" onClick={onDiscard} disabled={isSaving}>
            Discard
          </button>
          <button type="button" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
