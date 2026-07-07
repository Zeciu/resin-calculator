import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../adminRoutes.js";
import {
  createManualChapter,
  deleteManualChapter,
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

const LOCALES = ["en", "ro"];

function emptyEditorState() {
  return { title: "", document: emptyDocument(), status: "draft", exists: true };
}

export default function ManualManagementPage() {
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [locale, setLocale] = useState("en");
  const [editorState, setEditorState] = useState(emptyEditorState);
  const [savedState, setSavedState] = useState(emptyEditorState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigationRef = useRef(null);

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.contentId === selectedChapterId) ?? null,
    [chapters, selectedChapterId],
  );

  const isDirty = useMemo(
    () => !editorStatesEqual(editorState, savedState),
    [editorState, savedState],
  );

  const refreshChapters = useCallback(async (nextLocale = locale) => {
    const items = await listManualChapters(nextLocale);
    setChapters(items);
    return items;
  }, [locale]);

  const loadVariant = useCallback(async (contentId, nextLocale) => {
    const variant = await getManualVariant(contentId, nextLocale);
    const nextEditor = variantToEditor(variant);
    setEditorState(nextEditor);
    setSavedState(nextEditor);
    return variant;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialChapters() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const items = await refreshChapters(locale);
        if (cancelled) {
          return;
        }
        if (items.length > 0) {
          const firstId = items[0].contentId;
          setSelectedChapterId(firstId);
          await loadVariant(firstId, locale);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message || "Failed to load manual chapters.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitialChapters();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCurrentChapter = useCallback(async () => {
    if (!selectedChapterId) {
      return false;
    }

    setErrorMessage("");
    setIsSaving(true);
    try {
      const body = editorToVariantBody(editorState.title, editorState.document);
      const saved = await saveManualVariant(selectedChapterId, locale, body);
      const nextEditor = variantToEditor(saved);
      setEditorState(nextEditor);
      setSavedState(nextEditor);
      await refreshChapters(locale);
      return true;
    } catch (error) {
      setErrorMessage(error.message || "Failed to save chapter.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [editorState, locale, refreshChapters, selectedChapterId]);

  const createNewChapter = useCallback(async () => {
    const nextTitle = window.prompt("Enter the chapter title");
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
      const created = await createManualChapter(trimmed);
      const items = await refreshChapters(locale);
      const createdItem = items.find((item) => item.contentId === created.contentId) ?? created;
      setSelectedChapterId(createdItem.contentId);
      await loadVariant(createdItem.contentId, locale);
    } catch (error) {
      setErrorMessage(error.message || "Failed to create chapter.");
    } finally {
      setIsSaving(false);
    }
  }, [loadVariant, locale, refreshChapters]);

  const deleteSelectedChapter = useCallback(async () => {
    if (!selectedChapterId) {
      return;
    }

    const chapterTitle = editorState.title.trim() || selectedChapter?.title || "this chapter";
    const confirmed = window.confirm(`Delete "${chapterTitle}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    const deletedChapterId = selectedChapterId;
    setErrorMessage("");
    setIsSaving(true);
    try {
      await deleteManualChapter(deletedChapterId);
      const items = await refreshChapters(locale);
      if (items.length > 0) {
        const nextChapter = items.find((item) => item.contentId !== deletedChapterId) ?? items[0];
        setSelectedChapterId(nextChapter.contentId);
        await loadVariant(nextChapter.contentId, locale);
      } else {
        setSelectedChapterId(null);
        setEditorState(emptyEditorState());
        setSavedState(emptyEditorState());
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete chapter.");
    } finally {
      setIsSaving(false);
    }
  }, [editorState.title, loadVariant, locale, refreshChapters, selectedChapter, selectedChapterId]);

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
    const saved = await saveCurrentChapter();
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

  async function handleAddChapter() {
    if (isDirty) {
      pendingNavigationRef.current = createNewChapter;
      setShowUnsavedDialog(true);
      return;
    }
    await createNewChapter();
  }

  async function handleDeleteChapter() {
    if (!selectedChapterId) {
      return;
    }
    if (isDirty) {
      pendingNavigationRef.current = deleteSelectedChapter;
      setShowUnsavedDialog(true);
      return;
    }
    await deleteSelectedChapter();
  }

  async function handleSelectChapter(contentId) {
    if (contentId === selectedChapterId) {
      return;
    }

    requestNavigation(async () => {
      setErrorMessage("");
      setIsSaving(true);
      try {
        setSelectedChapterId(contentId);
        await loadVariant(contentId, locale);
      } catch (error) {
        setErrorMessage(error.message || "Failed to load chapter.");
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
        await refreshChapters(nextLocale);
        if (selectedChapterId) {
          await loadVariant(selectedChapterId, nextLocale);
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

  function handleChapterTitleChange(event) {
    setEditorState((prev) => ({ ...prev, title: event.target.value }));
  }

  function handleDocumentChange(document) {
    setEditorState((prev) => ({ ...prev, document }));
  }

  async function handleSave() {
    pendingNavigationRef.current = null;
    setShowUnsavedDialog(false);
    await saveCurrentChapter();
  }

  async function handlePublish() {
    if (!selectedChapterId) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);
    try {
      const body = editorToVariantBody(editorState.title, editorState.document);
      const saved = await saveManualVariant(selectedChapterId, locale, body);
      const published = await publishManualVariant(selectedChapterId, locale);
      const nextEditor = {
        ...variantToEditor(saved),
        status: published.status,
      };
      setEditorState(nextEditor);
      setSavedState(nextEditor);
      await refreshChapters(locale);
    } catch (error) {
      setErrorMessage(error.message || "Failed to publish chapter.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="manual-admin" aria-label="Manual management">
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
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedChapterId || isSaving}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={!selectedChapterId || isSaving}
            >
              Publish
            </button>
          </div>
        </div>
      </header>

      {errorMessage ? <p className="manual-admin__error">{errorMessage}</p> : null}
      {isDirty ? <p className="manual-admin__status">Unsaved changes</p> : null}
      {selectedChapter && savedState.status === "published" ? (
        <p className="manual-admin__status">Published ({locale.toUpperCase()})</p>
      ) : null}
      {selectedChapter && !savedState.exists && !isDirty ? (
        <p className="manual-admin__status">
          No {locale.toUpperCase()} content saved yet. Start writing, then click Save.
        </p>
      ) : null}

      <div className="manual-admin__layout">
        <aside className="manual-admin__chapters" aria-label="Manual chapters">
          <button
            type="button"
            className="manual-admin__add-chapter"
            onClick={handleAddChapter}
            disabled={isSaving}
          >
            Add New Chapter
          </button>
          <ol className="manual-admin__chapter-list">
            {chapters.map((chapter) => {
              const isActive = chapter.contentId === selectedChapterId;
              return (
                <li key={chapter.contentId}>
                  <button
                    type="button"
                    className={`manual-admin__chapter-button${isActive ? " manual-admin__chapter-button--active" : ""}`}
                    onClick={() => handleSelectChapter(chapter.contentId)}
                    disabled={isSaving}
                  >
                    {chapter.title}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="manual-admin__editor" aria-label="Manual chapter editor">
          {isLoading ? (
            <div className="manual-admin__empty">
              <p>Loading manual chapters...</p>
            </div>
          ) : selectedChapter ? (
            <>
              <div className="manual-admin__title-row">
                <div className="manual-admin__field manual-admin__field--title">
                  <input
                    type="text"
                    aria-label="Chapter title"
                    value={editorState.title}
                    onChange={handleChapterTitleChange}
                  />
                </div>
                <button
                  type="button"
                  className="manual-admin__delete-chapter"
                  onClick={handleDeleteChapter}
                  disabled={isSaving}
                >
                  Delete Chapter
                </button>
              </div>
              <div className="manual-admin__field manual-admin__field--editor">
                <ManualChapterEditor
                  key={`${selectedChapterId}-${locale}`}
                  document={editorState.document}
                  onDocumentChange={handleDocumentChange}
                  disabled={isSaving}
                />
              </div>
            </>
          ) : (
            <div className="manual-admin__empty">
              <h2>Manual chapter editor</h2>
              <p>
                Add a chapter to begin writing. Each chapter is edited as one
                complete document.
              </p>
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
            aria-labelledby="manual-admin-unsaved-title"
          >
            <p id="manual-admin-unsaved-title" className="manual-admin__unsaved-message">
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
