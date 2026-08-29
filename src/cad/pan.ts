import type { Viewport } from './viewport'

export function panViewportByScreenDelta(
  viewport: Viewport,
  deltaXPx: number,
  deltaYPx: number,
): Viewport {
  if (
    !Number.isFinite(deltaXPx) ||
    !Number.isFinite(deltaYPx)
  ) {
    throw new Error(
      'Pan delta must contain finite screen coordinates.',
    )
  }

  return {
    ...viewport,

    panXPx:
      viewport.panXPx +
      deltaXPx,

    panYPx:
      viewport.panYPx +
      deltaYPx,
  }
}