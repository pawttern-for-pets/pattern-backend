import type {
  PatternDocument,
} from '../cad/document'

import type {
  PatternPiece,
} from '../cad/patternPiece'

import {
  createStraightPatternPieceCuttingContour,
  type StraightPatternPieceCuttingContour,
} from '../cad/straightPatternPieceCuttingContour'

import {
  DEFAULT_SEAM_ALLOWANCE_MM,
  getPatternPieceEdgeSeamAllowanceMm,
} from './seamAllowancePolicy'

export function createStraightPatternPieceSeamAllowanceContour(
  document: PatternDocument,
  piece: PatternPiece,
  seamAllowanceMm:
    number =
      DEFAULT_SEAM_ALLOWANCE_MM,
): StraightPatternPieceCuttingContour {
  return createStraightPatternPieceCuttingContour(
    document,
    piece,
    (edge) =>
      getPatternPieceEdgeSeamAllowanceMm(
        edge,
        seamAllowanceMm,
      ),
  )
}