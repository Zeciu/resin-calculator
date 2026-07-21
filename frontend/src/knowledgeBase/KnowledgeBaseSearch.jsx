/**
 * Knowledge Base search input.
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
const KnowledgeBaseSearch = forwardRef(function KnowledgeBaseSearch(
  { value, onChange, onSubmit },
  ref,
) {
  const { t } = useI18n();
  const searchLabel = t("knowledgeBase.searchLabel");

  return (
    <label className="knowledge-base-toolbar__search-label">
      <span className="knowledge-base-toolbar__search-caption">{searchLabel}</span>
      <input
        ref={ref}
        type="search"
        className="knowledge-base-toolbar__search-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit?.(event.currentTarget.value);
          }
        }}
        placeholder={t("knowledgeBase.searchPlaceholder")}
        aria-label={searchLabel}
      />
    </label>
  );
});

export default KnowledgeBaseSearch;
