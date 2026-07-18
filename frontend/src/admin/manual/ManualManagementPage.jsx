import { ADMIN_ROUTES } from "../adminRoutes.js";
import EditorialManagementShell from "../../editorial/EditorialManagementShell.jsx";
import EditorialSidebar from "../../editorial/EditorialSidebar.jsx";
import { useEditorialWorkspace } from "../../editorial/useEditorialWorkspace.js";
import {
  createManualChapter,
  deleteManualChapter,
  generateManualTranslation,
  getManualVariant,
  listManualChapters,
  publishManualVariant,
  saveManualVariant,
} from "./manualAdminApi.js";
import ManualChapterEditor from "./ManualChapterEditor.jsx";
import {
  editorStatesEqual,
  editorToVariantBody,
  emptyDocument,
  variantToEditor,
} from "./manualEditorAdapter.js";

function emptyEditorState() {
  return { title: "", document: emptyDocument(), status: "draft", editorialVisibility: "empty", exists: true };
}

export default function ManualManagementPage() {
  const workspace = useEditorialWorkspace({
    listItems: (itemLocale) => listManualChapters(itemLocale),
    getItemLabel: (item) => item.title || item.contentId,
    loadVariant: getManualVariant,
    saveItem: (contentId, locale, editorState) =>
      saveManualVariant(contentId, locale, editorToVariantBody(editorState.title, editorState.document)),
    publishItem: (contentId, locale) => publishManualVariant(contentId, locale),
    generateTranslation: generateManualTranslation,
    createItem: (title, locale) => createManualChapter(title, locale),
    deleteItem: deleteManualChapter,
    createPromptLabel: "Enter the chapter title",
    variantToEditor,
    applySavedVariant: (saved) => variantToEditor(saved),
    editorStatesEqual,
    emptyEditorState,
    getDeleteLabel: (editorState, selectedItem) =>
      editorState.title.trim() || selectedItem?.title || "this chapter",
    getDeleteConfirmMessage: (label) =>
      `Delete "${label}"? This deletes this chapter in all languages. This cannot be undone.`,
    messages: {
      loadList: "Failed to load manual chapters.",
      loadVariant: "Failed to load chapter.",
      save: "Failed to save chapter draft.",
      publish: "Failed to publish chapter.",
      create: "Failed to create chapter.",
      delete: "Failed to delete chapter.",
      generate: "Failed to generate translation.",
    },
  });

  return (
    <EditorialManagementShell
      ariaLabel="Manual management"
      backHref={ADMIN_ROUTES.ROOT}
      locale={workspace.locale}
      isSaving={workspace.isSaving}
      isGenerating={workspace.isGenerating}
      isDirty={workspace.isDirty}
      editorialVisibility={workspace.savedState.editorialVisibility}
      exists={workspace.savedState.exists}
      hasSelection={Boolean(workspace.selectedItemId)}
      canSave={Boolean(workspace.selectedItemId)}
      canPublish={Boolean(workspace.selectedItemId)}
      errorMessage={workspace.errorMessage}
      onLocaleChange={workspace.handleLocaleChange}
      onSaveDraft={workspace.handleSaveDraft}
      onPublish={workspace.handlePublish}
      onGenerateTranslation={workspace.handleGenerateTranslation}
      showUnsavedDialog={workspace.showUnsavedDialog}
      onUnsavedSave={workspace.handleUnsavedSave}
      onUnsavedDiscard={workspace.handleUnsavedDiscard}
      onUnsavedCancel={workspace.handleUnsavedCancel}
      sidebar={
        <EditorialSidebar
          ariaLabel="Manual chapters"
          addLabel="Add New Chapter"
          items={workspace.sidebarItems}
          selectedId={workspace.selectedItemId}
          isSaving={workspace.isSaving || workspace.isGenerating}
          emptyLabel={
            workspace.locale === "ro"
              ? "No Romanian chapters yet."
              : `No ${workspace.locale.toUpperCase()} chapters yet.`
          }
          onAdd={workspace.handleAddItem}
          onSelect={workspace.handleSelectItem}
        />
      }
    >
      {workspace.isLoading ? (
        <div className="manual-admin__empty">
          <p>Loading manual chapters...</p>
        </div>
      ) : workspace.selectedItemId ? (
        <>
          <div className="manual-admin__title-row">
            <div className="manual-admin__field manual-admin__field--title">
              <input
                type="text"
                aria-label="Chapter title"
                value={workspace.editorState.title}
                onChange={(event) =>
                  workspace.setEditorState((prev) => ({ ...prev, title: event.target.value }))
                }
                disabled={workspace.isSaving || workspace.isGenerating}
              />
            </div>
            <button
              type="button"
              className="manual-admin__delete-chapter"
              onClick={workspace.handleDeleteItem}
              disabled={workspace.isSaving || workspace.isGenerating}
            >
              Delete Chapter
            </button>
          </div>
          <div className="manual-admin__field manual-admin__field--editor">
            <ManualChapterEditor
              key={`${workspace.selectedItemId}-${workspace.locale}`}
              document={workspace.editorState.document}
              onDocumentChange={(document) =>
                workspace.setEditorState((prev) => ({ ...prev, document }))
              }
              disabled={workspace.isSaving || workspace.isGenerating}
            />
          </div>
        </>
      ) : (
        <div className="manual-admin__empty">
          <h2>Manual chapter editor</h2>
          <p>Add a chapter to begin writing. Each chapter is edited as one complete document.</p>
        </div>
      )}
    </EditorialManagementShell>
  );
}
