import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import ResinCalculator from "../calculator/ResinCalculator.jsx";
import QuickPreferences from "../preferences/QuickPreferences.jsx";
import SaveProjectDialog from "./SaveProjectDialog.jsx";
import UnsavedChangesDialog from "./UnsavedChangesDialog.jsx";
import {
  canUpdateCurrentProjectInPlace,
  createNewCurrentProject,
  createOpenedCurrentProject,
  CURRENT_PROJECT_KIND,
} from "./currentProject.js";
import {
  assertCurrentProjectWritable,
  isCurrentProjectReadOnly,
  PROJECT_READ_ONLY_NOTICE_MESSAGE,
  PROJECT_WRITE_FORBIDDEN_MESSAGE,
  resolveProjectOwnershipMode,
} from "../project/projectOwnership.js";
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
import { useCapabilities } from "../capabilities/CapabilitiesContext.jsx";

export default function NewProjectWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const calculatorRef = useRef(null);
  const [currentProject, setCurrentProject] = useState(createNewCurrentProject);
  const [isProjectDirty, setIsProjectDirty] = useState(false);
  const [calculatorSessionKey, setCalculatorSessionKey] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingProjectRestore, setPendingProjectRestore] = useState(null);
  const [calculatorSessionEstablished, setCalculatorSessionEstablished] = useState(
    () => currentProject.kind === CURRENT_PROJECT_KIND.OPENED,
  );
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

  const establishOpenedProjectContext = useCallback(
    async (openContext) => {
      const handle = openContext.recentEntryId
        ? await getRecentProjectHandle(openContext.recentEntryId)
        : null;
      const ownershipMode = resolveProjectOwnershipMode(user, openContext.persistedLifecycle);
      setCurrentProject(
        createOpenedCurrentProject({
          recentEntryId: openContext.recentEntryId ?? null,
          projectName: openContext.projectName,
          lastKnownFileName: openContext.lastKnownFileName,
          fileHandle: handle,
          persistedLifecycle: openContext.persistedLifecycle ?? null,
          ownershipMode,
        }),
      );
    },
    [user],
  );

  const handleProjectRestored = useCallback(async () => {
    setCalculatorSessionEstablished(true);
    const openContext = pendingOpenContextRef.current;

    if (openContext?.persistedLifecycle) {
      usesBaselineDirtyRef.current = Boolean(openContext.recentEntryId);
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

    try {
      assertCurrentProjectWritable(project);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : PROJECT_WRITE_FORBIDDEN_MESSAGE);
      return true;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const snapshot = calculator.getProjectSnapshot();
      const saveResult = await updateProjectFile({
        fileHandle: project.fileHandle,
        projectName: project.projectName,
        snapshot,
        user,
        persistedLifecycle: project.persistedLifecycle,
        fileName: project.lastKnownFileName,
        ownershipMode: project.ownershipMode,
      });

      await recordUpdatedProjectInRecentIndex({
        entryId: project.recentEntryId,
        payload: saveResult.payload,
        fileName: saveResult.fileName,
        fileHandle: project.fileHandle,
      });

      setCurrentProject((previous) => ({
        ...previous,
        persistedLifecycle: saveResult.persistedLifecycle,
      }));

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
  }, [completeSuccessfulSave, user]);

  const openSaveProjectDialog = useCallback(() => {
    if (isCurrentProjectReadOnly(currentProjectRef.current)) {
      setSaveError(PROJECT_WRITE_FORBIDDEN_MESSAGE);
      return;
    }

    setSaveError("");
    setShowSaveDialog(true);
  }, []);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isProjectDirtyRef.current &&
      !isCurrentProjectReadOnly(currentProjectRef.current) &&
      currentLocation.pathname === ROUTES.NEW_PROJECT &&
      nextLocation.pathname !== ROUTES.NEW_PROJECT,
  );

  const handleSaveProjectRequest = useCallback(async () => {
    if (isCurrentProjectReadOnly(currentProjectRef.current)) {
      setSaveError(PROJECT_WRITE_FORBIDDEN_MESSAGE);
      return;
    }

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
    setCalculatorSessionEstablished(false);
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

      try {
        assertCurrentProjectWritable(currentProjectRef.current);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : PROJECT_WRITE_FORBIDDEN_MESSAGE);
        return;
      }

      setIsSaving(true);
      setSaveError("");

      try {
        const snapshot = calculator.getProjectSnapshot();
        const saveResult = await saveProjectFile({
          projectName,
          snapshot,
          user,
          ownershipMode: currentProjectRef.current?.ownershipMode ?? null,
        });

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
    [completeSuccessfulSave, user],
  );

  const handleCalculatorSaveProjectRequest = useCallback(() => {
    if (isCurrentProjectReadOnly(currentProjectRef.current)) {
      setSaveError(PROJECT_WRITE_FORBIDDEN_MESSAGE);
      return;
    }

    void saveProjectRequestRef.current();
  }, []);

  const isReadOnlyProject = isCurrentProjectReadOnly(currentProject);
  const { isLoading: capabilitiesLoading } = useCapabilities();
  const requiresCapabilityInitialization =
    currentProject.kind === CURRENT_PROJECT_KIND.NEW &&
    !calculatorSessionEstablished &&
    !pendingProjectRestore &&
    !isReadOnlyProject;
  const enforceAccountCapabilities =
    requiresCapabilityInitialization && !capabilitiesLoading;

  return (
    <div className="new-project-workspace">
      <QuickPreferences variant="workspace" />
      {isReadOnlyProject ? (
        <p className="new-project-workspace__read-only-notice" role="status">
          {PROJECT_READ_ONLY_NOTICE_MESSAGE}
        </p>
      ) : null}
      {saveError && !showSaveDialog ? (
        <p className="new-project-workspace__save-error" role="alert">
          {saveError}
        </p>
      ) : null}
      {requiresCapabilityInitialization && capabilitiesLoading ? (
        <p className="new-project-workspace__status" role="status">
          Loading workspace...
        </p>
      ) : (
      <ResinCalculator
        ref={calculatorRef}
        key={calculatorSessionKey}
        showHeader={false}
        workspaceVariant="dedicated"
        readOnly={isReadOnlyProject}
        enforceAccountCapabilities={enforceAccountCapabilities}
        onDirtyChange={handleDirtyChange}
        onProjectRestored={handleProjectRestored}
        onSaveProjectRequest={handleCalculatorSaveProjectRequest}
      />
      )}
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
