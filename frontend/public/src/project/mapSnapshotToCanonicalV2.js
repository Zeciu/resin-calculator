import {
  createEmptyCanonicalProjectV2,
  createEmptyProjectMetadata,
} from "./canonicalProjectV2.js";

/** @typedef {import("./canonicalProjectLifecycle.js").CanonicalProjectLifecycle} CanonicalProjectLifecycle */

/**
 * @typedef {{
 *   projectName?: string | null;
 *   lifecycle?: CanonicalProjectLifecycle | null;
 * }} MapSnapshotToCanonicalV2Options
 */

/**
 * Pure mapping from the current calculator snapshot shape to the canonical v2 envelope.
 * Used at Save time by `buildPersistableCanonicalV2.js` and restored at Open time
 * through `mapCanonicalV2ToCalculatorSnapshot.js`.
 *
 * @param {Record<string, unknown> | null | undefined} snapshot
 * @param {MapSnapshotToCanonicalV2Options} [options]
 */
export function mapCalculatorSnapshotToCanonicalV2(snapshot, options = {}) {
  const source = snapshot && typeof snapshot === "object" ? snapshot : {};
  const technicalContent = {};

  if (source.appVersion != null) {
    technicalContent.appVersion = source.appVersion;
  }

  if (source.image && typeof source.image === "object") {
    technicalContent.image = source.image;
  }

  if (source.calibration && typeof source.calibration === "object") {
    technicalContent.calibration = source.calibration;
  }

  if (source.standardResinArea && typeof source.standardResinArea === "object") {
    technicalContent.standardResinArea = source.standardResinArea;
  }

  if (source.woodBoundaryMode && typeof source.woodBoundaryMode === "object") {
    technicalContent.woodBoundaryMode = source.woodBoundaryMode;
  }

  const ui = source.ui && typeof source.ui === "object" ? source.ui : null;
  if (ui) {
    const workflow = {};

    if (ui.calculationMode != null) {
      workflow.calculationMode = ui.calculationMode;
    }

    if (ui.selectedMode != null) {
      workflow.selectedMode = ui.selectedMode;
    }

    if (ui.selectedShape != null) {
      workflow.selectedShape = ui.selectedShape;
    }

    if (Object.keys(workflow).length > 0) {
      technicalContent.ui = { workflow };
    }
  }

  const descriptiveMetadata = {};

  if (options.projectName != null && String(options.projectName).trim()) {
    descriptiveMetadata.projectName = String(options.projectName).trim();
  }

  if (source.projectNotes != null && String(source.projectNotes).length > 0) {
    descriptiveMetadata.notes = source.projectNotes;
  }

  if (ui?.rotationDeg != null) {
    descriptiveMetadata.workspaceView = { rotation: ui.rotationDeg };
  }

  const derivedData = {};

  if (source.result != null) {
    derivedData.result = source.result;
  }

  const envelope = createEmptyCanonicalProjectV2();
  const lifecycleMetadata = options.lifecycle?.projectMetadata;

  envelope.projectMetadata = lifecycleMetadata
    ? {
        ...createEmptyProjectMetadata(),
        ...lifecycleMetadata,
        ancestorVersionIds: Array.isArray(lifecycleMetadata.ancestorVersionIds)
          ? [...lifecycleMetadata.ancestorVersionIds]
          : [],
      }
    : createEmptyProjectMetadata();
  envelope.technicalContent = technicalContent;
  envelope.descriptiveMetadata = descriptiveMetadata;
  envelope.derivedData = derivedData;

  return envelope;
}
