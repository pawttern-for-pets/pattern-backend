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

import {
  createPatternPieceFoldMarkings,
} from './patternPieceFoldMarking'

export const
DEFAULT_GRAINLINE_BOUNDARY_CLEARANCE_MM =
  10

const POSITION_TOLERANCE_MM =
  0.000000001

const CROSSING_TOLERANCE_MM =
  0.0000001

const PREFERRED_INWARD_FRACTIONS =
  [
    0.35,
    0.45,
    0.25,
    0.55,
  ] as const

interface UnitVector {
  x: number
  y: number
}

interface GrainlineSpan {
  startU: number
  endU: number

  appliedBoundaryClearanceMm:
    number
}

export interface PatternPieceGrainline {
  start:
    WorldPosition

  end:
    WorldPosition

  midpoint:
    WorldPosition

  direction:
    UnitVector

  lengthMm:
    number

  inwardOffsetMm:
    number

  boundaryClearanceMm:
    number

  sourceFoldEdgeIndexes:
    number[]
}

function dot(
  x: number,
  y: number,

  axis:
    UnitVector,
): number {
  return (
    x *
      axis.x +
    y *
      axis.y
  )
}

function projectFromOrigin(
  point:
    WorldPosition,

  origin:
    WorldPosition,

  axis:
    UnitVector,
): number {
  return dot(
    point.xMm -
      origin.xMm,

    point.yMm -
      origin.yMm,

    axis,
  )
}

function createPointFromLocal(
  origin:
    WorldPosition,

  direction:
    UnitVector,

  inward:
    UnitVector,

  u: number,
  v: number,
): WorldPosition {
  return {
    xMm:
      origin.xMm +
      direction.x *
        u +
      inward.x *
        v,

    yMm:
      origin.yMm +
      direction.y *
        u +
      inward.y *
        v,
  }
}

function getInwardAxis(
  contour:
    readonly WorldPosition[],

  origin:
    WorldPosition,

  direction:
    UnitVector,
): {
  inward: UnitVector
  maxDepthMm: number
} {
  const perpendicular = {
    x:
      -direction.y,

    y:
      direction.x,
  }

  let maxPositive =
    0

  let maxNegative =
    0

  for (
    const point of contour
  ) {
    const value =
      projectFromOrigin(
        point,
        origin,
        perpendicular,
      )

    maxPositive =
      Math.max(
        maxPositive,
        value,
      )

    maxNegative =
      Math.max(
        maxNegative,
        -value,
      )
  }

  const usePositive =
    maxPositive >=
    maxNegative

  const maxDepthMm =
    usePositive
      ? maxPositive
      : maxNegative

  if (
    maxDepthMm <=
    POSITION_TOLERANCE_MM
  ) {
    throw new Error(
      'Pattern piece grainline could not determine the interior side of the fold.',
    )
  }

  return {
    inward:
      usePositive
        ? perpendicular
        : {
            x:
              -perpendicular.x,

            y:
              -perpendicular.y,
          },

    maxDepthMm,
  }
}

function deduplicateSortedValues(
  values:
    number[],
): number[] {
  const sorted =
    [...values].sort(
      (
        first,
        second,
      ) =>
        first -
        second,
    )

  const unique:
    number[] = []

  for (
    const value of sorted
  ) {
    const previous =
      unique[
        unique.length - 1
      ]

    if (
      previous ===
        undefined ||
      Math.abs(
        value -
          previous,
      ) >
        CROSSING_TOLERANCE_MM
    ) {
      unique.push(
        value,
      )
    }
  }

  return unique
}

function getLineCrossings(
  contour:
    readonly WorldPosition[],

  origin:
    WorldPosition,

  direction:
    UnitVector,

  inward:
    UnitVector,

  inwardOffsetMm:
    number,
): number[] {
  const crossings:
    number[] = []

  for (
    let index = 0;
    index <
      contour.length - 1;
    index += 1
  ) {
    const start =
      contour[index]

    const end =
      contour[
        index + 1
      ]

    const startV =
      projectFromOrigin(
        start,
        origin,
        inward,
      ) -
      inwardOffsetMm

    const endV =
      projectFromOrigin(
        end,
        origin,
        inward,
      ) -
      inwardOffsetMm

    const crosses =
      (
        startV <= 0 &&
        endV > 0
      ) ||
      (
        endV <= 0 &&
        startV > 0
      )

    if (!crosses) {
      continue
    }

    const denominator =
      startV -
      endV

    if (
      Math.abs(
        denominator,
      ) <=
      POSITION_TOLERANCE_MM
    ) {
      continue
    }

    const t =
      startV /
      denominator

    const intersection = {
      xMm:
        start.xMm +
        (
          end.xMm -
          start.xMm
        ) *
          t,

      yMm:
        start.yMm +
        (
          end.yMm -
          start.yMm
        ) *
          t,
    }

    crossings.push(
      projectFromOrigin(
        intersection,
        origin,
        direction,
      ),
    )
  }

  return deduplicateSortedValues(
    crossings,
  )
}

