/**
 * Single Knowledge Base troubleshooting entry with calm expand/collapse behavior.
 */

import { Link } from "react-router-dom";
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
  const indicator = isExpanded ? "−" : "+";
  const hasPrepMeta =
    entry.estimatedRepairTime ||
    (entry.requiredTools?.length ?? 0) > 0 ||
    (entry.requiredMaterials?.length ?? 0) > 0;
  const hasRelationships =
    (entry.relatedKbArticles?.length ?? 0) > 0 ||
    (entry.relatedGlossaryTerms?.length ?? 0) > 0 ||
    (entry.relatedManualChapters?.length ?? 0) > 0;

  return (
    <article className="knowledge-base-entry" id={getKnowledgeBaseEntryElementId(entry.id)}>
      <h3 className="knowledge-base-entry__heading">
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
      </h3>
      {isExpanded ? (
        <div className="knowledge-base-entry__body">
          <div className="knowledge-base-entry__columns">
            {entry.problemSummary || (entry.symptoms?.length ?? 0) > 0 ? (
              <div className="knowledge-base-entry__column">
                {entry.problemSummary ? (
                  <KnowledgeBaseSection title="Problem Summary">
                    <p className="knowledge-base-entry__paragraph">{entry.problemSummary}</p>
                  </KnowledgeBaseSection>
                ) : null}
                <KnowledgeBaseListSection title="Symptoms" items={entry.symptoms ?? []} />
              </div>
            ) : null}
            {(entry.possibleCauses?.length ?? 0) > 0 || (entry.solution?.length ?? 0) > 0 ? (
              <div className="knowledge-base-entry__column">
                <KnowledgeBaseListSection title="Possible Causes" items={entry.possibleCauses ?? []} />
                <KnowledgeBaseListSection title="Solution" items={entry.solution ?? []} />
              </div>
            ) : null}
            {(entry.prevention?.length ?? 0) > 0 ||
            (entry.tips?.length ?? 0) > 0 ||
            (entry.warnings?.length ?? 0) > 0 ? (
              <div className="knowledge-base-entry__column">
                <KnowledgeBaseListSection title="Prevention" items={entry.prevention ?? []} />
                <KnowledgeBaseListSection title="Tips" items={entry.tips ?? []} />
                <KnowledgeBaseListSection title="Warnings" items={entry.warnings ?? []} isWarning />
              </div>
            ) : null}
          </div>
          {hasPrepMeta ? (
            <div className="knowledge-base-entry__meta">
              {entry.estimatedRepairTime ? (
                <p>
                  <span className="knowledge-base-entry__meta-label">Estimated repair time:</span>{" "}
                  {entry.estimatedRepairTime}
                </p>
              ) : null}
              {(entry.requiredTools?.length ?? 0) > 0 ? (
                <p>
                  <span className="knowledge-base-entry__meta-label">Tools:</span>{" "}
                  {entry.requiredTools.join(", ")}
                </p>
              ) : null}
              {(entry.requiredMaterials?.length ?? 0) > 0 ? (
                <p>
                  <span className="knowledge-base-entry__meta-label">Materials:</span>{" "}
                  {entry.requiredMaterials.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}
          {entry.media?.map((block, index) => (
            <KnowledgeBaseEntryMedia key={`${entry.id}-media-${index}`} block={block} />
          ))}
          {hasRelationships ? (
            <div className="knowledge-base-entry__relationships">
              {(entry.relatedKbArticles?.length ?? 0) > 0 ? (
                <p className="knowledge-base-entry__meta">
                  <span className="knowledge-base-entry__meta-label">Related articles:</span>{" "}
                  {entry.relatedKbArticles.map((item, index) => (
                    <span key={item.id}>
                      {index > 0 ? ", " : null}
                      <button
                        type="button"
                        className="knowledge-base-entry__meta-link"
                        onClick={() => onNavigateToEntry?.(item.id)}
                      >
                        {item.label}
                      </button>
                    </span>
                  ))}
                </p>
              ) : null}
              {(entry.relatedGlossaryTerms?.length ?? 0) > 0 ? (
                <p className="knowledge-base-entry__meta">
                  <span className="knowledge-base-entry__meta-label">Glossary:</span>{" "}
                  {entry.relatedGlossaryTerms.map((item, index) => (
                    <span key={item.id}>
                      {index > 0 ? ", " : null}
                      <Link className="knowledge-base-entry__meta-link" to={`/glossary#glossary-entry-${item.id}`}>
                        {item.label}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : null}
              {(entry.relatedManualChapters?.length ?? 0) > 0 ? (
                <p className="knowledge-base-entry__meta">
                  <span className="knowledge-base-entry__meta-label">Manual:</span>{" "}
                  {entry.relatedManualChapters.map((item, index) => (
                    <span key={item.id}>
                      {index > 0 ? ", " : null}
                      <Link className="knowledge-base-entry__meta-link" to={`/manual#${item.id}`}>
                        {item.label}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * @param {{ title: string; children: import("react").ReactNode }} props
 */
function KnowledgeBaseSection({ title, children }) {
  return (
    <section className="knowledge-base-entry__section">
      <h4 className="knowledge-base-entry__section-title">{title}</h4>
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
    <KnowledgeBaseSection title={title}>
      <ul
        className={
          isWarning
            ? "knowledge-base-entry__list knowledge-base-entry__list--warning"
            : "knowledge-base-entry__list"
        }
      >
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="knowledge-base-entry__list-item">
            {item}
          </li>
        ))}
      </ul>
    </KnowledgeBaseSection>
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
