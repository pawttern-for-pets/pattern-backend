import type {
  PatternDocument,
} from '../cad/document'

import {
  evaluatePatternPieceEdgeCompatibility,
  type PatternPieceEdgeCompatibility,
} from '../cad/patternPieceCompatibility'

import type {
  PatternPiece,
  PatternPieceEdge,
  PatternPieceEdgeKind,
} from '../cad/patternPiece'

import {
  REFERENCE_TANK_V2_LINE_IDS,
} from './referenceTankV2Construction'

import {
  createReferenceTankV2PatternPieces,
} from './referenceTankV2PatternPieces'

export interface ReferenceTankV2SeamCompatibility {
  toleranceMm: number

  shoulder:
    PatternPieceEdgeCompatibility

  sideSeam:
    PatternPieceEdgeCompatibility

  compatible: boolean
}

function findRequiredEdge(
  piece: PatternPiece,
  kind: PatternPieceEdgeKind,
  geometryId: string,
): PatternPieceEdge {
  const edge =
    piece.edges.find(
      (candidate) =>
        candidate.kind === kind &&
        candidate.geometryId ===
          geometryId,
    )

  if (!edge) {
    throw new Error(
      `Pattern piece "${piece.id}" is missing required ${kind} "${geometryId}".`,
    )
  }

  return edge
}

export function evaluateReferenceTankV2SeamCompatibility(
  document: PatternDocument,
  toleranceMm: number,
): ReferenceTankV2SeamCompatibility {
  const pieces =
    createReferenceTankV2PatternPieces(
      document,
    )

  const backShoulder =
    findRequiredEdge(
      pieces.back,
      'line',
      REFERENCE_TANK_V2_LINE_IDS
        .backShoulder,
    )

  const frontShoulder =
    findRequiredEdge(
      pieces.frontBelly,
      'line',
      REFERENCE_TANK_V2_LINE_IDS
        .frontShoulder,
    )

  const backSideSeam =
    findRequiredEdge(
      pieces.back,
      'line',
      REFERENCE_TANK_V2_LINE_IDS
        .backSideSeam,
    )

  const frontSideSeam =
    findRequiredEdge(
      pieces.frontBelly,
      'line',
      REFERENCE_TANK_V2_LINE_IDS
        .frontBellySideSeam,
    )

  const shoulder =
    evaluatePatternPieceEdgeCompatibility(
      document,
      backShoulder,
      frontShoulder,
      toleranceMm,
    )

  const sideSeam =
    evaluatePatternPieceEdgeCompatibility(
      document,
      backSideSeam,
      frontSideSeam,
      toleranceMm,
    )

  return {
    toleranceMm,
    shoulder,
    sideSeam,

    compatible:
      shoulder.withinTolerance &&
      sideSeam.withinTolerance,
  }
}