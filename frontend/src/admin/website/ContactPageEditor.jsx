import { moveItem } from "./websiteSectionUtils.js";

/**
 * @param {{
 *   body: Record<string, unknown>;
 *   onChange: (body: Record<string, unknown>) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function ContactPageEditor({ body, onChange, disabled = false }) {
  const links = body.links ?? [];

  function updateLinks(nextLinks) {
    onChange({ ...body, links: nextLinks });
  }

  function updateLink(index, nextLink) {
    const next = [...links];
    next[index] = nextLink;
    updateLinks(next);
  }

  function addLink() {
    updateLinks([...links, { label: "", url: "", visible: true }]);
  }

  function removeLink(index) {
    updateLinks(links.filter((_, itemIndex) => itemIndex !== index));
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
      <label className="manual-admin__field">
        <span className="manual-admin__field-label">Introduction</span>
        <textarea
          value={body.intro ?? ""}
          onChange={(event) => onChange({ ...body, intro: event.target.value })}
          disabled={disabled}
          rows={4}
        />
      </label>
      <label className="manual-admin__field">
        <span className="manual-admin__field-label">Support email</span>
        <input
          type="email"
          value={body.supportEmail ?? ""}
          onChange={(event) => onChange({ ...body, supportEmail: event.target.value })}
          disabled={disabled}
        />
      </label>
      <div className="website-page-editor__group">
        <h3>Resource links</h3>
        <label className="manual-admin__field">
          <span className="manual-admin__field-label">Manual link label</span>
          <input
            type="text"
            value={body.manualLinkLabel ?? ""}
            onChange={(event) => onChange({ ...body, manualLinkLabel: event.target.value })}
            disabled={disabled}
          />
        </label>
        <label className="website-admin__checkbox">
          <input
            type="checkbox"
            checked={body.showManualLink ?? true}
            onChange={(event) => onChange({ ...body, showManualLink: event.target.checked })}
            disabled={disabled}
          />
          Show Manual link
        </label>
        <label className="manual-admin__field">
          <span className="manual-admin__field-label">Knowledge Base link label</span>
          <input
            type="text"
            value={body.knowledgeBaseLinkLabel ?? ""}
            onChange={(event) => onChange({ ...body, knowledgeBaseLinkLabel: event.target.value })}
            disabled={disabled}
          />
        </label>
        <label className="website-admin__checkbox">
          <input
            type="checkbox"
            checked={body.showKnowledgeBaseLink ?? true}
            onChange={(event) => onChange({ ...body, showKnowledgeBaseLink: event.target.checked })}
            disabled={disabled}
          />
          Show Knowledge Base link
        </label>
      </div>
      <div className="website-contact-links">
        <div className="website-contact-links__header">
          <h3>Additional contact links</h3>
          <button type="button" onClick={addLink} disabled={disabled}>
            Add link
          </button>
        </div>
        {links.length === 0 ? <p className="website-contact-links__empty">No additional links.</p> : null}
        {links.map((link, index) => (
          <article key={`contact-link-${index}`} className="website-contact-links__item">
            <div className="website-contact-links__item-actions">
              <button
                type="button"
                aria-label={`Move link ${index + 1} up`}
                onClick={() => updateLinks(moveItem(links, index, -1))}
                disabled={disabled || index === 0}
              >
                Up
              </button>
              <button
                type="button"
                aria-label={`Move link ${index + 1} down`}
                onClick={() => updateLinks(moveItem(links, index, 1))}
                disabled={disabled || index === links.length - 1}
              >
                Down
              </button>
              <button type="button" onClick={() => removeLink(index)} disabled={disabled}>
                Remove
              </button>
            </div>
            <label className="manual-admin__field">
              <span className="manual-admin__field-label">Link label</span>
              <input
                type="text"
                value={link.label ?? ""}
                onChange={(event) => updateLink(index, { ...link, label: event.target.value })}
                disabled={disabled}
              />
            </label>
            <label className="manual-admin__field">
              <span className="manual-admin__field-label">Link URL</span>
              <input
                type="text"
                value={link.url ?? ""}
                onChange={(event) => updateLink(index, { ...link, url: event.target.value })}
                disabled={disabled}
                placeholder="https://..."
              />
            </label>
            <label className="website-admin__checkbox">
              <input
                type="checkbox"
                checked={link.visible ?? true}
                onChange={(event) => updateLink(index, { ...link, visible: event.target.checked })}
                disabled={disabled}
              />
              Show link on page
            </label>
          </article>
        ))}
      </div>
    </div>
  );
}
