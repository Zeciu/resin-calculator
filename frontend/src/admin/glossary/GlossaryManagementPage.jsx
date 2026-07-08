import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../adminRoutes.js";
import {
  createGlossaryEntry,
  deleteGlossaryEntry,
  getGlossaryVariant,
  listGlossaryEntries,
  publishGlossaryVariant,
  saveGlossaryVariant,
} from "./glossaryAdminApi.js";
import GlossaryEntryEditor from "./GlossaryEntryEditor.jsx";
import RelationshipPicker from "./RelationshipPicker.jsx";
import {
  editorStatesEqual,
  editorToVariantBody,
  emptyEditorState,
  variantToEditor,
} from "./glossaryEditorAdapter.js";

const LOCALES = ["en", "ro"];

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
    const items = await listGlossaryEntries(nextLocale);
    setEntries(items);
    return items;
  }, [locale]);

  const loadVariant = useCallback(async (contentId, nextLocale) => {
    const variant = await getGlossaryVariant(contentId, nextLocale);
    const nextEditor = variantToEditor(variant);
    setEditorState(nextEditor);
    setSavedState(nextEditor);
    return variant;
  }, []);

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
          await loadVariant(firstId, locale);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message || "Failed to load glossary entries.");
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
      const saved = await saveGlossaryVariant(selectedEntryId, locale, body);
      const nextEditor = variantToEditor(saved);
      setEditorState(nextEditor);
      setSavedState(nextEditor);
      await refreshEntries(locale);
      return true;
    } catch (error) {
      setErrorMessage(error.message || "Failed to save glossary entry.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [editorState, locale, refreshEntries, selectedEntryId]);

  const createNewEntry = useCallback(async () => {
    const nextTerm = window.prompt("Enter the glossary term");
    if (typeof nextTerm !== "string") {
      return;
    }
    const trimmed = nextTerm.trim();
    if (!trimmed) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);
    try {
      const created = await createGlossaryEntry(trimmed);
      const items = await refreshEntries(locale);
      const createdItem = items.find((item) => item.contentId === created.contentId) ?? created;
      setSelectedEntryId(createdItem.contentId);
      await loadVariant(createdItem.contentId, locale);
    } catch (error) {
      setErrorMessage(error.message || "Failed to create glossary entry.");
    } finally {
      setIsSaving(false);
    }
  }, [loadVariant, locale, refreshEntries]);

  const deleteSelectedEntry = useCallback(async () => {
    if (!selectedEntryId) {
      return;
    }

    const entryTerm = editorState.term.trim() || selectedEntry?.term || "this entry";
    const confirmed = window.confirm(`Delete "${entryTerm}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    const deletedEntryId = selectedEntryId;
    setErrorMessage("");
    setIsSaving(true);
    try {
      await deleteGlossaryEntry(deletedEntryId);
      const items = await refreshEntries(locale);
      if (items.length > 0) {
        const nextEntry = items.find((item) => item.contentId !== deletedEntryId) ?? items[0];
        setSelectedEntryId(nextEntry.contentId);
        await loadVariant(nextEntry.contentId, locale);
      } else {
        setSelectedEntryId(null);
        setEditorState(emptyEditorState());
        setSavedState(emptyEditorState());
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete glossary entry.");
    } finally {
      setIsSaving(false);
    }
  }, [editorState.term, loadVariant, locale, refreshEntries, selectedEntry, selectedEntryId]);

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
        await loadVariant(contentId, locale);
      } catch (error) {
        setErrorMessage(error.message || "Failed to load glossary entry.");
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
        await refreshEntries(nextLocale);
        if (selectedEntryId) {
          await loadVariant(selectedEntryId, nextLocale);
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

  function handleTermChange(event) {
    setEditorState((prev) => ({ ...prev, term: event.target.value }));
  }

  function handleDocumentChange(document) {
    setEditorState((prev) => ({ ...prev, document }));
  }

  function handleMediaChange(media) {
    setEditorState((prev) => ({ ...prev, media }));
  }

  function handleRelatedTermsChange(selected) {
    setEditorState((prev) => ({
      ...prev,
      relatedTermIds: selected.map((item) => item.contentId),
      relatedTermsSelected: selected,
    }));
  }

  function handleSynonymsChange(selected) {
    setEditorState((prev) => ({
      ...prev,
      synonymTermIds: selected.map((item) => item.contentId),
      synonymsSelected: selected,
    }));
  }

  function handleSeeAlsoChange(selected) {
    setEditorState((prev) => ({ ...prev, seeAlso: selected }));
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
      const saved = await saveGlossaryVariant(selectedEntryId, locale, body);
      const published = await publishGlossaryVariant(selectedEntryId, locale);
      const nextEditor = {
        ...variantToEditor(saved),
        status: published.status,
      };
      setEditorState(nextEditor);
      setSavedState(nextEditor);
      await refreshEntries(locale);
    } catch (error) {
      setErrorMessage(error.message || "Failed to publish glossary entry.");
    } finally {
      setIsSaving(false);
    }
  }

  const relatedSelected = useMemo(
    () => idsToSelected(editorState.relatedTermIds, entries),
    [editorState.relatedTermIds, entries],
  );

  const synonymSelected = useMemo(
    () => idsToSelected(editorState.synonymTermIds, entries),
    [editorState.synonymTermIds, entries],
  );

  const statusLabel = savedState.status === "published" ? "Published" : "Draft";

  return (
    <section className="manual-admin glossary-admin" aria-label="Glossary management">
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
        <aside className="manual-admin__chapters glossary-admin__entries" aria-label="Glossary entries">
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
                    {entry.term || entry.contentId}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="manual-admin__editor glossary-admin__editor" aria-label="Glossary entry editor">
          {isLoading ? (
            <div className="manual-admin__empty">
              <p>Loading glossary entries...</p>
            </div>
          ) : selectedEntry ? (
            <>
              <div className="manual-admin__title-row">
                <div className="manual-admin__field manual-admin__field--title">
                  <input
                    type="text"
                    aria-label="Glossary term"
                    value={editorState.term}
                    onChange={handleTermChange}
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
              <div className="manual-admin__field manual-admin__field--editor">
                <GlossaryEntryEditor
                  key={`${selectedEntryId}-${locale}`}
                  document={editorState.document}
                  onDocumentChange={handleDocumentChange}
                  media={editorState.media}
                  onMediaChange={handleMediaChange}
                  disabled={isSaving}
                />
              </div>
              <div className="glossary-admin__relationships">
                <RelationshipPicker
                  label="Related terms"
                  selected={relatedSelected}
                  onChange={handleRelatedTermsChange}
                  locale={locale}
                  excludeIds={[selectedEntryId]}
                  allowTypes={["glossary_entry"]}
                />
                <RelationshipPicker
                  label="Synonyms"
                  selected={synonymSelected}
                  onChange={handleSynonymsChange}
                  locale={locale}
                  excludeIds={[selectedEntryId]}
                  allowTypes={["glossary_entry"]}
                />
                <RelationshipPicker
                  label="See also"
                  selected={editorState.seeAlso}
                  onChange={handleSeeAlsoChange}
                  locale={locale}
                  excludeIds={[selectedEntryId]}
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
        </main>
      </div>

      {showUnsavedDialog ? (
        <div className="manual-admin__unsaved-overlay">
          <div
            className="manual-admin__unsaved-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="glossary-admin-unsaved-title"
          >
            <p id="glossary-admin-unsaved-title" className="manual-admin__unsaved-message">
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
