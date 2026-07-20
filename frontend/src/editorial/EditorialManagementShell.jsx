import { useState } from "react";
import EditorialStatusBanner from "./EditorialStatusBanner.jsx";
import EditorialTopbar from "./EditorialTopbar.jsx";
import EditorialUnsavedDialog from "./EditorialUnsavedDialog.jsx";
import UpdateAllTranslationsDialog from "./UpdateAllTranslationsDialog.jsx";
import { isCanonicalSourceLocale } from "./editorialLocales.js";

/**
 * @param {{
 *   ariaLabel: string;
 *   backHref: string;
 *   locale: string;
 *   bulkModule?: "manual" | "glossary" | "knowledge_base" | null;
 *   isSaving?: boolean;
 *   isGenerating?: boolean;
 *   isDirty?: boolean;
 *   editorialVisibility?: string;
 *   exists?: boolean;
 *   translationUpdateState?: string | null;
 *   hasSelection?: boolean;
 *   canSave?: boolean;
 *   canPublish?: boolean;
 *   errorMessage?: string;
 *   onLocaleChange: (locale: string) => void;
 *   onSaveDraft: () => void;
 *   onPublish: () => void;
 *   onGenerateTranslation?: () => void;
 *   onBulkCompleted?: () => void;
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
  bulkModule = null,
  isSaving = false,
  isGenerating = false,
  isDirty = false,
  editorialVisibility,
  exists = true,
  translationUpdateState = null,
  hasSelection = false,
  canSave = false,
  canPublish = false,
  errorMessage = "",
  onLocaleChange,
  onSaveDraft,
  onPublish,
  onGenerateTranslation,
  onBulkCompleted,
  showUnsavedDialog = false,
  onUnsavedSave,
  onUnsavedDiscard,
  onUnsavedCancel,
  sidebar,
  children,
}) {
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkDialogKey, setBulkDialogKey] = useState(0);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const translationIsCurrent = translationUpdateState === "current";
  const canGenerate =
    Boolean(onGenerateTranslation) &&
    hasSelection &&
    !isCanonicalSourceLocale(locale) &&
    !translationIsCurrent;
  const canUpdateAll =
    Boolean(bulkModule) && !isCanonicalSourceLocale(locale) && !isBulkUpdating;

  function openBulkDialog() {
    setBulkDialogKey((value) => value + 1);
    setBulkDialogOpen(true);
  }

  return (
    <section className="editorial-workspace manual-admin" aria-label={ariaLabel}>
      <EditorialTopbar
        backHref={backHref}
        locale={locale}
        isSaving={isSaving}
        isGenerating={isGenerating}
        isBulkUpdating={isBulkUpdating}
        canSave={canSave}
        canPublish={canPublish}
        canGenerate={canGenerate}
        canUpdateAll={canUpdateAll}
        editorialVisibility={editorialVisibility}
        onLocaleChange={onLocaleChange}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
        onGenerateTranslation={onGenerateTranslation}
        onUpdateAllTranslations={bulkModule ? openBulkDialog : undefined}
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
        isSaving={isSaving || isGenerating || isBulkUpdating}
        onSave={onUnsavedSave ?? (() => {})}
        onDiscard={onUnsavedDiscard ?? (() => {})}
        onCancel={onUnsavedCancel ?? (() => {})}
      />

      {bulkModule && bulkDialogOpen ? (
        <UpdateAllTranslationsDialog
          key={`${bulkModule}-${locale}-${bulkDialogKey}`}
          isOpen
          module={bulkModule}
          locale={locale}
          onRunningChange={setIsBulkUpdating}
          onClose={() => {
            if (!isBulkUpdating) {
              setBulkDialogOpen(false);
            }
          }}
          onCompleted={() => {
            onBulkCompleted?.();
          }}
        />
      ) : null}
    </section>
  );
}
