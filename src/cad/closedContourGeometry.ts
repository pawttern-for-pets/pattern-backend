import type {
  WorldPosition,
} from './coordinates'

export type ClosedContourWinding =
  'clockwise' |
  'counter-clockwise'

const CLOSURE_TOLERANCE_MM =
  0.000000001

const AREA_TOLERANCE_MM2 =
  0.000000001

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value
}

function validatePosition(
  position: WorldPosition,
): void {
  if (
    !Number.isFinite(
      position.xMm,
    ) ||
    !Number.isFinite(
      position.yMm,
    )
  ) {
    throw new Error(
      'Closed contour positions must contain finite coordinates.',
    )
  }
}

function positionsAreEqual(
  first: WorldPosition,
  second: WorldPosition,
): boolean {
  return (
    Math.hypot(
      second.xMm -
        first.xMm,

      second.yMm -
        first.yMm,
    ) <=
    CLOSURE_TOLERANCE_MM
  )
}

function validateClosedContour(
  points:
    readonly WorldPosition[],
): void {
  if (
    points.length < 4
  ) {
    throw new Error(
      'Closed contour must contain at least three vertices plus its closing point.',
    )
  }

  for (
    const point of points
  ) {
    validatePosition(
      point,
    )
  }

  if (
    !positionsAreEqual(
      points[0],
      points[
        points.length - 1
      ],
    )
  ) {
    throw new Error(
      'Closed contour must end at its starting point.',
    )
  }
}

/*
 * Shoelace signed area.
 *
 * PAWTTERN world coordinates use
 * positive Y downward on screen.
 *
 * Therefore:
 *
 * positive signed area = clockwise
 * negative signed area = counter-clockwise
 */
export function calculateClosedContourSignedAreaMm2(
  points:
    readonly WorldPosition[],
): number {
  validateClosedContour(
    points,
  )

  let twiceArea = 0

  for (
    let index = 0;
    index <
      points.length - 1;
    index += 1
  ) {
    const current =
      points[index]

    const next =
      points[index + 1]

    twiceArea +=
      current.xMm *
        next.yMm -
      next.xMm *
        current.yMm
  }

  return twiceArea / 2
}

export function getClosedContourWinding(
  points:
    readonly WorldPosition[],
): ClosedContourWinding {
  const signedAreaMm2 =
    calculateClosedContourSignedAreaMm2(
      points,
    )

  if (
    Math.abs(
      signedAreaMm2,
    ) <=
    AREA_TOLERANCE_MM2
  ) {
    throw new Error(
      'Closed contour area is degenerate.',
    )
  }

  return signedAreaMm2 > 0
    ? 'clockwise'
    : 'counter-clockwise'
}

export function getOutwardUnitNormalForSegment(
  start: WorldPosition,
  end: WorldPosition,
  winding:
    ClosedContourWinding,
): WorldPosition {
  validatePosition(
    start,
  )

  validatePosition(
    end,
  )

  if (
    winding !==
      'clockwise' &&
    winding !==
      'counter-clockwise'
  ) {
    throw new Error(
      'Closed contour winding is invalid.',
    )
  }

  const deltaX =
    end.xMm -
    start.xMm

  const deltaY =
    end.yMm -
    start.yMm

  const lengthMm =
    Math.hypot(
      deltaX,
      deltaY,
    )

  if (
    lengthMm <=
    CLOSURE_TOLERANCE_MM
  ) {
    throw new Error(
      'Cannot calculate an outward normal for a zero-length segment.',
    )
  }

  /*
   * In PAWTTERN's positive-Y-down
   * coordinate system:
   *
   * clockwise contour
   * -> outside is the right normal
   *
   * counter-clockwise contour
   * -> outside is the left normal
   */
  if (
    winding ===
    'clockwise'
  ) {
    return {
      xMm:
        normalizeSignedZero(
          deltaY /
            lengthMm,
        ),

      yMm:
        normalizeSignedZero(
          -deltaX /
            lengthMm,
        ),
    }
  }

  return {
    xMm:
      normalizeSignedZero(
        -deltaY /
          lengthMm,
      ),

    yMm:
      normalizeSignedZero(
        deltaX /
          lengthMm,
      ),
  }
}