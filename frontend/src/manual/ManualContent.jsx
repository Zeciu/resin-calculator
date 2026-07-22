/**
 * Renders the continuous manual document from published section data.
 */

/**
 * @param {{ sections: import("./manualContent.js").ManualSection[] }} props
 */
export default function ManualContent({ sections }) {
  return (
    <div className="manual-module__sections">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="manual-module__section"
          aria-labelledby={`${section.id}-heading`}
        >
          <h2 className="manual-module__section-title" id={`${section.id}-heading`}>
            {section.title}
          </h2>
          {section.blocks.map((block, index) => (
            <ManualBlock key={`${section.id}-${index}`} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
}

/**
 * Trusted public renderer for published editorial blocks.
 * Shared with Website document pages (heading/paragraph subset).
 *
 * @param {{ block: import("./manualContent.js").ManualBlock }} props
 */
export function ManualBlock({ block }) {
  if (block.type === "heading") {
    const level = Math.min(Math.max(Number(block.level) || 2, 2), 4);
    const Tag = `h${level}`;
    return (
      <Tag
        className={`manual-module__heading manual-module__heading--level-${level}`}
        dangerouslySetInnerHTML={{ __html: block.text }}
      />
    );
  }

  if (block.type === "paragraph") {
    return (
      <p
        className="manual-module__paragraph"
        dangerouslySetInnerHTML={{ __html: block.text }}
      />
    );
  }

  if (block.type === "image") {
    return (
      <figure className="manual-module__figure manual-module__figure--image">
        <img className="manual-module__image" src={block.src} alt={block.alt} loading="lazy" />
        {block.caption ? (
          <figcaption className="manual-module__figure-caption">{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "video") {
    return (
      <figure className="manual-module__figure manual-module__figure--video">
        <div className="manual-module__video-frame">
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
          <figcaption className="manual-module__figure-caption">{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "callout") {
    return (
      <aside
        className={`manual-module__callout manual-module__callout--${block.variant}`}
        aria-label={block.variant}
      >
        {block.blocks?.map((innerBlock, index) => (
          <ManualBlock key={`${block.variant}-${index}`} block={innerBlock} />
        ))}
      </aside>
    );
  }

  return null;
}
