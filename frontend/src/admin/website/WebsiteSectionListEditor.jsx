import StringListEditor from "../knowledgeBase/StringListEditor.jsx";
import { moveItem } from "./websiteSectionUtils.js";

/**
 * @param {{
 *   sections: Array<{ id: string; title: string; blocks: Array<Record<string, unknown>> }>;
 *   onChange: (sections: Array<{ id: string; title: string; blocks: Array<Record<string, unknown>> }>) => void;
 *   renderSectionBody: (section: { id: string; title: string; blocks: Array<Record<string, unknown>> }, index: number, onSectionChange: (section: object) => void) => import("react").ReactNode;
 *   disabled?: boolean;
 *   addLabel?: string;
 *   sectionLabel?: string;
 *   listHeading?: string;
 *   withSectionImage?: boolean;
 * }} props
 */
export default function WebsiteSectionListEditor({
  sections,
  onChange,
  renderSectionBody,
  disabled = false,
  addLabel = "Add section",
  sectionLabel = "Section",
  listHeading,
  withSectionImage = false,
}) {
  const heading = listHeading ?? sectionLabel;
  function updateSection(index, nextSection) {
    const next = [...sections];
    next[index] = nextSection;
    onChange(next);
  }

  function addSection() {
    onChange([
      ...sections,
      {
        id: `section-${Math.random().toString(36).slice(2, 8)}`,
        title: "",
        blocks: [{ type: "paragraph", text: "" }],
        ...(withSectionImage ? { image: { src: "", alt: "" } } : {}),
      },
    ]);
  }

  function removeSection(index) {
    if (sections.length <= 1) {
      return;
    }
    onChange(sections.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="website-section-list">
      <div className="website-section-list__header">
        <h3>{heading}</h3>
        <button type="button" onClick={addSection} disabled={disabled}>
          {addLabel}
        </button>
      </div>
      {sections.map((section, index) => (
        <article key={section.id} className="website-section-list__item">
          <div className="website-section-list__item-header">
            <h4>
              {sectionLabel} {index + 1}
            </h4>
            <div className="website-section-list__item-actions">
              <button
                type="button"
                aria-label={`Move ${sectionLabel} ${index + 1} up`}
                onClick={() => onChange(moveItem(sections, index, -1))}
                disabled={disabled || index === 0}
              >
                Up
              </button>
              <button
                type="button"
                aria-label={`Move ${sectionLabel} ${index + 1} down`}
                onClick={() => onChange(moveItem(sections, index, 1))}
                disabled={disabled || index === sections.length - 1}
              >
                Down
              </button>
              <button
                type="button"
                aria-label={`Delete ${sectionLabel} ${index + 1}`}
                onClick={() => removeSection(index)}
                disabled={disabled || sections.length <= 1}
              >
                Delete
              </button>
            </div>
          </div>
          <label className="manual-admin__field">
            <span className="manual-admin__field-label">Title</span>
            <input
              type="text"
              value={section.title}
              onChange={(event) => updateSection(index, { ...section, title: event.target.value })}
              disabled={disabled}
            />
          </label>
          {renderSectionBody(section, index, (nextSection) => updateSection(index, nextSection))}
        </article>
      ))}
    </div>
  );
}

export { StringListEditor };
