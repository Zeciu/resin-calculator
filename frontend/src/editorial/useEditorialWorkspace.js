import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Shared editorial workspace state machine for admin content modules.
 *
 * @template TEditor
 * @param {{
 *   listItems: () => Promise<Array<{ contentId: string }>>;
 *   getItemLabel: (item: { contentId: string }) => string;
 *   loadVariant: (contentId: string, locale: string) => Promise<unknown>;
 *   saveItem: (contentId: string, locale: string, editorState: TEditor) => Promise<unknown>;
 *   publishItem: (contentId: string, locale: string, editorState: TEditor) => Promise<unknown>;
 *   createItem: (promptValue: string) => Promise<{ contentId: string }>;
 *   deleteItem: (contentId: string) => Promise<void>;
 *   createPromptLabel: string;
 *   variantToEditor: (variant: unknown) => TEditor;
 *   applySavedVariant: (variant: unknown, editorState: TEditor) => TEditor;
 *   editorStatesEqual: (left: TEditor, right: TEditor) => boolean;
 *   emptyEditorState: () => TEditor;
 *   getDeleteLabel: (editorState: TEditor, selectedItem: { contentId: string } | null, items: Array<{ contentId: string }>) => string;
 *   messages?: {
 *     loadList?: string;
 *     loadVariant?: string;
 *     save?: string;
 *     publish?: string;
 *     create?: string;
 *     delete?: string;
 *   };
 * }} config
 */
