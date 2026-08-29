import type {
  PatternDocument,
} from './document'

import {
  distanceMm,
} from './geometry'

export interface PointMeasurement {
  startPointId: string
  endPointId: string

  deltaXMm: number
  deltaYMm: number

  distanceMm: number
}

export function measureBetweenPoints(
  document: PatternDocument,
  startPointId: string,
  endPointId: string,
): PointMeasurement {
  const startPoint =
    document.points[
      startPointId
    ]

  if (!startPoint) {
    throw new Error(
      `Start point "${startPointId}" does not exist.`,
    )
  }

  const endPoint =
    document.points[
      endPointId
    ]

  if (!endPoint) {
    throw new Error(
      `End point "${endPointId}" does not exist.`,
    )
  }

  return {
    startPointId,
    endPointId,

    deltaXMm:
      endPoint.xMm -
      startPoint.xMm,

    deltaYMm:
      endPoint.yMm -
      startPoint.yMm,

    distanceMm:
      distanceMm(
        startPoint,
        endPoint,
      ),
  }
}