import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router-dom";
import ResinCalculator from "../calculator/ResinCalculator.jsx";
import QuickPreferences from "../preferences/QuickPreferences.jsx";
import SaveProjectDialog from "./SaveProjectDialog.jsx";
import UnsavedChangesDialog from "./UnsavedChangesDialog.jsx";
import {
  canUpdateCurrentProjectInPlace,
  createNewCurrentProject,
  createOpenedCurrentProject,
} from "./currentProject.js";
import { getRecentProjectHandle } from "./recentProjectHandles.js";
import {
  ProjectFileSaveCancelledError,
  ProjectFileSaveError,
  saveProjectFile,
  updateProjectFile,
} from "./projectFileSave.js";
import {
  recordSavedProjectInRecentIndex,
  recordUpdatedProjectInRecentIndex,
} from "./projectFileOpen.js";
import { areProjectSnapshotsEqual } from "./projectSnapshotCompare.js";
import { ROUTES } from "./routes.js";

export default function NewProjectWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const calculatorRef = useRef(null);
  const [currentProject, setCurrentProject] = useState(createNewCurrentProject);
  const [isProjectDirty, setIsProjectDirty] = useState(false);
  const [calculatorSessionKey, setCalculatorSessionKey] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingProjectRestore, setPendingProjectRestore] = useState(null);
  const [baselineCaptureKey, setBaselineCaptureKey] = useState(0);
  const isProjectDirtyRef = useRef(isProjectDirty);
  const baselineSnapshotRef = useRef(null);
  const usesBaselineDirtyRef = useRef(false);
  const pendingOpenContextRef = useRef(null);
  const currentProjectRef = useRef(currentProject);

  isProjectDirtyRef.current = isProjectDirty;
  currentProjectRef.current = currentProject;

  useEffect(() => {
    const project = location.state?.pendingProjectRestore;
    if (!project) {
      return;
    }

    pendingOpenContextRef.current = location.state?.openContext ?? null;
    setPendingProjectRestore(project);
    navigate(ROUTES.NEW_PROJECT, { replace: true, state: {} });
  }, [location.state, navigate]);

  const establishOpenedProjectContext = useCallback(async (openContext) => {
    const handle = await getRecentProjectHandle(openContext.recentEntryId);
    setCurrentProject(
      createOpenedCurrentProject({
        recentEntryId: openContext.recentEntryId,
        projectName: openContext.projectName,
        lastKnownFileName: openContext.lastKnownFileName,
        fileHandle: handle,
      }),
    );
  }, []);

  const handleProjectRestored = useCallback(async () => {
    const openContext = pendingOpenContextRef.current;

    if (openContext?.recentEntryId) {
      usesBaselineDirtyRef.current = true;
      baselineSnapshotRef.current = null;
      isProjectDirtyRef.current = false;
      setIsProjectDirty(false);
      await establishOpenedProjectContext(openContext);
      pendingOpenContextRef.current = null;
      setBaselineCaptureKey((key) => key + 1);
      return;
    }

    usesBaselineDirtyRef.current = false;
    baselineSnapshotRef.current = null;
  }, [establishOpenedProjectContext]);

  useEffect(() => {
    if (!usesBaselineDirtyRef.current || !calculatorRef.current) {
      return;
    }

    baselineSnapshotRef.current = calculatorRef.current.getProjectSnapshot();
    isProjectDirtyRef.current = false;
    setIsProjectDirty(false);
  }, [baselineCaptureKey, calculatorSessionKey]);

  useLayoutEffect(() => {
    if (!pendingProjectRestore || !calculatorRef.current) {
      return;
    }

    calculatorRef.current.restoreProjectSnapshot(pendingProjectRestore);
    setPendingProjectRestore(null);
  }, [pendingProjectRestore, calculatorSessionKey]);

  const handleDirtyChange = useCallback((calculatorDirty) => {
    if (usesBaselineDirtyRef.current && calculatorRef.current) {
      if (!baselineSnapshotRef.current) {
        isProjectDirtyRef.current = false;
        setIsProjectDirty(false);
        return;
      }

      const currentSnapshot = calculatorRef.current.getProjectSnapshot();
      const dirty = !areProjectSnapshotsEqual(baselineSnapshotRef.current, currentSnapshot);
      isProjectDirtyRef.current = dirty;
      setIsProjectDirty(dirty);
      return;
    }

    isProjectDirtyRef.current = calculatorDirty;
    setIsProjectDirty(calculatorDirty);
  }, []);

  const completeSuccessfulSave = useCallback(
    (snapshot) => {
      if (usesBaselineDirtyRef.current && snapshot) {
        baselineSnapshotRef.current = snapshot;
      }
      isProjectDirtyRef.current = false;
      setIsProjectDirty(false);
      setShowSaveDialog(false);
      setSaveError("");
      navigate(ROUTES.HOME);
    },
    [navigate],
  );

  const performInPlaceSave = useCallback(async () => {
    const calculator = calculatorRef.current;
    const project = currentProjectRef.current;
    if (!calculator || !canUpdateCurrentProjectInPlace(project)) {
      return false;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const snapshot = calculator.getProjectSnapshot();
      const saveResult = await updateProjectFile({
        fileHandle: project.fileHandle,
        projectName: project.projectName,
        snapshot,
        fileName: project.lastKnownFileName,
      });

      await recordUpdatedProjectInRecentIndex({
        entryId: project.recentEntryId,
        payload: saveResult.payload,
        fileName: saveResult.fileName,
        fileHandle: project.fileHandle,
      });

      completeSuccessfulSave(snapshot);
      return true;
    } catch (error) {
      const message =
        error instanceof ProjectFileSaveError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Could not update project file.";

      setSaveError(message);
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [completeSuccessfulSave]);

  const openSaveProjectDialog = useCallback(() => {
    setSaveError("");
    setShowSaveDialog(true);
  }, []);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isProjectDirtyRef.current &&
      currentLocation.pathname === ROUTES.NEW_PROJECT &&
      nextLocation.pathname !== ROUTES.NEW_PROJECT,
  );

  const handleSaveProjectRequest = useCallback(async () => {
    setShowUnsavedDialog(false);

    if (canUpdateCurrentProjectInPlace(currentProjectRef.current)) {
      await performInPlaceSave();
      if (blocker.state === "blocked" && !isProjectDirtyRef.current) {
        blocker.proceed();
      } else if (blocker.state === "blocked") {
        blocker.reset();
      }
      return;
    }

    openSaveProjectDialog();
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker, openSaveProjectDialog, performInPlaceSave]);

  const saveProjectRequestRef = useRef(handleSaveProjectRequest);
  saveProjectRequestRef.current = handleSaveProjectRequest;

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowUnsavedDialog(true);
    }
  }, [blocker.state]);

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedDialog(false);
    usesBaselineDirtyRef.current = false;
    baselineSnapshotRef.current = null;
    pendingOpenContextRef.current = null;
    setCurrentProject(createNewCurrentProject());
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
        const saveResult = await saveProjectFile({ projectName, snapshot });

        await recordSavedProjectInRecentIndex({
          payload: saveResult.payload,
          fileName: saveResult.fileName,
          fileHandle: saveResult.fileHandle,
        });

        completeSuccessfulSave(snapshot);
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
    [completeSuccessfulSave],
  );

  const handleCalculatorSaveProjectRequest = useCallback(() => {
    void saveProjectRequestRef.current();
  }, []);

  return (
    <div className="new-project-workspace">
      <QuickPreferences variant="workspace" />
      {saveError && !showSaveDialog ? (
        <p className="new-project-workspace__save-error" role="alert">
          {saveError}
        </p>
      ) : null}
      <ResinCalculator
        ref={calculatorRef}
        key={calculatorSessionKey}
        showHeader={false}
        workspaceVariant="dedicated"
        onDirtyChange={handleDirtyChange}
        onProjectRestored={handleProjectRestored}
        onSaveProjectRequest={handleCalculatorSaveProjectRequest}
      />
      {showUnsavedDialog ? (
        <UnsavedChangesDialog
          onSaveProject={() => {
            void saveProjectRequestRef.current();
          }}
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
