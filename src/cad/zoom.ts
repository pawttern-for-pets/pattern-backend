import type { ScreenPosition } from './coordinates'
import {
  screenToWorld,
  type Viewport,
} from './viewport'

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 10

export function clampZoom(
  zoom: number,
): number {
  if (!Number.isFinite(zoom)) {
    throw new Error(
      'Zoom must be a finite number.',
    )
  }

  return Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, zoom),
  )
}

export function zoomViewportAtScreenPoint(
  viewport: Viewport,
  anchor: ScreenPosition,
  requestedZoom: number,
): Viewport {
  if (
    !Number.isFinite(anchor.xPx) ||
    !Number.isFinite(anchor.yPx)
  ) {
    throw new Error(
      'Zoom anchor must contain finite coordinates.',
    )
  }

  const zoom =
    clampZoom(requestedZoom)

  const worldAtAnchor =
    screenToWorld(
      anchor,
      viewport,
    )

  const newScale =
    viewport.pxPerMm * zoom

  return {
    ...viewport,
    zoom,

    panXPx:
      anchor.xPx -
      worldAtAnchor.xMm *
        newScale,

    panYPx:
      anchor.yPx -
      worldAtAnchor.yMm *
        newScale,
  }
}