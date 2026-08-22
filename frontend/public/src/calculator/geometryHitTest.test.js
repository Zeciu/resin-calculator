import { describe, expect, it } from "vitest";
import {
  VERTEX_HIT_RADIUS_PX,
  distanceToSegment,
  findNearestSegment,
  findNearestVertex,
  hitTestProjectGeometry,
  isGeometryDrawMode,
  pointInPolygon,
  selectionFromHit,
} from "./geometryHitTest.js";

const mold = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];
const wood = [
  { x: 10, y: 10 },
  { x: 40, y: 10 },
  { x: 40, y: 40 },
  { x: 10, y: 40 },
];
const cavity = [
  { x: 60, y: 60 },
  { x: 90, y: 60 },
  { x: 90, y: 90 },
  { x: 60, y: 90 },
];
const overlappingCavity = [
  { x: 15, y: 15 },
  { x: 38, y: 15 },
  { x: 38, y: 38 },
  { x: 15, y: 38 },
];

const geometry = {
  moldBoundaryPoints: mold,
  woodBoundaryPolygons: [wood],
  cavityPolygons: [cavity],
  useImageBorderAsMold: false,
  referenceMeasurements: [
    {
      knownLengthCm: 10,
      calibrationPoints: [
        { x: 5, y: 50 },
        { x: 5, y: 80 },
      ],
    },
  ],
};

describe("geometryHitTest primitives", () => {
  it("detects polygon interiors with ray casting", () => {
    expect(pointInPolygon({ x: 25, y: 25 }, wood)).toBe(true);
    expect(pointInPolygon({ x: 50, y: 50 }, wood)).toBe(false);
  });

  it("finds the nearest vertex within the hit radius", () => {
    expect(findNearestVertex({ x: 10, y: 10 }, wood, VERTEX_HIT_RADIUS_PX).vertexIndex).toBe(
      0,
    );
    expect(findNearestVertex({ x: 80, y: 80 }, wood, VERTEX_HIT_RADIUS_PX)).toBeNull();
  });

  it("computes distance to a finite segment", () => {
    expect(distanceToSegment({ x: 25, y: 10 }, wood[0], wood[1])).toBe(0);
    expect(distanceToSegment({ x: 25, y: 14 }, wood[0], wood[1])).toBe(4);
  });

  it("finds a closed polygon segment", () => {
    expect(findNearestSegment({ x: 25, y: 10 }, wood, 8, { closed: true }).segmentIndex).toBe(
      0,
    );
  });
});

describe("hitTestProjectGeometry priority", () => {
  it("selects a cavity interior over wood and mold", () => {
    const overlapping = {
      ...geometry,
      cavityPolygons: [overlappingCavity],
    };
    expect(hitTestProjectGeometry({ x: 26, y: 26 }, overlapping)).toEqual({
      kind: "cavity",
      index: 0,
      hitType: "interior",
    });
  });

  it("selects wood interior over mold", () => {
    expect(hitTestProjectGeometry({ x: 25, y: 25 }, geometry)).toEqual({
      kind: "wood",
      index: 0,
      hitType: "interior",
    });
  });

  it("selects mold interior when outside wood and cavities", () => {
    expect(hitTestProjectGeometry({ x: 50, y: 50 }, geometry)).toEqual({
      kind: "mold",
      hitType: "interior",
    });
  });

  it("selects a polygon vertex owner with cavity-over-wood-over-mold order", () => {
    expect(hitTestProjectGeometry({ x: 60, y: 60 }, geometry)).toMatchObject({
      kind: "cavity",
      index: 0,
      vertexIndex: 0,
      hitType: "vertex",
    });
    expect(hitTestProjectGeometry({ x: 10, y: 10 }, geometry)).toMatchObject({
      kind: "wood",
      index: 0,
      vertexIndex: 0,
      hitType: "vertex",
    });
  });

  it("selects a polygon segment owner", () => {
    expect(hitTestProjectGeometry({ x: 25, y: 10 }, geometry)).toMatchObject({
      kind: "wood",
      index: 0,
      hitType: "segment",
    });
    expect(hitTestProjectGeometry({ x: 75, y: 60 }, geometry)).toMatchObject({
      kind: "cavity",
      index: 0,
      hitType: "segment",
    });
  });

  it("selects a reference endpoint and line", () => {
    expect(hitTestProjectGeometry({ x: 5, y: 80 }, geometry)).toMatchObject({
      kind: "reference",
      index: 0,
      vertexIndex: 1,
      hitType: "vertex",
    });
    expect(hitTestProjectGeometry({ x: 5, y: 65 }, geometry)).toMatchObject({
      kind: "reference",
      index: 0,
      hitType: "segment",
    });
  });

  it("prefers a shared mold/wood vertex as wood", () => {
    const shared = {
      ...geometry,
      moldBoundaryPoints: [
        { x: 10, y: 10 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    };
    expect(hitTestProjectGeometry({ x: 10, y: 10 }, shared)).toMatchObject({
      kind: "wood",
      hitType: "vertex",
    });
  });

  it("skips image-border mold interiors", () => {
    expect(
      hitTestProjectGeometry(
        { x: 50, y: 50 },
        { ...geometry, useImageBorderAsMold: true, moldBoundaryPoints: mold },
      ),
    ).toBeNull();
  });

  it("maps hits to selectedShape values", () => {
    expect(selectionFromHit({ kind: "mold", hitType: "interior" })).toEqual({
      type: "mold",
    });
    expect(selectionFromHit({ kind: "wood", index: 1, hitType: "interior" })).toEqual({
      type: "wood",
      index: 1,
    });
    expect(
      selectionFromHit({ kind: "reference", index: 2, hitType: "vertex" }),
    ).toEqual({ type: "reference", index: 2 });
  });

  it("treats drawing modes as active drafts", () => {
    expect(isGeometryDrawMode("wood")).toBe(true);
    expect(isGeometryDrawMode("edit")).toBe(false);
  });
});
