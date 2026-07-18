import EditorialStatusBanner from "./EditorialStatusBanner.jsx";
import EditorialTopbar from "./EditorialTopbar.jsx";
import EditorialUnsavedDialog from "./EditorialUnsavedDialog.jsx";
import { isCanonicalSourceLocale } from "./editorialLocales.js";

/**
 * @param {{
 *   ariaLabel: string;
 *   backHref: string;
 *   locale: string;
 *   isSaving?: boolean;
 *   isGenerating?: boolean;
 *   isDirty?: boolean;
 *   editorialVisibility?: string;
 *   exists?: boolean;
 *   hasSelection?: boolean;
 *   canSave?: boolean;
 *   canPublish?: boolean;
 *   errorMessage?: string;
 *   onLocaleChange: (locale: string) => void;
 *   onSaveDraft: () => void;
 *   onPublish: () => void;
 *   onGenerateTranslation?: () => void;
 *   showUnsavedDialog?: boolean;
 *   onUnsavedSave?: () => void;
 *   onUnsavedDiscard?: () => void;
 *   onUnsavedCancel?: () => void;
 *   sidebar: import("react").ReactNode;
 *   children: import("react").ReactNode;
 * }} props
 */
export default function EditorialManagementShell({
  ariaLabel,
  backHref,
  locale,
  isSaving = false,
  isGenerating = false,
  isDirty = false,
  editorialVisibility,
  exists = true,
  hasSelection = false,
  canSave = false,
  canPublish = false,
  errorMessage = "",
  onLocaleChange,
  onSaveDraft,
  onPublish,
  onGenerateTranslation,
  showUnsavedDialog = false,
  onUnsavedSave,
  onUnsavedDiscard,
  onUnsavedCancel,
  sidebar,
  children,
}) {
  const canGenerate =
    Boolean(onGenerateTranslation) &&
    hasSelection &&
    !isCanonicalSourceLocale(locale);

  return (
    <section className="editorial-workspace manual-admin" aria-label={ariaLabel}>
      <EditorialTopbar
        backHref={backHref}
        locale={locale}
        isSaving={isSaving}
        isGenerating={isGenerating}
        canSave={canSave}
        canPublish={canPublish}
        canGenerate={canGenerate}
        editorialVisibility={editorialVisibility}
        onLocaleChange={onLocaleChange}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
        onGenerateTranslation={onGenerateTranslation}
      />

      {errorMessage ? <p className="editorial-workspace__error">{errorMessage}</p> : null}

      <EditorialStatusBanner
        isDirty={isDirty}
        editorialVisibility={editorialVisibility}
        exists={exists}
        locale={locale}
        hasSelection={hasSelection}
      />

      <div className="editorial-workspace__layout manual-admin__layout">
        {sidebar}
        <main className="editorial-workspace__editor manual-admin__editor">{children}</main>
      </div>

      <EditorialUnsavedDialog
        isOpen={showUnsavedDialog}
        isSaving={isSaving || isGenerating}
        onSave={onUnsavedSave ?? (() => {})}
        onDiscard={onUnsavedDiscard ?? (() => {})}
        onCancel={onUnsavedCancel ?? (() => {})}
      />
    </section>
  );
}
