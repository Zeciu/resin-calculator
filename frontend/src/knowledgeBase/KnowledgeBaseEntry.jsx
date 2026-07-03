/**
 * Single Knowledge Base troubleshooting entry with calm expand/collapse behavior.
 */

import { getKnowledgeBaseEntryElementId } from "./knowledgeBaseFilter.js";

/**
 * @param {{
 *   entry: import("./knowledgeBaseContent.js").KnowledgeBaseEntry;
 *   isExpanded: boolean;
 *   onToggle: (entryId: string) => void;
 * }} props
 */
export default function KnowledgeBaseEntry({ entry, isExpanded, onToggle }) {
  const indicator = isExpanded ? "−" : "+";

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
            {entry.problemSummary || entry.symptoms.length > 0 ? (
              <div className="knowledge-base-entry__column">
                {entry.problemSummary ? (
                  <KnowledgeBaseSection title="Problem Summary">
                    <p className="knowledge-base-entry__paragraph">{entry.problemSummary}</p>
                  </KnowledgeBaseSection>
                ) : null}
                <KnowledgeBaseListSection title="Symptoms" items={entry.symptoms} />
              </div>
            ) : null}
            {entry.possibleCauses.length > 0 || entry.solution.length > 0 ? (
              <div className="knowledge-base-entry__column">
                <KnowledgeBaseListSection title="Possible Causes" items={entry.possibleCauses} />
                <KnowledgeBaseListSection title="Solution" items={entry.solution} />
              </div>
            ) : null}
            {entry.tips.length > 0 || entry.warnings.length > 0 ? (
              <div className="knowledge-base-entry__column">
                <KnowledgeBaseListSection title="Tips" items={entry.tips} />
                <KnowledgeBaseListSection title="Warnings" items={entry.warnings} isWarning />
              </div>
            ) : null}
          </div>
          {entry.media?.map((block, index) => (
            <KnowledgeBaseEntryMedia key={`${entry.id}-media-${index}`} block={block} />
          ))}
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
