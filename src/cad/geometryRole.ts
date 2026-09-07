export type GeometryRole =
  'boundary' |
  'construction'

export function isGeometryRole(
  value: unknown,
): value is GeometryRole {
  return (
    value === 'boundary' ||
    value === 'construction'
  )
}