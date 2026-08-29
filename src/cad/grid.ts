import type { Viewport } from './viewport'
import { screenToWorld } from './viewport'

export interface WorldBounds {
  minXMm: number
  maxXMm: number
  minYMm: number
  maxYMm: number
}

export function getVisibleWorldBounds(
  viewport: Viewport,
  widthPx: number,
  heightPx: number,
): WorldBounds {
  if (
    !Number.isFinite(widthPx) ||
    !Number.isFinite(heightPx) ||
    widthPx <= 0 ||
    heightPx <= 0
  ) {
    throw new Error(
      'Canvas width and height must be greater than zero.',
    )
  }

  const topLeft = screenToWorld(
    {
      xPx: 0,
      yPx: 0,
    },
    viewport,
  )

  const bottomRight = screenToWorld(
    {
      xPx: widthPx,
      yPx: heightPx,
    },
    viewport,
  )

  return {
    minXMm: Math.min(topLeft.xMm, bottomRight.xMm),
    maxXMm: Math.max(topLeft.xMm, bottomRight.xMm),
    minYMm: Math.min(topLeft.yMm, bottomRight.yMm),
    maxYMm: Math.max(topLeft.yMm, bottomRight.yMm),
  }
}

export function getGridPositionsMm(
  minMm: number,
  maxMm: number,
  spacingMm: number,
  maxLines = 5000,
): number[] {
  if (
    !Number.isFinite(minMm) ||
    !Number.isFinite(maxMm)
  ) {
    throw new Error('Grid bounds must be finite numbers.')
  }

  if (
    !Number.isFinite(spacingMm) ||
    spacingMm <= 0
  ) {
    throw new Error(
      'Grid spacing must be greater than zero.',
    )
  }

  if (
    !Number.isInteger(maxLines) ||
    maxLines <= 0
  ) {
    throw new Error(
      'Maximum grid line count must be a positive integer.',
    )
  }

  const low = Math.min(minMm, maxMm)
  const high = Math.max(minMm, maxMm)

  const tolerance = spacingMm * 1e-10

  const startIndex = Math.ceil(
    (low - tolerance) / spacingMm,
  )

  const endIndex = Math.floor(
    (high + tolerance) / spacingMm,
  )

  const count = endIndex - startIndex + 1

  if (count <= 0) {
    return []
  }

  if (count > maxLines) {
    throw new Error(
      'Too many grid lines requested.',
    )
  }

  return Array.from(
    { length: count },
    (_, index) => {
      const value =
        (startIndex + index) * spacingMm

      return Math.abs(value) < 1e-10
        ? 0
        : value
    },
  )
}