import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import ResinCalculator from "../calculator/ResinCalculator.jsx";
import SaveProjectDialog from "./SaveProjectDialog.jsx";
import UnsavedChangesDialog from "./UnsavedChangesDialog.jsx";
import {
  ProjectFileSaveCancelledError,
  ProjectFileSaveError,
  saveProjectFile,
} from "./projectFileSave.js";
import { ROUTES } from "./routes.js";

export default function NewProjectWorkspace() {
  const navigate = useNavigate();
  const calculatorRef = useRef(null);
  const [isProjectDirty, setIsProjectDirty] = useState(false);
  const [calculatorSessionKey, setCalculatorSessionKey] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isProjectDirtyRef = useRef(isProjectDirty);

  isProjectDirtyRef.current = isProjectDirty;

  const openSaveProjectDialog = useCallback(() => {
    setSaveError("");
    setShowSaveDialog(true);
  }, []);

  const saveProjectRequestRef = useRef(openSaveProjectDialog);
  saveProjectRequestRef.current = openSaveProjectDialog;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isProjectDirtyRef.current &&
      currentLocation.pathname === ROUTES.NEW_PROJECT &&
      nextLocation.pathname !== ROUTES.NEW_PROJECT,
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowUnsavedDialog(true);
    }
  }, [blocker.state]);

  const handleSaveProjectRequested = useCallback(() => {
    setShowUnsavedDialog(false);
    saveProjectRequestRef.current();
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedDialog(false);
    isProjectDirtyRef.current = false;
    setIsProjectDirty(false);
    setCalculatorSessionKey((key) => key + 1);
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  }, [blocker]);

  const handleCancel = useCallback(() => {
    setShowUnsavedDialog(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  const handleSaveDialogCancel = useCallback(() => {
    if (isSaving) {
      return;
    }

    setShowSaveDialog(false);
    setSaveError("");
  }, [isSaving]);

  const handleSaveProjectConfirm = useCallback(
    async (projectName) => {
      const calculator = calculatorRef.current;
      if (!calculator) {
        return;
      }

      setIsSaving(true);
      setSaveError("");

      try {
        const snapshot = calculator.getProjectSnapshot();
        await saveProjectFile({ projectName, snapshot });

        isProjectDirtyRef.current = false;
        setShowSaveDialog(false);
        setIsProjectDirty(false);
        navigate(ROUTES.HOME);
      } catch (error) {
        if (error instanceof ProjectFileSaveCancelledError) {
          return;
        }

        const message =
          error instanceof ProjectFileSaveError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Could not save project file.";

        setSaveError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [navigate],
  );

  return (
    <div className="new-project-workspace">
      <ResinCalculator
        ref={calculatorRef}
        key={calculatorSessionKey}
        showHeader={false}
        workspaceVariant="dedicated"
        onDirtyChange={setIsProjectDirty}
        onSaveProjectRequest={openSaveProjectDialog}
      />
      {showUnsavedDialog ? (
        <UnsavedChangesDialog
          onSaveProject={handleSaveProjectRequested}
          onDiscardChanges={handleDiscardChanges}
          onCancel={handleCancel}
        />
      ) : null}
      {showSaveDialog ? (
        <SaveProjectDialog
          error={saveError}
          isSaving={isSaving}
          onCancel={handleSaveDialogCancel}
          onSave={handleSaveProjectConfirm}
        />
      ) : null}
    </div>
  );
}
