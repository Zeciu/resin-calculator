import WebsiteImageField from "./WebsiteImageField.jsx";
import {
  documentToSectionBlocks,
  mergeAboutSections,
  sectionBlocksToDocument,
  splitAboutSections,
} from "./websiteEditorAdapter.js";
import WebsiteRichTextEditor from "./WebsiteRichTextEditor.jsx";
import WebsiteSectionListEditor from "./WebsiteSectionListEditor.jsx";

/**
 * @param {{
 *   body: Record<string, unknown>;
 *   onChange: (body: Record<string, unknown>) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function AboutPageEditor({ body, onChange, disabled = false }) {
  const { hero, contentSections } = splitAboutSections(body.sections);

  function updateSections(nextHero, nextContentSections) {
    onChange({
      ...body,
      sections: mergeAboutSections(nextHero, nextContentSections),
    });
  }

  return (
    <div className="website-page-editor">
      <label className="manual-admin__field">
        <span className="manual-admin__field-label">Page title</span>
        <input
          type="text"
          value={body.publicTitle ?? ""}
          onChange={(event) => onChange({ ...body, publicTitle: event.target.value })}
          disabled={disabled}
        />
      </label>
      <section className="website-page-editor__group" aria-label="Hero">
        <h3>Hero</h3>
        <label className="manual-admin__field">
          <span className="manual-admin__field-label">Main heading</span>
          <input
            type="text"
            value={hero.title ?? ""}
            onChange={(event) =>
              updateSections({ ...hero, title: event.target.value }, contentSections)
            }
            disabled={disabled}
            aria-label="Main heading"
          />
        </label>
        <div className="manual-admin__field manual-admin__field--editor">
          <span className="manual-admin__field-label">Introduction</span>
          <WebsiteRichTextEditor
            document={sectionBlocksToDocument(hero.blocks)}
            onDocumentChange={(document) =>
              updateSections(
                { ...hero, blocks: documentToSectionBlocks(document) },
                contentSections,
              )
            }
            disabled={disabled}
            placeholder="Write the introduction..."
            ariaLabel="About introduction"
          />
        </div>
      </section>
      <WebsiteSectionListEditor
        sections={contentSections}
        onChange={(nextSections) => updateSections(hero, nextSections)}
        disabled={disabled}
        addLabel="Add content section"
        listHeading="Content sections"
        sectionLabel="Section"
        withSectionImage
        renderSectionBody={(section, _index, onSectionChange) => (
          <>
            <WebsiteImageField
              label="Section image (optional)"
              src={section.image?.src ?? ""}
              alt={section.image?.alt ?? ""}
              onChange={(image) => onSectionChange({ ...section, image })}
              disabled={disabled}
            />
            <div className="manual-admin__field manual-admin__field--editor">
              <span className="manual-admin__field-label">Rich text</span>
              <WebsiteRichTextEditor
                document={sectionBlocksToDocument(section.blocks)}
                onDocumentChange={(document) =>
                  onSectionChange({ ...section, blocks: documentToSectionBlocks(document) })
                }
                disabled={disabled}
                placeholder="Write section content..."
                ariaLabel="Content section rich text"
              />
            </div>
          </>
        )}
      />
    </div>
  );
}
