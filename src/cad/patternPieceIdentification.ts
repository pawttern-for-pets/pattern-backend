import type {
  PatternPiece,
} from './patternPiece'

import {
  isValidPatternPieceProductionMetadata,
  type PatternPieceProductionMetadata,
} from './patternPieceProductionMetadata'

export interface PatternPieceIdentification {
  pieceId: string

  displayName: string

  cutQuantity: number

  isCutOnFold: boolean

  primaryText: string

  secondaryText: string
}

export function createPatternPieceIdentification(
  piece:
    PatternPiece,

  metadata:
    PatternPieceProductionMetadata,
): PatternPieceIdentification {
  if (
    !isValidPatternPieceProductionMetadata(
      metadata,
    )
  ) {
    throw new Error(
      'Pattern piece identification requires valid production metadata.',
    )
  }

  if (
    piece.id !==
    metadata.pieceId
  ) {
    throw new Error(
      'Pattern piece identification metadata does not match the pattern piece.',
    )
  }

  const isCutOnFold =
    piece.edges.some(
      (edge) =>
        edge.treatment ===
        'fold',
    )

  const secondaryText =
    isCutOnFold
      ? `CUT ${metadata.cutQuantity} ON FOLD`
      : `CUT ${metadata.cutQuantity}`

  return {
    pieceId:
      piece.id,

    displayName:
      metadata.displayName,

    cutQuantity:
      metadata.cutQuantity,

    isCutOnFold,

    primaryText:
      metadata.displayName,

    secondaryText,
  }
}