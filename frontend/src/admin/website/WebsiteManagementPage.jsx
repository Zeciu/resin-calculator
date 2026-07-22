import { useCallback, useState } from "react";
import { ADMIN_ROUTES } from "../adminRoutes.js";
import EditorialManagementShell from "../../editorial/EditorialManagementShell.jsx";
import { AdminApiError } from "../../editorial/editorialAdminApi.js";
import { adminLocaleLabel } from "../../editorial/editorialLocales.js";
import { useEditorialWorkspace } from "../../editorial/useEditorialWorkspace.js";
import WebsiteEditorHeader from "./WebsiteEditorHeader.jsx";
import WebsitePageEditor from "./WebsitePageEditor.jsx";
import WebsitePageSidebar from "./WebsitePageSidebar.jsx";
import {
  generateWebsiteTranslation,
  getWebsiteVariant,
  listWebsitePages,
  publishWebsiteVariant,
  saveWebsiteVariant,
  unpublishWebsiteVariant,
} from "./websiteAdminApi.js";
import {
  editorStatesEqual,
  editorToVariantBody,
  emptyEditorState,
  variantToEditor,
} from "./websiteEditorAdapter.js";
import { validateWebsiteEditorState } from "./websiteValidation.js";

async function listWebsiteWorkspaceItems(locale) {
  const pages = await listWebsitePages(locale);
  return pages.map((page) => ({
    ...page,
    contentId: page.pageKey,
  }));
}

export default function WebsiteManagementPage() {
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const workspace = useEditorialWorkspace({
    listItems: listWebsiteWorkspaceItems,
    getItemLabel: (item) => item.adminLabel || item.pageKey,
    loadVariant: getWebsiteVariant,
    saveItem: (pageKey, locale, editorState) => {
      const validationError = validateWebsiteEditorState(editorState);
      if (validationError) {
        throw new AdminApiError(validationError, 400);
      }
      return saveWebsiteVariant(pageKey, locale, editorToVariantBody(editorState));
    },
    publishItem: (pageKey, locale) => publishWebsiteVariant(pageKey, locale),
    generateTranslation: generateWebsiteTranslation,
    createItem: async () => {
      throw new Error("Website pages cannot be created.");
    },
    deleteItem: async () => {
      throw new Error("Website pages cannot be deleted.");
    },
    createPromptLabel: "",
    variantToEditor,
    applySavedVariant: (saved) => variantToEditor(saved),
    editorStatesEqual,
    emptyEditorState,
    getDeleteLabel: (editorState, selectedItem) =>
      selectedItem?.adminLabel || editorState.body?.publicTitle || editorState.pageKey || "this page",
    messages: {
      loadList: "Failed to load website pages.",
      loadVariant: "Failed to load website page.",
      save: "Failed to save website draft.",
      publish: "Failed to publish website page.",
      generate: "Failed to generate translation.",
    },
  });

  const {
    selectedItem,
    selectedItemId,
    locale,
    editorState,
    setEditorState,
    savedState,
    isLoading,
    isSaving,
    isGenerating,
    isDirty,
    errorMessage,
    showUnsavedDialog,
    sidebarItems,
    handleSelectItem,
    handleLocaleChange,
    handleSaveDraft,
    handlePublish,
    handleGenerateTranslation,
    reloadAfterBulkUpdate,
    handleUnsavedSave,
    handleUnsavedDiscard,
    handleUnsavedCancel,
  } = workspace;

  const handleBodyChange = useCallback(
    (nextBody) => {
      setEditorState((previous) => ({
        ...previous,
        body: nextBody,
      }));
    },
    [setEditorState],
  );

  const handleUnpublish = useCallback(async () => {
    if (!selectedItemId) {
      return;
    }
    setIsUnpublishing(true);
    try {
      await unpublishWebsiteVariant(selectedItemId, locale);
      await reloadAfterBulkUpdate();
    } catch (error) {
      window.alert(error.message || "Failed to unpublish website page.");
    } finally {
      setIsUnpublishing(false);
    }
  }, [locale, reloadAfterBulkUpdate, selectedItemId]);

  const selectedLabel = selectedItem?.adminLabel || editorState.body?.publicTitle || "Website page";

  const canSave =
    Boolean(selectedItemId) && Boolean(String(editorState.body?.publicTitle ?? "").trim());

  const canUnpublish =
    Boolean(selectedItemId) &&
    savedState.exists &&
    (savedState.status === "published" ||
      savedState.editorialVisibility === "live" ||
      savedState.editorialVisibility === "stale");

  return (
    <EditorialManagementShell
      ariaLabel="Website management"
      backHref={ADMIN_ROUTES.ROOT}
      locale={locale}
      bulkModule="website"
      isSaving={isSaving || isUnpublishing}
      isGenerating={isGenerating}
      isDirty={isDirty}
      editorialVisibility={savedState.editorialVisibility}
      exists={savedState.exists}
      translationUpdateState={savedState.translationUpdateState}
      hasSelection={Boolean(selectedItem)}
      canSave={canSave}
      canPublish={canSave}
      canUnpublish={canUnpublish}
      errorMessage={errorMessage}
      onLocaleChange={handleLocaleChange}
      onSaveDraft={handleSaveDraft}
      onPublish={handlePublish}
      onUnpublish={handleUnpublish}
      onGenerateTranslation={handleGenerateTranslation}
      onBulkCompleted={() => {
        void reloadAfterBulkUpdate();
      }}
      showUnsavedDialog={showUnsavedDialog}
      onUnsavedSave={handleUnsavedSave}
      onUnsavedDiscard={handleUnsavedDiscard}
      onUnsavedCancel={handleUnsavedCancel}
      sidebar={
        <WebsitePageSidebar
          ariaLabel="Website pages"
          items={sidebarItems}
          selectedId={selectedItemId}
          isSaving={isSaving || isGenerating || isUnpublishing}
          onSelect={handleSelectItem}
        />
      }
    >
      {isLoading ? (
        <div className="manual-admin__empty">
          <p>Loading website pages...</p>
        </div>
      ) : selectedItem ? (
        <div className="website-admin__shell">
          <WebsiteEditorHeader
            editingLabel={selectedLabel}
            localeLabel={adminLocaleLabel(locale)}
          />
          {locale === "ro" && savedState.exists === false ? (
            <p className="manual-admin__hint" role="status">
              No Romanian content yet. Enter the Romanian content and save the draft.
            </p>
          ) : null}
          <WebsitePageEditor
            key={`${selectedItemId}-${locale}`}
            pageKind={editorState.pageKind}
            body={editorState.body}
            onChange={handleBodyChange}
            disabled={isSaving || isGenerating || isUnpublishing}
          />
        </div>
      ) : (
        <div className="manual-admin__empty">
          <h2>Website page editor</h2>
          <p>Select a page from the sidebar to begin editing.</p>
        </div>
      )}
    </EditorialManagementShell>
  );
}
