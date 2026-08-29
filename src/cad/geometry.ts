export interface Point {
  id: string
  name: string
  xMm: number
  yMm: number
}

export function isValidPoint(point: Point): boolean {
  return (
    point.id.trim().length > 0 &&
    Number.isFinite(point.xMm) &&
    Number.isFinite(point.yMm)
  )
}

export function distanceMm(a: Point, b: Point): number {
  if (!isValidPoint(a) || !isValidPoint(b)) {
    throw new Error('Cannot measure distance between invalid points.')
  }

  const dx = b.xMm - a.xMm
  const dy = b.yMm - a.yMm

  return Math.hypot(dx, dy)
}