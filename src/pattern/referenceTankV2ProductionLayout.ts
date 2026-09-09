import {
  createEmptyDocument,
  type PatternDocument,
} from '../cad/document'

import type {
  PatternPiece,
} from '../cad/patternPiece'

import {
  addPatternPieceLayoutClone,
} from '../cad/patternPieceLayout'

import {
  createReferenceTankV2PatternPieces,
} from './referenceTankV2PatternPieces'

export const
REFERENCE_TANK_V2_PRODUCTION_LAYOUT_GAP_MM =
  40

export interface PatternPieceControlBounds {
  minXMm: number
  maxXMm: number
  minYMm: number
  maxYMm: number
}

export interface ReferenceTankV2ProductionLayout {
  document: PatternDocument

  back: PatternPiece
  frontBelly: PatternPiece

  backBounds:
    PatternPieceControlBounds

  frontBellyBounds:
    PatternPieceControlBounds

  gapMm: number
}

function includePosition(
  bounds:
    PatternPieceControlBounds,
  xMm: number,
  yMm: number,
): void {
  bounds.minXMm =
    Math.min(
      bounds.minXMm,
      xMm,
    )

  bounds.maxXMm =
    Math.max(
      bounds.maxXMm,
      xMm,
    )

  bounds.minYMm =
    Math.min(
      bounds.minYMm,
      yMm,
    )

  bounds.maxYMm =
    Math.max(
      bounds.maxYMm,
      yMm,
    )
}

export function getPatternPieceControlBounds(
  document: PatternDocument,
  piece: PatternPiece,
): PatternPieceControlBounds {
  const bounds:
    PatternPieceControlBounds = {
      minXMm:
        Number.POSITIVE_INFINITY,

      maxXMm:
        Number.NEGATIVE_INFINITY,

      minYMm:
        Number.POSITIVE_INFINITY,

      maxYMm:
        Number.NEGATIVE_INFINITY,
    }

  for (
    const edge
    of piece.edges
  ) {
    const geometry =
      edge.kind === 'line'
        ? document.lines[
            edge.geometryId
          ]
        : document.curves[
            edge.geometryId
          ]

    if (!geometry) {
      throw new Error(
        `Pattern piece layout geometry "${edge.geometryId}" does not exist.`,
      )
    }

    const start =
      document.points[
        geometry.startPointId
      ]

    const end =
      document.points[
        geometry.endPointId
      ]

    if (
      !start ||
      !end
    ) {
      throw new Error(
        'Pattern piece layout geometry has a missing endpoint.',
      )
    }

    includePosition(
      bounds,
      start.xMm,
      start.yMm,
    )

    includePosition(
      bounds,
      end.xMm,
      end.yMm,
    )

    if (
      edge.kind ===
      'curve'
    ) {
      const curve =
        document.curves[
          edge.geometryId
        ]

      includePosition(
        bounds,
        curve.control1.xMm,
        curve.control1.yMm,
      )

      includePosition(
        bounds,
        curve.control2.xMm,
        curve.control2.yMm,
      )
    }
  }

  if (
    !Number.isFinite(
      bounds.minXMm,
    ) ||
    !Number.isFinite(
      bounds.maxXMm,
    ) ||
    !Number.isFinite(
      bounds.minYMm,
    ) ||
    !Number.isFinite(
      bounds.maxYMm,
    )
  ) {
    throw new Error(
      'Pattern piece layout could not calculate finite bounds.',
    )
  }

  return bounds
}

export function createReferenceTankV2ProductionLayout(
  sourceDocument:
    PatternDocument,

  gapMm =
    REFERENCE_TANK_V2_PRODUCTION_LAYOUT_GAP_MM,
): ReferenceTankV2ProductionLayout {
  if (
    !Number.isFinite(
      gapMm,
    ) ||
    gapMm < 0
  ) {
    throw new Error(
      'V2 production layout gap must be a finite non-negative number.',
    )
  }

  const sourcePieces =
    createReferenceTankV2PatternPieces(
      sourceDocument,
    )

  const sourceBackBounds =
    getPatternPieceControlBounds(
      sourceDocument,
      sourcePieces.back,
    )

  const sourceFrontBounds =
    getPatternPieceControlBounds(
      sourceDocument,
      sourcePieces.frontBelly,
    )

  const backOffsetXMm =
    -sourceBackBounds.minXMm

  const backOffsetYMm =
    -sourceBackBounds.minYMm

  const backClone =
    addPatternPieceLayoutClone(
      createEmptyDocument(),
      sourceDocument,
      sourcePieces.back,
      {
        instanceId:
          'V2_PRODUCTION_BACK',

        offsetXMm:
          backOffsetXMm,

        offsetYMm:
          backOffsetYMm,
      },
    )

  const backBounds =
    getPatternPieceControlBounds(
      backClone.document,
      backClone.piece,
    )

  const frontOffsetXMm =
    backBounds.maxXMm +
    gapMm -
    sourceFrontBounds.minXMm

  const frontOffsetYMm =
    -sourceFrontBounds.minYMm

  const frontClone =
    addPatternPieceLayoutClone(
      backClone.document,
      sourceDocument,
      sourcePieces.frontBelly,
      {
        instanceId:
          'V2_PRODUCTION_FRONT_BELLY',

        offsetXMm:
          frontOffsetXMm,

        offsetYMm:
          frontOffsetYMm,
      },
    )

  const frontBellyBounds =
    getPatternPieceControlBounds(
      frontClone.document,
      frontClone.piece,
    )

  return {
    document:
      frontClone.document,

    back:
      backClone.piece,

    frontBelly:
      frontClone.piece,

    backBounds,

    frontBellyBounds,

    gapMm,
  }
}