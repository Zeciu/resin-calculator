export default function UnsavedChangesDialog({
  onSaveProject,
  onDiscardChanges,
  onCancel,
}) {
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      onCancel();
    }
  }

  return (
    <div
      className="unsaved-changes-dialog__backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className="unsaved-changes-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-dialog-title"
        aria-describedby="unsaved-changes-dialog-body"
      >
        <h2 id="unsaved-changes-dialog-title" className="unsaved-changes-dialog__title">
          You have unsaved changes.
        </h2>
        <p id="unsaved-changes-dialog-body" className="unsaved-changes-dialog__body">
          If you leave this workspace now, your current project work will be lost.
        </p>
        <p className="unsaved-changes-dialog__question">What would you like to do?</p>
        <div className="unsaved-changes-dialog__actions">
          <button
            type="button"
            className="unsaved-changes-dialog__button unsaved-changes-dialog__button--primary"
            onClick={onSaveProject}
          >
            Save Project
          </button>
          <button
            type="button"
            className="unsaved-changes-dialog__button unsaved-changes-dialog__button--danger"
            onClick={onDiscardChanges}
          >
            Discard Changes
          </button>
          <button
            type="button"
            className="unsaved-changes-dialog__button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
