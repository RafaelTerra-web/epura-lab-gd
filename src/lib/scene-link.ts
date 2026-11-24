import type { GDPoint, GDSegment, NotationMode } from "./gd-math";

export interface SharedScene {
  points: GDPoint[];
  segments: GDSegment[];
  foldAngle: number;
  notation: NotationMode;
  showXYZ: boolean;
  showBisectors: boolean;
}

const SCENE_PARAMETER = "scene";
const MAX_LINK_LENGTH = 8192;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 80;
}

function isInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isPoint(value: unknown): value is GDPoint {
  return (
    isObject(value) &&
    isText(value.id) &&
    isText(value.label) &&
    typeof value.color === "string" &&
    /^#[0-9a-f]{6}$/i.test(value.color) &&
    [value.x, value.y, value.z].every((coord) => isInRange(coord, -5.5, 5.5))
  );
}

function isSegment(value: unknown, pointIds: Set<string>): value is GDSegment {
  return (
    isObject(value) &&
    isText(value.id) &&
    isText(value.fromId) &&
    isText(value.toId) &&
    value.fromId !== value.toId &&
    pointIds.has(value.fromId) &&
    pointIds.has(value.toId) &&
    (value.label === undefined || isText(value.label)) &&
    (value.extendLine === undefined || typeof value.extendLine === "boolean")
  );
}

export function getSceneLink(location: string, scene: SharedScene): string {
  const url = new URL(location);
  url.hash = new URLSearchParams({ [SCENE_PARAMETER]: JSON.stringify(scene) }).toString();
  return url.toString();
}

export function readSharedScene(hash: string): SharedScene | null {
  if (hash.length > MAX_LINK_LENGTH) return null;
  const raw = new URLSearchParams(hash.slice(1)).get(SCENE_PARAMETER);
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value)) return null;

    const { points, segments, foldAngle, notation, showXYZ, showBisectors } = value;
    if (
      !Array.isArray(points) ||
      points.length < 1 ||
      points.length > 6 ||
      !points.every(isPoint) ||
      !Array.isArray(segments) ||
      segments.length > 15 ||
      !isInRange(foldAngle, 0, 90) ||
      (notation !== "uerj" && notation !== "iso") ||
      typeof showXYZ !== "boolean" ||
      typeof showBisectors !== "boolean"
    ) {
      return null;
    }

    const pointIds = new Set(points.map((point) => point.id));
    if (
      pointIds.size !== points.length ||
      !segments.every((segment) => isSegment(segment, pointIds)) ||
      new Set(segments.map((segment) => segment.id)).size !== segments.length
    ) {
      return null;
    }

    return { points, segments, foldAngle, notation, showXYZ, showBisectors };
  } catch {
    return null;
  }
}
