import type {
  PatternDocument,
} from './document'

import {
  cubicBezierCurveLengthMm,
} from './curves'

import {
  lineLengthMm,
} from './lines'

import {
  resolvePatternPieceEdgeEndpoints,
  type PatternPieceEdge,
} from './patternPiece'

export function patternPieceEdgeLengthMm(
  document: PatternDocument,
  edge: PatternPieceEdge,
  curveSegments = 100,
): number {
  /*
   * This validates that the referenced
   * geometry exists, is valid, and is
   * classified as a finished boundary.
   */
  resolvePatternPieceEdgeEndpoints(
    document,
    edge,
  )

  if (
    !Number.isInteger(
      curveSegments,
    ) ||
    curveSegments < 1
  ) {
    throw new Error(
      'Curve length segments must be a positive integer.',
    )
  }

  if (
    edge.kind === 'line'
  ) {
    return lineLengthMm(
      document.lines[
        edge.geometryId
      ],
      document.points,
    )
  }

  return cubicBezierCurveLengthMm(
    document.curves[
      edge.geometryId
    ],
    document.points,
    curveSegments,
  )
}