import type { Point } from './geometry'

function roundHalfAwayFromZero(value: number): number {
  if (value >= 0) {
    return Math.floor(value + 0.5)
  }

  return Math.ceil(value - 0.5)
}

export function snapValueMm(
  valueMm: number,
  spacingMm: number,
): number {
  if (!Number.isFinite(valueMm)) {
    throw new Error('Snap value must be a finite number.')
  }

  if (!Number.isFinite(spacingMm) || spacingMm <= 0) {
    throw new Error('Snap spacing must be greater than zero.')
  }

  const steps = valueMm / spacingMm

  return roundHalfAwayFromZero(steps) * spacingMm
}

export function snapPoint(
  point: Point,
  spacingMm: number,
): Point {
  return {
    ...point,
    xMm: snapValueMm(point.xMm, spacingMm),
    yMm: snapValueMm(point.yMm, spacingMm),
  }
}