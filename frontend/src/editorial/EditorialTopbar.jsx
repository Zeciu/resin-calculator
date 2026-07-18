import { Link } from "react-router-dom";
import { publishButtonLabel } from "./editorialStatus.js";
import { ADMIN_EDITORIAL_LOCALES, isCanonicalSourceLocale } from "./editorialLocales.js";

/**
 * @param {{
 *   backHref: string;
 *   locale: string;
 *   isSaving?: boolean;
 *   isGenerating?: boolean;
 *   canSave?: boolean;
 *   canPublish?: boolean;
 *   canGenerate?: boolean;
 *   editorialVisibility?: string;
 *   onLocaleChange: (locale: string) => void;
 *   onSaveDraft: () => void;
 *   onPublish: () => void;
 *   onGenerateTranslation?: () => void;
 * }} props
 */
export default function EditorialTopbar({
  backHref,
  locale,
  isSaving = false,
  isGenerating = false,
  canSave = false,
  canPublish = false,
  canGenerate = false,
  editorialVisibility,
  onLocaleChange,
  onSaveDraft,
  onPublish,
  onGenerateTranslation,
}) {
  const busy = isSaving || isGenerating;

  return (
    <header className="editorial-topbar">
      <Link className="editorial-topbar__back-link" to={backHref}>
        ← Back to Admin Dashboard
      </Link>
      <div className="editorial-topbar__actions">
        <div className="editorial-topbar__locale-switcher" aria-label="Content locale">
          {ADMIN_EDITORIAL_LOCALES.map((itemLocale) => (
            <button
              key={itemLocale}
              type="button"
              className={`editorial-topbar__locale-button${
                locale === itemLocale ? " editorial-topbar__locale-button--active" : ""
              }`}
              onClick={() => onLocaleChange(itemLocale)}
              disabled={busy}
            >
              {itemLocale.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="editorial-topbar__publish-controls" aria-label="Save and publish controls">
          {!isCanonicalSourceLocale(locale) && onGenerateTranslation ? (
            <button
              type="button"
              onClick={onGenerateTranslation}
              disabled={!canGenerate || busy}
            >
              {isGenerating ? "Generating…" : "Generate Translation"}
            </button>
          ) : null}
          <button type="button" onClick={onSaveDraft} disabled={!canSave || busy}>
            Save draft
          </button>
          <button type="button" onClick={onPublish} disabled={!canPublish || busy}>
            {publishButtonLabel(editorialVisibility)}
          </button>
        </div>
      </div>
    </header>
  );
}
