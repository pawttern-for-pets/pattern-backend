import type { WorldPosition } from './coordinates'

import {
  updatePoint,
  type PatternDocument,
} from './document'

import {
  snapValueMm,
} from './snapping'

export interface MovePointOptions {
  snapSpacingMm?: number | null
}

function validateWorldPosition(
  position: WorldPosition,
): void {
  if (
    !Number.isFinite(position.xMm) ||
    !Number.isFinite(position.yMm)
  ) {
    throw new Error(
      'Point position must contain finite coordinates.',
    )
  }
}

export function movePointToWorldPosition(
  document: PatternDocument,
  pointId: string,
  target: WorldPosition,
  options: MovePointOptions = {},
): PatternDocument {
  validateWorldPosition(target)

  const point =
    document.points[pointId]

  if (!point) {
    return document
  }

  let nextXMm =
    target.xMm

  let nextYMm =
    target.yMm

  const snapSpacingMm =
    options.snapSpacingMm

  if (
    snapSpacingMm !== undefined &&
    snapSpacingMm !== null
  ) {
    nextXMm =
      snapValueMm(
        nextXMm,
        snapSpacingMm,
      )

    nextYMm =
      snapValueMm(
        nextYMm,
        snapSpacingMm,
      )
  }

  if (
    point.xMm === nextXMm &&
    point.yMm === nextYMm
  ) {
    return document
  }

  return updatePoint(
    document,
    pointId,
    {
      xMm: nextXMm,
      yMm: nextYMm,
    },
  )
}