import { useI18n } from "../i18n/I18nContext.jsx";

export default function PreviewEmptyState() {
  const { t } = useI18n();

  return (
    <div className="module-empty-state" role="status">
      <p className="module-empty-state__title">{t("preview.emptyTitle")}</p>
    </div>
  );
}
