import { useAuth } from "../auth/useAuth.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import QuickPreferences from "../preferences/QuickPreferences.jsx";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ResinCalculator from "../calculator/ResinCalculator.jsx";
import { parseProjectFileText, ProjectFileParseError } from "./projectFileParse.js";
import { CURRENT_PROJECT_KIND } from "./currentProject.js";
import { CANONICAL_DEMO_PROJECT_URL } from "../demo/demoConstants.js";
import { ROUTES } from "./routes.js";
import DemoFollowUp from "./DemoFollowUp.jsx";

function cloneSnapshot(snapshot) {
  return structuredClone(snapshot);
}

export default function DemoWorkspace() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const calculatorRef = useRef(null);
  const pristineSnapshotRef = useRef(null);
  const [calculatorSessionKey, setCalculatorSessionKey] = useState(0);
  const [pendingProjectRestore, setPendingProjectRestore] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [error, setError] = useState("");

  const loadDemoProject = useCallback(async () => {
    setLoadState("loading");
    setError("");
    setPendingProjectRestore(null);
    pristineSnapshotRef.current = null;

    try {
      const response = await fetch(CANONICAL_DEMO_PROJECT_URL);
      if (!response.ok) {
        throw new Error("Could not load the demo project.");
      }

      const text = await response.text();
      const parsed = parseProjectFileText(text);
      const snapshot = cloneSnapshot(parsed.snapshot);
      pristineSnapshotRef.current = cloneSnapshot(snapshot);
      setPendingProjectRestore(snapshot);
      setLoadState("ready");
    } catch (loadError) {
      const message =
        loadError instanceof ProjectFileParseError
          ? loadError.message
          : t("demo.loadError");
      setError(message);
      setLoadState("error");
    }
  }, [t]);

  useEffect(() => {
    void loadDemoProject();
  }, [loadDemoProject]);

  useLayoutEffect(() => {
    if (!pendingProjectRestore || !calculatorRef.current) {
      return;
    }

    calculatorRef.current.restoreProjectSnapshot(pendingProjectRestore);
    setPendingProjectRestore(null);
  }, [pendingProjectRestore, calculatorSessionKey]);

  const handleResetDemo = useCallback(() => {
    if (!pristineSnapshotRef.current) {
      void loadDemoProject();
      return;
    }

    setPendingProjectRestore(cloneSnapshot(pristineSnapshotRef.current));
    setCalculatorSessionKey((key) => key + 1);
  }, [loadDemoProject]);

  return (
    <div className="new-project-workspace demo-workspace" data-project-kind={CURRENT_PROJECT_KIND.DEMO}>
      <QuickPreferences variant="workspace" />
      <div className="demo-workspace__toolbar">
        <button
          type="button"
          className="demo-workspace__reset"
          onClick={handleResetDemo}
          disabled={loadState !== "ready"}
        >
          {t("demo.reset")}
        </button>
        {!isAuthenticated ? (
          <Link className="demo-workspace__account-cta" to={ROUTES.PRICING}>
            {t("demo.accountCta")}
          </Link>
        ) : null}
      </div>
      {loadState === "error" ? (
        <div className="demo-workspace__error" role="alert">
          <p>{error}</p>
          <button type="button" className="demo-workspace__retry" onClick={() => void loadDemoProject()}>
            {t("demo.retry")}
          </button>
        </div>
      ) : null}
      {loadState === "loading" ? (
        <p className="new-project-workspace__status" role="status">
          {t("common.loading")}
        </p>
      ) : null}
      {loadState === "ready" ? (
        <>
          <ResinCalculator
            ref={calculatorRef}
            key={calculatorSessionKey}
            showHeader={false}
            workspaceVariant="dedicated"
            demoMode
            demoProjectNote={t("demo.projectNote", { reset: t("demo.reset") })}
            initialInteractionMode="modify"
            enforceAccountCapabilities={false}
          />
          <DemoFollowUp />
        </>
      ) : null}
    </div>
  );
}
