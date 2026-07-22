/**
 * @param {{
 *   editingLabel: string;
 *   localeLabel: string;
 * }} props
 */
export default function WebsiteEditorHeader({ editingLabel, localeLabel }) {
  return (
    <header className="website-admin__shell-header">
      <p className="website-admin__shell-editing">
        <span className="website-admin__shell-label">Editing:</span> {editingLabel}
      </p>
      <p className="website-admin__shell-language">
        <span className="website-admin__shell-label">Language:</span> {localeLabel}
      </p>
    </header>
  );
}