function findBestInteriorSpan(
  crossings:
    readonly number[],

  requestedBoundaryClearanceMm:
    number,
): GrainlineSpan | null {
  if (
    crossings.length < 2 ||
    crossings.length %
      2 !==
      0
  ) {
    return null
  }

  let best:
    GrainlineSpan |
    null = null

  let bestLength =
    Number.NEGATIVE_INFINITY

  for (
    let index = 0;
    index <
      crossings.length;
    index += 2
  ) {
    const rawStart =
      crossings[index]

    const rawEnd =
      crossings[
        index + 1
      ]

    const rawLength =
      rawEnd -
      rawStart

    if (
      rawLength <=
      POSITION_TOLERANCE_MM
    ) {
      continue
    }

    const appliedClearance =
      Math.min(
        requestedBoundaryClearanceMm,
        rawLength *
          0.15,
      )

    const startU =
      rawStart +
      appliedClearance

    const endU =
      rawEnd -
      appliedClearance

    const usableLength =
      endU -
      startU

    if (
      usableLength <=
        POSITION_TOLERANCE_MM ||
      usableLength <=
        bestLength
    ) {
      continue
    }

    bestLength =
      usableLength

    best = {
      startU,
      endU,

      appliedBoundaryClearanceMm:
        appliedClearance,
    }
  }

  return best
}

export function createFoldParallelPatternPieceGrainline(
  document:
    PatternDocument,

  piece:
    PatternPiece,

  options: {
    curveSegments?: number
    boundaryClearanceMm?: number
  } = {},
): PatternPieceGrainline {
  const curveSegments =
    options.curveSegments ??
    DEFAULT_PATTERN_PIECE_CURVE_SEGMENTS

  const boundaryClearanceMm =
    options.boundaryClearanceMm ??
    DEFAULT_GRAINLINE_BOUNDARY_CLEARANCE_MM

  if (
    !Number.isFinite(
      boundaryClearanceMm,
    ) ||
    boundaryClearanceMm < 0
  ) {
    throw new Error(
      'Pattern piece grainline boundary clearance must be a finite non-negative number.',
    )
  }

  const foldMarkings =
    createPatternPieceFoldMarkings(
      document,
      piece,
    )

  if (
    foldMarkings.length !==
    1
  ) {
    throw new Error(
      'Fold-parallel grainline requires exactly one semantic fold run.',
    )
  }

  const fold =
    foldMarkings[0]

  const contour =
    samplePatternPieceSewingContour(
      document,
      piece,
      curveSegments,
    )

  const {
    inward,
    maxDepthMm,
  } =
    getInwardAxis(
      contour.points,
      fold.midpoint,
      fold.direction,
    )

  for (
    const fraction of
      PREFERRED_INWARD_FRACTIONS
  ) {
    const inwardOffsetMm =
      maxDepthMm *
      fraction

    const crossings =
      getLineCrossings(
        contour.points,
        fold.midpoint,
        fold.direction,
        inward,
        inwardOffsetMm,
      )

    const span =
      findBestInteriorSpan(
        crossings,
        boundaryClearanceMm,
      )

    if (!span) {
      continue
    }

    const start =
      createPointFromLocal(
        fold.midpoint,
        fold.direction,
        inward,
        span.startU,
        inwardOffsetMm,
      )

    const end =
      createPointFromLocal(
        fold.midpoint,
        fold.direction,
        inward,
        span.endU,
        inwardOffsetMm,
      )

    const lengthMm =
      Math.hypot(
        end.xMm -
          start.xMm,

        end.yMm -
          start.yMm,
      )

    if (
      lengthMm <=
      POSITION_TOLERANCE_MM
    ) {
      continue
    }

    return {
      start,

      end,

      midpoint: {
        xMm:
          (
            start.xMm +
            end.xMm
          ) / 2,

        yMm:
          (
            start.yMm +
            end.yMm
          ) / 2,
      },

      direction: {
        x:
          fold.direction.x,

        y:
          fold.direction.y,
      },

      lengthMm,

      inwardOffsetMm,

      boundaryClearanceMm:
        span
          .appliedBoundaryClearanceMm,

      sourceFoldEdgeIndexes: [
        ...fold.edgeIndexes,
      ],
    }
  }

  throw new Error(
    'Pattern piece grainline could not find a safe internal span.',
  )
}