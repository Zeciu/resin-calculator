import { documentToSectionBlocks, sectionBlocksToDocument } from "./websiteEditorAdapter.js";
import WebsiteRichTextEditor from "./WebsiteRichTextEditor.jsx";
import WebsiteSectionListEditor from "./WebsiteSectionListEditor.jsx";

/**
 * @param {{
 *   body: Record<string, unknown>;
 *   onChange: (body: Record<string, unknown>) => void;
 *   disabled?: boolean;
 *   pageLabel: string;
 * }} props
 */
export default function DocumentSectionsPageEditor({ body, onChange, disabled = false, pageLabel }) {
  const sections = body.sections ?? [];

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
      <WebsiteSectionListEditor
        sections={sections.length ? sections : [{ id: "section-1", title: "", blocks: [{ type: "paragraph", text: "" }] }]}
        onChange={(nextSections) => onChange({ ...body, sections: nextSections })}
        disabled={disabled}
        addLabel={`Add ${pageLabel} section`}
        listHeading="Sections"
        sectionLabel="Section"
        renderSectionBody={(section, _index, onSectionChange) => (
          <div className="manual-admin__field manual-admin__field--editor">
            <span className="manual-admin__field-label">Rich text</span>
            <WebsiteRichTextEditor
              document={sectionBlocksToDocument(section.blocks)}
              onDocumentChange={(document) =>
                onSectionChange({ ...section, blocks: documentToSectionBlocks(document) })
              }
              disabled={disabled}
              placeholder="Write section content..."
              ariaLabel="Document section rich text"
            />
          </div>
        )}
      />
    </div>
  );
}
