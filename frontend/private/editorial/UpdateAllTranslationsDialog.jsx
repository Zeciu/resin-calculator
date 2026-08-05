import { useEffect, useState } from "react";
import { adminLocaleLabel } from "./editorialLocales.js";
import {
  mergeBulkSummaries,
  previewBulkTranslations,
  runBulkUpdateAll,
} from "./translationBulkApi.js";

/**
 * @param {{
 *   isOpen: boolean;
 *   module: "manual" | "glossary" | "knowledge_base" | "website";
 *   locale: string;
 *   onClose: () => void;
 *   onCompleted?: () => void;
 *   onRunningChange?: (running: boolean) => void;
 * }} props
 */
export default function UpdateAllTranslationsDialog({
  isOpen,
  module,
  locale,
  onClose,
  onCompleted,
  onRunningChange,
}) {
  const [phase, setPhase] = useState("loading"); // loading | confirm | running | summary | error
  const [preview, setPreview] = useState(null);
  const [includeTextOutdated, setIncludeTextOutdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(null);
  const [finalSummary, setFinalSummary] = useState(null);
  const [failedItems, setFailedItems] = useState([]);
  const [stoppedEarly, setStoppedEarly] = useState(false);
  const [stopReason, setStopReason] = useState(null);
  const [unprocessedCount, setUnprocessedCount] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let cancelled = false;
    setPhase("loading");
    setPreview(null);
    setIncludeTextOutdated(false);
    setErrorMessage("");
    setProgress(null);
    setFinalSummary(null);
    setFailedItems([]);
    setStoppedEarly(false);
    setStopReason(null);
    setUnprocessedCount(0);

    previewBulkTranslations(module, locale, { includeTextOutdated: false })
      .then((result) => {
        if (cancelled) {
          return;
        }
        setPreview(result);
        setPhase("confirm");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setErrorMessage(error?.message || "Failed to load preflight summary.");
        setPhase("error");
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, module, locale]);

  if (!isOpen) {
    return null;
  }

  const counts = preview?.counts ?? {};
  const localeName = adminLocaleLabel(locale);

  async function handleStart() {
    setPhase("running");
    setErrorMessage("");
    onRunningChange?.(true);
    setProgress({
      processed: 0,
      total: preview?.total ?? 0,
      currentLabel: null,
      currentAction: null,
      summary: mergeBulkSummaries({}, {}),
      items: [],
      done: false,
    });

    try {
      const result = await runBulkUpdateAll(module, locale, {
        includeTextOutdated,
        onProgress: setProgress,
      });
      setFinalSummary(result.summary);
      setFailedItems(result.items.filter((item) => item.status === "failed"));
      setStoppedEarly(Boolean(result.stoppedEarly));
      setStopReason(result.stopReason ?? null);
      setUnprocessedCount(result.unprocessedCount ?? 0);
      setPhase("summary");
      onRunningChange?.(false);
      onCompleted?.();
    } catch (error) {
      setErrorMessage(error?.message || "Update All Translations failed.");
      setPhase("error");
      onRunningChange?.(false);
    }
  }

  const busy = phase === "loading" || phase === "running";

  return (
    <div className="editorial-unsaved-overlay">
      <div
        className="editorial-bulk-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-all-translations-title"
      >
        <h2 id="update-all-translations-title" className="editorial-bulk-dialog__title">
          Update All Translations — {localeName}
        </h2>

        {phase === "loading" ? <p>Preparing preflight summary…</p> : null}

        {phase === "error" ? (
          <>
            <p className="editorial-workspace__error">{errorMessage}</p>
            <div className="editorial-bulk-dialog__actions">
              <button type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : null}

        {phase === "confirm" && preview ? (
          <>
            <p className="editorial-bulk-dialog__lead">
              Preflight for {preview.total} item{preview.total === 1 ? "" : "s"} in this module:
            </p>
            <ul className="editorial-bulk-dialog__counts">
              <li>Missing: {counts.missing ?? 0} (will generate)</li>
              <li>Current: {counts.current ?? 0} (will skip)</li>
              <li>Media-only outdated: {counts.mediaOnlyOutdated ?? 0} (sync, no DeepL)</li>
              <li>Text outdated: {counts.textOutdated ?? 0}</li>
              <li>Manual / untracked: {counts.manualUntracked ?? 0} (always skipped)</li>
              <li>Invalid / unavailable: {counts.invalid ?? 0} (skipped)</li>
            </ul>
            <p className="editorial-bulk-dialog__policy">
              Missing translations will be generated. Current translations will be skipped.
              Media-only changes will be synchronized without DeepL. Manual/untracked
              translations will be skipped. Generated translations are saved immediately as
              backend drafts — nothing is published automatically. Next steps: review entries,
              Save draft only when you edit one, then Publish all drafts for this locale.
            </p>
            <label className="editorial-bulk-dialog__checkbox">
              <input
                type="checkbox"
                checked={includeTextOutdated}
                onChange={(event) => setIncludeTextOutdated(event.target.checked)}
              />
              Include text-outdated translations (regenerates and may overwrite generated drafts)
            </label>
            {includeTextOutdated ? (
              <p className="editorial-bulk-dialog__warning" role="status">
                Warning: text-outdated generated targets will be fully regenerated. Manual
                and untracked translations remain protected.
              </p>
            ) : (
              <p className="editorial-bulk-dialog__note">
                Text-outdated translations will be skipped unless you enable the option
                above.
              </p>
            )}
            <div className="editorial-bulk-dialog__actions">
              <button type="button" onClick={handleStart}>
                Start update
              </button>
              <button type="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        ) : null}

        {phase === "running" && progress ? (
          <>
            <p>
              Processing {progress.processed} of {progress.total}
              {progress.currentLabel ? ` — ${progress.currentLabel}` : ""}
            </p>
            {progress.currentAction ? (
              <p className="editorial-bulk-dialog__note">Action: {progress.currentAction}</p>
            ) : null}
            <p className="editorial-bulk-dialog__note">
              Generated {progress.summary.generated ?? 0} · Media synced{" "}
              {progress.summary.mediaSynced ?? 0} · Skipped current{" "}
              {progress.summary.skippedCurrent ?? 0} · Failed {progress.summary.failed ?? 0}
            </p>
          </>
        ) : null}

        {phase === "summary" && finalSummary ? (
          <>
            {stopReason === "rate_limited" ? (
              <p className="editorial-bulk-dialog__lead">
                Translation processing was paused because DeepL temporarily limited requests.
                Completed drafts were saved. Run Update All Translations again later to continue
                with the remaining items.
                {unprocessedCount > 0
                  ? ` ${unprocessedCount} item${unprocessedCount === 1 ? "" : "s"} left unprocessed.`
                  : ""}
              </p>
            ) : null}
            {stopReason === "quota_exceeded" ? (
              <p className="editorial-bulk-dialog__lead">
                DeepL account quota has been exceeded. Completed drafts were saved. Translation
                can continue after quota becomes available.
                {unprocessedCount > 0
                  ? ` ${unprocessedCount} item${unprocessedCount === 1 ? "" : "s"} left unprocessed.`
                  : ""}
              </p>
            ) : null}
            {!stoppedEarly ? (
              <p className="editorial-bulk-dialog__lead">
                Update finished. Translations are saved as drafts. Review as needed, then use
                Publish all drafts for {localeName}.
              </p>
            ) : null}
            <ul className="editorial-bulk-dialog__counts">
              <li>Total processed: {finalSummary.total ?? 0}</li>
              <li>Generated: {finalSummary.generated ?? 0}</li>
              <li>Media synced: {finalSummary.mediaSynced ?? 0}</li>
              <li>Skipped current: {finalSummary.skippedCurrent ?? 0}</li>
              <li>Skipped text outdated: {finalSummary.skippedTextOutdated ?? 0}</li>
              <li>Skipped manual/untracked: {finalSummary.skippedManualUntracked ?? 0}</li>
              <li>Skipped invalid: {finalSummary.skippedInvalid ?? 0}</li>
              <li>Failed: {finalSummary.failed ?? 0}</li>
              <li>Items generated via DeepL: {finalSummary.providerCallItems ?? 0}</li>
            </ul>
            {failedItems.length > 0 ? (
              <ul className="editorial-bulk-dialog__failures">
                {failedItems.map((item) => (
                  <li key={item.contentId}>
                    {item.label}: {item.error || "failed"}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="editorial-bulk-dialog__actions">
              <button type="button" onClick={onClose} disabled={busy}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
