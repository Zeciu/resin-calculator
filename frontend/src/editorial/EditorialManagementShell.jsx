import EditorialStatusBanner from "./EditorialStatusBanner.jsx";
import EditorialTopbar from "./EditorialTopbar.jsx";
import EditorialUnsavedDialog from "./EditorialUnsavedDialog.jsx";

/**
 * @param {{
 *   ariaLabel: string;
 *   backHref: string;
 *   locale: string;
 *   isSaving?: boolean;
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
  showUnsavedDialog = false,
  onUnsavedSave,
  onUnsavedDiscard,
  onUnsavedCancel,
  sidebar,
  children,
}) {
  return (
    <section className="editorial-workspace manual-admin" aria-label={ariaLabel}>
      <EditorialTopbar
        backHref={backHref}
        locale={locale}
        isSaving={isSaving}
        canSave={canSave}
        canPublish={canPublish}
        editorialVisibility={editorialVisibility}
        onLocaleChange={onLocaleChange}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
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
        isSaving={isSaving}
        onSave={onUnsavedSave ?? (() => {})}
        onDiscard={onUnsavedDiscard ?? (() => {})}
        onCancel={onUnsavedCancel ?? (() => {})}
      />
    </section>
  );
}
