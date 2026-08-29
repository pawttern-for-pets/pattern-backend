import type { WorldPosition } from './coordinates'

import {
  addPoint,
  type PatternDocument,
} from './document'

import {
  snapValueMm,
} from './snapping'

export interface CreatePointOptions {
  id?: string
  name?: string
  snapSpacingMm?: number | null
}

export interface CreatePointResult {
  document: PatternDocument
  pointId: string
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

export function getNextPointId(
  document: PatternDocument,
  prefix = 'P',
): string {
  if (
    prefix.trim().length === 0
  ) {
    throw new Error(
      'Point ID prefix cannot be empty.',
    )
  }

  let number = 1

  while (
    document.points[
      `${prefix}${number}`
    ]
  ) {
    number += 1
  }

  return `${prefix}${number}`
}

export function createPointAtWorldPosition(
  document: PatternDocument,
  target: WorldPosition,
  options: CreatePointOptions = {},
): CreatePointResult {
  validateWorldPosition(target)

  const pointId =
    options.id ??
    getNextPointId(document)

  const pointName =
    options.name ??
    pointId

  let xMm =
    target.xMm

  let yMm =
    target.yMm

  const snapSpacingMm =
    options.snapSpacingMm

  if (
    snapSpacingMm !== undefined &&
    snapSpacingMm !== null
  ) {
    xMm =
      snapValueMm(
        xMm,
        snapSpacingMm,
      )

    yMm =
      snapValueMm(
        yMm,
        snapSpacingMm,
      )
  }

  const nextDocument =
    addPoint(
      document,
      {
        id: pointId,
        name: pointName,
        xMm,
        yMm,
      },
    )

  return {
    document:
      nextDocument,

    pointId,
  }
}