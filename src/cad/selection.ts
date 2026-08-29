import type { ScreenPosition } from './coordinates'
import type { PatternDocument } from './document'
import {
  worldToScreen,
  type Viewport,
} from './viewport'

export type Selection =
  | {
      kind: 'point'
      id: string
    }
  | {
      kind: 'line'
      id: string
    }

export interface SelectionTolerance {
  pointPx: number
  linePx: number
}

export const DEFAULT_SELECTION_TOLERANCE: SelectionTolerance =
  {
    pointPx: 10,
    linePx: 6,
  }

function validateScreenPosition(
  position: ScreenPosition,
): void {
  if (
    !Number.isFinite(position.xPx) ||
    !Number.isFinite(position.yPx)
  ) {
    throw new Error(
      'Screen position must contain finite coordinates.',
    )
  }
}

function validateTolerance(
  tolerance: SelectionTolerance,
): void {
  if (
    !Number.isFinite(tolerance.pointPx) ||
    tolerance.pointPx < 0 ||
    !Number.isFinite(tolerance.linePx) ||
    tolerance.linePx < 0
  ) {
    throw new Error(
      'Selection tolerances must be finite non-negative numbers.',
    )
  }
}

export function screenDistancePx(
  a: ScreenPosition,
  b: ScreenPosition,
): number {
  validateScreenPosition(a)
  validateScreenPosition(b)

  return Math.hypot(
    b.xPx - a.xPx,
    b.yPx - a.yPx,
  )
}

export function distanceToSegmentPx(
  point: ScreenPosition,
  start: ScreenPosition,
  end: ScreenPosition,
): number {
  validateScreenPosition(point)
  validateScreenPosition(start)
  validateScreenPosition(end)

  const segmentX =
    end.xPx - start.xPx

  const segmentY =
    end.yPx - start.yPx

  const segmentLengthSquared =
    segmentX * segmentX +
    segmentY * segmentY

  if (segmentLengthSquared === 0) {
    return screenDistancePx(
      point,
      start,
    )
  }

  const pointX =
    point.xPx - start.xPx

  const pointY =
    point.yPx - start.yPx

  const projection =
    (
      pointX * segmentX +
      pointY * segmentY
    ) /
    segmentLengthSquared

  const clampedProjection =
    Math.max(
      0,
      Math.min(1, projection),
    )

  const closestPoint = {
    xPx:
      start.xPx +
      clampedProjection *
        segmentX,

    yPx:
      start.yPx +
      clampedProjection *
        segmentY,
  }

  return screenDistancePx(
    point,
    closestPoint,
  )
}

export function findSelectionAtScreenPoint(
  document: PatternDocument,
  viewport: Viewport,
  screenPosition: ScreenPosition,
  tolerance: SelectionTolerance =
    DEFAULT_SELECTION_TOLERANCE,
): Selection | null {
  validateScreenPosition(
    screenPosition,
  )

  validateTolerance(tolerance)

  let nearestPointId:
    | string
    | null = null

  let nearestPointDistance =
    Number.POSITIVE_INFINITY

  for (
    const point of
    Object.values(document.points)
  ) {
    const pointScreen =
      worldToScreen(
        point,
        viewport,
      )

    const distance =
      screenDistancePx(
        screenPosition,
        pointScreen,
      )

    if (
      distance <=
        tolerance.pointPx &&
      distance <
        nearestPointDistance
    ) {
      nearestPointId =
        point.id

      nearestPointDistance =
        distance
    }
  }

  if (nearestPointId !== null) {
    return {
      kind: 'point',
      id: nearestPointId,
    }
  }

  let nearestLineId:
    | string
    | null = null

  let nearestLineDistance =
    Number.POSITIVE_INFINITY

  for (
    const line of
    Object.values(document.lines)
  ) {
    const startPoint =
      document.points[
        line.startPointId
      ]

    const endPoint =
      document.points[
        line.endPointId
      ]

    if (
      !startPoint ||
      !endPoint
    ) {
      continue
    }

    const startScreen =
      worldToScreen(
        startPoint,
        viewport,
      )

    const endScreen =
      worldToScreen(
        endPoint,
        viewport,
      )

    const distance =
      distanceToSegmentPx(
        screenPosition,
        startScreen,
        endScreen,
      )

    if (
      distance <=
        tolerance.linePx &&
      distance <
        nearestLineDistance
    ) {
      nearestLineId =
        line.id

      nearestLineDistance =
        distance
    }
  }

  if (nearestLineId !== null) {
    return {
      kind: 'line',
      id: nearestLineId,
    }
  }

  return null
}