export interface PatternPieceProductionMetadata {
  pieceId: string
  displayName: string
  cutQuantity: number
}

export function isValidPatternPieceProductionMetadata(
  metadata:
    PatternPieceProductionMetadata,
): boolean {
  return (
    metadata.pieceId
      .trim()
      .length > 0 &&
    metadata.displayName
      .trim()
      .length > 0 &&
    Number.isInteger(
      metadata.cutQuantity,
    ) &&
    metadata.cutQuantity > 0
  )
}