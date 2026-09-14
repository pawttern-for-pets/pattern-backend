import type {
  WorldPosition,
} from './coordinates'

const POSITION_TOLERANCE_MM =
  0.000000001

export interface PolylineSelfIntersection {
  firstSegmentIndex: number
  secondSegmentIndex: number
}

function validatePoint(
  point: WorldPosition,
): void {
  if (
    !Number.isFinite(point.xMm) ||
    !Number.isFinite(point.yMm)
  ) {
    throw new Error(
      'Closed polyline points must contain finite coordinates.',
    )
  }
}

function distanceMm(
  first: WorldPosition,
  second: WorldPosition,
): number {
  return Math.hypot(
    second.xMm - first.xMm,
    second.yMm - first.yMm,
  )
}

function pointsAreClose(
  first: WorldPosition,
  second: WorldPosition,
): boolean {
  return (
    distanceMm(
      first,
      second,
    ) <=
    POSITION_TOLERANCE_MM
  )
}

function crossProduct(
  a: WorldPosition,
  b: WorldPosition,
  c: WorldPosition,
): number {
  return (
    (b.xMm - a.xMm) *
      (c.yMm - a.yMm) -
    (b.yMm - a.yMm) *
      (c.xMm - a.xMm)
  )
}

function pointIsOnSegment(
  point: WorldPosition,
  start: WorldPosition,
  end: WorldPosition,
): boolean {
  if (
    Math.abs(
      crossProduct(
        start,
        end,
        point,
      ),
    ) >
    POSITION_TOLERANCE_MM
  ) {
    return false
  }

  return (
    point.xMm >=
      Math.min(
        start.xMm,
        end.xMm,
      ) -
        POSITION_TOLERANCE_MM &&
    point.xMm <=
      Math.max(
        start.xMm,
        end.xMm,
      ) +
        POSITION_TOLERANCE_MM &&
    point.yMm >=
      Math.min(
        start.yMm,
        end.yMm,
      ) -
        POSITION_TOLERANCE_MM &&
    point.yMm <=
      Math.max(
        start.yMm,
        end.yMm,
      ) +
        POSITION_TOLERANCE_MM
  )
}

function segmentsIntersect(
  firstStart: WorldPosition,
  firstEnd: WorldPosition,
  secondStart: WorldPosition,
  secondEnd: WorldPosition,
): boolean {
  const cross1 =
    crossProduct(
      firstStart,
      firstEnd,
      secondStart,
    )

  const cross2 =
    crossProduct(
      firstStart,
      firstEnd,
      secondEnd,
    )

  const cross3 =
    crossProduct(
      secondStart,
      secondEnd,
      firstStart,
    )

  const cross4 =
    crossProduct(
      secondStart,
      secondEnd,
      firstEnd,
    )

  const firstStraddles =
    (
      cross1 >
        POSITION_TOLERANCE_MM &&
      cross2 <
        -POSITION_TOLERANCE_MM
    ) ||
    (
      cross1 <
        -POSITION_TOLERANCE_MM &&
      cross2 >
        POSITION_TOLERANCE_MM
    )

  const secondStraddles =
    (
      cross3 >
        POSITION_TOLERANCE_MM &&
      cross4 <
        -POSITION_TOLERANCE_MM
    ) ||
    (
      cross3 <
        -POSITION_TOLERANCE_MM &&
      cross4 >
        POSITION_TOLERANCE_MM
    )

  if (
    firstStraddles &&
    secondStraddles
  ) {
    return true
  }

  if (
    Math.abs(cross1) <=
      POSITION_TOLERANCE_MM &&
    pointIsOnSegment(
      secondStart,
      firstStart,
      firstEnd,
    )
  ) {
    return true
  }

  if (
    Math.abs(cross2) <=
      POSITION_TOLERANCE_MM &&
    pointIsOnSegment(
      secondEnd,
      firstStart,
      firstEnd,
    )
  ) {
    return true
  }

  if (
    Math.abs(cross3) <=
      POSITION_TOLERANCE_MM &&
    pointIsOnSegment(
      firstStart,
      secondStart,
      secondEnd,
    )
  ) {
    return true
  }

  if (
    Math.abs(cross4) <=
      POSITION_TOLERANCE_MM &&
    pointIsOnSegment(
      firstEnd,
      secondStart,
      secondEnd,
    )
  ) {
    return true
  }

  return false
}

function segmentsAreAdjacent(
  firstIndex: number,
  secondIndex: number,
  segmentCount: number,
): boolean {
  if (
    Math.abs(
      firstIndex -
      secondIndex,
    ) === 1
  ) {
    return true
  }

  return (
    firstIndex === 0 &&
    secondIndex ===
      segmentCount - 1
  )
}

export function findClosedPolylineSelfIntersections(
  points:
    readonly WorldPosition[],
): PolylineSelfIntersection[] {
  if (
    points.length < 4
  ) {
    throw new Error(
      'Closed polyline requires at least three segments.',
    )
  }

  for (
    const point of points
  ) {
    validatePoint(point)
  }

  if (
    !pointsAreClose(
      points[0],
      points[
        points.length - 1
      ],
    )
  ) {
    throw new Error(
      'Closed polyline must explicitly repeat its first point at the end.',
    )
  }

  const segmentCount =
    points.length - 1

  for (
    let index = 0;
    index <
      segmentCount;
    index += 1
  ) {
    if (
      pointsAreClose(
        points[index],
        points[index + 1],
      )
    ) {
      throw new Error(
        'Closed polyline cannot contain zero-length segments.',
      )
    }
  }

  const intersections:
    PolylineSelfIntersection[] =
      []

  for (
    let firstIndex = 0;
    firstIndex <
      segmentCount;
    firstIndex += 1
  ) {
    for (
      let secondIndex =
        firstIndex + 1;
      secondIndex <
        segmentCount;
      secondIndex += 1
    ) {
      if (
        segmentsAreAdjacent(
          firstIndex,
          secondIndex,
          segmentCount,
        )
      ) {
        continue
      }

      if (
        segmentsIntersect(
          points[firstIndex],
          points[
            firstIndex + 1
          ],
          points[secondIndex],
          points[
            secondIndex + 1
          ],
        )
      ) {
        intersections.push({
          firstSegmentIndex:
            firstIndex,

          secondSegmentIndex:
            secondIndex,
        })
      }
    }
  }

  return intersections
}

export function closedPolylineHasSelfIntersection(
  points:
    readonly WorldPosition[],
): boolean {
  return (
    findClosedPolylineSelfIntersections(
      points,
    ).length > 0
  )
}