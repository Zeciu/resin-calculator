import { useState } from "react";

const MAX_PROJECT_NAME_LENGTH = 100;

export default function SaveProjectDialog({
  error = "",
  isSaving = false,
  onCancel,
  onSave,
}) {
  const [projectName, setProjectName] = useState("");
  const [validationError, setValidationError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = projectName.trim();

    if (!trimmedName) {
      setValidationError("Project name is required.");
      return;
    }

    setValidationError("");
    onSave(trimmedName);
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !isSaving) {
      onCancel();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && !isSaving) {
      onCancel();
    }
  }

  const visibleError = validationError || error;

  return (
    <div
      className="save-project-dialog__backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <form
        className="save-project-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-project-dialog-title"
        onSubmit={handleSubmit}
      >
        <h2 id="save-project-dialog-title" className="save-project-dialog__title">
          Save Project
        </h2>
        <label className="save-project-dialog__label" htmlFor="save-project-name">
          Project name
          <input
            id="save-project-name"
            className="save-project-dialog__input"
            type="text"
            value={projectName}
            maxLength={MAX_PROJECT_NAME_LENGTH}
            disabled={isSaving}
            onChange={(event) => {
              setProjectName(event.target.value);
              if (validationError) {
                setValidationError("");
              }
            }}
            autoFocus
          />
        </label>
        {visibleError ? (
          <p className="save-project-dialog__error" role="alert">
            {visibleError}
          </p>
        ) : null}
        <div className="save-project-dialog__actions">
          <button
            type="button"
            className="save-project-dialog__button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-project-dialog__button save-project-dialog__button--primary"
            disabled={isSaving}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
