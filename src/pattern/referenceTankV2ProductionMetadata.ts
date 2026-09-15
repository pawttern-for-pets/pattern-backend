import {
  isValidPatternPieceProductionMetadata,
  type PatternPieceProductionMetadata,
} from '../cad/patternPieceProductionMetadata'

import type {
  ReferenceTankV2ProductionLayout,
} from './referenceTankV2ProductionLayout'

export interface ReferenceTankV2ProductionMetadata {
  back:
    PatternPieceProductionMetadata

  frontBelly:
    PatternPieceProductionMetadata
}

function createMetadata(
  pieceId:
    string,

  displayName:
    string,

  cutQuantity:
    number,
): PatternPieceProductionMetadata {
  const metadata = {
    pieceId,
    displayName,
    cutQuantity,
  }

  if (
    !isValidPatternPieceProductionMetadata(
      metadata,
    )
  ) {
    throw new Error(
      'V2 pattern piece production metadata is invalid.',
    )
  }

  return metadata
}

export function createReferenceTankV2ProductionMetadata(
  layout:
    ReferenceTankV2ProductionLayout,
): ReferenceTankV2ProductionMetadata {
  return {
    back:
      createMetadata(
        layout.back.id,
        'BACK BODICE',
        1,
      ),

    frontBelly:
      createMetadata(
        layout.frontBelly.id,
        'FRONT BODICE',
        1,
      ),
  }
}