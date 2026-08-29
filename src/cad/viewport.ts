import type {
  ScreenPosition,
  WorldPosition,
} from './coordinates'
import { MM_PER_INCH } from './units'

export const CSS_PX_PER_INCH = 96
export const DEFAULT_PX_PER_MM =
  CSS_PX_PER_INCH / MM_PER_INCH

export interface Viewport {
  zoom: number
  panXPx: number
  panYPx: number
  pxPerMm: number
}

export function createViewport(
  zoom = 1,
  panXPx = 0,
  panYPx = 0,
  pxPerMm = DEFAULT_PX_PER_MM,
): Viewport {
  if (!Number.isFinite(zoom) || zoom <= 0) {
    throw new Error('Zoom must be greater than zero.')
  }

  if (!Number.isFinite(pxPerMm) || pxPerMm <= 0) {
    throw new Error(
      'Pixels per millimeter must be greater than zero.',
    )
  }

  if (
    !Number.isFinite(panXPx) ||
    !Number.isFinite(panYPx)
  ) {
    throw new Error('Pan values must be finite numbers.')
  }

  return {
    zoom,
    panXPx,
    panYPx,
    pxPerMm,
  }
}

export function worldToScreen(
  position: WorldPosition,
  viewport: Viewport,
): ScreenPosition {
  const scale = viewport.pxPerMm * viewport.zoom

  return {
    xPx: position.xMm * scale + viewport.panXPx,
    yPx: position.yMm * scale + viewport.panYPx,
  }
}

export function screenToWorld(
  position: ScreenPosition,
  viewport: Viewport,
): WorldPosition {
  const scale = viewport.pxPerMm * viewport.zoom

  return {
    xMm: (position.xPx - viewport.panXPx) / scale,
    yMm: (position.yPx - viewport.panYPx) / scale,
  }
}