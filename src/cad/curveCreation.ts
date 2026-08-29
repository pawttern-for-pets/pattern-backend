import type {
  WorldPosition,
} from './coordinates'

import {
  addCurve,
  type PatternDocument,
} from './document'

export interface CreateCurveOptions {
  id?: string
  name?: string

  control1?: WorldPosition
  control2?: WorldPosition
}

export interface CreateCurveResult {
  document: PatternDocument
  curveId: string
}

function validatePosition(
  position: WorldPosition,
): void {
  if (
    !Number.isFinite(
      position.xMm,
    ) ||
    !Number.isFinite(
      position.yMm,
    )
  ) {
    throw new Error(
      'Curve control coordinates must be finite numbers.',
    )
  }
}

export function getNextCurveId(
  document: PatternDocument,
  prefix = 'C',
): string {
  if (
    prefix.trim().length === 0
  ) {
    throw new Error(
      'Curve ID prefix cannot be empty.',
    )
  }

  let number = 1

  while (
    document.curves[
      `${prefix}${number}`
    ]
  ) {
    number += 1
  }

  return `${prefix}${number}`
}

export function getDefaultCurveControls(
  start: WorldPosition,
  end: WorldPosition,
): {
  control1: WorldPosition
  control2: WorldPosition
} {
  validatePosition(start)
  validatePosition(end)

  const deltaXMm =
    end.xMm -
    start.xMm

  const deltaYMm =
    end.yMm -
    start.yMm

  return {
    control1: {
      xMm:
        start.xMm +
        deltaXMm / 3,

      yMm:
        start.yMm +
        deltaYMm / 3,
    },

    control2: {
      xMm:
        start.xMm +
        (
          2 *
          deltaXMm
        ) /
          3,

      yMm:
        start.yMm +
        (
          2 *
          deltaYMm
        ) /
          3,
    },
  }
}

export function createCurveBetweenPoints(
  document: PatternDocument,
  startPointId: string,
  endPointId: string,
  options: CreateCurveOptions = {},
): CreateCurveResult {
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

  if (
    startPointId ===
    endPointId
  ) {
    throw new Error(
      'A curve cannot connect a point to itself.',
    )
  }

  const curveId =
    options.id ??
    getNextCurveId(
      document,
    )

  const curveName =
    options.name ??
    curveId

  const defaults =
    getDefaultCurveControls(
      startPoint,
      endPoint,
    )

  const control1 =
    options.control1 ??
    defaults.control1

  const control2 =
    options.control2 ??
    defaults.control2

  validatePosition(
    control1,
  )

  validatePosition(
    control2,
  )

  const nextDocument =
    addCurve(
      document,
      {
        id: curveId,
        name: curveName,

        startPointId,
        endPointId,

        control1: {
          xMm:
            control1.xMm,

          yMm:
            control1.yMm,
        },

        control2: {
          xMm:
            control2.xMm,

          yMm:
            control2.yMm,
        },
      },
    )

  return {
    document:
      nextDocument,

    curveId,
  }
}