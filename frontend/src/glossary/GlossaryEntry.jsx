/**
 * Single glossary dictionary entry with calm expand/collapse behavior.
 */

import { getGlossaryEntryElementId } from "./glossaryFilter.js";

/**
 * @param {{
 *   entry: import("./glossaryContent.js").GlossaryEntry;
 *   isExpanded: boolean;
 *   onToggle: (entryId: string) => void;
 * }} props
 */
export default function GlossaryEntry({ entry, isExpanded, onToggle }) {
  const indicator = isExpanded ? "−" : "+";

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
