import { ManualBlock } from "../manual/ManualContent.jsx";

const WEBSITE_BLOCK_TYPES = new Set(["heading", "paragraph"]);

/**
 * Public Website section/block renderer.
 * Website schemas publish heading + paragraph blocks (same trusted Manual model).
 *
 * @param {{
 *   sections?: Array<{
 *     id?: string;
 *     title?: string;
 *     blocks?: Array<Record<string, unknown>>;
 *     image?: { src?: string; alt?: string };
 *   }>;
 *   withSectionImages?: boolean;
 * }} props
 */
export default function WebsiteSectionBlocks({ sections = [], withSectionImages = false }) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return null;
  }

  return (
    <div className="website-section-blocks">
      {sections.map((section, index) => {
        const sectionId = String(section.id ?? `section-${index}`).trim() || `section-${index}`;
        const title = String(section.title ?? "").trim();
        const blocks = (Array.isArray(section.blocks) ? section.blocks : []).filter((block) =>
          WEBSITE_BLOCK_TYPES.has(String(block?.type ?? "")),
        );
        const imageSrc = withSectionImages ? String(section.image?.src ?? "").trim() : "";
        const imageAlt = String(section.image?.alt ?? "").trim();
        const headingId = `${sectionId}-heading`;

        return (
          <section
            key={sectionId}
            id={sectionId}
            className={
              imageSrc
                ? "website-section-blocks__section website-section-blocks__section--with-image"
                : "website-section-blocks__section"
            }
            aria-labelledby={title ? headingId : undefined}
          >
            {title ? (
              <h2 className="website-section-blocks__title" id={headingId}>
                {title}
              </h2>
            ) : null}
            <div className="website-section-blocks__content">
              {imageSrc ? (
                <figure className="website-section-blocks__figure">
                  <img
                    className="website-section-blocks__image"
                    src={imageSrc}
                    alt={imageAlt}
                    loading="lazy"
                  />
                </figure>
              ) : null}
              <div className="website-section-blocks__blocks">
                {blocks.map((block, blockIndex) => (
                  <ManualBlock key={`${sectionId}-block-${blockIndex}`} block={block} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
