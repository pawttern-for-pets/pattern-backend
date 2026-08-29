import type {
  ScreenPosition,
} from './coordinates'

import type {
  PatternDocument,
} from './document'

import {
  evaluateCubicBezier,
} from './bezier'

import {
  resolveCubicBezierGeometry,
} from './curves'

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
  | {
      kind: 'curve'
      id: string
    }

export interface SelectionTolerance {
  pointPx: number
  linePx: number
  curvePx?: number
}

export const DEFAULT_SELECTION_TOLERANCE:
SelectionTolerance = {
  pointPx: 10,
  linePx: 6,
  curvePx: 6,
}

const CURVE_HIT_TEST_SEGMENTS = 40

export function screenDistancePx(
  first: ScreenPosition,
  second: ScreenPosition,
): number {
  return Math.hypot(
    second.xPx -
      first.xPx,

    second.yPx -
      first.yPx,
  )
}

export function distanceToSegmentPx(
  point: ScreenPosition,
  start: ScreenPosition,
  end: ScreenPosition,
): number {
  const deltaX =
    end.xPx -
    start.xPx

  const deltaY =
    end.yPx -
    start.yPx

  const lengthSquared =
    deltaX *
      deltaX +
    deltaY *
      deltaY

  /*
   * A zero-length segment behaves
   * like a single point.
   */
  if (lengthSquared === 0) {
    return screenDistancePx(
      point,
      start,
    )
  }

  const projection =
    (
      (
        point.xPx -
        start.xPx
      ) *
        deltaX +
      (
        point.yPx -
        start.yPx
      ) *
        deltaY
    ) /
    lengthSquared

  const clampedProjection =
    Math.max(
      0,
      Math.min(
        1,
        projection,
      ),
    )

  const closest = {
    xPx:
      start.xPx +
      clampedProjection *
        deltaX,

    yPx:
      start.yPx +
      clampedProjection *
        deltaY,
  }

  return screenDistancePx(
    point,
    closest,
  )
}

function distanceToCurvePx(
  document: PatternDocument,
  curveId: string,
  viewport: Viewport,
  screenPosition: ScreenPosition,
): number {
  const curve =
    document.curves[
      curveId
    ]

  if (!curve) {
    return Number.POSITIVE_INFINITY
  }

  let geometry

  try {
    geometry =
      resolveCubicBezierGeometry(
        curve,
        document.points,
      )
  } catch {
    return Number.POSITIVE_INFINITY
  }

  let previousScreen =
    worldToScreen(
      evaluateCubicBezier(
        geometry,
        0,
      ),
      viewport,
    )

  let minimumDistance =
    Number.POSITIVE_INFINITY

  for (
    let index = 1;
    index <=
      CURVE_HIT_TEST_SEGMENTS;
    index += 1
  ) {
    const t =
      index /
      CURVE_HIT_TEST_SEGMENTS

    const currentWorld =
      evaluateCubicBezier(
        geometry,
        t,
      )

    const currentScreen =
      worldToScreen(
        currentWorld,
        viewport,
      )

    const distance =
      distanceToSegmentPx(
        screenPosition,
        previousScreen,
        currentScreen,
      )

    minimumDistance =
      Math.min(
        minimumDistance,
        distance,
      )

    previousScreen =
      currentScreen
  }

  return minimumDistance
}

export function findSelectionAtScreenPoint(
  document: PatternDocument,
  viewport: Viewport,
  screenPosition: ScreenPosition,
  tolerance:
    SelectionTolerance =
      DEFAULT_SELECTION_TOLERANCE,
): Selection | null {
  /*
   * Validate all hit-test tolerances.
   *
   * Negative, NaN, or Infinity values
   * are not valid CAD selection
   * tolerances.
   */
  if (
    !Number.isFinite(
      tolerance.pointPx,
    ) ||
    tolerance.pointPx < 0 ||
    !Number.isFinite(
      tolerance.linePx,
    ) ||
    tolerance.linePx < 0 ||
    (
      tolerance.curvePx !==
        undefined &&
      (
        !Number.isFinite(
          tolerance.curvePx,
        ) ||
        tolerance.curvePx < 0
      )
    )
  ) {
    throw new Error(
      'Selection tolerances must be finite non-negative numbers.',
    )
  }

  /*
   * POINTS HAVE FIRST PRIORITY.
   *
   * This is important because curve
   * and line endpoints occupy the
   * same physical position as points.
   */
  let nearestPointId:
    string | null = null

  let nearestPointDistance =
    Number.POSITIVE_INFINITY

  for (
    const point of
    Object.values(
      document.points,
    )
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

  if (
    nearestPointId !== null
  ) {
    return {
      kind: 'point',
      id: nearestPointId,
    }
  }

  /*
   * CURVES HAVE SECOND PRIORITY.
   *
   * A newly created default Bezier can
   * temporarily overlap a straight
   * line. Curve priority makes it
   * possible to select that curve and
   * expose its control handles.
   */
  const curveTolerance =
    tolerance.curvePx ??
    tolerance.linePx

  let nearestCurveId:
    string | null = null

  let nearestCurveDistance =
    Number.POSITIVE_INFINITY

  for (
    const curve of
    Object.values(
      document.curves,
    )
  ) {
    const distance =
      distanceToCurvePx(
        document,
        curve.id,
        viewport,
        screenPosition,
      )

    if (
      distance <=
        curveTolerance &&
      distance <
        nearestCurveDistance
    ) {
      nearestCurveId =
        curve.id

      nearestCurveDistance =
        distance
    }
  }

  if (
    nearestCurveId !== null
  ) {
    return {
      kind: 'curve',
      id: nearestCurveId,
    }
  }

  /*
   * STRAIGHT LINES HAVE THIRD
   * PRIORITY.
   */
  let nearestLineId:
    string | null = null

  let nearestLineDistance =
    Number.POSITIVE_INFINITY

  for (
    const line of
    Object.values(
      document.lines,
    )
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

  if (
    nearestLineId !== null
  ) {
    return {
      kind: 'line',
      id: nearestLineId,
    }
  }

  return null
}