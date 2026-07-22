/**
 * Single glossary dictionary entry with calm expand/collapse behavior.
 */

import { Link } from "react-router-dom";
import { getGlossaryEntryElementId } from "./glossaryFilter.js";

/**
 * @param {{
 *   entry: {
 *     id: string;
 *     term: string;
 *     definition: string[];
 *     media?: import("./glossaryContent.js").GlossaryMediaBlock[];
 *     relatedTerms?: { id: string; term: string }[];
 *     synonyms?: { id: string; term: string }[];
 *     seeAlso?: { targetType: string; targetId: string; label: string; href: string }[];
 *   };
 *   isExpanded: boolean;
 *   onToggle: (entryId: string) => void;
 *   onNavigateToEntry?: (entryId: string) => void;
 *   publishedEntryIds?: Set<string>;
 * }} props
 */
export default function GlossaryEntry({
  entry,
  isExpanded,
  onToggle,
  onNavigateToEntry,
  publishedEntryIds,
}) {
  const indicator = isExpanded ? "−" : "+";

  function canNavigateToGlossaryEntry(targetId) {
    if (!targetId || !onNavigateToEntry) {
      return false;
    }
    if (publishedEntryIds && !publishedEntryIds.has(targetId)) {
      return false;
    }
    return true;
  }

  function renderGlossaryTargetButton(targetId, label) {
    if (!canNavigateToGlossaryEntry(targetId)) {
      return <span>{label}</span>;
    }
    return (
      <button
        type="button"
        className="glossary-entry__meta-link"
        onClick={() => onNavigateToEntry(targetId)}
      >
        {label}
      </button>
    );
  }

  return (
    <article className="glossary-entry" id={getGlossaryEntryElementId(entry.id)}>
      <h3 className="glossary-entry__heading">
        <button
          type="button"
          className="glossary-entry__toggle"
          aria-expanded={isExpanded}
          onClick={() => onToggle(entry.id)}
        >
          <span className="glossary-entry__indicator" aria-hidden="true">
            {indicator}
          </span>
          <span className="glossary-entry__term">{entry.term}</span>
        </button>
      </h3>
      {isExpanded ? (
        <div className="glossary-entry__body">
          {entry.definition.map((paragraph, index) => (
            <p key={`${entry.id}-definition-${index}`} className="glossary-entry__paragraph">
              {paragraph}
            </p>
          ))}
          {entry.media?.map((block, index) => (
            <GlossaryEntryMedia key={`${entry.id}-media-${index}`} block={block} />
          ))}
          {entry.synonyms?.length > 0 ? (
            <p className="glossary-entry__meta">
              <span className="glossary-entry__meta-label">Also called:</span>{" "}
              {entry.synonyms.map((item, index) => (
                <span key={item.id}>
                  {index > 0 ? ", " : null}
                  {renderGlossaryTargetButton(item.id, item.term)}
                </span>
              ))}
            </p>
          ) : null}
          {entry.relatedTerms?.length > 0 ? (
            <p className="glossary-entry__meta">
              <span className="glossary-entry__meta-label">Related:</span>{" "}
              {entry.relatedTerms.map((item, index) => (
                <span key={item.id}>
                  {index > 0 ? ", " : null}
                  {renderGlossaryTargetButton(item.id, item.term)}
                </span>
              ))}
            </p>
          ) : null}
          {entry.seeAlso?.length > 0 ? (
            <p className="glossary-entry__meta">
              <span className="glossary-entry__meta-label">See also:</span>{" "}
              {entry.seeAlso.map((item, index) => (
                <span key={`${item.targetType}-${item.targetId}`}>
                  {index > 0 ? ", " : null}
                  {item.targetType === "glossary_entry" ? (
                    renderGlossaryTargetButton(item.targetId, item.label)
                  ) : (
                    <Link className="glossary-entry__meta-link" to={item.href}>
                      {item.label}
                    </Link>
                  )}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * @param {{ block: import("./glossaryContent.js").GlossaryMediaBlock }} props
 */
function GlossaryEntryMedia({ block }) {
  if (block.type === "image") {
    return (
      <figure className="glossary-entry__figure glossary-entry__figure--image">
        <img className="glossary-entry__image" src={block.src} alt={block.alt} loading="lazy" />
        {block.caption ? (
          <figcaption className="glossary-entry__caption">{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "video") {
    return (
      <figure className="glossary-entry__figure glossary-entry__figure--video">
        <div className="glossary-entry__video-frame">
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
          <figcaption className="glossary-entry__caption">{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  return null;
}
