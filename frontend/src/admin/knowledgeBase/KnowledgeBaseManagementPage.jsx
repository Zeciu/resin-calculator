import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../adminRoutes.js";
import KnowledgeBaseEntryEditor from "./KnowledgeBaseEntryEditor.jsx";
import KnowledgeBaseRelationshipPicker from "./KnowledgeBaseRelationshipPicker.jsx";
import {
  createKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
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

const LOCALES = ["en", "ro"];

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
  const [entries, setEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [locale, setLocale] = useState("en");
  const [editorState, setEditorState] = useState(emptyEditorState);
  const [savedState, setSavedState] = useState(emptyEditorState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigationRef = useRef(null);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.contentId === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );

  const isDirty = useMemo(
    () => !editorStatesEqual(editorState, savedState),
    [editorState, savedState],
  );

  const refreshEntries = useCallback(async (nextLocale = locale) => {
    const items = await listKnowledgeBaseEntries(nextLocale);
    setEntries(items);
    return items;
  }, [locale]);

  const loadVariant = useCallback(
    async (contentId, nextLocale, items = entries) => {
      const variant = await getKnowledgeBaseVariant(contentId, nextLocale);
      const nextEditor = variantToEditor(variant);
      nextEditor.relatedKbSelected = enrichKbSelected(nextEditor.relatedKbEntryIds, items);
      setEditorState(nextEditor);
      setSavedState(nextEditor);
      return variant;
    },
    [entries],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialEntries() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const items = await refreshEntries(locale);
        if (cancelled) {
          return;
        }
        if (items.length > 0) {
          const firstId = items[0].contentId;
          setSelectedEntryId(firstId);
          await loadVariant(firstId, locale, items);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message || "Failed to load knowledge base entries.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitialEntries();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCurrentEntry = useCallback(async () => {
    if (!selectedEntryId) {
      return false;
    }

    setErrorMessage("");
    setIsSaving(true);
    try {
      const body = editorToVariantBody(editorState);
      const saved = await saveKnowledgeBaseVariant(
        selectedEntryId,
        locale,
        editorState.category,
        editorState.difficulty,
        body,
      );
      const items = await refreshEntries(locale);
      const nextEditor = variantToEditor(saved);
      nextEditor.relatedKbSelected = enrichKbSelected(nextEditor.relatedKbEntryIds, items);
      setEditorState(nextEditor);
      setSavedState(nextEditor);
      return true;
    } catch (error) {
      setErrorMessage(error.message || "Failed to save knowledge base entry.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [editorState, locale, refreshEntries, selectedEntryId]);

  const createNewEntry = useCallback(async () => {
    const nextTitle = window.prompt("Enter the troubleshooting entry title");
    if (typeof nextTitle !== "string") {
      return;
    }
    const trimmed = nextTitle.trim();
    if (!trimmed) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);
    try {
      const created = await createKnowledgeBaseEntry(trimmed, "Epoxy", "Beginner");
      const items = await refreshEntries(locale);
      const createdItem = items.find((item) => item.contentId === created.contentId) ?? created;
      setSelectedEntryId(createdItem.contentId);
      await loadVariant(createdItem.contentId, locale, items);
    } catch (error) {
      setErrorMessage(error.message || "Failed to create knowledge base entry.");
    } finally {
      setIsSaving(false);
    }
  }, [loadVariant, locale, refreshEntries]);

  const deleteSelectedEntry = useCallback(async () => {
    if (!selectedEntryId) {
      return;
    }

    const entryTitle = editorState.title.trim() || selectedEntry?.title || "this entry";
    const confirmed = window.confirm(`Delete "${entryTitle}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    const deletedEntryId = selectedEntryId;
    setErrorMessage("");
    setIsSaving(true);
    try {
      await deleteKnowledgeBaseEntry(deletedEntryId);
      const items = await refreshEntries(locale);
      if (items.length > 0) {
        const nextEntry = items.find((item) => item.contentId !== deletedEntryId) ?? items[0];
        setSelectedEntryId(nextEntry.contentId);
        await loadVariant(nextEntry.contentId, locale, items);
      } else {
        setSelectedEntryId(null);
        setEditorState(emptyEditorState());
        setSavedState(emptyEditorState());
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete knowledge base entry.");
    } finally {
      setIsSaving(false);
    }
  }, [editorState.title, loadVariant, locale, refreshEntries, selectedEntry, selectedEntryId]);

  const continuePendingNavigation = useCallback(async () => {
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setShowUnsavedDialog(false);
    if (action) {
      await action();
    }
  }, []);

  const requestNavigation = useCallback((action) => {
    if (!isDirty) {
      void action();
      return;
    }
    pendingNavigationRef.current = action;
    setShowUnsavedDialog(true);
  }, [isDirty]);

  async function handleUnsavedSave() {
    const saved = await saveCurrentEntry();
    if (!saved) {
      return;
    }
    await continuePendingNavigation();
  }

  function handleUnsavedDiscard() {
    setEditorState(savedState);
    void continuePendingNavigation();
  }

  function handleUnsavedCancel() {
    pendingNavigationRef.current = null;
    setShowUnsavedDialog(false);
  }

  async function handleAddEntry() {
    if (isDirty) {
      pendingNavigationRef.current = createNewEntry;
      setShowUnsavedDialog(true);
      return;
    }
    await createNewEntry();
  }

  async function handleDeleteEntry() {
    if (!selectedEntryId) {
      return;
    }
    if (isDirty) {
      pendingNavigationRef.current = deleteSelectedEntry;
      setShowUnsavedDialog(true);
      return;
    }
    await deleteSelectedEntry();
  }

  async function handleSelectEntry(contentId) {
    if (contentId === selectedEntryId) {
      return;
    }

    requestNavigation(async () => {
      setErrorMessage("");
      setIsSaving(true);
      try {
        setSelectedEntryId(contentId);
        await loadVariant(contentId, locale, entries);
      } catch (error) {
        setErrorMessage(error.message || "Failed to load knowledge base entry.");
      } finally {
        setIsSaving(false);
      }
    });
  }

  async function handleLocaleChange(nextLocale) {
    if (nextLocale === locale) {
      return;
    }

    requestNavigation(async () => {
      setErrorMessage("");
      setLocale(nextLocale);
      setIsSaving(true);
      try {
        const items = await refreshEntries(nextLocale);
        if (selectedEntryId) {
          await loadVariant(selectedEntryId, nextLocale, items);
        } else {
          setEditorState(emptyEditorState());
          setSavedState(emptyEditorState());
        }
      } catch (error) {
        setErrorMessage(error.message || "Failed to load locale variant.");
      } finally {
        setIsSaving(false);
      }
    });
  }

  function handleEditorChange(patch) {
    setEditorState((prev) => ({ ...prev, ...patch }));
  }

  function handleTitleChange(event) {
    setEditorState((prev) => ({ ...prev, title: event.target.value }));
  }

  function handleRelatedKbChange(selected) {
    setEditorState((prev) => ({
      ...prev,
      relatedKbEntryIds: selected.map((item) => item.contentId),
      relatedKbSelected: selected,
    }));
  }

  function handleRelatedGlossaryChange(selected) {
    setEditorState((prev) => ({
      ...prev,
      relatedGlossaryEntryIds: selected.map((item) => item.contentId),
      relatedGlossarySelected: selected,
    }));
  }

  function handleRelatedManualChange(selected) {
    setEditorState((prev) => ({
      ...prev,
      relatedManualChapterIds: selected.map((item) => item.contentId),
      relatedManualSelected: selected,
    }));
  }

  async function handleSave() {
    pendingNavigationRef.current = null;
    setShowUnsavedDialog(false);
    await saveCurrentEntry();
  }

  async function handlePublish() {
    if (!selectedEntryId) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);
    try {
      const body = editorToVariantBody(editorState);
      const saved = await saveKnowledgeBaseVariant(
        selectedEntryId,
        locale,
        editorState.category,
        editorState.difficulty,
        body,
      );
      const published = await publishKnowledgeBaseVariant(selectedEntryId, locale);
      const items = await refreshEntries(locale);
      const nextEditor = {
        ...variantToEditor(saved),
        status: published.status,
      };
      nextEditor.relatedKbSelected = enrichKbSelected(nextEditor.relatedKbEntryIds, items);
      setEditorState(nextEditor);
      setSavedState(nextEditor);
    } catch (error) {
      setErrorMessage(error.message || "Failed to publish knowledge base entry.");
    } finally {
      setIsSaving(false);
    }
  }

  const statusLabel = savedState.status === "published" ? "Published" : "Draft";

  return (
    <section className="manual-admin kb-admin" aria-label="Knowledge base management">
      <header className="manual-admin__topbar">
        <Link className="manual-admin__back-link" to={ADMIN_ROUTES.ROOT}>
          ← Back to Admin Dashboard
        </Link>
        <div className="manual-admin__topbar-actions">
          <div className="manual-admin__locale-switcher" aria-label="Content locale">
            {LOCALES.map((itemLocale) => (
              <button
                key={itemLocale}
                type="button"
                className={`manual-admin__locale-button${locale === itemLocale ? " manual-admin__locale-button--active" : ""}`}
                onClick={() => handleLocaleChange(itemLocale)}
                disabled={isSaving}
              >
                {itemLocale.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="manual-admin__publish-controls" aria-label="Save and publish controls">
            <button type="button" onClick={handleSave} disabled={!selectedEntryId || isSaving}>
              Save
            </button>
            <button type="button" onClick={handlePublish} disabled={!selectedEntryId || isSaving}>
              Publish
            </button>
          </div>
        </div>
      </header>

      {errorMessage ? <p className="manual-admin__error">{errorMessage}</p> : null}
      {isDirty ? <p className="manual-admin__status">Unsaved changes</p> : null}
      {selectedEntry ? (
        <p className="manual-admin__status">
          {statusLabel} ({locale.toUpperCase()})
        </p>
      ) : null}
      {selectedEntry && !savedState.exists && !isDirty ? (
        <p className="manual-admin__status">
          No {locale.toUpperCase()} content saved yet. Start writing, then click Save.
        </p>
      ) : null}

      <div className="manual-admin__layout">
        <aside className="manual-admin__chapters kb-admin__entries" aria-label="Knowledge base entries">
          <button
            type="button"
            className="manual-admin__add-chapter"
            onClick={handleAddEntry}
            disabled={isSaving}
          >
            Add New Entry
          </button>
          <ol className="manual-admin__chapter-list">
            {entries.map((entry) => {
              const isActive = entry.contentId === selectedEntryId;
              return (
                <li key={entry.contentId}>
                  <button
                    type="button"
                    className={`manual-admin__chapter-button${isActive ? " manual-admin__chapter-button--active" : ""}`}
                    onClick={() => handleSelectEntry(entry.contentId)}
                    disabled={isSaving}
                  >
                    {entry.title || entry.contentId}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="manual-admin__editor kb-admin__editor" aria-label="Knowledge base entry editor">
          {isLoading ? (
            <div className="manual-admin__empty">
              <p>Loading knowledge base entries...</p>
            </div>
          ) : selectedEntry ? (
            <>
              <div className="manual-admin__title-row">
                <div className="manual-admin__field manual-admin__field--title">
                  <input
                    type="text"
                    aria-label="Entry title"
                    value={editorState.title}
                    onChange={handleTitleChange}
                    disabled={isSaving}
                  />
                </div>
                <button
                  type="button"
                  className="manual-admin__delete-chapter"
                  onClick={handleDeleteEntry}
                  disabled={isSaving}
                >
                  Delete Entry
                </button>
              </div>
              <KnowledgeBaseEntryEditor
                key={`${selectedEntryId}-${locale}`}
                editorState={editorState}
                onChange={handleEditorChange}
                disabled={isSaving}
              />
              <div className="kb-admin__relationships">
                <KnowledgeBaseRelationshipPicker
                  label="Related Knowledge Base Articles"
                  selected={editorState.relatedKbSelected}
                  onChange={handleRelatedKbChange}
                  locale={locale}
                  excludeIds={[selectedEntryId]}
                  allowTypes={["kb_entry"]}
                />
                <KnowledgeBaseRelationshipPicker
                  label="Related Glossary Entries"
                  selected={editorState.relatedGlossarySelected}
                  onChange={handleRelatedGlossaryChange}
                  locale={locale}
                  excludeIds={[]}
                  allowTypes={["glossary_entry"]}
                />
                <KnowledgeBaseRelationshipPicker
                  label="Related Manual Chapters"
                  selected={editorState.relatedManualSelected}
                  onChange={handleRelatedManualChange}
                  locale={locale}
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
        </main>
      </div>

      {showUnsavedDialog ? (
        <div className="manual-admin__unsaved-overlay">
          <div
            className="manual-admin__unsaved-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kb-admin-unsaved-title"
          >
            <p id="kb-admin-unsaved-title" className="manual-admin__unsaved-message">
              You have unsaved changes.
            </p>
            <div className="manual-admin__unsaved-actions">
              <button type="button" onClick={handleUnsavedSave} disabled={isSaving}>
                Save
              </button>
              <button type="button" onClick={handleUnsavedDiscard} disabled={isSaving}>
                Discard
              </button>
              <button type="button" onClick={handleUnsavedCancel} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
