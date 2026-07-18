import { ADMIN_ROUTES } from "../adminRoutes.js";
import CrossReferencePicker from "../../editorial/CrossReferencePicker.jsx";
import EditorialManagementShell from "../../editorial/EditorialManagementShell.jsx";
import EditorialSidebar from "../../editorial/EditorialSidebar.jsx";
import { adminLocaleLabel } from "../../editorial/editorialLocales.js";
import { useEditorialWorkspace } from "../../editorial/useEditorialWorkspace.js";
import KnowledgeBaseEntryEditor from "./KnowledgeBaseEntryEditor.jsx";
import {
  createKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  deleteKnowledgeBaseEntryVariant,
  generateKnowledgeBaseTranslation,
  getKnowledgeBaseVariant,
  listKnowledgeBaseEntries,
  publishKnowledgeBaseVariant,
  saveKnowledgeBaseVariant,
} from "./knowledgeBaseAdminApi.js";
import {
  editorStatesEqual,
  editorToVariantBody,
  emptyEditorState,
  variantToEditor,
} from "./knowledgeBaseEditorAdapter.js";

function enrichKbSelected(ids, entries) {
  return (ids ?? []).map((contentId) => {
    const match = entries.find((entry) => entry.contentId === contentId);
    return {
      contentId,
      label: match?.title?.trim() || contentId,
      contentType: "kb_entry",
    };
  });
}

export default function KnowledgeBaseManagementPage() {
  const workspace = useEditorialWorkspace({
    listItems: (itemLocale) => listKnowledgeBaseEntries(itemLocale),
    getItemLabel: (item) => item.title || item.contentId,
    loadVariant: getKnowledgeBaseVariant,
    saveItem: (contentId, locale, editorState) =>
      saveKnowledgeBaseVariant(
        contentId,
        locale,
        editorState.category,
        editorState.difficulty,
        editorToVariantBody(editorState),
      ),
    publishItem: (contentId, locale) => publishKnowledgeBaseVariant(contentId, locale),
    generateTranslation: generateKnowledgeBaseTranslation,
    createItem: (title) => createKnowledgeBaseEntry(title, "Epoxy", "Beginner"),
    deleteItem: deleteKnowledgeBaseEntry,
    deleteLocaleVariant: deleteKnowledgeBaseEntryVariant,
    createPromptLabel: "Enter the troubleshooting entry title",
    variantToEditor,
    transformEditor: (editor, { items }) => ({
      ...editor,
      relatedKbSelected: enrichKbSelected(editor.relatedKbEntryIds, items),
    }),
    applySavedVariant: (saved) => variantToEditor(saved),
    editorStatesEqual,
    emptyEditorState,
    getDeleteLabel: (editorState, selectedItem) =>
      editorState.title.trim() || selectedItem?.title || "this entry",
    getDeleteEntityConfirmMessage: (label) =>
      `Delete "${label}" in all languages? Romanian and every translation will be permanently deleted. This cannot be undone.`,
    getDeleteLocaleConfirmMessage: (label, locale) =>
      `Delete the ${adminLocaleLabel(locale)} translation of "${label}"? Only this language will be removed. Romanian and other translations will remain.`,
    messages: {
      loadList: "Failed to load knowledge base entries.",
      loadVariant: "Failed to load knowledge base entry.",
      save: "Failed to save knowledge base draft.",
      publish: "Failed to publish knowledge base entry.",
      create: "Failed to create knowledge base entry.",
      delete: "Failed to delete knowledge base entry.",
      deleteLocale: "Failed to delete translation.",
      generate: "Failed to generate translation.",
    },
  });

  return (
    <EditorialManagementShell
      ariaLabel="Knowledge base management"
      backHref={ADMIN_ROUTES.ROOT}
      locale={workspace.locale}
      isSaving={workspace.isSaving}
      isGenerating={workspace.isGenerating}
      isDirty={workspace.isDirty}
      editorialVisibility={workspace.savedState.editorialVisibility}
      exists={workspace.savedState.exists}
      hasSelection={Boolean(workspace.selectedItem)}
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
          ariaLabel="Knowledge base entries"
          addLabel="Add New Entry"
          items={workspace.sidebarItems}
          selectedId={workspace.selectedItemId}
          isSaving={workspace.isSaving || workspace.isGenerating}
          onAdd={workspace.handleAddItem}
          onSelect={workspace.handleSelectItem}
        />
      }
    >
      {workspace.isLoading ? (
        <div className="manual-admin__empty">
          <p>Loading knowledge base entries...</p>
        </div>
      ) : workspace.selectedItem ? (
        <>
          <div className="manual-admin__title-row">
            <div className="manual-admin__field manual-admin__field--title">
              <input
                type="text"
                aria-label="Entry title"
                value={workspace.editorState.title}
                onChange={(event) =>
                  workspace.setEditorState((prev) => ({ ...prev, title: event.target.value }))
                }
                disabled={workspace.isSaving}
              />
            </div>
            <div className="manual-admin__delete-actions">
              {workspace.canDeleteLocaleVariant && workspace.savedState.exists !== false ? (
                <button
                  type="button"
                  className="manual-admin__delete-chapter"
                  onClick={workspace.handleDeleteLocaleVariant}
                  disabled={workspace.isSaving || workspace.isGenerating}
                >
                  {`Delete ${adminLocaleLabel(workspace.locale)} translation`}
                </button>
              ) : null}
              <button
                type="button"
                className="manual-admin__delete-chapter"
                onClick={workspace.handleDeleteItem}
                disabled={workspace.isSaving || workspace.isGenerating}
              >
                Delete entry in all languages
              </button>
            </div>
          </div>
          <KnowledgeBaseEntryEditor
            key={`${workspace.selectedItemId}-${workspace.locale}`}
            editorState={workspace.editorState}
            onChange={(patch) => workspace.setEditorState((prev) => ({ ...prev, ...patch }))}
            disabled={workspace.isSaving}
          />
          <div className="editorial-reference-picker-group">
            <CrossReferencePicker
              label="Related Knowledge Base Articles"
              selected={workspace.editorState.relatedKbSelected}
              onChange={(selected) =>
                workspace.setEditorState((prev) => ({
                  ...prev,
                  relatedKbEntryIds: selected.map((item) => item.contentId),
                  relatedKbSelected: selected,
                }))
              }
              locale={workspace.locale}
              excludeIds={[workspace.selectedItemId]}
              allowTypes={["kb_entry"]}
            />
            <CrossReferencePicker
              label="Related Glossary Entries"
              selected={workspace.editorState.relatedGlossarySelected}
              onChange={(selected) =>
                workspace.setEditorState((prev) => ({
                  ...prev,
                  relatedGlossaryEntryIds: selected.map((item) => item.contentId),
                  relatedGlossarySelected: selected,
                }))
              }
              locale={workspace.locale}
              excludeIds={[]}
              allowTypes={["glossary_entry"]}
            />
            <CrossReferencePicker
              label="Related Manual Chapters"
              selected={workspace.editorState.relatedManualSelected}
              onChange={(selected) =>
                workspace.setEditorState((prev) => ({
                  ...prev,
                  relatedManualChapterIds: selected.map((item) => item.contentId),
                  relatedManualSelected: selected,
                }))
              }
              locale={workspace.locale}
              excludeIds={[]}
              allowTypes={["manual_chapter"]}
            />
          </div>
        </>
      ) : (
        <div className="manual-admin__empty">
          <h2>Knowledge base entry editor</h2>
          <p>Add an entry to begin writing. Each entry follows the troubleshooting template.</p>
        </div>
      )}
    </EditorialManagementShell>
  );
}
