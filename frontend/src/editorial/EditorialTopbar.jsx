import { Link } from "react-router-dom";
import { publishButtonLabel } from "./editorialStatus.js";

const LOCALES = ["ro", "en"];

/**
 * @param {{
 *   backHref: string;
 *   locale: string;
 *   isSaving?: boolean;
 *   canSave?: boolean;
 *   canPublish?: boolean;
 *   editorialVisibility?: string;
 *   onLocaleChange: (locale: string) => void;
 *   onSaveDraft: () => void;
 *   onPublish: () => void;
 * }} props
 */
export default function EditorialTopbar({
  backHref,
  locale,
  isSaving = false,
  canSave = false,
  canPublish = false,
  editorialVisibility,
  onLocaleChange,
  onSaveDraft,
  onPublish,
}) {
  return (
    <header className="editorial-topbar">
      <Link className="editorial-topbar__back-link" to={backHref}>
        ← Back to Admin Dashboard
      </Link>
      <div className="editorial-topbar__actions">
        <div className="editorial-topbar__locale-switcher" aria-label="Content locale">
          {LOCALES.map((itemLocale) => (
            <button
              key={itemLocale}
              type="button"
              className={`editorial-topbar__locale-button${
                locale === itemLocale ? " editorial-topbar__locale-button--active" : ""
              }`}
              onClick={() => onLocaleChange(itemLocale)}
              disabled={isSaving}
            >
              {itemLocale.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="editorial-topbar__publish-controls" aria-label="Save and publish controls">
          <button type="button" onClick={onSaveDraft} disabled={!canSave || isSaving}>
            Save draft
          </button>
          <button type="button" onClick={onPublish} disabled={!canPublish || isSaving}>
            {publishButtonLabel(editorialVisibility)}
          </button>
        </div>
      </div>
    </header>
  );
}
