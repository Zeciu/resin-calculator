import { useI18n } from "../i18n/I18nContext.jsx";

/**
 * @param {{
 *   unavailableKey: string;
 *   englishAvailable?: boolean;
 *   onViewEnglish?: () => void;
 * }} props
 */
export default function ContentUnavailableMessage({
  unavailableKey,
  englishAvailable = false,
  onViewEnglish,
}) {
  const { t } = useI18n();

  return (
    <div className="content-unavailable" role="alert">
      <p className="content-unavailable__message">{t(unavailableKey)}</p>
      {englishAvailable ? (
        <button type="button" className="content-unavailable__action" onClick={onViewEnglish}>
          {t("content.viewEnglishVersion")}
        </button>
      ) : null}
    </div>
  );
}
