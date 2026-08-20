/**
 * Glossary search input.
 */

import { forwardRef } from "react";
import { useI18n } from "../i18n/I18nContext.jsx";

/**
 * @param {{
 *   value: string;
 *   onChange: (value: string) => void;
 *   onSubmit?: (value: string) => void;
 * }} props
 */
const GlossarySearch = forwardRef(function GlossarySearch({ value, onChange, onSubmit }, ref) {
  const { t } = useI18n();
  const searchLabel = t("glossary.searchLabel");

  return (
    <label className="glossary-toolbar__search-label">
      <span className="glossary-toolbar__search-caption">{searchLabel}</span>
      <input
        ref={ref}
        type="search"
        className="glossary-toolbar__search-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit?.(event.currentTarget.value);
          }
        }}
        placeholder={t("glossary.searchPlaceholder")}
        aria-label={searchLabel}
      />
    </label>
  );
});

export default GlossarySearch;
