import type {
  PatternPieceEdge,
} from '../cad/patternPiece'

import {
  isPatternPieceEdgeTreatment,
} from '../cad/patternPieceEdgeTreatment'

/*
 * PAWTTERN standard seam allowance.
 *
 * User-facing:
 * 1 cm
 *
 * Internal CAD:
 * 10 mm
 */
export const DEFAULT_SEAM_ALLOWANCE_MM =
  10

export function getPatternPieceEdgeSeamAllowanceMm(
  edge: PatternPieceEdge,
  seamAllowanceMm =
    DEFAULT_SEAM_ALLOWANCE_MM,
): number {
  if (
    !Number.isFinite(
      seamAllowanceMm,
    ) ||
    seamAllowanceMm < 0
  ) {
    throw new Error(
      'Seam allowance must be a finite non-negative number.',
    )
  }

  if (
    edge.treatment !==
      undefined &&
    !isPatternPieceEdgeTreatment(
      edge.treatment,
    )
  ) {
    throw new Error(
      'Pattern piece edge treatment is invalid.',
    )
  }

  /*
   * A CUT ON FOLD edge lies directly
   * on the fabric fold, so it receives
   * no seam allowance.
   */
  if (
    edge.treatment ===
    'fold'
  ) {
    return 0
  }

  /*
   * Every other perimeter edge keeps
   * the original boundary as its
   * sewing line and receives the
   * configured outward allowance.
   */
  return seamAllowanceMm
}