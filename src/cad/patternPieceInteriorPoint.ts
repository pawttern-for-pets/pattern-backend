import type {
  WorldPosition,
} from './coordinates'

import type {
  PatternDocument,
} from './document'

import type {
  PatternPiece,
} from './patternPiece'

import {
  DEFAULT_PATTERN_PIECE_CURVE_SEGMENTS,
  samplePatternPieceSewingContour,
} from './patternPieceContour'

export interface PatternPieceInteriorPoint {
  point: WorldPosition
  boundaryClearanceMm: number
}

const GRID_STEPS =
  24

const POSITION_TOLERANCE_MM =
  0.000000001

function distanceToSegment(
  point:
    WorldPosition,

  start:
    WorldPosition,

  end:
    WorldPosition,
): number {
  const deltaX =
    end.xMm -
    start.xMm

  const deltaY =
    end.yMm -
    start.yMm

  const lengthSquared =
    deltaX *
      deltaX +
    deltaY *
      deltaY

  if (
    lengthSquared <=
    POSITION_TOLERANCE_MM
  ) {
    return Math.hypot(
      point.xMm -
        start.xMm,

      point.yMm -
        start.yMm,
    )
  }

  const t =
    Math.max(
      0,
      Math.min(
        1,
        (
          (
            point.xMm -
            start.xMm
          ) *
            deltaX +
          (
            point.yMm -
            start.yMm
          ) *
            deltaY
        ) /
          lengthSquared,
      ),
    )

  const closestX =
    start.xMm +
    deltaX *
      t

  const closestY =
    start.yMm +
    deltaY *
      t

  return Math.hypot(
    point.xMm -
      closestX,

    point.yMm -
      closestY,
  )
}

export function isPointInsideClosedContour(
  point:
    WorldPosition,

  contour:
    readonly WorldPosition[],
): boolean {
  let inside =
    false

  for (
    let index = 0;
    index <
      contour.length - 1;
    index += 1
  ) {
    const first =
      contour[index]

    const second =
      contour[
        index + 1
      ]

    const crosses =
      (
        first.yMm >
          point.yMm
      ) !==
      (
        second.yMm >
          point.yMm
      )

    if (!crosses) {
      continue
    }

    const xAtCrossing =
      first.xMm +
      (
        (
          point.yMm -
          first.yMm
        ) *
        (
          second.xMm -
          first.xMm
        )
      ) /
      (
        second.yMm -
        first.yMm
      )

    if (
      point.xMm <
      xAtCrossing
    ) {
      inside =
        !inside
    }
  }

  return inside
}

function getBoundaryClearanceMm(
  point:
    WorldPosition,

  contour:
    readonly WorldPosition[],
): number {
  let clearance =
    Number.POSITIVE_INFINITY

  for (
    let index = 0;
    index <
      contour.length - 1;
    index += 1
  ) {
    clearance =
      Math.min(
        clearance,

        distanceToSegment(
          point,
          contour[index],
          contour[
            index + 1
          ],
        ),
      )
  }

  return clearance
}

export function findPatternPieceInteriorPoint(
  document:
    PatternDocument,

  piece:
    PatternPiece,

  curveSegments =
    DEFAULT_PATTERN_PIECE_CURVE_SEGMENTS,
): PatternPieceInteriorPoint {
  const contour =
    samplePatternPieceSewingContour(
      document,
      piece,
      curveSegments,
    )

  const uniquePoints =
    contour.points.slice(
      0,
      -1,
    )

  const minXMm =
    Math.min(
      ...uniquePoints.map(
        (point) =>
          point.xMm,
      ),
    )

  const maxXMm =
    Math.max(
      ...uniquePoints.map(
        (point) =>
          point.xMm,
      ),
    )

  const minYMm =
    Math.min(
      ...uniquePoints.map(
        (point) =>
          point.yMm,
      ),
    )

  const maxYMm =
    Math.max(
      ...uniquePoints.map(
        (point) =>
          point.yMm,
      ),
    )

  const widthMm =
    maxXMm -
    minXMm

  const heightMm =
    maxYMm -
    minYMm

  if (
    widthMm <=
      POSITION_TOLERANCE_MM ||
    heightMm <=
      POSITION_TOLERANCE_MM
  ) {
    throw new Error(
      'Pattern piece interior point requires non-zero piece bounds.',
    )
  }

  let best:
    PatternPieceInteriorPoint |
    null = null

  for (
    let row = 1;
    row < GRID_STEPS;
    row += 1
  ) {
    for (
      let column = 1;
      column < GRID_STEPS;
      column += 1
    ) {
      const point = {
        xMm:
          minXMm +
          widthMm *
            (
              column /
              GRID_STEPS
            ),

        yMm:
          minYMm +
          heightMm *
            (
              row /
              GRID_STEPS
            ),
      }

      if (
        !isPointInsideClosedContour(
          point,
          contour.points,
        )
      ) {
        continue
      }

      const boundaryClearanceMm =
        getBoundaryClearanceMm(
          point,
          contour.points,
        )

      if (
        best === null ||
        boundaryClearanceMm >
          best.boundaryClearanceMm
      ) {
        best = {
          point,
          boundaryClearanceMm,
        }
      }
    }
  }

  if (
    best ===
    null
  ) {
    throw new Error(
      'Pattern piece interior point could not find a safe internal position.',
    )
  }

  return best
}