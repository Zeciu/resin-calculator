import { useMemo } from "react";
import { ADMIN_ROUTES } from "../adminRoutes.js";
import CrossReferencePicker from "../../editorial/CrossReferencePicker.jsx";
import EditorialManagementShell from "../../editorial/EditorialManagementShell.jsx";
import EditorialSidebar from "../../editorial/EditorialSidebar.jsx";
import { adminLocaleLabel } from "../../editorial/editorialLocales.js";
import { useEditorialWorkspace } from "../../editorial/useEditorialWorkspace.js";
import {
  createGlossaryEntry,
  deleteGlossaryEntry,
  deleteGlossaryEntryVariant,
  generateGlossaryTranslation,
  getGlossaryVariant,
  listGlossaryEntries,
  publishGlossaryVariant,
  saveGlossaryVariant,
} from "./glossaryAdminApi.js";
import GlossaryEntryEditor from "./GlossaryEntryEditor.jsx";
import {
  editorStatesEqual,
  editorToVariantBody,
  emptyEditorState,
  variantToEditor,
} from "./glossaryEditorAdapter.js";

function idsToSelected(ids, entries) {
  return (ids ?? []).map((contentId) => {
    const match = entries.find((entry) => entry.contentId === contentId);
    return {
      contentId,
      label: match?.term?.trim() || contentId,
    };
  });
}

export default function GlossaryManagementPage() {
  const workspace = useEditorialWorkspace({
    listItems: (itemLocale) => listGlossaryEntries(itemLocale),
    getItemLabel: (item) => item.term || item.contentId,
    loadVariant: getGlossaryVariant,
    saveItem: (contentId, locale, editorState) =>
      saveGlossaryVariant(contentId, locale, editorToVariantBody(editorState)),
    publishItem: (contentId, locale) => publishGlossaryVariant(contentId, locale),
    generateTranslation: generateGlossaryTranslation,
    createItem: (term) => createGlossaryEntry(term),
    deleteItem: deleteGlossaryEntry,
    deleteLocaleVariant: deleteGlossaryEntryVariant,
    createPromptLabel: "Enter the glossary term",
    variantToEditor,
    applySavedVariant: (saved) => variantToEditor(saved),
    editorStatesEqual,
    emptyEditorState,
    getDeleteLabel: (editorState, selectedItem) =>
      editorState.term.trim() || selectedItem?.term || "this entry",
    getDeleteEntityConfirmMessage: (label) =>
      `Delete "${label}" in all languages? Romanian and every translation will be permanently deleted. This cannot be undone.`,
    getDeleteLocaleConfirmMessage: (label, locale) =>
      `Delete the ${adminLocaleLabel(locale)} translation of "${label}"? Only this language will be removed. Romanian and other translations will remain.`,
    messages: {
      loadList: "Failed to load glossary entries.",
      loadVariant: "Failed to load glossary entry.",
      save: "Failed to save glossary draft.",
      publish: "Failed to publish glossary entry.",
      create: "Failed to create glossary entry.",
      delete: "Failed to delete glossary entry.",
      deleteLocale: "Failed to delete translation.",
      generate: "Failed to generate translation.",
    },
  });

  const relatedSelected = useMemo(
    () => idsToSelected(workspace.editorState.relatedTermIds, workspace.items),
    [workspace.editorState.relatedTermIds, workspace.items],
  );

  const synonymSelected = useMemo(
    () => idsToSelected(workspace.editorState.synonymTermIds, workspace.items),
    [workspace.editorState.synonymTermIds, workspace.items],
  );

  return (
    <EditorialManagementShell
      ariaLabel="Glossary management"
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
          ariaLabel="Glossary entries"
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
          <p>Loading glossary entries...</p>
        </div>
      ) : workspace.selectedItem ? (
        <>
          <div className="manual-admin__title-row">
            <div className="manual-admin__field manual-admin__field--title">
              <input
                type="text"
                aria-label="Glossary term"
                value={workspace.editorState.term}
                onChange={(event) =>
                  workspace.setEditorState((prev) => ({ ...prev, term: event.target.value }))
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
          <div className="manual-admin__field manual-admin__field--editor">
            <GlossaryEntryEditor
              key={`${workspace.selectedItemId}-${workspace.locale}`}
              document={workspace.editorState.document}
              onDocumentChange={(document) =>
                workspace.setEditorState((prev) => ({ ...prev, document }))
              }
              media={workspace.editorState.media}
              onMediaChange={(media) => workspace.setEditorState((prev) => ({ ...prev, media }))}
              disabled={workspace.isSaving}
            />
          </div>
          <div className="editorial-reference-picker-group">
            <CrossReferencePicker
              label="Related terms"
              selected={relatedSelected}
              onChange={(selected) =>
                workspace.setEditorState((prev) => ({
                  ...prev,
                  relatedTermIds: selected.map((item) => item.contentId),
                }))
              }
              locale={workspace.locale}
              excludeIds={[workspace.selectedItemId]}
              allowTypes={["glossary_entry"]}
            />
            <CrossReferencePicker
              label="Synonyms"
              selected={synonymSelected}
              onChange={(selected) =>
                workspace.setEditorState((prev) => ({
                  ...prev,
                  synonymTermIds: selected.map((item) => item.contentId),
                }))
              }
              locale={workspace.locale}
              excludeIds={[workspace.selectedItemId]}
              allowTypes={["glossary_entry"]}
            />
            <CrossReferencePicker
              label="See also"
              selected={workspace.editorState.seeAlso}
              onChange={(selected) => workspace.setEditorState((prev) => ({ ...prev, seeAlso: selected }))}
              locale={workspace.locale}
              excludeIds={[workspace.selectedItemId]}
              allowTypes={["glossary_entry", "manual_chapter"]}
              seeAlsoMode
            />
          </div>
        </>
      ) : (
        <div className="manual-admin__empty">
          <h2>Glossary entry editor</h2>
          <p>Add an entry to begin writing. Each entry is edited as one complete definition.</p>
        </div>
      )}
    </EditorialManagementShell>
  );
}
