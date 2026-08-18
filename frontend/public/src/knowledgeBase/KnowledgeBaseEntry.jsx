/**
 * Single Knowledge Base troubleshooting entry with calm expand/collapse behavior.
 */

import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { getKnowledgeBaseEntryElementId } from "./knowledgeBaseFilter.js";

/**
 * @param {{
 *   entry: {
 *     id: string;
 *     title: string;
 *     problemSummary?: string;
 *     symptoms?: string[];
 *     possibleCauses?: string[];
 *     solution?: string[];
 *     prevention?: string[];
 *     tips?: string[];
 *     warnings?: string[];
 *     estimatedRepairTime?: string | null;
 *     requiredTools?: string[];
 *     requiredMaterials?: string[];
 *     media?: import("./knowledgeBaseContent.js").KnowledgeBaseMediaBlock[];
 *     relatedKbArticles?: { id: string; label: string }[];
 *     relatedGlossaryTerms?: { id: string; label: string }[];
 *     relatedManualChapters?: { id: string; label: string }[];
 *   };
 *   isExpanded: boolean;
 *   onToggle: (entryId: string) => void;
 *   onNavigateToEntry?: (entryId: string) => void;
 * }} props
 */
export default function KnowledgeBaseEntry({ entry, isExpanded, onToggle, onNavigateToEntry }) {
  const { t } = useI18n();
  const indicator = isExpanded ? "−" : "+";
  const hasSupportInformation =
    entry.estimatedRepairTime ||
    (entry.requiredTools?.length ?? 0) > 0 ||
    (entry.requiredMaterials?.length ?? 0) > 0;
  const hasRelationships =
    (entry.relatedKbArticles?.length ?? 0) > 0 ||
    (entry.relatedGlossaryTerms?.length ?? 0) > 0 ||
    (entry.relatedManualChapters?.length ?? 0) > 0;

  return (
    <article className="knowledge-base-entry" id={getKnowledgeBaseEntryElementId(entry.id)}>
      <h2 className="knowledge-base-entry__heading">
        <button
          type="button"
          className="knowledge-base-entry__toggle"
          aria-expanded={isExpanded}
          onClick={() => onToggle(entry.id)}
        >
          <span className="knowledge-base-entry__indicator" aria-hidden="true">
            {indicator}
          </span>
          <span className="knowledge-base-entry__title">{entry.title}</span>
        </button>
      </h2>
      {isExpanded ? (
        <div className="knowledge-base-entry__body">
          {entry.problemSummary ? (
            <p className="knowledge-base-entry__lead">{entry.problemSummary}</p>
          ) : null}
          <div className="knowledge-base-entry__cards">
            {entry.problemSummary || (entry.symptoms?.length ?? 0) > 0 ? (
              <KnowledgeBaseCard
                type="problem"
                title={t("knowledgeBase.problemSummary")}
              >
                {entry.problemSummary ? (
                  <p className="knowledge-base-entry__paragraph">{entry.problemSummary}</p>
                ) : null}
                <KnowledgeBaseListSection
                  title={t("knowledgeBase.symptoms")}
                  items={entry.symptoms ?? []}
                />
              </KnowledgeBaseCard>
            ) : null}
            {(entry.possibleCauses?.length ?? 0) > 0 ? (
              <KnowledgeBaseCard type="causes" title={t("knowledgeBase.possibleCauses")}>
                <KnowledgeBaseList items={entry.possibleCauses ?? []} />
              </KnowledgeBaseCard>
            ) : null}
            {(entry.solution?.length ?? 0) > 0 ? (
              <KnowledgeBaseCard type="solution" title={t("knowledgeBase.solution")}>
                <KnowledgeBaseList items={entry.solution ?? []} />
              </KnowledgeBaseCard>
            ) : null}
            {(entry.prevention?.length ?? 0) > 0 ||
            (entry.tips?.length ?? 0) > 0 ||
            (entry.warnings?.length ?? 0) > 0 ? (
              <KnowledgeBaseCard type="prevention" title={t("knowledgeBase.prevention")}>
                <KnowledgeBaseList items={entry.prevention ?? []} />
                <KnowledgeBaseListSection title={t("knowledgeBase.tips")} items={entry.tips ?? []} />
                <KnowledgeBaseListSection
                  title={t("knowledgeBase.warnings")}
                  items={entry.warnings ?? []}
                  isWarning
                />
              </KnowledgeBaseCard>
            ) : null}
          </div>
          {entry.media?.map((block, index) => (
            <KnowledgeBaseEntryMedia key={`${entry.id}-media-${index}`} block={block} />
          ))}
          {hasSupportInformation ? (
            <section className="knowledge-base-entry__support">
              <h3 className="knowledge-base-entry__support-title">
                {t("knowledgeBase.supportInformation")}
              </h3>
              {entry.estimatedRepairTime ? (
                <p className="knowledge-base-entry__estimated-time">
                  <span className="knowledge-base-entry__support-label">
                    {t("knowledgeBase.estimatedRepairTime")}:
                  </span>{" "}
                  {entry.estimatedRepairTime}
                </p>
              ) : null}
              <div className="knowledge-base-entry__support-grid">
                <KnowledgeBaseSupportList
                  title={t("knowledgeBase.tools")}
                  items={entry.requiredTools ?? []}
                />
                <KnowledgeBaseSupportList
                  title={t("knowledgeBase.materials")}
                  items={entry.requiredMaterials ?? []}
                />
              </div>
            </section>
          ) : null}
          {hasRelationships ? (
            <div className="knowledge-base-entry__relationships">
              {(entry.relatedKbArticles?.length ?? 0) > 0 ? (
                <section className="knowledge-base-entry__relationship-group">
                  <h3 className="knowledge-base-entry__relationship-title">
                    {t("knowledgeBase.relatedArticles")}
                  </h3>
                  <div className="knowledge-base-entry__related-kb-links">
                    {entry.relatedKbArticles.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="knowledge-base-entry__related-kb-link"
                        onClick={() => onNavigateToEntry?.(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              {(entry.relatedGlossaryTerms?.length ?? 0) > 0 ? (
                <section className="knowledge-base-entry__relationship-group">
                  <h3 className="knowledge-base-entry__relationship-title">
                    {t("knowledgeBase.glossary")}
                  </h3>
                  <div className="knowledge-base-entry__relationship-links">
                    {entry.relatedGlossaryTerms.map((item) => (
                      <Link
                        key={item.id}
                        className="knowledge-base-entry__relationship-link"
                        to={`/glossary#glossary-entry-${item.id}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
              {(entry.relatedManualChapters?.length ?? 0) > 0 ? (
                <section className="knowledge-base-entry__relationship-group">
                  <h3 className="knowledge-base-entry__relationship-title">
                    {t("knowledgeBase.manual")}
                  </h3>
                  <div className="knowledge-base-entry__relationship-links">
                    {entry.relatedManualChapters.map((item) => (
                      <Link key={item.id} className="knowledge-base-entry__relationship-link" to={`/manual#${item.id}`}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * @param {{ title: string; type: string; children: import("react").ReactNode }} props
 */
function KnowledgeBaseCard({ title, type, children }) {
  return (
    <section className={`knowledge-base-entry__card knowledge-base-entry__card--${type}`}>
      <h3 className="knowledge-base-entry__card-title">{title}</h3>
      {children}
    </section>
  );
}

/**
 * @param {{ title: string; items: string[]; isWarning?: boolean }} props
 */
function KnowledgeBaseListSection({ title, items, isWarning = false }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="knowledge-base-entry__subsection">
      <h4 className="knowledge-base-entry__section-title">{title}</h4>
      <KnowledgeBaseList items={items} isWarning={isWarning} />
    </section>
  );
}

function KnowledgeBaseList({ items, isWarning = false }) {
  return (
    <ul
      className={
        isWarning
          ? "knowledge-base-entry__list knowledge-base-entry__list--warning"
          : "knowledge-base-entry__list"
      }
    >
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="knowledge-base-entry__list-item">
          {item}
        </li>
      ))}
    </ul>
  );
}

function KnowledgeBaseSupportList({ title, items }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="knowledge-base-entry__support-list">
      <h4 className="knowledge-base-entry__section-title">{title}</h4>
      <KnowledgeBaseList items={items} />
    </section>
  );
}

/**
 * @param {{ block: import("./knowledgeBaseContent.js").KnowledgeBaseMediaBlock }} props
 */
function KnowledgeBaseEntryMedia({ block }) {
  if (block.type === "image") {
    return (
      <figure className="knowledge-base-entry__figure knowledge-base-entry__figure--image">
        <img
          className="knowledge-base-entry__image"
          src={block.src}
          alt={block.alt}
          loading="lazy"
        />
        {block.caption ? (
          <figcaption className="knowledge-base-entry__caption">{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "video") {
    return (
      <figure className="knowledge-base-entry__figure knowledge-base-entry__figure--video">
        <div className="knowledge-base-entry__video-frame">
          <iframe
            src={block.embedUrl}
            title={block.title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        {block.caption ? (
          <figcaption className="knowledge-base-entry__caption">{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  return null;
}
