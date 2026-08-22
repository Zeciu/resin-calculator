import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { computeProjectDirtyState } from "./projectDirtyState.js";
import {
  CircleHelp,
  FileText,
  Maximize2,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  Save,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import AppHeader from "../AppHeader";
import { buildAuthHeaders } from "../auth/authHeaders.js";
import { LengthUnitInput } from "./LengthUnitInput.jsx";
import { useCalculatorDisplayUnits } from "./useCalculatorDisplayUnits.js";
import { canAddPolygonPoint } from "./calculatorCapabilityPolicy.js";
import { useCalculatorCapabilityEnforcement } from "./useCalculatorCapabilityEnforcement.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { buildCalculatorUi } from "./calculatorUi.js";
import {
  hitTestProjectGeometry,
  isGeometryDrawMode,
  selectionFromHit,
} from "./geometryHitTest.js";
import {
  canEnterModifyProject,
  resolveRestoredCavitiesComplete,
} from "./workflowCompletion.js";
import { ROUTES } from "../workspace/routes.js";
import {
  CALCULATOR_API_KIND,
  getCalculatorApiPath,
  getCalculatorRequestHeaders,
} from "./calculatorApi.js";

const API_BASE_URL = "";
const PROJECT_FILE_VERSION = "1.0";
const ROTATIONS = [0, 90, 180, 270];
const AXIS_DOMINANCE_RATIO = 1.5;
const MIX_RATIO_OPTIONS = [
  { value: "1:1", label: "1 : 1", aParts: 1, bParts: 1 },
  { value: "2:1", label: "2 : 1", aParts: 2, bParts: 1 },
  { value: "2.5:1", label: "2.5 : 1", aParts: 2.5, bParts: 1 },
  { value: "3:1", label: "3 : 1", aParts: 3, bParts: 1 },
  { value: "100:40", label: "100 : 40", aParts: 100, bParts: 40 },
  { value: "100:45", label: "100 : 45", aParts: 100, bParts: 45 },
  { value: "100:50", label: "100 : 50", aParts: 100, bParts: 50 },
  { value: "100:60", label: "100 : 60", aParts: 100, bParts: 60 },
  { value: "100:70", label: "100 : 70", aParts: 100, bParts: 70 },
];
const FIRST_FILL_RECOMMENDATION_OPTIONS = [
  {
    value: "10",
    multiplier: 1.1,
  },
  {
    value: "30",
    multiplier: 1.3,
  },
];
const WORKSPACE_EDIT_COLORS = {
  active: {
    stroke: "#00e5ff",
    fill: "rgba(0, 229, 255, 0.14)",
    pointFill: "#ffffff",
    pointStroke: "#111111",
    lineWidth: 2.5,
    pointRadius: 5,
  },
  completed: {
    mold: {
      stroke: "#bdbdbd",
      fill: "rgba(180, 180, 180, 0.14)",
      pointFill: "#eeeeee",
      lineWidth: 2,
    },
    wood: {
      stroke: "#f0b878",
      fill: "rgba(240, 184, 120, 0.22)",
      pointFill: "#ffe8c8",
      lineWidth: 2,
    },
    cavity: {
      stroke: "#c77dff",
      fill: "rgba(199, 125, 255, 0.24)",
      pointFill: "#e9c4ff",
      lineWidth: 2,
    },
    standard: {
      stroke: "#4fc3ff",
      fill: "rgba(79, 195, 255, 0.22)",
      pointFill: "#b8e7ff",
      lineWidth: 2,
    },
  },
  reference: {
    stroke: "#ff8c42",
    pointFill: "#ff8c42",
    lineWidth: 2,
    pointRadius: 5,
  },
};

function GeometryFamilyGroup({ family, label, status, children, groupRef }) {
  return (
    <div
      ref={groupRef}
      className={`geometry-family-group geometry-family-group--${family} active-step-group`}
    >
      <span className="geometry-family-label workflow-section-label">{label}</span>
      {status ? <span className="geometry-family-status">{status}</span> : null}
      {children}
    </div>
  );
}

function HelpIcon({ helpKey, help, activeHelpKey, onToggle, aboutLabel }) {
  const isActive = activeHelpKey === helpKey;

  return (
    <span className="help-icon-wrapper">
      <span
        role="button"
        tabIndex={0}
        className="help-icon-trigger"
        aria-label={aboutLabel}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(helpKey);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          onToggle(helpKey);
        }}
      >
        <CircleHelp size={16} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className={`help-tooltip ${isActive ? "help-tooltip-active" : ""}`}>
        <strong>{help.title}</strong>
        <span>{help.text}</span>
        {help.examples && <span>{help.examples}</span>}
      </span>
    </span>
  );
}

function classifyReferenceDirection(dx, dy) {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx >= absDy * AXIS_DOMINANCE_RATIO) return "horizontal";
  if (absDy >= absDx * AXIS_DOMINANCE_RATIO) return "vertical";
  return "diagonal";
}

function getDisplayDimensions(imageWidth, imageHeight, rotationDeg) {
  const quarterTurn = rotationDeg % 180 !== 0;
  return quarterTurn
    ? { width: imageHeight, height: imageWidth }
    : { width: imageWidth, height: imageHeight };
}

function imagePointToRotated(point, imageWidth, imageHeight, rotationDeg) {
  if (rotationDeg === 90) {
    return { x: imageHeight - point.y, y: point.x };
  }
  if (rotationDeg === 180) {
    return { x: imageWidth - point.x, y: imageHeight - point.y };
  }
  if (rotationDeg === 270) {
    return { x: point.y, y: imageWidth - point.x };
  }
  return { x: point.x, y: point.y };
}

function rotatedPointToImage(point, imageWidth, imageHeight, rotationDeg) {
  if (rotationDeg === 90) {
    return { x: point.y, y: imageHeight - point.x };
  }
  if (rotationDeg === 180) {
    return { x: imageWidth - point.x, y: imageHeight - point.y };
  }
  if (rotationDeg === 270) {
    return { x: imageWidth - point.y, y: point.x };
  }
  return { x: point.x, y: point.y };
}

function getFitScale(viewW, viewH, imageW, imageH, rotationDeg) {
  const display = getDisplayDimensions(imageW, imageH, rotationDeg);
  return Math.min(viewW / display.width, viewH / display.height);
}

function polygonAreaPx2(points) {
  if (!points || points.length < 3) return 0;

  let area = 0;
  points.forEach((point, idx) => {
    const next = points[(idx + 1) % points.length];
    area += point.x * next.y - next.x * point.y;
  });

  return Math.abs(area) / 2;
}

function formatNumber(value, digits = 2, fallback = "N/A") {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : fallback;
}

function getMixRatioOption(value) {
  return (
    MIX_RATIO_OPTIONS.find((option) => option.value === value) ||
    MIX_RATIO_OPTIONS[0]
  );
}

function calculateMixComponents(recommendedVolumeLiters, mixRatioValue) {
  const recommendedAmountMl = Number(recommendedVolumeLiters) * 1000;
  const ratio = getMixRatioOption(mixRatioValue);
  const totalParts = ratio.aParts + ratio.bParts;

  if (!Number.isFinite(recommendedAmountMl) || recommendedAmountMl < 0) {
    return { componentAMl: null, componentBMl: null };
  }

  return {
    componentAMl: Math.round((recommendedAmountMl * ratio.aParts) / totalParts),
    componentBMl: Math.round((recommendedAmountMl * ratio.bParts) / totalParts),
  };
}

function getFirstFillRecommendationOption(value) {
  return (
    FIRST_FILL_RECOMMENDATION_OPTIONS.find((option) => option.value === value) ||
    FIRST_FILL_RECOMMENDATION_OPTIONS[0]
  );
}

function getFirstFillRecommendedVolume(volumeLiters, mode) {
  const volume = Number(volumeLiters);
  if (!Number.isFinite(volume)) return null;
  return volume * getFirstFillRecommendationOption(mode).multiplier;
}

function isFirstFillPourRow(row) {
  return row?.type === "firstFill" || row?.label?.includes("First Fill Seal Coat");
}

function getPourPlanRecommendedVolume(row, firstFillRecommendationMode) {
  if (isFirstFillPourRow(row)) {
    return getFirstFillRecommendedVolume(
      row.volumeLiters,
      firstFillRecommendationMode
    );
  }

  return row.recommendedVolumeLiters;
}

function drawPolygonOnCanvas(
  ctx,
  screenPts,
  { stroke, fill, pointFill, pointStroke, lineWidth = 2, pointRadius = 4 },
) {
  if (screenPts.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(screenPts[0].x, screenPts[0].y);
  screenPts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
  if (screenPts.length > 2) ctx.closePath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  if (screenPts.length > 2 && fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  screenPts.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, pointRadius, 0, Math.PI * 2);
    ctx.fillStyle = pointFill;
    ctx.fill();
    if (pointStroke) {
      ctx.strokeStyle = pointStroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });
}

function drawReferenceAlignmentGrid(ctx, offsetX, offsetY, drawW, drawH) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i += 1) {
    const x = offsetX + (drawW * i) / 4;
    const y = offsetY + (drawH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + drawH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + drawW, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCanvas({
  canvas,
  image,
  calculationMode,
  polygonPoints,
  useImageBorderAsMold,
  moldBoundaryPoints,
  woodBoundaryPolygons = [],
  woodBoundaryPoints,
  cavityPolygons,
  currentCavityPoints,
  referenceMeasurements,
  draftReferencePoints,
  selectedShape,
  mode,
  rotationDeg,
  zoomFactor,
  measurementsComplete,
  moldBoundaryComplete,
}) {
  if (!canvas || !image) return;

  const activeColors = WORKSPACE_EDIT_COLORS.active;
  const completed = WORKSPACE_EDIT_COLORS.completed;
  const referenceColors = WORKSPACE_EDIT_COLORS.reference;

  const ctx = canvas.getContext("2d");
  const viewW = canvas.width;
  const viewH = canvas.height;
  const fitScale = getFitScale(viewW, viewH, image.width, image.height, rotationDeg);
  const scale = fitScale * zoomFactor;
  const display = getDisplayDimensions(image.width, image.height, rotationDeg);
  const drawW = display.width * scale;
  const drawH = display.height * scale;
  const offsetX = (viewW - drawW) / 2;
  const offsetY = (viewH - drawH) / 2;

  ctx.clearRect(0, 0, viewW, viewH);
  ctx.fillStyle = "#ddd";
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  if (rotationDeg === 90) {
    ctx.translate(image.height, 0);
    ctx.rotate(Math.PI / 2);
  } else if (rotationDeg === 180) {
    ctx.translate(image.width, image.height);
    ctx.rotate(Math.PI);
  } else if (rotationDeg === 270) {
    ctx.translate(0, image.width);
    ctx.rotate((3 * Math.PI) / 2);
  }
  ctx.drawImage(image, 0, 0, image.width, image.height);
  ctx.restore();

  if (!measurementsComplete) {
    drawReferenceAlignmentGrid(ctx, offsetX, offsetY, drawW, drawH);
  }

  const toScreen = (pt) => {
    const r = imagePointToRotated(pt, image.width, image.height, rotationDeg);
    return {
      x: offsetX + r.x * scale,
      y: offsetY + r.y * scale,
    };
  };

  if (calculationMode === "wood" && image && useImageBorderAsMold) {
    const moldCorners = [
      { x: 0, y: 0 },
      { x: image.width, y: 0 },
      { x: image.width, y: image.height },
      { x: 0, y: image.height },
    ].map(toScreen);
    ctx.beginPath();
    ctx.moveTo(moldCorners[0].x, moldCorners[0].y);
    moldCorners.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(120, 120, 120, 0.08)";
    ctx.fill();
  }

  if (calculationMode === "standard" && polygonPoints.length > 0) {
    const screenPts = polygonPoints.map(toScreen);
    const polygonColors =
      mode === "polygon" ? activeColors : completed.standard;
    drawPolygonOnCanvas(ctx, screenPts, polygonColors);
  }

  if (calculationMode === "wood") {
    if (!useImageBorderAsMold && moldBoundaryPoints.length > 0) {
      const screenPts = moldBoundaryPoints.map(toScreen);
      const moldColors =
        !moldBoundaryComplete || mode === "mold" ? activeColors : completed.mold;
      drawPolygonOnCanvas(ctx, screenPts, moldColors);
    }

    woodBoundaryPolygons.forEach((woodPolygon, idx) => {
      if (!woodPolygon || woodPolygon.length === 0) return;
      const screenPts = woodPolygon.map(toScreen);
      drawPolygonOnCanvas(ctx, screenPts, completed.wood);
      if (screenPts.length >= 2) {
        const mid = {
          x: screenPts.reduce((s, p) => s + p.x, 0) / screenPts.length,
          y: screenPts.reduce((s, p) => s + p.y, 0) / screenPts.length,
        };
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(mid.x - 14, mid.y - 10, 28, 16);
        ctx.fillStyle = "#fff";
        ctx.font = "11px sans-serif";
        ctx.fillText(`W${idx + 1}`, mid.x - 9, mid.y + 3);
      }
    });

    if (woodBoundaryPoints.length > 0) {
      const screenPts = woodBoundaryPoints.map(toScreen);
      drawPolygonOnCanvas(ctx, screenPts, activeColors);
    }

    cavityPolygons.forEach((cavity, idx) => {
      if (!cavity || cavity.length === 0) return;
      const screenPts = cavity.map(toScreen);
      drawPolygonOnCanvas(ctx, screenPts, completed.cavity);
      if (screenPts.length >= 2) {
        const mid = {
          x: screenPts.reduce((s, p) => s + p.x, 0) / screenPts.length,
          y: screenPts.reduce((s, p) => s + p.y, 0) / screenPts.length,
        };
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(mid.x - 12, mid.y - 10, 24, 16);
        ctx.fillStyle = "#fff";
        ctx.font = "11px sans-serif";
        ctx.fillText(`C${idx + 1}`, mid.x - 8, mid.y + 3);
      }
    });

    if (currentCavityPoints.length > 0) {
      const screenPts = currentCavityPoints.map(toScreen);
      drawPolygonOnCanvas(ctx, screenPts, activeColors);
    }

    let selectedPoints = [];
    if (selectedShape?.type === "mold" && !useImageBorderAsMold) {
      selectedPoints = moldBoundaryPoints;
    } else if (selectedShape?.type === "wood") {
      selectedPoints = woodBoundaryPolygons[selectedShape.index] || [];
    } else if (selectedShape?.type === "cavity") {
      selectedPoints = cavityPolygons[selectedShape.index] || [];
    }

    if (selectedPoints.length > 0) {
      const screenPts = selectedPoints.map(toScreen);
      drawPolygonOnCanvas(ctx, screenPts, {
        ...activeColors,
        fill: null,
        lineWidth: 4,
        pointRadius: 8,
      });
    }

    if (selectedShape?.type === "reference") {
      const selectedRef = referenceMeasurements[selectedShape.index];
      const selectedRefPts = (selectedRef?.calibrationPoints || []).map(toScreen);
      if (selectedRefPts.length > 0) {
        selectedRefPts.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, activeColors.pointRadius + 3, 0, Math.PI * 2);
          ctx.fillStyle = activeColors.pointFill;
          ctx.fill();
          ctx.strokeStyle = activeColors.stroke;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        if (selectedRefPts.length === 2) {
          ctx.beginPath();
          ctx.moveTo(selectedRefPts[0].x, selectedRefPts[0].y);
          ctx.lineTo(selectedRefPts[1].x, selectedRefPts[1].y);
          ctx.strokeStyle = activeColors.stroke;
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      }
    }
  }

  if (referenceMeasurements.length > 0) {
    referenceMeasurements.forEach((ref, idx) => {
      const screenPts = (ref.calibrationPoints || []).map(toScreen);
      screenPts.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, referenceColors.pointRadius, 0, Math.PI * 2);
        ctx.fillStyle = referenceColors.pointFill;
        ctx.fill();
      });

      if (screenPts.length === 2) {
        ctx.beginPath();
        ctx.moveTo(screenPts[0].x, screenPts[0].y);
        ctx.lineTo(screenPts[1].x, screenPts[1].y);
        ctx.strokeStyle = referenceColors.stroke;
        ctx.lineWidth = referenceColors.lineWidth;
        ctx.stroke();
      }

      if (screenPts.length === 2) {
        const mid = {
          x: (screenPts[0].x + screenPts[1].x) / 2,
          y: (screenPts[0].y + screenPts[1].y) / 2,
        };
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(mid.x - 10, mid.y - 10, 20, 16);
        ctx.fillStyle = "#fff";
        ctx.font = "12px sans-serif";
        ctx.fillText(String(idx + 1), mid.x - 4, mid.y + 3);
      }
    });
  }

  if (draftReferencePoints.length > 0) {
    const screenPts = draftReferencePoints.map(toScreen);
    screenPts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, activeColors.pointRadius, 0, Math.PI * 2);
      ctx.fillStyle = activeColors.pointFill;
      ctx.fill();
      ctx.strokeStyle = activeColors.pointStroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    if (screenPts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      ctx.lineTo(screenPts[1].x, screenPts[1].y);
      ctx.strokeStyle = activeColors.stroke;
      ctx.lineWidth = activeColors.lineWidth;
      ctx.stroke();
    }
  }
}

