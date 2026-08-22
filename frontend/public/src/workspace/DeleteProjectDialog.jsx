import { useI18n } from "../i18n/I18nContext.jsx";

export default function DeleteProjectDialog({ projectName, onConfirm, onCancel }) {
  const { t } = useI18n();
  const name = projectName ?? "";

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
        aria-labelledby="delete-project-dialog-title"
        aria-describedby="delete-project-dialog-body"
      >
        <h2 id="delete-project-dialog-title" className="unsaved-changes-dialog__title">
          {t("projects.deleteConfirmTitle")}
        </h2>
        <p id="delete-project-dialog-body" className="unsaved-changes-dialog__body">
          {t("projects.deleteConfirmBody", { name })}
        </p>
        <div className="unsaved-changes-dialog__actions">
          <button
            type="button"
            className="unsaved-changes-dialog__button unsaved-changes-dialog__button--danger"
            onClick={onConfirm}
          >
            {t("projects.deleteConfirm")}
          </button>
          <button type="button" className="unsaved-changes-dialog__button" onClick={onCancel}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
