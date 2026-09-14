import type {
  WorldPosition,
} from './coordinates'

import {
  intersectInfiniteLines,
  type OffsetLineSegment,
} from './offsetGeometry'

export const DEFAULT_OFFSET_JOIN_MITER_LIMIT =
  4

const POSITION_TOLERANCE_MM =
  0.000000001

export type OffsetJoinKind =
  | 'continuous'
  | 'miter'
  | 'bevel'

export interface OffsetJoinResult {
  kind: OffsetJoinKind
  points: WorldPosition[]
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
      'Offset join positions must contain finite coordinates.',
    )
  }
}

function copyPosition(
  position: WorldPosition,
): WorldPosition {
  return {
    xMm:
      Object.is(
        position.xMm,
        -0,
      )
        ? 0
        : position.xMm,

    yMm:
      Object.is(
        position.yMm,
        -0,
      )
        ? 0
        : position.yMm,
  }
}

function distanceMm(
  first: WorldPosition,
  second: WorldPosition,
): number {
  return Math.hypot(
    second.xMm -
      first.xMm,

    second.yMm -
      first.yMm,
  )
}

function positionsAreClose(
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

function pointToInfiniteLineDistanceMm(
  point: WorldPosition,
  line: OffsetLineSegment,
): number {
  const deltaX =
    line.end.xMm -
    line.start.xMm

  const deltaY =
    line.end.yMm -
    line.start.yMm

  const lengthMm =
    Math.hypot(
      deltaX,
      deltaY,
    )

  if (
    lengthMm <=
    POSITION_TOLERANCE_MM
  ) {
    throw new Error(
      'Offset join cannot use a zero-length segment.',
    )
  }

  const relativeX =
    point.xMm -
    line.start.xMm

  const relativeY =
    point.yMm -
    line.start.yMm

  const cross =
    deltaX *
      relativeY -
    deltaY *
      relativeX

  return (
    Math.abs(
      cross,
    ) /
    lengthMm
  )
}

function bevelJoin(
  previous:
    OffsetLineSegment,

  current:
    OffsetLineSegment,
): OffsetJoinResult {
  return {
    kind: 'bevel',

    points: [
      copyPosition(
        previous.end,
      ),

      copyPosition(
        current.start,
      ),
    ],
  }
}

/*
 * Resolves the join between two adjacent
 * offset contour segments.
 *
 * Safety rules:
 *
 * 1. Segments that already meet remain
 *    continuous. This is especially
 *    important for consecutive 0 mm
 *    CUT ON FOLD segments.
 *
 * 2. Ordinary corners use the intersection
 *    of the two infinite offset lines.
 *
 * 3. Parallel separated lines use a bevel.
 *
 * 4. A miter whose intersection lies too
 *    far from the original sewing vertex
 *    is rejected and replaced by a bevel.
 *
 * This prevents near-parallel sampled
 * curve segments from creating extremely
 * long cutting-line spikes.
 */
export function resolveOffsetSegmentJoin(
  previous:
    OffsetLineSegment,

  current:
    OffsetLineSegment,

  sewingVertex:
    WorldPosition,

  miterLimit =
    DEFAULT_OFFSET_JOIN_MITER_LIMIT,
): OffsetJoinResult {
  validatePosition(
    previous.start,
  )

  validatePosition(
    previous.end,
  )

  validatePosition(
    current.start,
  )

  validatePosition(
    current.end,
  )

  validatePosition(
    sewingVertex,
  )

  if (
    !Number.isFinite(
      miterLimit,
    ) ||
    miterLimit < 1
  ) {
    throw new Error(
      'Offset join miter limit must be a finite number greater than or equal to 1.',
    )
  }

  /*
   * Validate both segment lengths before
   * accepting a coincident endpoint.
   */
  pointToInfiniteLineDistanceMm(
    sewingVertex,
    previous,
  )

  pointToInfiniteLineDistanceMm(
    sewingVertex,
    current,
  )

  if (
    positionsAreClose(
      previous.end,
      current.start,
    )
  ) {
    return {
      kind:
        'continuous',

      points: [
        copyPosition(
          current.start,
        ),
      ],
    }
  }

  const intersection =
    intersectInfiniteLines(
      previous,
      current,
    )

  /*
   * Parallel but separated offset lines
   * cannot form one mathematical miter.
   * Preserve both ends with a bevel join.
   */
  if (
    intersection === null
  ) {
    return bevelJoin(
      previous,
      current,
    )
  }

  const previousOffsetMm =
    pointToInfiniteLineDistanceMm(
      sewingVertex,
      previous,
    )

  const currentOffsetMm =
    pointToInfiniteLineDistanceMm(
      sewingVertex,
      current,
    )

  const referenceOffsetMm =
    Math.max(
      previousOffsetMm,
      currentOffsetMm,
    )

  const miterDistanceMm =
    distanceMm(
      sewingVertex,
      intersection,
    )

  /*
   * Two effectively zero-offset lines
   * should meet at the sewing vertex.
   *
   * If numerical or malformed geometry
   * places their intersection elsewhere,
   * use the safer bevel instead.
   */
  if (
    referenceOffsetMm <=
    POSITION_TOLERANCE_MM
  ) {
    if (
      miterDistanceMm <=
      POSITION_TOLERANCE_MM
    ) {
      return {
        kind: 'miter',

        points: [
          copyPosition(
            intersection,
          ),
        ],
      }
    }

    return bevelJoin(
      previous,
      current,
    )
  }

  const miterRatio =
    miterDistanceMm /
    referenceOffsetMm

  if (
    miterRatio >
    miterLimit
  ) {
    return bevelJoin(
      previous,
      current,
    )
  }

  return {
    kind: 'miter',

    points: [
      copyPosition(
        intersection,
      ),
    ],
  }
}