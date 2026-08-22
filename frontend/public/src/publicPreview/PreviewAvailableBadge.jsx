import { useI18n } from "../i18n/I18nContext.jsx";

export default function PreviewAvailableBadge() {
  const { t } = useI18n();

  return <span className="knowledge-preview-available__badge">{t("preview.availableInPreview")}</span>;
}
