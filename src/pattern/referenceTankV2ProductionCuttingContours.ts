import {
  closedPolylineHasSelfIntersection,
} from '../cad/closedPolylineIntersection'

import {
  samplePatternPieceSewingContour,
  DEFAULT_PATTERN_PIECE_CURVE_SEGMENTS,
} from '../cad/patternPieceContour'

import {
  createSampledPatternPieceCuttingContour,
  type SampledPatternPieceCuttingContour,
} from '../cad/sampledPatternPieceCuttingContour'

import type {
  ReferenceTankV2ProductionLayout,
} from './referenceTankV2ProductionLayout'

import {
  DEFAULT_SEAM_ALLOWANCE_MM,
  getPatternPieceEdgeSeamAllowanceMm,
} from './seamAllowancePolicy'

export interface ReferenceTankV2ProductionCuttingContours {
  back:
    SampledPatternPieceCuttingContour

  frontBelly:
    SampledPatternPieceCuttingContour

  seamAllowanceMm: number
  curveSegments: number
}

function validateProductionContour(
  contour:
    SampledPatternPieceCuttingContour,

  pieceName:
    string,
): void {
  if (
    closedPolylineHasSelfIntersection(
      contour.sewingPoints,
    )
  ) {
    throw new Error(
      `${pieceName} sewing contour self-intersects.`,
    )
  }

  if (
    closedPolylineHasSelfIntersection(
      contour.cuttingPoints,
    )
  ) {
    throw new Error(
      `${pieceName} cutting contour self-intersects.`,
    )
  }
}

export function createReferenceTankV2ProductionCuttingContours(
  layout:
    ReferenceTankV2ProductionLayout,

  seamAllowanceMm =
    DEFAULT_SEAM_ALLOWANCE_MM,

  curveSegments =
    DEFAULT_PATTERN_PIECE_CURVE_SEGMENTS,
): ReferenceTankV2ProductionCuttingContours {
  if (
    !Number.isFinite(
      seamAllowanceMm,
    ) ||
    seamAllowanceMm < 0
  ) {
    throw new Error(
      'Production seam allowance must be a finite non-negative number.',
    )
  }

  if (
    !Number.isInteger(
      curveSegments,
    ) ||
    curveSegments <= 0
  ) {
    throw new Error(
      'Production cutting contour curve segments must be a positive integer.',
    )
  }

  const backSampled =
    samplePatternPieceSewingContour(
      layout.document,
      layout.back,
      curveSegments,
    )

  const frontBellySampled =
    samplePatternPieceSewingContour(
      layout.document,
      layout.frontBelly,
      curveSegments,
    )

  const back =
    createSampledPatternPieceCuttingContour(
      backSampled,
      (edge) =>
        getPatternPieceEdgeSeamAllowanceMm(
          edge,
          seamAllowanceMm,
        ),
    )

  const frontBelly =
    createSampledPatternPieceCuttingContour(
      frontBellySampled,
      (edge) =>
        getPatternPieceEdgeSeamAllowanceMm(
          edge,
          seamAllowanceMm,
        ),
    )

  validateProductionContour(
    back,
    'Back',
  )

  validateProductionContour(
    frontBelly,
    'Front/Belly',
  )

  return {
    back,
    frontBelly,
    seamAllowanceMm,
    curveSegments,
  }
}