export function useEditorialWorkspace(config) {
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [locale, setLocale] = useState("en");
  const [editorState, setEditorState] = useState(config.emptyEditorState);
  const [savedState, setSavedState] = useState(config.emptyEditorState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigationRef = useRef(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.contentId === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const isDirty = useMemo(
    () => !config.editorStatesEqual(editorState, savedState),
    [config, editorState, savedState],
  );

  const refreshItems = useCallback(async (nextLocale = locale) => {
    const nextItems = await config.listItems(nextLocale);
    setItems(nextItems);
    return nextItems;
  }, [config, locale]);

  const loadVariant = useCallback(
    async (contentId, nextLocale) => {
      const variant = await config.loadVariant(contentId, nextLocale);
      let nextEditor = config.variantToEditor(variant);
      if (config.transformEditor) {
        const nextItems = items.length > 0 ? items : await refreshItems(nextLocale);
        nextEditor = config.transformEditor(nextEditor, { items: nextItems, variant });
      }
      setEditorState(nextEditor);
      setSavedState(nextEditor);
      return variant;
    },
    [config, items, refreshItems],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const nextItems = await refreshItems();
        if (cancelled) {
          return;
        }
        if (nextItems.length > 0) {
          const firstId = nextItems[0].contentId;
          setSelectedItemId(firstId);
          await loadVariant(firstId, locale);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message || config.messages?.loadList || "Failed to load content.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCurrentItem = useCallback(async () => {
    if (!selectedItemId) {
      return false;
    }

    setErrorMessage("");
    setIsSaving(true);
    try {
      const saved = await config.saveItem(selectedItemId, locale, editorState);
      let nextEditor = config.applySavedVariant(saved, editorState);
      if (config.transformEditor) {
        const nextItems = await refreshItems(locale);
        nextEditor = config.transformEditor(nextEditor, { items: nextItems, variant: saved });
      }
      setEditorState(nextEditor);
      setSavedState(nextEditor);
      await refreshItems();
      return true;
    } catch (error) {
      setErrorMessage(error.message || config.messages?.save || "Failed to save draft.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [config, editorState, locale, refreshItems, selectedItemId]);

  const createNewItem = useCallback(async () => {
    const promptValue = window.prompt(config.createPromptLabel);
    if (typeof promptValue !== "string") {
      return;
    }
    const trimmed = promptValue.trim();
    if (!trimmed) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);
    try {
      const created = await config.createItem(trimmed, locale);
      const nextItems = await refreshItems();
      const createdItem = nextItems.find((item) => item.contentId === created.contentId) ?? created;
      setSelectedItemId(createdItem.contentId);
      await loadVariant(createdItem.contentId, locale);
    } catch (error) {
      setErrorMessage(error.message || config.messages?.create || "Failed to create item.");
    } finally {
      setIsSaving(false);
    }
  }, [config, loadVariant, locale, refreshItems]);

  const deleteSelectedItem = useCallback(async () => {
    if (!selectedItemId) {
      return;
    }

    const deleteLabel = config.getDeleteLabel(editorState, selectedItem, items);
    const confirmMessage = config.getDeleteConfirmMessage
      ? config.getDeleteConfirmMessage(deleteLabel)
      : `Delete "${deleteLabel}"? This cannot be undone.`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return;
    }

    const deletedItemId = selectedItemId;
    setErrorMessage("");
    setIsSaving(true);
    try {
      await config.deleteItem(deletedItemId);
      const nextItems = await refreshItems();
      if (nextItems.length > 0) {
        const nextItem = nextItems.find((item) => item.contentId !== deletedItemId) ?? nextItems[0];
        setSelectedItemId(nextItem.contentId);
        await loadVariant(nextItem.contentId, locale);
      } else {
        setSelectedItemId(null);
        const empty = config.emptyEditorState();
        setEditorState(empty);
        setSavedState(empty);
      }
    } catch (error) {
      setErrorMessage(error.message || config.messages?.delete || "Failed to delete item.");
    } finally {
      setIsSaving(false);
    }
  }, [config, editorState, items, loadVariant, locale, refreshItems, selectedItem, selectedItemId]);

  const continuePendingNavigation = useCallback(async () => {
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setShowUnsavedDialog(false);
    if (action) {
      await action();
    }
  }, []);

  const requestNavigation = useCallback(
    (action) => {
      if (!isDirty) {
        void action();
        return;
      }
      pendingNavigationRef.current = action;
      setShowUnsavedDialog(true);
    },
    [isDirty],
  );

  const handleUnsavedSave = useCallback(async () => {
    const saved = await saveCurrentItem();
    if (!saved) {
      return;
    }
    await continuePendingNavigation();
  }, [continuePendingNavigation, saveCurrentItem]);

  const handleUnsavedDiscard = useCallback(() => {
    setEditorState(savedState);
    void continuePendingNavigation();
  }, [continuePendingNavigation, savedState]);

  const handleUnsavedCancel = useCallback(() => {
    pendingNavigationRef.current = null;
    setShowUnsavedDialog(false);
  }, []);

  const handleAddItem = useCallback(async () => {
    if (isDirty) {
      pendingNavigationRef.current = createNewItem;
      setShowUnsavedDialog(true);
      return;
    }
    await createNewItem();
  }, [createNewItem, isDirty]);

  const handleDeleteItem = useCallback(async () => {
    if (!selectedItemId) {
      return;
    }
    if (isDirty) {
      pendingNavigationRef.current = deleteSelectedItem;
      setShowUnsavedDialog(true);
      return;
    }
    await deleteSelectedItem();
  }, [deleteSelectedItem, isDirty, selectedItemId]);

  const handleSelectItem = useCallback(
    (contentId) => {
      if (contentId === selectedItemId) {
        return;
      }

      requestNavigation(async () => {
        setErrorMessage("");
        setIsSaving(true);
        try {
          setSelectedItemId(contentId);
          await loadVariant(contentId, locale);
        } catch (error) {
          setErrorMessage(error.message || config.messages?.loadVariant || "Failed to load item.");
        } finally {
          setIsSaving(false);
        }
      });
    },
    [config.messages?.loadVariant, loadVariant, locale, requestNavigation, selectedItemId],
  );

  const handleLocaleChange = useCallback(
    (nextLocale) => {
      if (nextLocale === locale) {
        return;
      }

      requestNavigation(async () => {
        setErrorMessage("");
        setLocale(nextLocale);
        setIsSaving(true);
        try {
          await refreshItems(nextLocale);
          if (selectedItemId) {
            await loadVariant(selectedItemId, nextLocale);
          } else {
            const empty = config.emptyEditorState();
            setEditorState(empty);
            setSavedState(empty);
          }
        } catch (error) {
          setErrorMessage(error.message || config.messages?.loadVariant || "Failed to load locale variant.");
        } finally {
          setIsSaving(false);
        }
      });
    },
    [config, loadVariant, locale, refreshItems, requestNavigation, selectedItemId],
  );

  const handleSaveDraft = useCallback(async () => {
    pendingNavigationRef.current = null;
    setShowUnsavedDialog(false);
    await saveCurrentItem();
  }, [saveCurrentItem]);

  const handlePublish = useCallback(async () => {
    if (!selectedItemId) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);
    try {
      await config.saveItem(selectedItemId, locale, editorState);
      await config.publishItem(selectedItemId, locale, editorState);
      await loadVariant(selectedItemId, locale);
      await refreshItems();
    } catch (error) {
      setErrorMessage(error.message || config.messages?.publish || "Failed to publish.");
    } finally {
      setIsSaving(false);
    }
  }, [config, editorState, loadVariant, locale, refreshItems, selectedItemId]);

  const sidebarItems = useMemo(
    () => items.map((item) => ({ contentId: item.contentId, label: config.getItemLabel(item) })),
    [config, items],
  );

  return {
    items,
    selectedItem,
    selectedItemId,
    locale,
    editorState,
    setEditorState,
    savedState,
    isLoading,
    isSaving,
    isDirty,
    errorMessage,
    showUnsavedDialog,
    sidebarItems,
    handleAddItem,
    handleDeleteItem,
    handleSelectItem,
    handleLocaleChange,
    handleSaveDraft,
    handlePublish,
    handleUnsavedSave,
    handleUnsavedDiscard,
    handleUnsavedCancel,
  };
}
