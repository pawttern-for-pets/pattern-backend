import type {
  PatternDocument,
} from './document'

import {
  patternPieceEdgeLengthMm,
} from './patternPieceMetrics'

import type {
  PatternPieceEdge,
} from './patternPiece'

export interface PatternPieceEdgeCompatibility {
  firstLengthMm: number
  secondLengthMm: number
  differenceMm: number
  toleranceMm: number
  withinTolerance: boolean
}

export function evaluatePatternPieceEdgeCompatibility(
  document: PatternDocument,
  firstEdge: PatternPieceEdge,
  secondEdge: PatternPieceEdge,
  toleranceMm: number,
  curveSegments = 100,
): PatternPieceEdgeCompatibility {
  if (
    !Number.isFinite(
      toleranceMm,
    ) ||
    toleranceMm < 0
  ) {
    throw new Error(
      'Pattern piece edge compatibility tolerance must be a finite non-negative number.',
    )
  }

  const firstLengthMm =
    patternPieceEdgeLengthMm(
      document,
      firstEdge,
      curveSegments,
    )

  const secondLengthMm =
    patternPieceEdgeLengthMm(
      document,
      secondEdge,
      curveSegments,
    )

  const differenceMm =
    Math.abs(
      firstLengthMm -
        secondLengthMm,
    )

  return {
    firstLengthMm,
    secondLengthMm,
    differenceMm,
    toleranceMm,

    withinTolerance:
      differenceMm <=
      toleranceMm,
  }
}