export default forwardRef(function ResinCalculator(
  {
    showHeader = true,
    workspaceVariant,
    readOnly = false,
    enforceAccountCapabilities = false,
    onDirtyChange,
    onProjectRestored,
    onSaveProjectRequest,
    demoMode = false,
    initialInteractionMode = "build",
  },
  ref,
) {
  const isReadOnly = Boolean(readOnly);
  const isDemoMode = Boolean(demoMode);
  const canvasRef = useRef(null);
  const workAreaRef = useRef(null);
  const workspaceImagePanelRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const suppressNextClickRef = useRef(false);
  const cavityRowRefs = useRef([]);
  const cavityDepthInputRefs = useRef([]);
  const referenceDraftRef = useRef(null);
  const draftKnownLengthInputRef = useRef(null);
  const selectedReferenceLengthInputRef = useRef(null);
  // Attached to `.active-workflow-controls` for every workflow step so
  // automatic scrolling can target the newly active step controls.
  const activeWorkflowControlsRef = useRef(null);
  const cavityControlsRef = useRef(null);
  const finalActionBarRef = useRef(null);
  const mainDepthInputRef = useRef(null);
  const maxPourThicknessInputRef = useRef(null);
  const firstFillThicknessInputRef = useRef(null);
  const displayUnits = useCalculatorDisplayUnits();
  const accountCapabilities = useCalculatorCapabilityEnforcement(
    isDemoMode ? false : enforceAccountCapabilities,
  );
  const maxPolygonPoints = isDemoMode ? null : accountCapabilities.maxPolygonPoints;
  const layerCalculation = isDemoMode ? true : accountCapabilities.layerCalculation;
  const pdfExport = isDemoMode ? false : accountCapabilities.pdfExport;
  const advancedReports = isDemoMode ? true : accountCapabilities.advancedReports;
  const { t } = useI18n();
  const ui = useMemo(() => buildCalculatorUi(t), [t]);

  const [calculationMode, setCalculationMode] = useState("wood");
  const [mode, setMode] = useState("reference");
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [useImageBorderAsMold, setUseImageBorderAsMold] = useState(false);
  const [moldBoundaryPoints, setMoldBoundaryPoints] = useState([]);
  const [woodBoundaryPolygons, setWoodBoundaryPolygons] = useState([]);
  const [woodBoundaryPoints, setWoodBoundaryPoints] = useState([]);
  const [cavityPolygons, setCavityPolygons] = useState([]);
  const [currentCavityPoints, setCurrentCavityPoints] = useState([]);
  const [referenceMeasurements, setReferenceMeasurements] = useState([]);
  const [measurementsComplete, setMeasurementsComplete] = useState(false);
  const [referencesExpanded, setReferencesExpanded] = useState(true);
  const [moldBoundaryComplete, setMoldBoundaryComplete] = useState(false);
  const [woodBoundaryComplete, setWoodBoundaryComplete] = useState(false);
  const [cavitiesComplete, setCavitiesComplete] = useState(false);
  const [interactionMode, setInteractionMode] = useState(
    initialInteractionMode === "modify" ? "modify" : "build",
  );
  const [draftReferencePoints, setDraftReferencePoints] = useState([]);
  const [draftKnownLengthCm, setDraftKnownLengthCm] = useState("");
  const [selectedReferenceLengthDraft, setSelectedReferenceLengthDraft] = useState("");
  const [rotationDeg, setRotationDeg] = useState(0);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [depthMm, setDepthMm] = useState("");
  const [maxPourThicknessMm, setMaxPourThicknessMm] = useState("");
  const [recommendedLayerCount, setRecommendedLayerCount] = useState(null);
  const [pourPlanRows, setPourPlanRows] = useState([]);
  const [layerPlanningError, setLayerPlanningError] = useState("");
  const [resinMixRatio, setResinMixRatio] = useState(MIX_RATIO_OPTIONS[0].value);
  const [firstFillThicknessMm, setFirstFillThicknessMm] = useState("");
  const [firstFillVolumeLiters, setFirstFillVolumeLiters] = useState(null);
  const [recommendedFirstFillVolumeLiters, setRecommendedFirstFillVolumeLiters] =
    useState(null);
  const [firstFillRecommendationMode, setFirstFillRecommendationMode] = useState(
    FIRST_FILL_RECOMMENDATION_OPTIONS[0].value
  );
  const [firstFillError, setFirstFillError] = useState("");
  const [cavityDepthsMm, setCavityDepthsMm] = useState([]);
  const [useMainDepthForCavities, setUseMainDepthForCavities] = useState(false);
  const [projectNotes, setProjectNotes] = useState("");
  const [selectedShape, setSelectedShape] = useState(null);
  const [activeModeHelp, setActiveModeHelp] = useState(null);
  const [pendingNewCavityIndex, setPendingNewCavityIndex] = useState(null);
  const [highlightedCavityIndex, setHighlightedCavityIndex] = useState(null);
  const [editingCavityDepthIndex, setEditingCavityDepthIndex] = useState(null);
  const [result, setResult] = useState(null);
  const [resultOutdated, setResultOutdated] = useState(false);
  const [error, setError] = useState("");
  const buildProjectSnapshotRef = useRef(() => ({}));
  const restoreImportedProjectRef = useRef(() => {});

  useEffect(() => {
    if (!onDirtyChange) {
      return;
    }

    if (isReadOnly) {
      onDirtyChange(false);
      return;
    }

    onDirtyChange(
      computeProjectDirtyState({
        referenceMeasurements,
        draftReferencePoints,
        polygonPoints,
        moldBoundaryPoints,
        woodBoundaryPolygons,
        woodBoundaryPoints,
        cavityPolygons,
        currentCavityPoints,
        projectNotes,
        depthMm,
        maxPourThicknessMm,
        firstFillThicknessMm,
        cavityDepthsMm,
        result,
        measurementsComplete,
        moldBoundaryComplete,
        woodBoundaryComplete,
        cavitiesComplete,
      }),
    );
  }, [
    onDirtyChange,
    referenceMeasurements,
    draftReferencePoints,
    polygonPoints,
    moldBoundaryPoints,
    woodBoundaryPolygons,
    woodBoundaryPoints,
    cavityPolygons,
    currentCavityPoints,
    projectNotes,
    depthMm,
    maxPourThicknessMm,
    firstFillThicknessMm,
    cavityDepthsMm,
    result,
    measurementsComplete,
    moldBoundaryComplete,
    woodBoundaryComplete,
    cavitiesComplete,
    isReadOnly,
  ]);

  const markResultOutdated = () => {
    setResultOutdated((prev) => prev || Boolean(result));
  };

  const resolveCavityDepthsForApi = () => {
    if (useMainDepthForCavities) {
      const main = parseFloat(depthMm);
      return cavityPolygons.map(() => main);
    }
    return cavityDepthsMm.map((d) => parseFloat(d));
  };

  const hasImage = !!imageRef.current;

  const getEffectiveScales = (quality) => {
    if (!quality) return null;
    let scaleX = quality.scaleXAvgCmPerPx;
    let scaleY = quality.scaleYAvgCmPerPx;
    if (scaleX == null && scaleY == null) return null;
    if (scaleX == null) scaleX = scaleY;
    if (scaleY == null) scaleY = scaleX;
    return { scaleX, scaleY };
  };

  const getDrawParams = (overrides = {}) => ({
    canvas: canvasRef.current,
    image: imageRef.current,
    calculationMode,
    polygonPoints,
    useImageBorderAsMold,
    moldBoundaryPoints,
    woodBoundaryPolygons,
    woodBoundaryPoints,
    cavityPolygons,
    currentCavityPoints,
    referenceMeasurements,
    draftReferencePoints,
    selectedShape,
    mode,
    rotationDeg,
    zoomFactor,
    measurementsComplete,
    moldBoundaryComplete,
    ...overrides,
  });

  const referenceQuality = (() => {
    if (referenceMeasurements.length === 0) return null;
    const parsed = referenceMeasurements
      .map((ref) => {
        const points = ref.calibrationPoints || [];
        if (points.length !== 2) return null;
        const [p1, p2] = points;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Number(ref.knownLengthCm);
        if (!Number.isFinite(len) || len <= 0) return null;
        return { dx, dy, len };
      })
      .filter(Boolean);

    if (parsed.length === 0) return null;

    const horizontalScales = [];
    const verticalScales = [];
    let diagonalCount = 0;

    parsed.forEach(({ dx, dy, len }) => {
      const direction = classifyReferenceDirection(dx, dy);
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (direction === "horizontal" && absDx > 0) {
        horizontalScales.push(len / absDx);
      } else if (direction === "vertical" && absDy > 0) {
        verticalScales.push(len / absDy);
      } else {
        diagonalCount += 1;
      }
    });

    const horizontalCount = horizontalScales.length;
    const verticalCount = verticalScales.length;
    const scaleXAvgCmPerPx =
      horizontalCount > 0
        ? horizontalScales.reduce((a, b) => a + b, 0) / horizontalCount
        : null;
    const scaleYAvgCmPerPx =
      verticalCount > 0
        ? verticalScales.reduce((a, b) => a + b, 0) / verticalCount
        : null;

    return {
      scaleXAvgCmPerPx,
      scaleYAvgCmPerPx,
      horizontalCount,
      verticalCount,
      diagonalCount,
      oneDirectionOnlyWarning: horizontalCount === 0 || verticalCount === 0,
    };
  })();

  const cavitySummaries = (() => {
    const effectiveScales = getEffectiveScales(referenceQuality);
    return cavityPolygons.map((cavity, idx) => {
      const depthValue = useMainDepthForCavities
        ? depthMm
        : cavityDepthsMm[idx] ?? "";
      const depth = parseFloat(depthValue);
      const areaCm2 = effectiveScales
        ? polygonAreaPx2(cavity) * effectiveScales.scaleX * effectiveScales.scaleY
        : null;
      const volumeLiters =
        areaCm2 != null && Number.isFinite(depth) && depth > 0
          ? (areaCm2 * (depth / 10)) / 1000
          : null;

      return {
        name: `Cavity ${idx + 1}`,
        depthValue,
        areaCm2,
        volumeLiters,
      };
    });
  })();

  const woodLiveSummary = (() => {
    if (calculationMode !== "wood") return null;
    const image = imageRef.current;
    const effectiveScales = getEffectiveScales(referenceQuality);
    const completedWoodPolygons = woodBoundaryPolygons.filter(
      (polygon) => polygon.length >= 3
    );
    if (!image || !effectiveScales || completedWoodPolygons.length === 0) return null;
    if (!useImageBorderAsMold && moldBoundaryPoints.length < 3) return null;

    const moldAreaPx = useImageBorderAsMold
      ? image.width * image.height
      : polygonAreaPx2(moldBoundaryPoints);
    const woodAreaPx = completedWoodPolygons.reduce(
      (total, polygon) => total + polygonAreaPx2(polygon),
      0
    );
    const areaScale = effectiveScales.scaleX * effectiveScales.scaleY;
    const moldAreaCm2 = moldAreaPx * areaScale;
    const woodAreaCm2 = woodAreaPx * areaScale;
    const mainResinAreaCm2 = Math.max(0, moldAreaCm2 - woodAreaCm2);
    const mainDepth = parseFloat(depthMm);
    const mainVolumeLiters =
      Number.isFinite(mainDepth) && mainDepth > 0
        ? (mainResinAreaCm2 * (mainDepth / 10)) / 1000
        : null;
    const cavityVolumeLiters = cavitySummaries.reduce(
      (sum, cavity) => sum + (cavity.volumeLiters || 0),
      0
    );
    const totalVolumeLiters =
      mainVolumeLiters == null ? null : mainVolumeLiters + cavityVolumeLiters;

    return {
      moldAreaCm2,
      woodAreaCm2,
      woodIslandCount: completedWoodPolygons.length,
      mainResinAreaCm2,
      mainVolumeLiters,
      totalVolumeLiters,
      recommendedVolumeLiters:
        totalVolumeLiters == null ? null : totalVolumeLiters * 1.1,
    };
  })();

  const resizeCanvasToWorkArea = () => {
    const canvas = canvasRef.current;
    const workArea = workAreaRef.current;
    if (!canvas || !workArea) return;
    const width = Math.max(1, Math.floor(workArea.clientWidth));
    const height = Math.max(1, Math.floor(workArea.clientHeight));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  useEffect(() => {
    resizeCanvasToWorkArea();
    const onResize = () => {
      resizeCanvasToWorkArea();
      drawCanvas(getDrawParams());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [
    calculationMode,
    polygonPoints,
    useImageBorderAsMold,
    moldBoundaryPoints,
    woodBoundaryPolygons,
    woodBoundaryPoints,
    cavityPolygons,
    currentCavityPoints,
    referenceMeasurements,
    draftReferencePoints,
    selectedShape,
    mode,
    rotationDeg,
    zoomFactor,
    measurementsComplete,
    moldBoundaryComplete,
  ]);

  useEffect(() => {
    drawCanvas(getDrawParams());
  }, [
    calculationMode,
    polygonPoints,
    useImageBorderAsMold,
    moldBoundaryPoints,
    woodBoundaryPolygons,
    woodBoundaryPoints,
    cavityPolygons,
    currentCavityPoints,
    referenceMeasurements,
    draftReferencePoints,
    selectedShape,
    mode,
    rotationDeg,
    zoomFactor,
    measurementsComplete,
    moldBoundaryComplete,
  ]);

  const scrollActiveWorkflowControlsIntoView = (behavior = "auto") => {
    window.setTimeout(() => {
      // Prefer active workflow-step controls over the image panel alone so the
      // next mandatory action stays visible while retaining image context below.
      const scrollTarget =
        activeWorkflowControlsRef.current ?? workspaceImagePanelRef.current;
      scrollTarget?.scrollIntoView({
        behavior,
        block: "start",
      });
    }, 0);
  };

  useEffect(() => {
    if (!imageDataUrl) return undefined;

    const scrollTimer = window.setTimeout(() => {
      resizeCanvasToWorkArea();
      // Prefer the active workflow-controls container so the mandatory next
      // action (e.g. Add Reference Measurement) stays visible while still
      // keeping part of the uploaded image in view below it.
      const scrollTarget =
        activeWorkflowControlsRef.current ?? workspaceImagePanelRef.current;
      scrollTarget?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    }, 50);

    return () => {
      window.clearTimeout(scrollTimer);
    };
  }, [imageDataUrl]);

  useEffect(() => {
    if (pendingNewCavityIndex == null) return;
    if (pendingNewCavityIndex >= cavityPolygons.length) return;

    const focusTimer = window.setTimeout(() => {
      const row = cavityRowRefs.current[pendingNewCavityIndex];
      const input = cavityDepthInputRefs.current[pendingNewCavityIndex];

      row?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus({ preventScroll: true });
      input?.select();
      setHighlightedCavityIndex(pendingNewCavityIndex);
      window.setTimeout(() => {
        setHighlightedCavityIndex((current) =>
          current === pendingNewCavityIndex ? null : current
        );
      }, 3000);
      setPendingNewCavityIndex(null);
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [pendingNewCavityIndex, cavityPolygons.length]);

  useEffect(() => {
    if (mode !== "reference" || draftReferencePoints.length !== 2) return;

    setReferencesExpanded(true);

    const focusTimer = window.setTimeout(() => {
      referenceDraftRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      draftKnownLengthInputRef.current?.focus({ preventScroll: true });
      draftKnownLengthInputRef.current?.select();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [mode, draftReferencePoints.length]);

  const deleteReferenceMeasurement = (idx) => {
    if (isReadOnly) return;
    setReferenceMeasurements((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0 && interactionMode !== "modify") {
        setMeasurementsComplete(false);
        setReferencesExpanded(true);
        setMode("reference");
      }
      return next;
    });
    setSelectedShape((prev) => {
      if (prev?.type !== "reference") return prev;
      if (prev.index === idx) return null;
      if (prev.index > idx) return { type: "reference", index: prev.index - 1 };
      return prev;
    });
    setResult(null);
    setError("");
  };

  const saveReferenceMeasurement = () => {
    if (isReadOnly) return;
    const valCm = displayUnits.parseReferenceLengthToCm(draftKnownLengthCm);
    if (!Number.isFinite(valCm) || valCm <= 0) {
      setError(displayUnits.referenceLengthError());
      window.setTimeout(() => {
        draftKnownLengthInputRef.current?.focus();
        draftKnownLengthInputRef.current?.select();
      }, 0);
      return;
    }

    const newIndex = referenceMeasurements.length;
    setReferenceMeasurements((prev) => [
      ...prev,
      {
        calibrationPoints: draftReferencePoints,
        knownLengthCm: valCm,
      },
    ]);
    setDraftReferencePoints([]);
    setDraftKnownLengthCm("");
    setReferencesExpanded(true);
    setResult(null);
    setError("");
    if (interactionMode === "modify") {
      setSelectedShape({ type: "reference", index: newIndex });
      setMode("edit");
    } else {
      setMeasurementsComplete(false);
      setMode("reference");
      setSelectedShape(null);
    }

    scrollActiveWorkflowControlsIntoView("smooth");
  };

  const updateSelectedReferenceLength = (rawValue) => {
    if (isReadOnly) return;
    if (selectedShape?.type !== "reference") return;
    setSelectedReferenceLengthDraft(rawValue);
    const valCm = displayUnits.parseReferenceLengthToCm(rawValue);
    if (!Number.isFinite(valCm) || valCm <= 0) return;
    setReferenceMeasurements((prev) =>
      prev.map((measurement, index) =>
        index === selectedShape.index
          ? { ...measurement, knownLengthCm: valCm }
          : measurement
      )
    );
    setResult(null);
    setError("");
  };

  const onImageUpload = (event) => {
    if (isReadOnly || isDemoMode) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        setError(ui.errors.readUploadedImage);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const initialRotationDeg = img.height > img.width ? 90 : 0;
        imageRef.current = img;
        setImageDataUrl(dataUrl);
        setPolygonPoints([]);
        setUseImageBorderAsMold(false);
        setMoldBoundaryPoints([]);
        setWoodBoundaryPolygons([]);
        setWoodBoundaryPoints([]);
        setCavityPolygons([]);
        setCavityDepthsMm([]);
        setUseMainDepthForCavities(false);
        setCurrentCavityPoints([]);
        setSelectedShape(null);
        setPendingNewCavityIndex(null);
        setHighlightedCavityIndex(null);
        setReferenceMeasurements([]);
        setMeasurementsComplete(false);
        setReferencesExpanded(true);
        setMoldBoundaryComplete(false);
        setWoodBoundaryComplete(false);
        setCavitiesComplete(false);
        setInteractionMode("build");
        setDraftReferencePoints([]);
        setDraftKnownLengthCm("");
        setProjectNotes("");
        setMaxPourThicknessMm("");
        setRecommendedLayerCount(null);
        setPourPlanRows([]);
        setLayerPlanningError("");
        setResinMixRatio(MIX_RATIO_OPTIONS[0].value);
        setFirstFillThicknessMm("");
        setFirstFillVolumeLiters(null);
        setRecommendedFirstFillVolumeLiters(null);
        setFirstFillRecommendationMode(FIRST_FILL_RECOMMENDATION_OPTIONS[0].value);
        setFirstFillError("");
        setRotationDeg(initialRotationDeg);
        setZoomFactor(1);
        setMode("reference");
        setResult(null);
        setResultOutdated(false);
        setError("");
        resizeCanvasToWorkArea();
        drawCanvas(
          getDrawParams({
            image: img,
            polygonPoints: [],
            useImageBorderAsMold: false,
            moldBoundaryPoints: [],
            woodBoundaryPolygons: [],
            woodBoundaryPoints: [],
            cavityPolygons: [],
            currentCavityPoints: [],
            referenceMeasurements: [],
            draftReferencePoints: [],
            selectedShape: null,
            mode: "reference",
            rotationDeg: initialRotationDeg,
            zoomFactor: 1,
          })
        );
      };
      img.onerror = () => setError(ui.errors.readUploadedImage);
      img.src = dataUrl;
    };
    reader.onerror = () => setError(ui.errors.readUploadedImage);
    reader.readAsDataURL(file);
  };

  const getCanvasCoordinates = (event) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return null;

    const rect = canvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (event.clientY - rect.top) * (canvas.height / rect.height);

    const fitScale = getFitScale(
      canvas.width,
      canvas.height,
      image.width,
      image.height,
      rotationDeg
    );
    const scale = fitScale * zoomFactor;
    const display = getDisplayDimensions(image.width, image.height, rotationDeg);
    const drawW = display.width * scale;
    const drawH = display.height * scale;
    const offsetX = (canvas.width - drawW) / 2;
    const offsetY = (canvas.height - drawH) / 2;

    const rotatedX = (canvasX - offsetX) / scale;
    const rotatedY = (canvasY - offsetY) / scale;

    if (
      rotatedX < 0 ||
      rotatedY < 0 ||
      rotatedX > display.width ||
      rotatedY > display.height
    ) {
      return null;
    }

    const point = rotatedPointToImage(
      { x: rotatedX, y: rotatedY },
      image.width,
      image.height,
      rotationDeg
    );

    return {
      x: Math.max(0, Math.min(image.width, point.x)),
      y: Math.max(0, Math.min(image.height, point.y)),
    };
  };

  const getCanvasImageScale = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return 1;
    return (
      getFitScale(canvas.width, canvas.height, image.width, image.height, rotationDeg) *
      zoomFactor
    );
  };

  const getSelectedShapePoints = () => {
    if (!selectedShape) return [];
    if (selectedShape.type === "mold") return moldBoundaryPoints;
    if (selectedShape.type === "wood") {
      return woodBoundaryPolygons[selectedShape.index] || [];
    }
    if (selectedShape.type === "cavity") {
      return cavityPolygons[selectedShape.index] || [];
    }
    if (selectedShape.type === "reference") {
      return referenceMeasurements[selectedShape.index]?.calibrationPoints || [];
    }
    return [];
  };

  const findSelectedVertexAt = (point) => {
    if (!point || !selectedShape) return null;
    const points = getSelectedShapePoints();
    const hitRadius = 12 / getCanvasImageScale();

    for (let idx = 0; idx < points.length; idx += 1) {
      const dx = points[idx].x - point.x;
      const dy = points[idx].y - point.y;
      if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
        return idx;
      }
    }

    return null;
  };

  const updateShapeVertex = (shape, vertexIndex, point) => {
    if (isReadOnly) return;
    if (!shape || vertexIndex == null || !point) return;

    if (shape.type === "mold") {
      setMoldBoundaryPoints((prev) =>
        prev.map((p, idx) => (idx === vertexIndex ? point : p))
      );
      markResultOutdated();
    } else if (shape.type === "wood") {
      setWoodBoundaryPolygons((prev) =>
        prev.map((polygon, polygonIdx) =>
          polygonIdx === shape.index
            ? polygon.map((p, idx) => (idx === vertexIndex ? point : p))
            : polygon
        )
      );
      markResultOutdated();
    } else if (shape.type === "cavity") {
      setCavityPolygons((prev) =>
        prev.map((cavity, cavityIdx) =>
          cavityIdx === shape.index
            ? cavity.map((p, idx) => (idx === vertexIndex ? point : p))
            : cavity
        )
      );
      markResultOutdated();
    } else if (shape.type === "reference") {
      setReferenceMeasurements((prev) =>
        prev.map((measurement, measurementIdx) =>
          measurementIdx === shape.index
            ? {
                ...measurement,
                calibrationPoints: (measurement.calibrationPoints || []).map(
                  (p, idx) => (idx === vertexIndex ? point : p)
                ),
              }
            : measurement
        )
      );
      setResult(null);
    }

    setError("");
  };

  const updateSelectedVertex = (vertexIndex, point) => {
    updateShapeVertex(selectedShape, vertexIndex, point);
  };

  const applyGeometryHit = (hit) => {
    const nextShape = selectionFromHit(hit);
    if (!nextShape) return false;
    setSelectedShape(nextShape);
    setDraftReferencePoints([]);
    setMode("edit");
    setError("");
    if (nextShape.type === "cavity") {
      focusCavityDepthInput(nextShape.index);
    }
    if (nextShape.type === "reference") {
      const measurement = referenceMeasurements[nextShape.index];
      setSelectedReferenceLengthDraft(
        measurement
          ? displayUnits.formatReferenceLength(measurement.knownLengthCm)
          : ""
      );
    }
    return true;
  };

  const getGeometryHitAt = (point) => {
    return hitTestProjectGeometry(
      point,
      {
        cavityPolygons,
        woodBoundaryPolygons,
        moldBoundaryPoints,
        useImageBorderAsMold,
        referenceMeasurements,
      },
      { scale: getCanvasImageScale() }
    );
  };

  const focusCavityDepthInput = (index) => {
    window.setTimeout(() => {
      const row = cavityRowRefs.current[index];
      const input = cavityDepthInputRefs.current[index];
      setEditingCavityDepthIndex(index);
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus({ preventScroll: true });
      input?.select();
      setHighlightedCavityIndex(index);
      window.setTimeout(() => {
        setHighlightedCavityIndex((current) => (current === index ? null : current));
      }, 3000);
    }, 0);
  };

  const confirmCavityDepth = (index) => {
    if (isReadOnly) return;
    const depthMm = displayUnits.readCanonicalMm(cavityDepthsMm[index]);
    if (!Number.isFinite(depthMm) || depthMm <= 0) {
      setError(displayUnits.cavityDepthError());
      setEditingCavityDepthIndex(index);
      window.setTimeout(() => {
        cavityDepthInputRefs.current[index]?.focus();
        cavityDepthInputRefs.current[index]?.select();
      }, 0);
      return;
    }

    setEditingCavityDepthIndex(null);
    setCavityDepthsMm((prev) => {
      const next = [...prev];
      next[index] = String(depthMm);
      return next;
    });
    setError("");
    window.setTimeout(() => {
      cavityControlsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const focusMainResinDepth = () => {
    window.setTimeout(() => {
      finalActionBarRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      mainDepthInputRef.current?.focus({ preventScroll: true });
      mainDepthInputRef.current?.select();
    }, 0);
  };

  const selectExistingShapeAt = (point) => {
    if (calculationMode !== "wood" || !point) return false;
    const hit = getGeometryHitAt(point);
    return applyGeometryHit(hit);
  };

  const onCanvasMouseDown = (event) => {
    if (isReadOnly) return;
    if (calculationMode !== "wood") return;
    if (isGeometryDrawMode(mode)) return;
    const point = getCanvasCoordinates(event);
    if (!point) return;

    const hit = getGeometryHitAt(point);
    if (hit?.hitType === "vertex") {
      const nextShape = selectionFromHit(hit);
      applyGeometryHit(hit);
      dragRef.current = {
        shape: nextShape,
        vertexIndex: hit.vertexIndex,
      };
      suppressNextClickRef.current = true;
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      return;
    }

    if (!selectedShape) return;
    const vertexIndex = findSelectedVertexAt(point);
    if (vertexIndex == null) return;

    dragRef.current = { shape: selectedShape, vertexIndex };
    suppressNextClickRef.current = true;
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  };

  const onCanvasMouseMove = (event) => {
    const point = getCanvasCoordinates(event);

    if (dragRef.current) {
      if (isReadOnly) return;
      updateShapeVertex(
        dragRef.current.shape,
        dragRef.current.vertexIndex,
        point
      );
      return;
    }

    if (canvasRef.current) {
      if (isGeometryDrawMode(mode) || !point) {
        canvasRef.current.style.cursor = "default";
        return;
      }
      const hit = getGeometryHitAt(point);
      canvasRef.current.style.cursor = hit?.hitType === "vertex" ? "grab" : "default";
    }
  };

  const stopDragging = () => {
    dragRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "default";
  };

  const onCanvasClick = (event) => {
    if (isReadOnly) return;
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    if (!hasImage) return;
    const point = getCanvasCoordinates(event);
    if (!point) return;

    if (mode === "edit" && selectExistingShapeAt(point)) return;

    if (
      interactionMode === "modify" &&
      !isGeometryDrawMode(mode) &&
      selectExistingShapeAt(point)
    ) {
      return;
    }

    if (mode === "reference") {
      if (draftReferencePoints.length >= 2) return;
      setDraftReferencePoints((prev) => [...prev, point]);
      return;
    }

    if (calculationMode === "standard" && mode === "polygon") {
      if (!canAddPolygonPoint(polygonPoints.length, maxPolygonPoints)) {
        setError(ui.errors.polygonPointLimit(maxPolygonPoints, "standard"));
        return;
      }
      setPolygonPoints((prev) => [...prev, point]);
      markResultOutdated();
      return;
    }

    if (calculationMode === "wood" && mode === "mold") {
      if (!canAddPolygonPoint(moldBoundaryPoints.length, maxPolygonPoints)) {
        setError(ui.errors.polygonPointLimit(maxPolygonPoints, "mold"));
        return;
      }
      setMoldBoundaryPoints((prev) => [...prev, point]);
      markResultOutdated();
      return;
    }

    if (calculationMode === "wood" && mode === "wood") {
      if (!canAddPolygonPoint(woodBoundaryPoints.length, maxPolygonPoints)) {
        setError(ui.errors.polygonPointLimit(maxPolygonPoints, "wood"));
        return;
      }
      setWoodBoundaryPoints((prev) => [...prev, point]);
      markResultOutdated();
      return;
    }

    if (calculationMode === "wood" && mode === "cavity") {
      if (!canAddPolygonPoint(currentCavityPoints.length, maxPolygonPoints)) {
        setError(ui.errors.polygonPointLimit(maxPolygonPoints, "cavity"));
        return;
      }
      setCurrentCavityPoints((prev) => [...prev, point]);
      markResultOutdated();
    }
  };

  const clearPolygon = () => {
    if (isReadOnly) return;
    setPolygonPoints([]);
    markResultOutdated();
    setError("");
  };

  const clearMoldBoundary = () => {
    if (isReadOnly) return;
    setMoldBoundaryPoints([]);
    setWoodBoundaryPolygons([]);
    setWoodBoundaryPoints([]);
    setCavityPolygons([]);
    setCavityDepthsMm([]);
    setCurrentCavityPoints([]);
    setMoldBoundaryComplete(false);
    setWoodBoundaryComplete(false);
    setCavitiesComplete(false);
    setSelectedShape((prev) =>
      prev?.type === "mold" || prev?.type === "wood" || prev?.type === "cavity" ? null : prev,
    );
    markResultOutdated();
    setError("");
  };

  const clearWoodIslands = () => {
    if (isReadOnly) return;
    setWoodBoundaryPolygons([]);
    setWoodBoundaryPoints([]);
    setCavityPolygons([]);
    setCavityDepthsMm([]);
    setCurrentCavityPoints([]);
    setWoodBoundaryComplete(false);
    setCavitiesComplete(false);
    setSelectedShape((prev) =>
      prev?.type === "wood" || prev?.type === "cavity" ? null : prev,
    );
    markResultOutdated();
    setError("");
  };

  const clearAllCavities = () => {
    if (isReadOnly) return;
    setCavityPolygons([]);
    setCavityDepthsMm([]);
    setCurrentCavityPoints([]);
    setEditingCavityDepthIndex(null);
    setCavitiesComplete(false);
    setSelectedShape((prev) => (prev?.type === "cavity" ? null : prev));
    markResultOutdated();
    setError("");
  };

  const deleteWoodIslandAtIndex = (idx) => {
    if (isReadOnly) return;
    setWoodBoundaryPolygons((prev) => prev.filter((__, woodIdx) => woodIdx !== idx));
    setSelectedShape((prev) => {
      if (prev?.type !== "wood") return prev;
      if (prev.index === idx) return null;
      if (prev.index > idx) return { type: "wood", index: prev.index - 1 };
      return prev;
    });
    if (interactionMode !== "modify") {
      setWoodBoundaryComplete(false);
      setCavitiesComplete(false);
    }
    markResultOutdated();
    setError("");
  };

  const deleteCavityAtIndex = (idx) => {
    if (isReadOnly) return;
    setCavityPolygons((prev) => prev.filter((__, i) => i !== idx));
    setCavityDepthsMm((prev) => prev.filter((__, i) => i !== idx));
    setEditingCavityDepthIndex((prev) => {
      if (prev == null) return prev;
      if (prev === idx) return null;
      if (prev > idx) return prev - 1;
      return prev;
    });
    setSelectedShape((prev) => {
      if (prev?.type !== "cavity") return prev;
      if (prev.index === idx) return null;
      if (prev.index > idx) {
        return { type: "cavity", index: prev.index - 1 };
      }
      return prev;
    });
    markResultOutdated();
    setError("");
  };

  const getActiveWoodDrawingPointCount = () => {
    if (calculationMode !== "wood") return 0;
    if (mode === "mold") return moldBoundaryPoints.length;
    if (mode === "wood") return woodBoundaryPoints.length;
    if (mode === "cavity") return currentCavityPoints.length;
    return 0;
  };

  const undoLastPoint = () => {
    if (isReadOnly) return;
    if (calculationMode !== "wood") return;

    if (mode === "mold") {
      setMoldBoundaryPoints((prev) => prev.slice(0, -1));
    } else if (mode === "wood") {
      setWoodBoundaryPoints((prev) => prev.slice(0, -1));
    } else if (mode === "cavity") {
      setCurrentCavityPoints((prev) => prev.slice(0, -1));
    }

    markResultOutdated();
    setError("");
  };

  const buildProjectSnapshot = () => ({
    appVersion: PROJECT_FILE_VERSION,
    savedAt: new Date().toISOString(),
    image: {
      dataUrl: imageDataUrl,
      width: imageRef.current?.width || null,
      height: imageRef.current?.height || null,
    },
    ui: {
      calculationMode,
      selectedMode: mode,
      rotationDeg,
      zoomFactor,
      selectedShape,
      measurementsComplete,
      cavitiesComplete,
    },
    calibration: {
      referenceMeasurements,
    },
    standardResinArea: {
      polygonPoints,
      resinDepthMm: depthMm,
    },
    woodBoundaryMode: {
      useImageBorderAsMold,
      moldBoundaryPoints,
      woodBoundaryPoints: woodBoundaryPolygons[0] || woodBoundaryPoints,
      woodBoundaryPolygons,
      currentWoodBoundaryPoints: woodBoundaryPoints,
      cavities: cavityPolygons.map((points, idx) => ({
        name: `Cavity ${idx + 1}`,
        points,
        depthMm: cavityDepthsMm[idx] ?? "",
      })),
      cavityDepthsMm,
      useMainDepthForCavities,
      currentCavityPoints,
      mainResinDepthMm: depthMm,
      maxPourThicknessMm,
      recommendedLayerCount,
      pourPlanRows,
      resinMixRatio,
      firstFillThicknessMm,
      firstFillVolumeLiters,
      recommendedFirstFillVolumeLiters,
      firstFillRecommendationMode,
    },
    projectNotes,
    result,
  });

  const saveProject = () => {
    if (isDemoMode) {
      return;
    }
    if (!imageDataUrl) {
      setError(ui.errors.uploadImageBeforeSave);
      return;
    }

    const snapshot = buildProjectSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.href = url;
    link.download = `resin-calculator-project-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setError("");
  };

  const handleSaveProjectClick = () => {
    if (isReadOnly || isDemoMode) return;
    if (workspaceVariant === "dedicated" && onSaveProjectRequest) {
      onSaveProjectRequest();
      return;
    }

    saveProject();
  };

  const restoreImportedProject = (project) => {
    if (!project || typeof project !== "object") {
      throw new Error("Invalid project file.");
    }
    if (!project.image?.dataUrl || typeof project.image.dataUrl !== "string") {
      throw new Error("Invalid project file: missing image data.");
    }

    const img = new Image();
    img.onload = () => {
      const ui = project.ui || {};
      const calibration = project.calibration || {};
      const standard = project.standardResinArea || {};
      const wood = project.woodBoundaryMode || {};
      const importedReferenceMeasurements = calibration.referenceMeasurements || [];
      const importedCavities = Array.isArray(wood.cavities) ? wood.cavities : [];
      const importedCavityPolygons =
        importedCavities.length > 0
          ? importedCavities.map((cavity) => cavity.points || [])
          : wood.cavityPolygons || [];
      const importedCavityDepths =
        importedCavities.length > 0
          ? importedCavities.map((cavity) => cavity.depthMm ?? "")
          : wood.cavityDepthsMm || [];
      const importedWoodBoundaryPolygons = Array.isArray(wood.woodBoundaryPolygons)
        ? wood.woodBoundaryPolygons
        : (wood.woodBoundaryPoints || []).length >= 3
          ? [wood.woodBoundaryPoints]
          : [];
      const importedSelectedShape =
        ui.selectedShape?.type === "wood" && ui.selectedShape.index == null
          ? { type: "wood", index: 0 }
          : ui.selectedShape || null;
      const importedFirstFillRecommendationMode =
        FIRST_FILL_RECOMMENDATION_OPTIONS.some(
          (option) => option.value === wood.firstFillRecommendationMode
        )
          ? wood.firstFillRecommendationMode
          : FIRST_FILL_RECOMMENDATION_OPTIONS[0].value;

      imageRef.current = img;
      dragRef.current = null;
      suppressNextClickRef.current = false;
      setImageDataUrl(project.image.dataUrl);
      const restoreModifyMode = initialInteractionMode === "modify";
      setCalculationMode(ui.calculationMode || "standard");
      setMode(
        restoreModifyMode
          ? "edit"
          : ui.selectedMode || (ui.calculationMode === "wood" ? "wood" : "polygon"),
      );
      setPolygonPoints(standard.polygonPoints || []);
      setUseImageBorderAsMold(wood.useImageBorderAsMold ?? true);
      setMoldBoundaryPoints(wood.moldBoundaryPoints || []);
      setWoodBoundaryPolygons(importedWoodBoundaryPolygons);
      setWoodBoundaryPoints(wood.currentWoodBoundaryPoints || []);
      setCavityPolygons(importedCavityPolygons);
      setCurrentCavityPoints(wood.currentCavityPoints || []);
      setCavityDepthsMm(importedCavityDepths);
      setUseMainDepthForCavities(false);
      setReferenceMeasurements(importedReferenceMeasurements);
      setMeasurementsComplete(
        typeof ui.measurementsComplete === "boolean"
          ? ui.measurementsComplete
          : importedReferenceMeasurements.length > 0
      );
      setReferencesExpanded(importedReferenceMeasurements.length === 0);
      setMoldBoundaryComplete((wood.moldBoundaryPoints || []).length >= 3);
      setWoodBoundaryComplete(importedWoodBoundaryPolygons.length > 0);
      setCavitiesComplete(
        resolveRestoredCavitiesComplete({
          storedCavitiesComplete: ui.cavitiesComplete,
          cavityCount: importedCavityPolygons.length,
          hasCalculatedResult: Boolean(project.result),
        })
      );
      setInteractionMode(restoreModifyMode ? "modify" : "build");
      setDraftReferencePoints([]);
      setDraftKnownLengthCm("");
      setRotationDeg(ui.rotationDeg ?? 0);
      setZoomFactor(ui.zoomFactor ?? 1);
      setDepthMm(wood.mainResinDepthMm ?? standard.resinDepthMm ?? "");
      setMaxPourThicknessMm(wood.maxPourThicknessMm ?? "");
      setRecommendedLayerCount(wood.recommendedLayerCount ?? null);
      setPourPlanRows(Array.isArray(wood.pourPlanRows) ? wood.pourPlanRows : []);
      setResinMixRatio(
        MIX_RATIO_OPTIONS.some((option) => option.value === wood.resinMixRatio)
          ? wood.resinMixRatio
          : MIX_RATIO_OPTIONS[0].value
      );
      setLayerPlanningError("");
      setFirstFillThicknessMm(wood.firstFillThicknessMm ?? "");
      setFirstFillVolumeLiters(wood.firstFillVolumeLiters ?? null);
      setFirstFillRecommendationMode(importedFirstFillRecommendationMode);
      setRecommendedFirstFillVolumeLiters(
        wood.recommendedFirstFillVolumeLiters ??
          (Number.isFinite(Number(wood.firstFillVolumeLiters))
            ? getFirstFillRecommendedVolume(
                wood.firstFillVolumeLiters,
                importedFirstFillRecommendationMode
              )
            : null)
      );
      setFirstFillError("");
      setProjectNotes(project.projectNotes || "");
      setSelectedShape(importedSelectedShape);
      setResult(project.result || null);
      setResultOutdated(false);
      setError("");
      resizeCanvasToWorkArea();
      queueMicrotask(() => {
        onProjectRestored?.();
      });
    };
    img.onerror = () => {
      setError("Invalid project file: image data could not be loaded.");
    };
    img.src = project.image.dataUrl;
  };

  buildProjectSnapshotRef.current = buildProjectSnapshot;
  restoreImportedProjectRef.current = restoreImportedProject;

  useImperativeHandle(ref, () => ({
    getProjectSnapshot: () => buildProjectSnapshotRef.current(),
    restoreProjectSnapshot: (project) => restoreImportedProjectRef.current(project),
  }));

  const exportPdf = () => {
    if (isDemoMode) {
      return;
    }
    if (!result) {
      setError(ui.errors.calculateBeforePdf);
      return;
    }
    if (!pdfExport) {
      setError(ui.errors.pdfExportUnavailable);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      setError("Project image is not available for PDF export.");
      return;
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (heightNeeded) => {
      if (y + heightNeeded > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addSectionTitle = (title) => {
      ensureSpace(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(title, margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    const addLine = (label, value = "") => {
      const columnGap = 10;
      const valueColumnWidth = 58;
      const labelColumnWidth = contentWidth - valueColumnWidth - columnGap;
      const valueRightX = margin + contentWidth;
      const lineHeight = 5;

      doc.setFont("helvetica", "bold");
      const labelLines = doc.splitTextToSize(`${label}:`, labelColumnWidth);
      doc.setFont("helvetica", "normal");
      const valueLines = doc.splitTextToSize(String(value), valueColumnWidth);
      const rowLineCount = Math.max(labelLines.length, valueLines.length);

      ensureSpace(rowLineCount * lineHeight + 2);

      doc.setFont("helvetica", "bold");
      labelLines.forEach((line, idx) => {
        doc.text(line, margin, y + idx * lineHeight);
      });

      doc.setFont("helvetica", "normal");
      valueLines.forEach((line, idx) => {
        doc.text(line, valueRightX, y + idx * lineHeight, { align: "right" });
      });

      y += rowLineCount * lineHeight + 2;
    };

    const addWrappedText = (text) => {
      const lines = doc.splitTextToSize(text, contentWidth);
      ensureSpace(lines.length * 5);
      doc.text(lines, margin, y);
      y += lines.length * 5;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Epoxy Resin Volume Estimator", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Report generated: ${new Date().toLocaleString()}`, margin, y);
    y += 10;

    addSectionTitle("Project Image");
    const imageData = canvas.toDataURL("image/png");
    const imageRatio = canvas.width / canvas.height;
    const pdfImageWidth = contentWidth;
    const pdfImageHeight = Math.min(pdfImageWidth / imageRatio, 115);
    ensureSpace(pdfImageHeight + 8);
    doc.addImage(imageData, "PNG", margin, y, pdfImageWidth, pdfImageHeight);
    y += pdfImageHeight + 10;

    addSectionTitle("Calculation Mode");
    addLine(
      "Mode",
      result.calculationType === "wood"
        ? "Wood Boundary Mode"
        : "Standard Resin Area"
    );

    addSectionTitle("Reference Measurements");
    if (referenceMeasurements.length === 0) {
      addWrappedText("No reference measurements saved.");
    } else {
      referenceMeasurements.forEach((ref, idx) => {
        const points = ref.calibrationPoints || [];
        const direction =
          points.length === 2
            ? classifyReferenceDirection(
                points[1].x - points[0].x,
                points[1].y - points[0].y
              )
            : "unknown";
        addLine(
          `Reference ${idx + 1}`,
          `${displayUnits.formatReferenceLengthWithUnit(ref.knownLengthCm)} (${direction})`
        );
      });
    }

    addSectionTitle("Results");
    if (result.calculationType === "standard") {
      addLine("Resin area", `${formatNumber(result.areaCm2, 2)} cm²`);
      addLine("Depth", displayUnits.formatDepthWithUnit(depthMm));
      addLine("Volume", `${formatNumber(result.volumeLiters, 3)} L`);
      addLine(
        "Recommended amount (+10%)",
        `${formatNumber(result.recommendedVolumeLiters, 3)} L`
      );
    } else {
      addLine("Mold area", `${formatNumber(result.moldAreaCm2, 2)} cm²`);
      addLine("Total wood island area", `${formatNumber(result.woodAreaCm2, 2)} cm²`);
      addLine("Wood islands", `${result.woodIslandCount ?? woodBoundaryPolygons.length}`);
      addLine(
        "Main resin area",
        `${formatNumber(result.mainResinAreaCm2, 2)} cm²`
      );
      addLine(
        "Main resin volume",
        `${formatNumber(result.mainVolumeLiters, 3)} L`
      );

      if (advancedReports && firstFillVolumeLiters != null) {
        const selectedFirstFillOption = getFirstFillRecommendationOption(
          firstFillRecommendationMode
        );
        addSectionTitle("First Fill Seal Coat");
        addLine(
          "First fill thickness",
          displayUnits.formatDepthWithUnit(firstFillThicknessMm)
        );
        addLine(
          "First fill seal coat volume",
          `${formatNumber(firstFillVolumeLiters, 3)} L`
        );
        addLine(
          "Selected first fill recommendation",
          selectedFirstFillOption.label
        );
        addLine(
          "Selected first fill amount",
          `${formatNumber(getFirstFillRecommendedVolume(firstFillVolumeLiters, firstFillRecommendationMode), 3)} L`
        );
      }

      if (advancedReports && pourPlanRows.length > 0) {
        addSectionTitle("Pour Layer Planning");
        addLine("Maximum pour thickness", displayUnits.formatDepthWithUnit(maxPourThicknessMm));
        addLine("Resin mix ratio (A:B)", getMixRatioOption(resinMixRatio).label);
        pourPlanRows.forEach((row) => {
          const recommendedVolumeLiters = getPourPlanRecommendedVolume(
            row,
            firstFillRecommendationMode
          );
          const { componentAMl, componentBMl } = calculateMixComponents(
            recommendedVolumeLiters,
            resinMixRatio
          );
          addLine(
            row.label,
            `${displayUnits.formatDepthWithUnit(row.thicknessMm)} | ${formatNumber(row.volumeLiters, 3)} L | ${formatNumber(recommendedVolumeLiters, 3)} L recommended | A ${componentAMl} ml | B ${componentBMl} ml`
          );
        });
      }

      if (Array.isArray(result.cavities) && result.cavities.length > 0) {
        result.cavities.forEach((cavity, idx) => {
          ensureSpace(22);
          doc.setFont("helvetica", "bold");
          doc.text(cavity.name || `Cavity ${idx + 1}`, margin, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          addLine("Area", `${formatNumber(cavity.areaCm2, 2)} cm²`);
          addLine("Depth", displayUnits.formatDepthWithUnit(cavity.depthMm));
          addLine("Volume", `${formatNumber(cavity.volumeLiters, 3)} L`);
        });
      } else {
        addWrappedText("No isolated cavities included.");
      }

      addSectionTitle("Totals");
      addLine("Total resin volume", `${formatNumber(result.volumeLiters, 3)} L`);
      addLine(
        "Recommended amount (+10%)",
        `${formatNumber(result.recommendedVolumeLiters, 3)} L`
      );
    }

    addSectionTitle("Scale Information");
    const scaleQuality = result.scaleQuality || referenceQuality;
    addLine(
      "Horizontal scale average",
      `${formatNumber(scaleQuality?.scaleXAvgCmPerPx, 6)} cm/pixel`
    );
    addLine(
      "Vertical scale average",
      `${formatNumber(scaleQuality?.scaleYAvgCmPerPx, 6)} cm/pixel`
    );
    addLine(
      "References used",
      `${(scaleQuality?.horizontalCount || 0) + (scaleQuality?.verticalCount || 0)} axis references (${scaleQuality?.diagonalCount || 0} diagonal tracked)`
    );

    addSectionTitle("Project Notes");
    if (projectNotes.trim()) {
      addWrappedText(projectNotes.trim());
    } else {
      addWrappedText("No project notes entered.");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    doc.save(`resin-calculator-report-${timestamp}.pdf`);
    setError("");
  };

  const fitToScreen = () => {
    setZoomFactor(1);
  };

  const zoomIn = () => {
    setZoomFactor((prev) => Math.min(prev * 1.2, 20));
  };

  const zoomOut = () => {
    setZoomFactor((prev) => Math.max(prev / 1.2, 0.1));
  };

  const resetZoom = () => {
    setZoomFactor(1);
  };

  const rotateLeft = () => {
    if (isReadOnly) return;
    setRotationDeg((prev) => ROTATIONS[(ROTATIONS.indexOf(prev) + 3) % 4]);
    setZoomFactor(1);
  };

  const rotateRight = () => {
    if (isReadOnly) return;
    setRotationDeg((prev) => ROTATIONS[(ROTATIONS.indexOf(prev) + 1) % 4]);
    setZoomFactor(1);
  };

  const calculate = async () => {
    if (isReadOnly) return;
    setError("");
    setResult(null);
    setResultOutdated(false);

    try {
      const response = await fetch(`${API_BASE_URL}/calculate`, {
        method: "POST",
        headers: await buildAuthHeaders(),
        body: JSON.stringify({
          polygonPoints,
          referenceMeasurements,
          depthMm,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Calculation failed.");
      }
      setResult({ ...data, calculationType: "standard" });
      setResultOutdated(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const calculateWood = async () => {
    if (isReadOnly) return;
    setError("");
    setResult(null);
    setResultOutdated(false);
    const image = imageRef.current;
    if (!image) {
      setError(ui.errors.uploadImageFirst);
      return;
    }

    const mainPourDepthMm = displayUnits.readCanonicalMm(depthMm);
    if (!Number.isFinite(mainPourDepthMm) || mainPourDepthMm <= 0) {
      setError(displayUnits.mainPourDepthError());
      return;
    }

    const resolvedCavityDepths = resolveCavityDepthsForApi();
    if (cavityPolygons.length > 0) {
      const invalid = resolvedCavityDepths.some(
        (d) => !Number.isFinite(d) || d <= 0
      );
      if (invalid) {
        setError(displayUnits.cavityDepthError());
        return;
      }
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}${getCalculatorApiPath(CALCULATOR_API_KIND.WOOD, isDemoMode)}`,
        {
          method: "POST",
          headers: await getCalculatorRequestHeaders(isDemoMode),
          body: JSON.stringify({
            imageWidth: image.width,
            imageHeight: image.height,
            useImageBorderAsMold,
            moldBoundaryPoints,
            woodBoundaryPoints: woodBoundaryPolygons[0] || [],
            woodBoundaryPolygons,
            cavityPolygons,
            referenceMeasurements,
            mainPourDepthMm: mainPourDepthMm,
            cavityDepthsMm: resolvedCavityDepths,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Calculation failed.");
      }
      setResult({ ...data, calculationType: "wood" });
      setResultOutdated(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMainResinDepthKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    calculateWood();
  };

  const focusPourLayerPlanning = () => {
    requestAnimationFrame(() => {
      maxPourThicknessInputRef.current?.focus();
    });
  };

  const calculatePourLayers = async () => {
    if (isReadOnly) return;
    if (!layerCalculation) {
      setRecommendedLayerCount(null);
      setPourPlanRows([]);
      setLayerPlanningError(ui.errors.layerPlanningUnavailable);
      return;
    }
    const mainDepth = displayUnits.readCanonicalMm(depthMm);
    const maxPourThickness = displayUnits.readCanonicalMm(maxPourThicknessMm);
    const hasFirstFillThickness = String(firstFillThicknessMm).trim() !== "";
    const firstFillThickness = displayUnits.readCanonicalMm(firstFillThicknessMm);
    const resinSurfaceAreaCm2 = getCalculatedResinSurfaceAreaCm2();

    if (!Number.isFinite(mainDepth) || mainDepth <= 0) {
      setRecommendedLayerCount(null);
      setPourPlanRows([]);
      setLayerPlanningError(ui.errors.mainDepthBeforeLayers);
      focusPourLayerPlanning();
      return;
    }
    if (!Number.isFinite(maxPourThickness) || maxPourThickness <= 0) {
      setRecommendedLayerCount(null);
      setPourPlanRows([]);
      setLayerPlanningError(ui.errors.maxPourThicknessPositive);
      focusPourLayerPlanning();
      return;
    }
    if (!resinSurfaceAreaCm2) {
      setRecommendedLayerCount(null);
      setPourPlanRows([]);
      setLayerPlanningError(ui.errors.calculateVolumeBeforePlanning);
      focusPourLayerPlanning();
      return;
    }
    if (hasFirstFillThickness && (!Number.isFinite(firstFillThickness) || firstFillThickness <= 0 || firstFillThickness > mainDepth)) {
      setRecommendedLayerCount(null);
      setPourPlanRows([]);
      setLayerPlanningError(ui.errors.firstFillThicknessRange);
      focusPourLayerPlanning();
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}${getCalculatorApiPath(CALCULATOR_API_KIND.POUR_LAYERS, isDemoMode)}`,
        {
          method: "POST",
          headers: await getCalculatorRequestHeaders(isDemoMode),
          body: JSON.stringify({
            mainDepthMm: mainDepth,
            maxPourThicknessMm: maxPourThickness,
            resinSurfaceAreaCm2,
            firstFillThicknessMm: hasFirstFillThickness ? firstFillThickness : null,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Pour layer calculation failed.");
      setRecommendedLayerCount(data.layerCount);
      setPourPlanRows(data.rows);
      setLayerPlanningError("");
    } catch (err) {
      setRecommendedLayerCount(null);
      setPourPlanRows([]);
      setLayerPlanningError(err.message);
    }
    focusPourLayerPlanning();
  };

  const handleMaxPourThicknessKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    calculatePourLayers();
  };

  const focusFirstFillPlanning = () => {
    requestAnimationFrame(() => {
      firstFillThicknessInputRef.current?.focus();
    });
  };

  const getCalculatedResinSurfaceAreaCm2 = () => {
    if (!result || resultOutdated) return null;
    const cavityAreaFromItems = Array.isArray(result.cavities)
      ? result.cavities.reduce((sum, cavity) => {
          const area = Number(cavity.areaCm2);
          return sum + (Number.isFinite(area) ? area : 0);
        }, 0)
      : 0;
    const cavityArea =
      cavityAreaFromItems > 0 ? cavityAreaFromItems : Number(result.cavityAreaCm2) || 0;
    const area =
      result.calculationType === "wood"
        ? Number(result.mainResinAreaCm2) + cavityArea
        : result.areaCm2;
    const numericArea = Number(area);
    return Number.isFinite(numericArea) && numericArea > 0 ? numericArea : null;
  };

  const calculateFirstFillVolume = async () => {
    if (isReadOnly) return;
    if (!layerCalculation) {
      setFirstFillVolumeLiters(null);
      setRecommendedFirstFillVolumeLiters(null);
      setFirstFillError(ui.errors.firstFillPlanningUnavailable);
      return;
    }
    const resinSurfaceAreaCm2 = getCalculatedResinSurfaceAreaCm2();
    const firstFillThickness = displayUnits.readCanonicalMm(firstFillThicknessMm);

    if (!resinSurfaceAreaCm2) {
      setFirstFillVolumeLiters(null);
      setRecommendedFirstFillVolumeLiters(null);
      setFirstFillError(ui.errors.calculateVolumeBeforePlanning);
      focusFirstFillPlanning();
      return;
    }
    if (!Number.isFinite(firstFillThickness) || firstFillThickness <= 0) {
      setFirstFillVolumeLiters(null);
      setRecommendedFirstFillVolumeLiters(null);
      setFirstFillError(ui.errors.firstFillThicknessPositive);
      focusFirstFillPlanning();
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}${getCalculatorApiPath(CALCULATOR_API_KIND.FIRST_FILL, isDemoMode)}`,
        {
          method: "POST",
          headers: await getCalculatorRequestHeaders(isDemoMode),
          body: JSON.stringify({ resinSurfaceAreaCm2, firstFillThicknessMm: firstFillThickness }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "First fill calculation failed.");
      setFirstFillVolumeLiters(data.volumeLiters);
      setRecommendedFirstFillVolumeLiters(
        getFirstFillRecommendedVolume(data.volumeLiters, firstFillRecommendationMode)
      );
      setFirstFillError("");
    } catch (err) {
      setFirstFillVolumeLiters(null);
      setRecommendedFirstFillVolumeLiters(null);
      setFirstFillError(err.message);
    }
    focusFirstFillPlanning();
  };

  const handleFirstFillThicknessKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    calculateFirstFillVolume();
  };

  const startAddReferenceMeasurement = () => {
    if (isReadOnly) return;
    setMode("reference");
    setSelectedShape(null);
    setReferencesExpanded(true);
    setDraftReferencePoints([]);
    setDraftKnownLengthCm("");
  };

  const startAddWoodIsland = () => {
    if (isReadOnly) return;
    setMode("wood");
    setSelectedShape(null);
    setDraftReferencePoints([]);
    if (interactionMode !== "modify") {
      setWoodBoundaryComplete(false);
      setCavitiesComplete(false);
    }
  };

  const startAddCavity = () => {
    if (isReadOnly) return;
    setMode("cavity");
    setSelectedShape(null);
    setDraftReferencePoints([]);
    if (interactionMode !== "modify") {
      setCavitiesComplete(false);
    }
  };

  const enterModifyProject = () => {
    if (isReadOnly) return;
    setInteractionMode("modify");
    setMode("edit");
    setDraftReferencePoints([]);
    setError("");
  };

  const deleteSelectedReferenceMeasurement = () => {
    if (selectedShape?.type !== "reference") return;
    deleteReferenceMeasurement(selectedShape.index);
  };

  const deleteSelectedCavity = () => {
    if (isReadOnly) return;
    if (selectedShape?.type !== "cavity") return;
    deleteCavityAtIndex(selectedShape.index);
  };

  const finishWoodIsland = () => {
    if (isReadOnly) return;
    if (woodBoundaryPoints.length < 3) {
      setError(ui.errors.woodIslandMinPoints);
      return;
    }

    const newWoodIndex = woodBoundaryPolygons.length;
    setWoodBoundaryPolygons((prev) => [...prev, woodBoundaryPoints]);
    setWoodBoundaryPoints([]);
    setSelectedShape({ type: "wood", index: newWoodIndex });
    if (interactionMode === "modify") {
      setMode("edit");
    } else {
      setWoodBoundaryComplete(false);
      setCavitiesComplete(false);
    }
    markResultOutdated();
    setError("");
  };

  const deleteSelectedWoodIsland = () => {
    if (isReadOnly) return;
    if (selectedShape?.type !== "wood") return;
    const index = selectedShape.index;
    setWoodBoundaryPolygons((prev) => prev.filter((_, idx) => idx !== index));
    setSelectedShape(null);
    if (interactionMode !== "modify") {
      setWoodBoundaryComplete(false);
      setCavitiesComplete(false);
    }
    markResultOutdated();
    setError("");
  };

  const finishCavity = () => {
    if (isReadOnly) return;
    if (currentCavityPoints.length < 3) {
      setError(ui.errors.cavityMinPoints);
      return;
    }
    const newCavityIndex = cavityPolygons.length;
    setCavityPolygons((prev) => [...prev, currentCavityPoints]);
    setCavityDepthsMm((prev) => [...prev, ""]);
    setCurrentCavityPoints([]);
    setSelectedShape({ type: "cavity", index: newCavityIndex });
    setPendingNewCavityIndex(newCavityIndex);
    setHighlightedCavityIndex(newCavityIndex);
    setEditingCavityDepthIndex(newCavityIndex);
    if (interactionMode === "modify") {
      setMode("edit");
    } else {
      setCavitiesComplete(false);
    }
    markResultOutdated();
    setError("");
  };

  const renderHelpPopup = (helpKey, help) => {
    return (
      <HelpIcon
        helpKey={helpKey}
        help={help}
        activeHelpKey={activeModeHelp}
        aboutLabel={ui.helpAbout(help.title)}
        onToggle={(nextHelpKey) =>
          setActiveModeHelp((prev) => (prev === nextHelpKey ? null : nextHelpKey))
        }
      />
    );
  };

  const hasUploadedPhoto = Boolean(imageDataUrl);
  const activeWorkflowStage = !hasUploadedPhoto
    ? "photo"
    : calculationMode === "wood"
      ? !measurementsComplete
        ? "references"
        : !moldBoundaryComplete
          ? "mold"
          : !woodBoundaryComplete
            ? "wood"
            : !cavitiesComplete
              ? "cavities"
              : result?.calculationType === "wood" && !resultOutdated
                ? null
                : "calculate"
      : !measurementsComplete
        ? "references"
        : polygonPoints.length < 3
          ? "area"
          : result?.calculationType === "standard" && !resultOutdated
            ? null
            : "calculate";

  const workflowSteps =
    calculationMode === "wood"
      ? [
          {
            label: ui.workflow.references,
            complete: measurementsComplete,
            current: activeWorkflowStage === "references",
          },
          {
            label: ui.workflow.mold,
            complete: moldBoundaryComplete,
            current: activeWorkflowStage === "mold",
          },
          {
            label: ui.workflow.wood,
            complete: woodBoundaryComplete,
            current: activeWorkflowStage === "wood",
          },
          {
            label: ui.workflow.cavities,
            complete: cavitiesComplete,
            current: activeWorkflowStage === "cavities",
          },
          {
            label: ui.workflow.calculate,
            complete: result?.calculationType === "wood" && !resultOutdated,
            current: activeWorkflowStage === "calculate",
          },
        ]
      : [
          {
            label: ui.workflow.references,
            complete: measurementsComplete,
            current: activeWorkflowStage === "references",
          },
          {
            label: ui.workflow.area,
            complete: polygonPoints.length >= 3,
            current: activeWorkflowStage === "area",
          },
          {
            label: ui.workflow.calculate,
            complete: result?.calculationType === "standard" && !resultOutdated,
            current: activeWorkflowStage === "calculate",
          },
        ];

  const isModifyMode = interactionMode === "modify";
  const showModifyProjectControl =
    !isDemoMode &&
    canEnterModifyProject({
    isReadOnly,
    interactionMode,
    calculationMode,
    measurementsComplete,
    moldBoundaryComplete,
    woodBoundaryComplete,
    cavitiesComplete,
    hasCalculatedResult: Boolean(result),
  });
  const showReferenceFamily =
    Boolean(imageDataUrl) &&
    (!measurementsComplete || isModifyMode || calculationMode === "wood");

  return (
    <div className={`container${isReadOnly ? " container--read-only" : ""}`}>
      {showHeader ? <AppHeader /> : null}

      {workspaceVariant !== "dedicated" ? (
        <div className="calculation-mode-bar">
          <span className="calculation-mode-label">{ui.title}</span>
        </div>
      ) : null}

      <div className={`controls${isReadOnly ? " controls--read-only" : ""}`}>
        {!isDemoMode ? (
        <div className="workflow-row">
          <span className="workflow-section-label">{ui.uploadPhoto}</span>
          <label
            className={`upload-control ${
              activeWorkflowStage === "photo" ? "upload-control-current" : ""
            } ${hasUploadedPhoto ? "upload-control-complete" : ""}`}
          >
            <span className="upload-label-row">
              {hasUploadedPhoto ? ui.photoUploaded : ui.chooseFile}
              {renderHelpPopup("photo", ui.help.photo)}
            </span>
            <input type="file" accept="image/*" onChange={onImageUpload} />
            {activeWorkflowStage === "photo" && (
              <span className="upload-helper">{ui.uploadHelper}</span>
            )}
          </label>
          <aside className="upload-onboarding-panel" aria-label="Upload photo guidance">
            <span className="onboarding-badge">1</span>
            <div>
              <h2>{ui.step1Title}</h2>
              <p>{ui.step1Body}</p>
            </div>
          </aside>
        </div>
        ) : null}

      </div>

      <div className="workflow-progress" aria-label={ui.workflowProgress}>
        {workflowSteps.map((step, idx) => (
          <div
            key={step.label}
            className={`workflow-progress-step ${
              step.complete ? "workflow-step-complete" : ""
            } ${step.current ? "workflow-step-current" : ""}`}
          >
            <span className="workflow-step-marker">
              {step.complete ? "✓" : idx + 1}
            </span>
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      {mode === "reference" && draftReferencePoints.length === 2 && (
        <div className="reference-draft" ref={referenceDraftRef}>
          <div>
            {ui.referenceDraft(displayUnits.lengthLabel)}
          </div>
          <div className="reference-draft-row">
            <label className="reference-length-field">
              {displayUnits.referenceLengthLabel()}
              <LengthUnitInput
                ref={draftKnownLengthInputRef}
                unit={displayUnits.lengthLabel}
                step="0.1"
                value={draftKnownLengthCm}
                onChange={(e) => setDraftKnownLengthCm(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  saveReferenceMeasurement();
                }}
                placeholder="e.g. 10.0"
              />
            </label>
            <button onClick={saveReferenceMeasurement}>
              {ui.saveReferenceMeasurement}
            </button>
          </div>
        </div>
      )}

      {woodLiveSummary && (
        <details className="live-estimate">
          <summary>Advanced Details</summary>
          <div>Mold area: {formatNumber(woodLiveSummary.moldAreaCm2, 2)} cm²</div>
          <div>
            Total wood island area: {formatNumber(woodLiveSummary.woodAreaCm2, 2)} cm²
          </div>
          <div>Wood islands: {woodLiveSummary.woodIslandCount}</div>
          <div>
            Main resin area: {formatNumber(woodLiveSummary.mainResinAreaCm2, 2)} cm²
          </div>
          <div>
            Main volume: {formatNumber(woodLiveSummary.mainVolumeLiters, 3)} L
          </div>
          <div>
            Total resin volume: {formatNumber(woodLiveSummary.totalVolumeLiters, 3)} L
          </div>
          <div>
            Recommended amount (+10%):{" "}
            {formatNumber(woodLiveSummary.recommendedVolumeLiters, 3)} L
          </div>
        </details>
      )}

      {imageDataUrl && (
        <>
        <div className="workspace-controls">
        <div
          className="active-workflow-controls"
          ref={activeWorkflowControlsRef}
        >
          {showModifyProjectControl && (
            <button
              type="button"
              className="primary-action modify-project-button"
              onClick={enterModifyProject}
            >
              {ui.modifyProject}
            </button>
          )}
          {isModifyMode && (
            <span className="modify-mode-badge" role="status">
              {ui.modifyProjectActive}
            </span>
          )}

          {showReferenceFamily && (
            <GeometryFamilyGroup
              family="reference"
              label={ui.referenceMeasurements}
              status={measurementsComplete ? ui.referencesComplete : null}
            >
              {(!measurementsComplete || isModifyMode) && (
                <button
                  className={
                    mode === "reference"
                      ? "mode-active secondary-action"
                      : activeWorkflowStage === "references" &&
                          referenceMeasurements.length === 0
                        ? "primary-action"
                        : "secondary-action"
                  }
                  onClick={startAddReferenceMeasurement}
                  title="Click then select two points on the image"
                >
                  {ui.addReferenceMeasurement}
                  {renderHelpPopup("reference", ui.help.reference)}
                </button>
              )}
              <button
                className="secondary-action"
                onClick={() => {
                  if (selectedShape?.type !== "reference") return;
                  setMode("edit");
                  setDraftReferencePoints([]);
                  window.setTimeout(() => {
                    selectedReferenceLengthInputRef.current?.focus();
                    selectedReferenceLengthInputRef.current?.select();
                  }, 0);
                }}
                disabled={selectedShape?.type !== "reference" || isReadOnly}
              >
                {ui.editSelectedReference}
              </button>
              <button
                className="secondary-action"
                onClick={deleteSelectedReferenceMeasurement}
                disabled={selectedShape?.type !== "reference" || isReadOnly}
              >
                {ui.deleteSelectedReference}
              </button>
              {!isModifyMode && !measurementsComplete && (
                <button
                  className={
                    activeWorkflowStage === "references" &&
                    referenceMeasurements.length > 0
                      ? "primary-action"
                      : "secondary-action"
                  }
                  onClick={() => {
                    if (referenceMeasurements.length === 0) {
                      setError(ui.errors.addReferenceBeforeContinue);
                      setMode("reference");
                      return;
                    }
                    setMeasurementsComplete(true);
                    setReferencesExpanded(false);
                    setDraftReferencePoints([]);
                    setDraftKnownLengthCm("");
                    if (calculationMode === "wood") {
                      setUseImageBorderAsMold(false);
                      setMode("mold");
                    } else {
                      setMode("polygon");
                    }
                    setResult(null);
                    setError("");
                    scrollActiveWorkflowControlsIntoView("auto");
                  }}
                >
                  {ui.doneWithMeasurements}
                </button>
              )}
              {selectedShape?.type === "reference" && (
                <label className="reference-length-field">
                  {displayUnits.referenceLengthLabel()}
                  <LengthUnitInput
                    ref={selectedReferenceLengthInputRef}
                    unit={displayUnits.lengthLabel}
                    step="0.1"
                    value={selectedReferenceLengthDraft}
                    onChange={(e) => updateSelectedReferenceLength(e.target.value)}
                    disabled={isReadOnly}
                  />
                </label>
              )}
              {referenceMeasurements.length > 0 && (
                <div className="reference-list-items geometry-family-items">
                  {referenceMeasurements.map((ref, idx) => (
                    <button
                      type="button"
                      key={idx}
                      className={`reference-item ${
                        selectedShape?.type === "reference" &&
                        selectedShape.index === idx
                          ? "reference-item--selected"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedShape({ type: "reference", index: idx });
                        setMode("edit");
                        setDraftReferencePoints([]);
                      }}
                    >
                      <span className="reference-label">
                        {ui.referenceItem(idx + 1)}:{" "}
                        {displayUnits.formatReferenceLengthWithUnit(ref.knownLengthCm)}
                        {(() => {
                          const pts = ref.calibrationPoints || [];
                          if (pts.length !== 2) return "";
                          const dx = pts[1].x - pts[0].x;
                          const dy = pts[1].y - pts[0].y;
                          return ` (${classifyReferenceDirection(dx, dy)})`;
                        })()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {!isModifyMode && activeWorkflowStage === "references" && (
                <aside
                  className="upload-onboarding-panel"
                  aria-label="Reference measurement guidance"
                >
                  <span className="onboarding-badge">2</span>
                  <div>
                    <h2>{ui.step2Title}</h2>
                    <p>{ui.step2Body}</p>
                  </div>
                </aside>
              )}
            </GeometryFamilyGroup>
          )}

          {measurementsComplete && calculationMode === "standard" && (
            <>
              <button
                className={`${mode === "polygon" ? "mode-active" : ""} ${
                  activeWorkflowStage === "area" && polygonPoints.length < 3
                    ? "primary-action"
                    : "secondary-action"
                }`}
                onClick={() => {
                  setMode("polygon");
                  setDraftReferencePoints([]);
                  setDraftKnownLengthCm("");
                }}
              >
                Polygon Mode
              </button>
              <button className="secondary-action" onClick={clearPolygon} disabled={isReadOnly}>
                Clear Polygon
              </button>
              <label>
                {displayUnits.resinDepthLabel()}:
                <LengthUnitInput
                  unit={displayUnits.lengthLabel}
                  step="0.1"
                  value={depthMm === "" ? "" : displayUnits.formatDepth(depthMm)}
                  onChange={(e) => {
                    setDepthMm(displayUnits.storeDepthInput(e.target.value));
                    markResultOutdated();
                  }}
                />
              </label>
              <button
                className={
                  activeWorkflowStage === "calculate"
                    ? "primary-action"
                    : "secondary-action"
                }
                onClick={calculate}
              >
                {ui.calculate}
              </button>
            </>
          )}

          {isModifyMode && calculationMode === "wood" && (
            <>
              <GeometryFamilyGroup
                family="mold"
                label={ui.moldBoundary}
                status={moldBoundaryComplete ? ui.moldComplete : null}
              >
                <button
                  className="secondary-action"
                  onClick={() => {
                    setMode("edit");
                    setSelectedShape({ type: "mold" });
                    setDraftReferencePoints([]);
                  }}
                  disabled={moldBoundaryPoints.length < 3 || isReadOnly}
                >
                  {ui.editMoldBoundary}
                </button>
                {moldBoundaryPoints.length < 3 && (
                  <button
                    className={`${mode === "mold" ? "mode-active" : ""} secondary-action`}
                    onClick={() => {
                      setUseImageBorderAsMold(false);
                      setMode("mold");
                      setSelectedShape(null);
                      setDraftReferencePoints([]);
                    }}
                  >
                    {ui.drawMoldBoundary}
                  </button>
                )}
                <button
                  className="secondary-action"
                  onClick={clearMoldBoundary}
                  disabled={isReadOnly}
                >
                  {ui.clearMoldBoundary}
                </button>
              </GeometryFamilyGroup>

              <GeometryFamilyGroup
                family="wood"
                label={ui.woodIslands}
                status={woodBoundaryComplete ? ui.woodComplete : null}
              >
                <button
                  className="secondary-action"
                  onClick={() => {
                    setMode("edit");
                    setDraftReferencePoints([]);
                  }}
                  disabled={selectedShape?.type !== "wood"}
                >
                  {ui.editSelectedWoodIsland}
                </button>
                <button
                  className={`${mode === "wood" ? "mode-active" : ""} secondary-action`}
                  onClick={startAddWoodIsland}
                >
                  {ui.addWoodIsland}
                  {renderHelpPopup("wood-boundary", ui.help.wood)}
                </button>
                <button
                  className="secondary-action"
                  onClick={finishWoodIsland}
                  disabled={woodBoundaryPoints.length < 3}
                >
                  {ui.completeCurrentIsland}
                </button>
                <button
                  className="secondary-action"
                  onClick={deleteSelectedWoodIsland}
                  disabled={selectedShape?.type !== "wood" || isReadOnly}
                >
                  {ui.deleteSelectedWoodIsland}
                </button>
                <button
                  className="secondary-action"
                  onClick={clearWoodIslands}
                  disabled={isReadOnly}
                >
                  {ui.clearWoodIslands}
                </button>
                <button
                  className="secondary-action"
                  onClick={undoLastPoint}
                  disabled={getActiveWoodDrawingPointCount() === 0 || isReadOnly}
                >
                  {ui.undoLastPoint}
                </button>
              </GeometryFamilyGroup>

              <GeometryFamilyGroup
                family="cavity"
                label={ui.resinCavities}
                status={cavitiesComplete ? ui.cavitiesComplete : null}
                groupRef={cavityControlsRef}
              >
                <button
                  className="secondary-action"
                  onClick={() => {
                    setMode("edit");
                    setDraftReferencePoints([]);
                  }}
                  disabled={selectedShape?.type !== "cavity"}
                >
                  {ui.editSelectedCavity}
                </button>
                <button
                  className={`${mode === "cavity" ? "mode-active" : ""} secondary-action`}
                  onClick={startAddCavity}
                >
                  {ui.addResinCavity}
                  {renderHelpPopup("resin-cavity", ui.help.cavity)}
                </button>
                <button
                  className="secondary-action"
                  onClick={finishCavity}
                  disabled={currentCavityPoints.length < 3}
                >
                  {ui.finishCavity}
                </button>
                <button
                  className="secondary-action"
                  onClick={deleteSelectedCavity}
                  disabled={selectedShape?.type !== "cavity" || isReadOnly}
                >
                  {ui.deleteSelectedCavity}
                </button>
                <button
                  className="secondary-action"
                  onClick={clearAllCavities}
                  disabled={isReadOnly}
                >
                  {ui.clearAllCavities}
                </button>
              </GeometryFamilyGroup>
            </>
          )}

          {measurementsComplete && calculationMode === "wood" && !isModifyMode && (
            <>
              {!moldBoundaryComplete && (
                <GeometryFamilyGroup family="mold" label={ui.moldBoundary}>
                  <button
                    className={`${
                      mode === "mold" ? "mode-active" : ""
                    } ${
                      activeWorkflowStage === "mold" &&
                      moldBoundaryPoints.length < 3
                        ? "primary-action"
                        : "secondary-action"
                    }`}
                    onClick={() => {
                      setUseImageBorderAsMold(false);
                      setMode("mold");
                      setSelectedShape(null);
                      setDraftReferencePoints([]);
                      setMoldBoundaryComplete(false);
                      setWoodBoundaryComplete(false);
                      setCavitiesComplete(false);
                    }}
                  >
                    {ui.drawMoldBoundary}
                    {renderHelpPopup("mold-boundary", ui.help.mold)}
                  </button>
                  <button
                    className="secondary-action"
                    onClick={clearMoldBoundary}
                    disabled={isReadOnly}
                  >
                    {ui.clearMoldBoundary}
                  </button>
                  <button
                    className={
                      activeWorkflowStage === "mold" &&
                      moldBoundaryPoints.length >= 3
                        ? "primary-action"
                        : "secondary-action"
                    }
                    onClick={() => {
                      if (moldBoundaryPoints.length < 3) {
                        setError(ui.errors.drawMoldBeforeContinue);
                        return;
                      }
                      setMoldBoundaryComplete(true);
                      setMode("wood");
                      setSelectedShape(null);
                      setError("");
                    }}
                  >
                    {ui.finishMold}
                  </button>
                  {activeWorkflowStage === "mold" && (
                    <aside
                      className="upload-onboarding-panel"
                      aria-label="Mold boundary guidance"
                    >
                      <span className="onboarding-badge">3</span>
                      <div>
                        <h2>{ui.step3Title}</h2>
                        <p>{ui.step3Body}</p>
                      </div>
                    </aside>
                  )}
                </GeometryFamilyGroup>
              )}

              {moldBoundaryComplete && (
                <GeometryFamilyGroup
                  family="mold"
                  label={ui.moldBoundary}
                  status={ui.moldComplete}
                >
                  <button
                    className="secondary-action"
                    onClick={() => {
                      setMode("edit");
                      setSelectedShape({ type: "mold" });
                      setDraftReferencePoints([]);
                    }}
                    disabled={moldBoundaryPoints.length < 3 || isReadOnly}
                  >
                    {ui.editMoldBoundary}
                  </button>
                  <button
                    className="secondary-action"
                    onClick={clearMoldBoundary}
                    disabled={isReadOnly}
                  >
                    {ui.clearMoldBoundary}
                  </button>
                </GeometryFamilyGroup>
              )}

              {moldBoundaryComplete && !woodBoundaryComplete && (
                <GeometryFamilyGroup family="wood" label={ui.woodIslands}>
                  <div className="toolbar-row toolbar-row-primary">
                    <button
                      className={`${
                        mode === "wood" ? "mode-active" : ""
                      } ${
                        activeWorkflowStage === "wood" &&
                        woodBoundaryPoints.length < 3 &&
                        (woodBoundaryPolygons.length === 0 ||
                          woodBoundaryPoints.length === 0)
                          ? "primary-action"
                          : "secondary-action"
                      }`}
                      onClick={startAddWoodIsland}
                    >
                      {ui.addWoodIsland}
                      {renderHelpPopup("wood-boundary", ui.help.wood)}
                    </button>
                    <button
                      className={
                        activeWorkflowStage === "wood" &&
                        woodBoundaryPoints.length >= 3
                          ? "primary-action"
                          : "secondary-action"
                      }
                      onClick={finishWoodIsland}
                      disabled={woodBoundaryPoints.length < 3}
                    >
                      {ui.completeCurrentIsland}
                    </button>
                    <button
                      className="secondary-action"
                      onClick={deleteSelectedWoodIsland}
                      disabled={selectedShape?.type !== "wood" || isReadOnly}
                    >
                      {ui.deleteSelectedWoodIsland}
                    </button>
                    <button
                      className={
                        activeWorkflowStage === "wood" &&
                        woodBoundaryPolygons.length > 0 &&
                        woodBoundaryPoints.length === 0
                          ? "primary-action"
                          : "secondary-action"
                      }
                      onClick={() => {
                        if (woodBoundaryPoints.length > 0) {
                          setError(ui.errors.completeWoodIslandFirst);
                          return;
                        }
                        if (woodBoundaryPolygons.length === 0) {
                          setError(ui.errors.addWoodIslandBeforeContinue);
                          return;
                        }
                        setWoodBoundaryComplete(true);
                        setMode("cavity");
                        setSelectedShape(null);
                        setError("");
                      }}
                    >
                      {ui.doneWithWood}
                    </button>
                  </div>
                  <div className="toolbar-row toolbar-row-secondary">
                    {activeWorkflowStage === "wood" && (
                      <aside
                        className="upload-onboarding-panel"
                        aria-label="Wood island guidance"
                      >
                        <span className="onboarding-badge">4</span>
                        <div>
                          <h2>{ui.step4Title}</h2>
                          <p>{ui.step4Body}</p>
                        </div>
                      </aside>
                    )}
                    <div className="toolbar-secondary-actions">
                    <button
                      className="secondary-action"
                      onClick={undoLastPoint}
                      disabled={getActiveWoodDrawingPointCount() === 0 || isReadOnly}
                    >
                      {ui.undoLastPoint}
                    </button>
                    <button
                      className="secondary-action"
                      onClick={clearWoodIslands}
                      disabled={isReadOnly}
                    >
                      {ui.clearWoodIslands}
                    </button>
                    </div>
                  </div>
                </GeometryFamilyGroup>
              )}

              {woodBoundaryComplete && (
                <GeometryFamilyGroup
                  family="wood"
                  label={ui.woodIslands}
                  status={ui.woodComplete}
                >
                  <button
                    className="secondary-action"
                    onClick={() => {
                      setMode("edit");
                      setDraftReferencePoints([]);
                    }}
                    disabled={selectedShape?.type !== "wood"}
                  >
                    {ui.editSelectedWoodIsland}
                  </button>
                  <button
                    className="secondary-action"
                    onClick={startAddWoodIsland}
                  >
                    {ui.addWoodIsland}
                  </button>
                  <button
                    className="secondary-action"
                    onClick={deleteSelectedWoodIsland}
                    disabled={selectedShape?.type !== "wood" || isReadOnly}
                  >
                    {ui.deleteSelectedWoodIsland}
                  </button>
                  <button
                    className="secondary-action"
                    onClick={clearWoodIslands}
                    disabled={isReadOnly}
                  >
                    {ui.clearWoodIslands}
                  </button>
                </GeometryFamilyGroup>
              )}

              {woodBoundaryComplete && !cavitiesComplete && (
                <GeometryFamilyGroup
                  family="cavity"
                  label={ui.resinCavities}
                  groupRef={cavityControlsRef}
                >
                  <div className="toolbar-row toolbar-row-primary">
                    <button
                      className={`${
                        mode === "cavity" ? "mode-active" : ""
                      } ${
                        activeWorkflowStage === "cavities" &&
                        currentCavityPoints.length < 3 &&
                        (cavityPolygons.length === 0 ||
                          editingCavityDepthIndex == null)
                          ? "primary-action"
                          : "secondary-action"
                      }`}
                      onClick={startAddCavity}
                    >
                      {ui.addResinCavity}
                      {renderHelpPopup("resin-cavity", ui.help.cavity)}
                    </button>
                    <button
                      className={
                        activeWorkflowStage === "cavities" &&
                        currentCavityPoints.length >= 3
                          ? "primary-action"
                          : "secondary-action"
                      }
                      onClick={finishCavity}
                      disabled={currentCavityPoints.length < 3}
                    >
                      {ui.finishCavity}
                    </button>
                    <button
                      className="secondary-action"
                      onClick={() => {
                        setMode("edit");
                        setDraftReferencePoints([]);
                      }}
                      disabled={selectedShape?.type !== "cavity"}
                    >
                      {ui.editSelectedCavity}
                    </button>
                    <button
                      className="secondary-action"
                      onClick={clearAllCavities}
                      disabled={isReadOnly}
                    >
                      {ui.clearAllCavities}
                    </button>
                    <button
                      className={
                        activeWorkflowStage === "cavities" &&
                        cavityPolygons.length > 0 &&
                        currentCavityPoints.length < 3 &&
                        editingCavityDepthIndex == null
                          ? "primary-action"
                          : "secondary-action"
                      }
                      onClick={() => {
                        setCavitiesComplete(true);
                        setMode("edit");
                        setError("");
                        focusMainResinDepth();
                      }}
                    >
                      {ui.finishCavities}
                    </button>
                  </div>
                  <div className="toolbar-row toolbar-row-secondary">
                    {activeWorkflowStage === "cavities" && (
                      <aside
                        className="upload-onboarding-panel"
                        aria-label="Resin cavity guidance"
                      >
                        <span className="onboarding-badge">5</span>
                        <div>
                          <h2>{ui.step5Title}</h2>
                          <p>{ui.step5Body}</p>
                        </div>
                      </aside>
                    )}
                  </div>
                </GeometryFamilyGroup>
              )}

              {cavitiesComplete && (
                <GeometryFamilyGroup
                  family="cavity"
                  label={ui.resinCavities}
                  status={ui.cavitiesComplete}
                  groupRef={cavityControlsRef}
                >
                  <button
                    className="secondary-action"
                    onClick={startAddCavity}
                  >
                    {ui.addResinCavity}
                  </button>
                  <button
                    className="secondary-action"
                    onClick={() => {
                      setMode("edit");
                      setDraftReferencePoints([]);
                    }}
                    disabled={selectedShape?.type !== "cavity"}
                  >
                    {ui.editSelectedCavity}
                  </button>
                  <button
                    className="secondary-action"
                    onClick={clearAllCavities}
                    disabled={isReadOnly}
                  >
                    {ui.clearAllCavities}
                  </button>
                </GeometryFamilyGroup>
              )}

            </>
          )}
          </div>
        </div>

        <div className="workspace-image-panel" ref={workspaceImagePanelRef}>
          <div ref={workAreaRef} className="work-area">
            <canvas
              ref={canvasRef}
              className="canvas"
              onClick={onCanvasClick}
              onMouseDown={onCanvasMouseDown}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
            />
          </div>
          <div className="workspace-image-footer">
            <div className="canvas-status-bar" aria-live="polite">
              {calculationMode === "wood"
                ? `Wood | ${mode} | Refs: ${referenceMeasurements.length}`
                : `Std | ${mode} | Refs: ${referenceMeasurements.length}`}
              {isModifyMode ? " | Modify" : ""}
              {" | "}
              Zoom: {(zoomFactor * 100).toFixed(0)}%
              {" | "}
              Rot: {rotationDeg}°
            </div>
            <div className="mode-buttons view-controls">
              <span className="workflow-section-label">View & Navigation</span>
              <button className="nav-tool-button" onClick={fitToScreen}>
                <Maximize2 size={14} aria-hidden="true" />
                Fit to Screen
              </button>
              <button className="nav-tool-button" onClick={zoomIn}>
                <ZoomIn size={14} aria-hidden="true" />
                Zoom In
              </button>
              <button className="nav-tool-button" onClick={zoomOut}>
                <ZoomOut size={14} aria-hidden="true" />
                Zoom Out
              </button>
              <button className="nav-tool-button" onClick={resetZoom}>
                <RefreshCcw size={14} aria-hidden="true" />
                Reset Zoom
              </button>
              <button className="nav-tool-button" onClick={rotateLeft} disabled={isReadOnly}>
                <RotateCcw size={14} aria-hidden="true" />
                Rotate Left 90°
              </button>
              <button className="nav-tool-button" onClick={rotateRight} disabled={isReadOnly}>
                <RotateCw size={14} aria-hidden="true" />
                Rotate Right 90°
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {calculationMode === "wood" && woodBoundaryPolygons.length > 0 && (
        <div className="wood-island-list">
          <h3>Wood Islands</h3>
          {woodBoundaryPolygons.map((woodPolygon, idx) => (
            <div
              key={idx}
              className={`wood-island-item ${
                selectedShape?.type === "wood" && selectedShape.index === idx
                  ? "selected-wood-island"
                  : ""
              }`}
              onClick={() => {
                setMode("edit");
                setSelectedShape({ type: "wood", index: idx });
                setDraftReferencePoints([]);
              }}
            >
              <span>Wood Island {idx + 1}</span>
              <button
                type="button"
                className="icon-delete-button"
                aria-label={`Delete Wood Island ${idx + 1}`}
                title={`Delete Wood Island ${idx + 1}`}
                disabled={isReadOnly}
                onClick={(event) => {
                  event.stopPropagation();
                  deleteWoodIslandAtIndex(idx);
                }}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {calculationMode === "wood" && cavityPolygons.length > 0 && (
        <div className="cavity-list workspace-cavity-list">
          <h3>Cavity Depths & Volumes</h3>
          {!referenceQuality && (
            <div className="cavity-note">
              Add reference measurements to preview cavity areas and volumes.
            </div>
          )}
          {cavitySummaries.map((cavity, idx) => (
            <div
              key={idx}
              className={`cavity-item cavity-item-depth ${
                selectedShape?.type === "cavity" && selectedShape.index === idx
                  ? "selected-cavity"
                  : ""
              } ${
                highlightedCavityIndex === idx ? "new-cavity-highlight" : ""
              }`}
              ref={(element) => {
                cavityRowRefs.current[idx] = element;
              }}
              onClick={() => {
                setMode("edit");
                setSelectedShape({ type: "cavity", index: idx });
                setDraftReferencePoints([]);
              }}
            >
              <div className="cavity-details">
                <div className="cavity-name">{cavity.name}</div>
                {editingCavityDepthIndex !== idx && (
                  <div className="cavity-depth-summary">
                    {displayUnits.cavityDepthSummary(cavity.depthValue)}
                  </div>
                )}
                <details className="cavity-details-toggle">
                  <summary>Details</summary>
                  <div>
                    Area:{" "}
                    {cavity.areaCm2 != null
                      ? `${cavity.areaCm2.toFixed(2)} cm²`
                      : "needs calibration"}
                  </div>
                  <div>
                    Volume:{" "}
                    {cavity.volumeLiters != null
                      ? `${displayUnits.formatVolume(cavity.volumeLiters)} ${displayUnits.volumeLabel}`
                      : "enter depth"}
                  </div>
                </details>
              </div>
              {editingCavityDepthIndex === idx ? (
                <div className="cavity-depth-editor">
                  <label className="cavity-depth-field">
                    {displayUnits.depthLabel()}:
                    <LengthUnitInput
                      ref={(element) => {
                        cavityDepthInputRefs.current[idx] = element;
                      }}
                      unit={displayUnits.lengthLabel}
                      step="0.1"
                      value={
                        cavityDepthsMm[idx] === "" || cavityDepthsMm[idx] == null
                          ? ""
                          : displayUnits.formatDepth(cavityDepthsMm[idx])
                      }
                      onChange={(e) => {
                        const val = displayUnits.storeDepthInput(e.target.value);
                        setCavityDepthsMm((prev) => {
                          const next = [...prev];
                          next[idx] = val;
                          return next;
                        });
                        markResultOutdated();
                        setError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        confirmCavityDepth(idx);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="secondary-action confirm-depth-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      confirmCavityDepth(idx);
                    }}
                  >
                    Confirm Depth
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="secondary-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingCavityDepthIndex(idx);
                    focusCavityDepthInput(idx);
                  }}
                >
                  Edit Depth
                </button>
              )}
              <button
                type="button"
                className="icon-delete-button"
                aria-label={`Delete ${cavity.name}`}
                title={`Delete ${cavity.name}`}
                disabled={isReadOnly}
                onClick={(event) => {
                  event.stopPropagation();
                  deleteCavityAtIndex(idx);
                }}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {calculationMode === "wood" &&
        measurementsComplete &&
        (useImageBorderAsMold || moldBoundaryPoints.length >= 3) &&
        woodBoundaryPolygons.length > 0 &&
        woodBoundaryPoints.length === 0 &&
        cavitiesComplete && (
          <div className="final-action-bar" ref={finalActionBarRef}>
            <label className="final-depth-field">
              <span className="final-depth-label">
                {displayUnits.mainResinDepthLabel()}
                {renderHelpPopup("main-resin-depth", {
                  ...ui.help.mainResinDepth,
                  examples: displayUnits.mainResinDepthExamples(),
                })}
              </span>
              <LengthUnitInput
                ref={mainDepthInputRef}
                unit={displayUnits.lengthLabel}
                step="0.1"
                value={depthMm === "" ? "" : displayUnits.formatDepth(depthMm)}
                onChange={(e) => {
                  setDepthMm(displayUnits.storeDepthInput(e.target.value));
                  setRecommendedLayerCount(null);
                  setPourPlanRows([]);
                  markResultOutdated();
                }}
                onKeyDown={handleMainResinDepthKeyDown}
              />
            </label>
            <button className="calculate-primary-button" onClick={calculateWood}>
              {ui.calculateResinVolume}
            </button>
          </div>
        )}

      {error && (
        <div className="error">
          <div>{error}</div>
          {enforceAccountCapabilities &&
          (error === ui.errors.pdfExportUnavailable ||
            error === ui.errors.layerPlanningUnavailable ||
            error === ui.errors.firstFillPlanningUnavailable ||
            (typeof error === "string" &&
              error.includes("points for new projects on this account"))) ? (
            <div className="error__upgrade">
              <a href={ROUTES.ACCOUNT}>{ui.errors.upgradeHint}</a>
            </div>
          ) : null}
        </div>
      )}
      {result && resultOutdated && (
        <div className="outdated-result-warning">
          {ui.resultsOutdated}
        </div>
      )}
      {result && result.calculationType === "standard" && (
        <div className="result">
          <div className="result-summary-layout">
            <div className="result-summary-column">
              <div>{ui.result.selectedArea(result.areaCm2.toFixed(2))}</div>
              <div>
                {ui.result.estimatedVolume(
                  displayUnits.formatVolume(result.volumeLiters),
                  displayUnits.volumeLabel,
                )}
              </div>
              {result.recommendedVolumeLiters != null && (
                <div>
                  {ui.result.recommendedAmountWithMargin(result.safetyMarginPercent ?? 10)}{" "}
                  {result.recommendedVolumeLiters.toFixed(3)} L
                </div>
              )}
            </div>
            <div className="project-notes-column">
              <label className="project-notes-label">
                {ui.projectNotes}
                <textarea
                  value={projectNotes}
                  maxLength={1000}
                  rows={5}
                  readOnly={isReadOnly}
                  onChange={(event) => setProjectNotes(event.target.value)}
                  placeholder="Client requests black pigment. Pour in two stages..."
                />
              </label>
              <div className="project-notes-counter">{projectNotes.length}/1000</div>
            </div>
          </div>
        </div>
      )}
      {result && result.calculationType === "wood" && (
        <div className="result result-wood">
          <div className="result-summary-layout">
            <div className="main-result-card result-summary-column">
              <div className="main-result-label">{ui.result.totalResinRequired}</div>
              <div className="main-result-value">
                {formatNumber(result.volumeLiters, 2)} L
              </div>
              <div className="main-result-label">{ui.result.recommendedAmountTenPercent}</div>
              <div className="main-result-value">
                {formatNumber(result.recommendedVolumeLiters, 2)} L
              </div>
            </div>
            <div className="project-notes-column">
              <label className="project-notes-label">
                {ui.projectNotes}
                <textarea
                  value={projectNotes}
                  maxLength={1000}
                  rows={5}
                  readOnly={isReadOnly}
                  onChange={(event) => setProjectNotes(event.target.value)}
                  placeholder="Client requests black pigment. Pour in two stages..."
                />
              </label>
              <div className="project-notes-counter">{projectNotes.length}/1000</div>
            </div>
          </div>

          <section className="optional-planning-tools" aria-label={ui.planning.optionalToolsTitle}>
            <div className="optional-planning-header">
              <h3>{ui.planning.optionalToolsTitle}</h3>
              <p>{ui.planning.optionalToolsSubtitle}</p>
            </div>
            {layerCalculation ? (
              <>
            <div className="pour-layer-planning-row">
              <div className="pour-layer-planning-controls">
                <h3 className="planning-tool-title">{ui.planning.firstFillTitle}</h3>
                <label className="pour-layer-field">
                  {displayUnits.firstFillThicknessLabel()}
                  <LengthUnitInput
                    ref={firstFillThicknessInputRef}
                    unit={displayUnits.lengthLabel}
                    step="0.1"
                    placeholder={displayUnits.firstFillThicknessPlaceholder()}
                    value={
                      firstFillThicknessMm === ""
                        ? ""
                        : displayUnits.formatDepth(firstFillThicknessMm)
                    }
                    onChange={(event) => {
                      setFirstFillThicknessMm(
                        displayUnits.storeDepthInput(event.target.value),
                      );
                      setFirstFillVolumeLiters(null);
                      setRecommendedFirstFillVolumeLiters(null);
                      setRecommendedLayerCount(null);
                      setPourPlanRows([]);
                      setFirstFillError("");
                    }}
                    onKeyDown={handleFirstFillThicknessKeyDown}
                  />
                </label>
                <button className="primary-action" onClick={calculateFirstFillVolume}>
                  {ui.planning.calculateFirstFillVolume}
                </button>
                {firstFillVolumeLiters != null && (
                  <div className="pour-layer-result">
                    <div>
                      {ui.planning.firstFillVolume}{" "}
                      {formatNumber(firstFillVolumeLiters, 3)} L
                    </div>
                    <div className="first-fill-recommendation-options">
                      <div className="first-fill-recommendation-title">
                        {ui.planning.firstFillRecommendationMode}
                      </div>
                      {FIRST_FILL_RECOMMENDATION_OPTIONS.map((option) => {
                        const recommendedVolumeLiters =
                          getFirstFillRecommendedVolume(
                            firstFillVolumeLiters,
                            option.value
                          );

                        return (
                          <label
                            key={option.value}
                            className="first-fill-recommendation-option"
                          >
                            <input
                              type="radio"
                              name="first-fill-recommendation-mode"
                              value={option.value}
                              checked={firstFillRecommendationMode === option.value}
                              onChange={() => {
                                setFirstFillRecommendationMode(option.value);
                                setRecommendedFirstFillVolumeLiters(
                                  recommendedVolumeLiters
                                );
                              }}
                            />
                            <span>
                              {option.value === "10"
                                ? ui.planning.firstFillSealedUnderneath
                                : ui.planning.firstFillUnsealedUnderneath}{" "}
                              —{" "}
                              <strong className="first-fill-recommendation-volume">
                                {formatNumber(recommendedVolumeLiters, 3)} L
                              </strong>
                            </span>
                          </label>
                        );
                      })}
                      <div className="first-fill-recommendation-helper">
                        {ui.planning.firstFillTableHelper}
                      </div>
                    </div>
                  </div>
                )}
                {firstFillError && (
                  <div className="pour-layer-validation">{firstFillError}</div>
                )}
              </div>
              <aside
                className="upload-onboarding-panel pour-layer-helper"
                aria-label={ui.help.firstFill.title}
              >
                <span className="onboarding-badge">i</span>
                <div>
                  <h2>{ui.help.firstFill.title}</h2>
                  <p>{ui.help.firstFill.text}</p>
                </div>
              </aside>
            </div>
            <div className="pour-layer-planning-row">
              <div className="pour-layer-planning-controls">
                <h3 className="planning-tool-title">{ui.planning.pourLayerTitle}</h3>
                <label className="pour-layer-field">
                  {displayUnits.maxPourThicknessLabel()}
                  <LengthUnitInput
                    ref={maxPourThicknessInputRef}
                    unit={displayUnits.lengthLabel}
                    step="0.1"
                    value={
                      maxPourThicknessMm === ""
                        ? ""
                        : displayUnits.formatDepth(maxPourThicknessMm)
                    }
                    onChange={(event) => {
                      setMaxPourThicknessMm(
                        displayUnits.storeDepthInput(event.target.value),
                      );
                      setRecommendedLayerCount(null);
                      setPourPlanRows([]);
                      setLayerPlanningError("");
                    }}
                    onKeyDown={handleMaxPourThicknessKeyDown}
                  />
                </label>
                <label className="pour-layer-field">
                  {ui.planning.resinMixRatioLabel}
                  <select
                    value={resinMixRatio}
                    onChange={(event) => setResinMixRatio(event.target.value)}
                  >
                    {MIX_RATIO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary-action" onClick={calculatePourLayers}>
                  {ui.planning.calculatePourPlan}
                </button>
                {pourPlanRows.length > 0 && (
                  <div className="pour-plan-table-wrap">
                    <table className="pour-plan-table">
                      <thead>
                        <tr>
                          <th>{ui.planning.tablePour}</th>
                          <th>{ui.planning.tableThickness}</th>
                          <th>{ui.planning.tableResinVolume}</th>
                          <th>{ui.planning.tableRecommendedAmount}</th>
                          <th>{ui.planning.tableComponentA}</th>
                          <th>{ui.planning.tableComponentB}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pourPlanRows.map((row, idx) => {
                          const recommendedVolumeLiters =
                            getPourPlanRecommendedVolume(
                              row,
                              firstFillRecommendationMode
                            );
                          const { componentAMl, componentBMl } =
                            calculateMixComponents(
                              recommendedVolumeLiters,
                              resinMixRatio
                            );

                          return (
                            <tr key={`${row.label}-${idx}`}>
                              <td>{row.label}</td>
                              <td>{displayUnits.formatDepthWithUnit(row.thicknessMm)}</td>
                              <td>{formatNumber(row.volumeLiters, 3)} L</td>
                              <td>{formatNumber(recommendedVolumeLiters, 3)} L</td>
                              <td>{componentAMl} ml</td>
                              <td>{componentBMl} ml</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="pour-plan-note">
                      {ui.planning.layerBalanceNote}
                    </div>
                  </div>
                )}
                {layerPlanningError && (
                  <div className="pour-layer-validation">{layerPlanningError}</div>
                )}
              </div>
              <aside
                className="upload-onboarding-panel pour-layer-helper"
                aria-label={ui.help.pourLayer.title}
              >
                <span className="onboarding-badge">i</span>
                <div>
                  <h2>{ui.help.pourLayer.title}</h2>
                  <p>{ui.help.pourLayer.text1}</p>
                  <p>{ui.help.pourLayer.text2}</p>
                </div>
              </aside>
            </div>
              </>
            ) : (
              <p className="pour-layer-validation">
                {ui.errors.layerPlanningUnavailable}
              </p>
            )}
          </section>

          <details className="detailed-breakdown">
            <summary>{ui.result.detailedBreakdown}</summary>
            <div className="result-section">
              <div className="result-section-title">{ui.result.summaryAreas}</div>
              <div>{ui.result.moldArea(formatNumber(result.moldAreaCm2, 2))}</div>
              <div>
                {ui.result.moldSource}{" "}
                {result.useImageBorderAsMold
                  ? ui.result.moldSourceImageBorder
                  : ui.result.moldSourceDrawnBoundary}
              </div>
              <div>
                {ui.result.totalWoodIslandArea(formatNumber(result.woodAreaCm2, 2))}
              </div>
              <div>
                {ui.result.woodIslandsCount(
                  result.woodIslandCount ?? woodBoundaryPolygons.length,
                )}
              </div>
              <div>
                {ui.result.mainResinArea(formatNumber(result.mainResinAreaCm2, 2))}
              </div>
              <div>
                {ui.result.isolatedCavityArea(formatNumber(result.cavityAreaCm2, 2))}
              </div>
            </div>

            <div className="result-section">
              <div className="result-section-title">{ui.result.mainResinSection}</div>
              <div>{ui.result.area(formatNumber(result.mainResinAreaCm2, 2))}</div>
              <div>{displayUnits.resultMainDepth(result.mainPourDepthMm)}</div>
              <div>{ui.result.mainVolume(formatNumber(result.mainVolumeLiters, 3))}</div>
            </div>

            {Array.isArray(result.cavities) && result.cavities.length > 0 && (
              <div className="result-section">
                <div className="result-section-title">{ui.result.cavitiesSection}</div>
                {result.cavities.map((cavity, idx) => (
                  <div key={cavity.name || idx} className="cavity-result-block">
                    <div>{cavity.name || ui.result.cavityItem(idx + 1)}</div>
                    <div>{ui.result.area(formatNumber(cavity.areaCm2, 2))}</div>
                    <div>{displayUnits.resultDepth(cavity.depthMm)}</div>
                    <div>{ui.result.volume(formatNumber(cavity.volumeLiters, 3))}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="result-section">
              <div className="result-section-title">{ui.result.totalsSection}</div>
              <div>{ui.result.totalResinVolume(formatNumber(result.volumeLiters, 3))}</div>
              <div>
                {ui.result.recommendedAmountWithMargin(result.safetyMarginPercent ?? 10)}{" "}
                {formatNumber(result.recommendedVolumeLiters, 3)} L
              </div>
            </div>
          </details>
        </div>
      )}
      <div className="bottom-project-actions">
        <h3>{ui.projectActions}</h3>
        <div className="bottom-project-actions-row">
          {!isReadOnly && !isDemoMode ? (
            <button className="project-action-button" onClick={handleSaveProjectClick}>
              <Save size={15} aria-hidden="true" />
              {ui.saveProject}
            </button>
          ) : null}
          <button
            className="project-action-button"
            onClick={exportPdf}
            disabled={!result || !pdfExport}
          >
            <FileText size={15} aria-hidden="true" />
            {ui.exportPdf}
          </button>
        </div>
      </div>
    </div>
  );
});
