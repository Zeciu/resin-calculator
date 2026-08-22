import { useI18n } from "../i18n/I18nContext.jsx";

/**
 * @param {{
 *   value: string;
 *   onChange: (value: string) => void;
 *   placeholderKey: string;
 * }} props
 */
export default function PreviewSearch({ value, onChange, placeholderKey }) {
  const { t } = useI18n();
  const searchLabel = t("preview.searchLabel");

  return (
    <label className="knowledge-base-toolbar__search-label">
      <span className="knowledge-base-toolbar__search-caption">{searchLabel}</span>
      <input
        type="search"
        className="knowledge-base-toolbar__search-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t(placeholderKey)}
        aria-label={searchLabel}
      />
    </label>
  );
}
