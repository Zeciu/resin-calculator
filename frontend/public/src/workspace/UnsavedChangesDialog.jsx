import { useI18n } from "../i18n/I18nContext.jsx";

export default function UnsavedChangesDialog({
  onSaveProject,
  onDiscardChanges,
  onCancel,
}) {
  const { t } = useI18n();

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
          {t("unsaved.title")}
        </h2>
        <p id="unsaved-changes-dialog-body" className="unsaved-changes-dialog__body">
          {t("unsaved.body")}
        </p>
        <p className="unsaved-changes-dialog__question">{t("unsaved.question")}</p>
        <div className="unsaved-changes-dialog__actions">
          <button
            type="button"
            className="unsaved-changes-dialog__button unsaved-changes-dialog__button--primary"
            onClick={onSaveProject}
          >
            {t("unsaved.saveProject")}
          </button>
          <button
            type="button"
            className="unsaved-changes-dialog__button unsaved-changes-dialog__button--danger"
            onClick={onDiscardChanges}
          >
            {t("unsaved.discard")}
          </button>
          <button
            type="button"
            className="unsaved-changes-dialog__button"
            onClick={onCancel}
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
