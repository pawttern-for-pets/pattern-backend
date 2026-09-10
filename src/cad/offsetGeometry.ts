import type {
  WorldPosition,
} from './coordinates'

import {
  getOutwardUnitNormalForSegment,
  type ClosedContourWinding,
} from './closedContourGeometry'

export interface OffsetLineSegment {
  start: WorldPosition
  end: WorldPosition
}

const PARALLEL_TOLERANCE =
  0.000000000001

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
      'Offset geometry positions must contain finite coordinates.',
    )
  }
}

function normalizeSignedZero(
  value: number,
): number {
  return Object.is(
    value,
    -0,
  )
    ? 0
    : value
}

function normalizePosition(
  position: WorldPosition,
): WorldPosition {
  return {
    xMm:
      normalizeSignedZero(
        position.xMm,
      ),

    yMm:
      normalizeSignedZero(
        position.yMm,
      ),
  }
}

/*
 * Creates a line segment parallel to the
 * original sewing-line segment at the
 * requested physical distance OUTSIDE
 * the closed pattern piece.
 */
export function offsetLineSegmentOutward(
  start: WorldPosition,
  end: WorldPosition,
  winding:
    ClosedContourWinding,
  offsetMm: number,
): OffsetLineSegment {
  validatePosition(start)
  validatePosition(end)

  if (
    !Number.isFinite(
      offsetMm,
    ) ||
    offsetMm < 0
  ) {
    throw new Error(
      'Offset distance must be a finite non-negative number.',
    )
  }

  const normal =
    getOutwardUnitNormalForSegment(
      start,
      end,
      winding,
    )

  const offsetX =
    normal.xMm *
    offsetMm

  const offsetY =
    normal.yMm *
    offsetMm

  return {
    start:
      normalizePosition({
        xMm:
          start.xMm +
          offsetX,

        yMm:
          start.yMm +
          offsetY,
      }),

    end:
      normalizePosition({
        xMm:
          end.xMm +
          offsetX,

        yMm:
          end.yMm +
          offsetY,
      }),
  }
}

/*
 * Intersects two INFINITE lines defined
 * by two finite line segments.
 *
 * This is useful for joining adjacent
 * offset sewing-line segments at a
 * cutting-line corner.
 *
 * Parallel lines return null.
 */
export function intersectInfiniteLines(
  first:
    OffsetLineSegment,

  second:
    OffsetLineSegment,
): WorldPosition | null {
  validatePosition(
    first.start,
  )

  validatePosition(
    first.end,
  )

  validatePosition(
    second.start,
  )

  validatePosition(
    second.end,
  )

  const firstDX =
    first.end.xMm -
    first.start.xMm

  const firstDY =
    first.end.yMm -
    first.start.yMm

  const secondDX =
    second.end.xMm -
    second.start.xMm

  const secondDY =
    second.end.yMm -
    second.start.yMm

  const firstLength =
    Math.hypot(
      firstDX,
      firstDY,
    )

  const secondLength =
    Math.hypot(
      secondDX,
      secondDY,
    )

  if (
    firstLength <=
      PARALLEL_TOLERANCE ||
    secondLength <=
      PARALLEL_TOLERANCE
  ) {
    throw new Error(
      'Cannot intersect a zero-length line.',
    )
  }

  const denominator =
    firstDX *
      secondDY -
    firstDY *
      secondDX

  /*
   * Normalize the cross product by both
   * line lengths so the parallel test is
   * independent of the segment scale.
   */
  const normalizedCross =
    denominator /
    (
      firstLength *
      secondLength
    )

  if (
    Math.abs(
      normalizedCross,
    ) <=
    PARALLEL_TOLERANCE
  ) {
    return null
  }

  const deltaX =
    second.start.xMm -
    first.start.xMm

  const deltaY =
    second.start.yMm -
    first.start.yMm

  const firstParameter =
    (
      deltaX *
        secondDY -
      deltaY *
        secondDX
    ) /
    denominator

  return normalizePosition({
    xMm:
      first.start.xMm +
      firstParameter *
        firstDX,

    yMm:
      first.start.yMm +
      firstParameter *
        firstDY,
  })
}