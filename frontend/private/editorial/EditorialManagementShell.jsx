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
 *   bulkModule?: "manual" | "glossary" | "knowledge_base" | "website" | null;
 *   isSaving?: boolean;
 *   isGenerating?: boolean;
 *   isDirty?: boolean;
 *   editorialVisibility?: string;
 *   exists?: boolean;
 *   translationUpdateState?: string | null;
 *   hasSelection?: boolean;
 *   canSave?: boolean;
 *   canPublish?: boolean;
 *   canPublishAllDrafts?: boolean;
 *   publishableDraftCount?: number;
 *   localeFullyPublished?: boolean;
 *   isBulkPublishing?: boolean;
 *   errorMessage?: string;
 *   statusMessage?: string;
 *   onLocaleChange: (locale: string) => void;
 *   onSaveDraft: () => void;
 *   onPublish: () => void;
 *   onPublishAllDrafts?: () => void;
 *   onGenerateTranslation?: () => void;
 *   onBulkCompleted?: () => void;
 *   onUnpublish?: () => void;
 *   canUnpublish?: boolean;
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
  isBulkPublishing = false,
  isDirty = false,
  editorialVisibility,
  exists = true,
  translationUpdateState = null,
  hasSelection = false,
  canSave = false,
  canPublish = false,
  canPublishAllDrafts = false,
  publishableDraftCount = 0,
  localeFullyPublished = false,
  errorMessage = "",
  statusMessage = "",
  onLocaleChange,
  onSaveDraft,
  onPublish,
  onPublishAllDrafts,
  onGenerateTranslation,
  onBulkCompleted,
  onUnpublish,
  canUnpublish = false,
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
        isBulkPublishing={isBulkPublishing}
        canSave={canSave}
        canPublish={canPublish}
        canGenerate={canGenerate}
        canUpdateAll={canUpdateAll}
        canPublishAllDrafts={canPublishAllDrafts}
        editorialVisibility={editorialVisibility}
        onLocaleChange={onLocaleChange}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
        onPublishAllDrafts={onPublishAllDrafts}
        onGenerateTranslation={onGenerateTranslation}
        onUpdateAllTranslations={bulkModule ? openBulkDialog : undefined}
        onUnpublish={onUnpublish}
        canUnpublish={canUnpublish}
      />

      {errorMessage ? <p className="editorial-workspace__error">{errorMessage}</p> : null}
      {statusMessage ? <p className="editorial-workspace__status" role="status">{statusMessage}</p> : null}

      {onPublishAllDrafts ? (
        <p className="editorial-workspace__bulk-status" role="status">
          {`Drafts ready to publish: ${publishableDraftCount}`}
          {localeFullyPublished ? " · Current locale fully published" : ""}
        </p>
      ) : null}

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
        isSaving={isSaving || isGenerating || isBulkUpdating || isBulkPublishing}
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
