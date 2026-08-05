import WebsiteImageField from "./WebsiteImageField.jsx";

/**
 * @param {{
 *   body: Record<string, unknown>;
 *   onChange: (body: Record<string, unknown>) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function HomePageEditor({ body, onChange, disabled = false }) {
  function updateField(field, value) {
    onChange({ ...body, [field]: value });
  }

  function updateNested(path, value) {
    onChange({
      ...body,
      [path]: {
        ...(body[path] ?? {}),
        ...value,
      },
    });
  }

  return (
    <div className="website-page-editor">
      <label className="manual-admin__field">
        <span className="manual-admin__field-label">Hero title</span>
        <input
          type="text"
          value={body.publicTitle ?? ""}
          onChange={(event) => updateField("publicTitle", event.target.value)}
          disabled={disabled}
        />
      </label>
      <label className="manual-admin__field">
        <span className="manual-admin__field-label">Subtitle</span>
        <input
          type="text"
          value={body.subtitle ?? ""}
          onChange={(event) => updateField("subtitle", event.target.value)}
          disabled={disabled}
        />
      </label>
      <label className="manual-admin__field">
        <span className="manual-admin__field-label">Short description</span>
        <textarea
          value={body.description ?? ""}
          onChange={(event) => updateField("description", event.target.value)}
          disabled={disabled}
          rows={15}
        />
      </label>
      <WebsiteImageField
        label="Hero image"
        src={body.image?.src ?? ""}
        alt={body.image?.alt ?? ""}
        visible={body.image?.visible ?? false}
        showVisibility
        visibilityLabel="Show hero image"
        disabled={disabled}
        onChange={(image) => updateNested("image", image)}
      />
      <section className="website-page-editor__group" aria-label="Call to action">
        <h3>Call to action</h3>
        <label className="manual-admin__field">
          <span className="manual-admin__field-label">CTA label</span>
          <input
            type="text"
            value={body.cta?.label ?? ""}
            onChange={(event) => updateNested("cta", { ...body.cta, label: event.target.value })}
            disabled={disabled}
          />
        </label>
        <label className="manual-admin__field">
          <span className="manual-admin__field-label">CTA destination</span>
          <input
            type="text"
            value={body.cta?.destination ?? ""}
            onChange={(event) => updateNested("cta", { ...body.cta, destination: event.target.value })}
            disabled={disabled}
            placeholder="/pricing or https://..."
          />
        </label>
        <label className="website-admin__checkbox">
          <input
            type="checkbox"
            checked={body.cta?.visible === true}
            onChange={(event) =>
              updateNested("cta", {
                label: body.cta?.label ?? "",
                destination: body.cta?.destination ?? "",
                visible: event.target.checked,
              })
            }
            disabled={disabled}
          />
          Show CTA
        </label>
      </section>
      <section className="website-page-editor__group" aria-label="Video">
        <h3>Video</h3>
        <label className="manual-admin__field">
          <span className="manual-admin__field-label">Video URL (optional)</span>
          <input
            type="text"
            value={body.video?.url ?? ""}
            onChange={(event) => updateNested("video", { ...body.video, url: event.target.value })}
            disabled={disabled}
            placeholder="https://..."
          />
        </label>
        <label className="website-admin__checkbox">
          <input
            type="checkbox"
            checked={body.video?.visible ?? false}
            onChange={(event) => updateNested("video", { ...body.video, visible: event.target.checked })}
            disabled={disabled}
          />
          Show video
        </label>
      </section>
    </div>
  );
}
