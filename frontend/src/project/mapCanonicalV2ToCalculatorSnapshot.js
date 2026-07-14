/** @typedef {import("./canonicalProjectV2.js").CanonicalProjectV2Envelope} CanonicalProjectV2Envelope */

/**
 * Maps a validated canonical v2 envelope to the calculator snapshot shape used by
 * `restoreProjectSnapshot()`. Session-only zoom is intentionally omitted.
 *
 * @param {CanonicalProjectV2Envelope} envelope
 * @returns {Record<string, unknown>}
 */
export function mapCanonicalV2ToCalculatorSnapshot(envelope) {
  const technicalContent = envelope.technicalContent ?? {};
  const descriptiveMetadata = envelope.descriptiveMetadata ?? {};
  const derivedData = envelope.derivedData ?? {};
  const workflow =
    technicalContent.ui && typeof technicalContent.ui === "object"
      ? technicalContent.ui.workflow
      : null;

  const snapshot = {
    image: technicalContent.image,
    projectNotes:
      typeof descriptiveMetadata.notes === "string" ? descriptiveMetadata.notes : "",
    result: derivedData.result ?? null,
  };

  if (technicalContent.appVersion != null) {
    snapshot.appVersion = technicalContent.appVersion;
  }

  if (technicalContent.calibration && typeof technicalContent.calibration === "object") {
    snapshot.calibration = technicalContent.calibration;
  }

  if (technicalContent.standardResinArea && typeof technicalContent.standardResinArea === "object") {
    snapshot.standardResinArea = technicalContent.standardResinArea;
  }

  if (technicalContent.woodBoundaryMode && typeof technicalContent.woodBoundaryMode === "object") {
    snapshot.woodBoundaryMode = technicalContent.woodBoundaryMode;
  }

  const ui = {};

  if (workflow && typeof workflow === "object") {
    if (workflow.calculationMode != null) {
      ui.calculationMode = workflow.calculationMode;
    }

    if (workflow.selectedMode != null) {
      ui.selectedMode = workflow.selectedMode;
    }

    if (workflow.selectedShape != null) {
      ui.selectedShape = workflow.selectedShape;
    }
  }

  const rotation = descriptiveMetadata.workspaceView?.rotation;
  if (rotation != null) {
    ui.rotationDeg = rotation;
  }

  if (Object.keys(ui).length > 0) {
    snapshot.ui = ui;
  }

  return snapshot;
}
