import type { Point } from './geometry'
import {
  isValidLine,
  type Line,
  type PointMap,
} from './lines'

export interface PatternDocument {
  schemaVersion: 1
  points: PointMap
  lines: Record<string, Line>
}

export type PointChanges = Partial<
  Pick<Point, 'name' | 'xMm' | 'yMm'>
>

export function createEmptyDocument(): PatternDocument {
  return {
    schemaVersion: 1,
    points: {},
    lines: {},
  }
}

export function addPoint(
  document: PatternDocument,
  point: Point,
): PatternDocument {
  if (document.points[point.id]) {
    throw new Error(`Point "${point.id}" already exists.`)
  }

  if (
    point.id.trim().length === 0 ||
    !Number.isFinite(point.xMm) ||
    !Number.isFinite(point.yMm)
  ) {
    throw new Error('Cannot add an invalid point.')
  }

  return {
    ...document,
    points: {
      ...document.points,
      [point.id]: point,
    },
  }
}

export function updatePoint(
  document: PatternDocument,
  pointId: string,
  changes: PointChanges,
): PatternDocument {
  const existing = document.points[pointId]

  if (!existing) {
    throw new Error(`Point "${pointId}" does not exist.`)
  }

  const updated: Point = {
    ...existing,
    ...changes,
  }

  if (
    !Number.isFinite(updated.xMm) ||
    !Number.isFinite(updated.yMm)
  ) {
    throw new Error('Point coordinates must be finite numbers.')
  }

  return {
    ...document,
    points: {
      ...document.points,
      [pointId]: updated,
    },
  }
}

export function removePoint(
  document: PatternDocument,
  pointId: string,
): PatternDocument {
  if (!document.points[pointId]) {
    return document
  }

  const nextPoints = { ...document.points }
  delete nextPoints[pointId]

  const nextLines: Record<string, Line> = {}

  for (const [lineId, line] of Object.entries(document.lines)) {
    const touchesDeletedPoint =
      line.startPointId === pointId ||
      line.endPointId === pointId

    if (!touchesDeletedPoint) {
      nextLines[lineId] = line
    }
  }

  return {
    ...document,
    points: nextPoints,
    lines: nextLines,
  }
}

export function addLine(
  document: PatternDocument,
  line: Line,
): PatternDocument {
  if (document.lines[line.id]) {
    throw new Error(`Line "${line.id}" already exists.`)
  }

  if (!isValidLine(line, document.points)) {
    throw new Error('Cannot add an invalid line.')
  }

  return {
    ...document,
    lines: {
      ...document.lines,
      [line.id]: line,
    },
  }
}

export function removeLine(
  document: PatternDocument,
  lineId: string,
): PatternDocument {
  if (!document.lines[lineId]) {
    return document
  }

  const nextLines = { ...document.lines }
  delete nextLines[lineId]

  return {
    ...document,
    lines: nextLines,
  }
}