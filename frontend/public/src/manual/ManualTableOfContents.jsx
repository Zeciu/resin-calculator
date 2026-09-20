/**
 * Table of contents for the continuous manual document.
 */

import { useI18n } from "../i18n/I18nContext.jsx";

/**
 * @param {{
 *   sections: import("./manualContent.js").ManualSection[];
 *   onNavigate: (sectionId: string) => void;
 * }} props
 */
export default function ManualTableOfContents({ sections, onNavigate }) {
  const { t } = useI18n();
  return (
    <nav className="manual-module__toc" aria-label={t("content.tableOfContents")}>
      <h2 className="manual-module__toc-title">{t("content.contents")}</h2>
      <ol className="manual-module__toc-list">
        {sections.map((section) => (
          <li key={section.id} className="manual-module__toc-item">
            <button
              type="button"
              className="manual-module__toc-link"
              title={section.title}
              onClick={() => onNavigate(section.id)}
            >
              <span className="manual-module__toc-label">{section.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
