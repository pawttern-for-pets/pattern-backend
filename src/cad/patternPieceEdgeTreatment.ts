export type PatternPieceEdgeTreatment =
  'seam' |
  'fold' |
  'hem' |
  'finished-edge'

export function isPatternPieceEdgeTreatment(
  value: unknown,
): value is PatternPieceEdgeTreatment {
  return (
    value === 'seam' ||
    value === 'fold' ||
    value === 'hem' ||
    value === 'finished-edge'
  )
}