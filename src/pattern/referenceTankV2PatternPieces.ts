import type {
  PatternDocument,
} from '../cad/document'

import {
  isValidPatternPiece,
  type PatternPiece,
} from '../cad/patternPiece'

import {
  REFERENCE_TANK_V2_CURVE_IDS,
  REFERENCE_TANK_V2_LINE_IDS,
} from './referenceTankV2Construction'

export interface ReferenceTankV2PatternPieces {
  back: PatternPiece
  frontBelly: PatternPiece
}

function createBackPiece():
PatternPiece {
  return {
    id: 'V2_BACK_PIECE',
    name: 'V2 Back Piece',

    edges: [
      {
        kind: 'curve',
        geometryId:
          REFERENCE_TANK_V2_CURVE_IDS
            .backNeckline,
        direction: 'forward',
      },

      {
        kind: 'line',
        geometryId:
          REFERENCE_TANK_V2_LINE_IDS
            .backShoulder,
        direction: 'forward',
      },

      {
        kind: 'curve',
        geometryId:
          REFERENCE_TANK_V2_CURVE_IDS
            .backArmholeShoulderToPivot,
        direction: 'forward',
      },

      {
        kind: 'curve',
        geometryId:
          REFERENCE_TANK_V2_CURVE_IDS
            .backArmholePivotToCommon,
        direction: 'forward',
      },

      {
        kind: 'line',
        geometryId:
          REFERENCE_TANK_V2_LINE_IDS
            .backSideSeam,
        direction: 'forward',
      },

      {
        kind: 'curve',
        geometryId:
          REFERENCE_TANK_V2_CURVE_IDS
            .lowerBackUpper,
        direction: 'forward',
      },

      {
        kind: 'curve',
        geometryId:
          REFERENCE_TANK_V2_CURVE_IDS
            .lowerBackHemBlend,
        direction: 'forward',
      },

      {
        kind: 'line',
        geometryId:
          REFERENCE_TANK_V2_LINE_IDS
            .backHemCenterToOneThird,
        direction: 'reverse',
      },

      {
        kind: 'line',
        geometryId:
          REFERENCE_TANK_V2_LINE_IDS
            .backCenterLength,
        direction: 'reverse',
      },
    ],
  }
}

function createFrontBellyPiece():
PatternPiece {
  return {
    id: 'V2_FRONT_BELLY_PIECE',
    name: 'V2 Front/Belly Piece',

    edges: [
      {
        kind: 'curve',
        geometryId:
          REFERENCE_TANK_V2_CURVE_IDS
            .frontNeckline,
        direction: 'forward',
      },

      {
        kind: 'line',
        geometryId:
          REFERENCE_TANK_V2_LINE_IDS
            .frontShoulder,
        direction: 'forward',
      },

      {
        kind: 'curve',
        geometryId:
          REFERENCE_TANK_V2_CURVE_IDS
            .frontArmholePivotToShoulder,
        direction: 'reverse',
      },

      {
        kind: 'curve',
        geometryId:
          REFERENCE_TANK_V2_CURVE_IDS
            .frontArmholeCommonToPivot,
        direction: 'reverse',
      },

      {
        kind: 'line',
        geometryId:
          REFERENCE_TANK_V2_LINE_IDS
            .frontBellySideSeam,
        direction: 'forward',
      },

      {
        kind: 'curve',
        geometryId:
          REFERENCE_TANK_V2_CURVE_IDS
            .bellyEdge,
        direction: 'forward',
      },

      {
        kind: 'line',
        geometryId:
          REFERENCE_TANK_V2_LINE_IDS
            .frontCenterBodyEdge,
        direction: 'reverse',
      },

      {
        kind: 'line',
        geometryId:
          REFERENCE_TANK_V2_LINE_IDS
            .frontCenterNeckExtension,
        direction: 'reverse',
      },
    ],
  }
}

export function createReferenceTankV2PatternPieces(
  document: PatternDocument,
): ReferenceTankV2PatternPieces {
  const back =
    createBackPiece()

  const frontBelly =
    createFrontBellyPiece()

  if (
    !isValidPatternPiece(
      back,
      document,
    )
  ) {
    throw new Error(
      'V2 Back pattern piece is not a valid closed boundary.',
    )
  }

  if (
    !isValidPatternPiece(
      frontBelly,
      document,
    )
  ) {
    throw new Error(
      'V2 Front/Belly pattern piece is not a valid closed boundary.',
    )
  }

  return {
    back,
    frontBelly,
  }
}