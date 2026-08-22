export const VERTEX_HIT_RADIUS_PX = 12;
export const SEGMENT_HIT_RADIUS_PX = 8;
export const REFERENCE_HIT_RADIUS_PX = 10;

export function distance(a, b) {
  if (!a || !b) return Infinity;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointInPolygon(point, polygon) {
  if (!point || !polygon || polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = polygon[i];
    const pj = polygon[j];
    const intersects =
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersects) inside = !inside;
  }

  return inside;
}

export function distanceToSegment(point, a, b) {
  if (!point || !a || !b) return Infinity;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return distance(point, a);
  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq),
  );
  return distance(point, { x: a.x + t * dx, y: a.y + t * dy });
}

export function findNearestVertex(point, vertices, radius) {
  if (!point || !Array.isArray(vertices) || vertices.length === 0) return null;
  let best = null;
  vertices.forEach((vertex, vertexIndex) => {
    const hitDistance = distance(point, vertex);
    if (hitDistance <= radius && (best == null || hitDistance < best.distance)) {
      best = { vertexIndex, distance: hitDistance };
    }
  });
  return best;
}

export function findNearestSegment(point, vertices, radius, { closed = true } = {}) {
  if (!point || !Array.isArray(vertices) || vertices.length < 2) return null;
  const count = closed ? vertices.length : vertices.length - 1;
  let best = null;
  for (let i = 0; i < count; i += 1) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const hitDistance = distanceToSegment(point, a, b);
    if (hitDistance <= radius && (best == null || hitDistance < best.distance)) {
      best = { segmentIndex: i, distance: hitDistance };
    }
  }
  return best;
}

export function isGeometryDrawMode(mode) {
  return (
    mode === "reference" ||
    mode === "mold" ||
    mode === "wood" ||
    mode === "cavity" ||
    mode === "polygon"
  );
}

function hitPolygonFamily(point, polygons, kind, radius, { closed = true } = {}) {
  if (!Array.isArray(polygons)) return null;
  for (let idx = polygons.length - 1; idx >= 0; idx -= 1) {
    const hit = findNearestVertex(point, polygons[idx], radius);
    if (hit) {
      return {
        kind,
        index: idx,
        vertexIndex: hit.vertexIndex,
        hitType: "vertex",
      };
    }
  }
  return null;
}

function hitPolygonFamilySegments(point, polygons, kind, radius) {
  if (!Array.isArray(polygons)) return null;
  for (let idx = polygons.length - 1; idx >= 0; idx -= 1) {
    const hit = findNearestSegment(point, polygons[idx], radius, { closed: true });
    if (hit) {
      return {
        kind,
        index: idx,
        segmentIndex: hit.segmentIndex,
        hitType: "segment",
      };
    }
  }
  return null;
}

function hitPolygonFamilyInterior(point, polygons, kind) {
  if (!Array.isArray(polygons)) return null;
  for (let idx = polygons.length - 1; idx >= 0; idx -= 1) {
    if (pointInPolygon(point, polygons[idx])) {
      return { kind, index: idx, hitType: "interior" };
    }
  }
  return null;
}

/**
 * Geometric hit-test in image coordinates.
 * Priority: cavity → wood → formwork. Vertices beat segments beat interiors.
 * Reference endpoints/lines are tested after polygon vertices and before
 * polygon segments/interiors so a calibration line on a formwork edge remains selectable.
 */
export function hitTestProjectGeometry(point, geometry = {}, { scale = 1 } = {}) {
  if (!point) return null;
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const vertexRadius = VERTEX_HIT_RADIUS_PX / safeScale;
  const segmentRadius = SEGMENT_HIT_RADIUS_PX / safeScale;
  const referenceRadius = REFERENCE_HIT_RADIUS_PX / safeScale;

  const cavities = geometry.cavityPolygons || [];
  const woods = geometry.woodBoundaryPolygons || [];
  const mold = geometry.useImageBorderAsMold
    ? []
    : geometry.moldBoundaryPoints || [];
  const references = geometry.referenceMeasurements || [];

  const moldVertex = findNearestVertex(point, mold, vertexRadius);
  const vertexHit =
    hitPolygonFamily(point, cavities, "cavity", vertexRadius) ||
    hitPolygonFamily(point, woods, "wood", vertexRadius) ||
    (moldVertex
      ? { kind: "mold", vertexIndex: moldVertex.vertexIndex, hitType: "vertex" }
      : null);
  if (vertexHit) return vertexHit;

  for (let idx = references.length - 1; idx >= 0; idx -= 1) {
    const points = references[idx]?.calibrationPoints || [];
    const hit = findNearestVertex(point, points, vertexRadius);
    if (hit) {
      return {
        kind: "reference",
        index: idx,
        vertexIndex: hit.vertexIndex,
        hitType: "vertex",
      };
    }
  }

  for (let idx = references.length - 1; idx >= 0; idx -= 1) {
    const points = references[idx]?.calibrationPoints || [];
    if (points.length !== 2) continue;
    if (distanceToSegment(point, points[0], points[1]) <= referenceRadius) {
      return { kind: "reference", index: idx, hitType: "segment" };
    }
  }

  const moldSegment = findNearestSegment(point, mold, segmentRadius, {
    closed: true,
  });
  const segmentHit =
    hitPolygonFamilySegments(point, cavities, "cavity", segmentRadius) ||
    hitPolygonFamilySegments(point, woods, "wood", segmentRadius) ||
    (moldSegment
      ? {
          kind: "mold",
          segmentIndex: moldSegment.segmentIndex,
          hitType: "segment",
        }
      : null);
  if (segmentHit) return segmentHit;

  return (
    hitPolygonFamilyInterior(point, cavities, "cavity") ||
    hitPolygonFamilyInterior(point, woods, "wood") ||
    (pointInPolygon(point, mold) ? { kind: "mold", hitType: "interior" } : null)
  );
}

export function selectionFromHit(hit) {
  if (!hit) return null;
  if (hit.kind === "mold") return { type: "mold" };
  if (hit.kind === "wood") return { type: "wood", index: hit.index };
  if (hit.kind === "cavity") return { type: "cavity", index: hit.index };
  if (hit.kind === "reference") return { type: "reference", index: hit.index };
  return null;
}
