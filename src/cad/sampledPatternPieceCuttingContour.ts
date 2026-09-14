import type {
  WorldPosition,
} from './coordinates'

import {
  getClosedContourWinding,
  type ClosedContourWinding,
} from './closedContourGeometry'

import {
  offsetLineSegmentOutward,
  type OffsetLineSegment,
} from './offsetGeometry'

import {
  DEFAULT_OFFSET_JOIN_MITER_LIMIT,
  resolveOffsetSegmentJoin,
  type OffsetJoinKind,
} from './offsetJoinGeometry'

import type {
  PatternPieceEdge,
} from './patternPiece'

import type {
  SampledPatternPieceContour,
  SampledPatternPieceEdge,
} from './patternPieceContour'

export type SampledPatternPieceEdgeOffsetResolver =
  (
    edge: PatternPieceEdge,
    edgeIndex: number,
  ) => number

export interface SampledPatternPieceCuttingContour {
  winding:
    ClosedContourWinding

  sewingPoints:
    WorldPosition[]

  cuttingPoints:
    WorldPosition[]

  edgeOffsetsMm:
    number[]

  joinKinds:
    OffsetJoinKind[]
}

interface SampledSewingSegment {
  edgeIndex: number
  start: WorldPosition
  end: WorldPosition
  offsetSegment:
    OffsetLineSegment
}

const POSITION_TOLERANCE_MM =
  0.000000001

function copyPosition(
  position:
    WorldPosition,
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

function validateOffsetMm(
  offsetMm: number,
): void {
  if (
    !Number.isFinite(
      offsetMm,
    ) ||
    offsetMm < 0
  ) {
    throw new Error(
      'Sampled cutting contour offsets must be finite non-negative numbers.',
    )
  }
}

function getOrderedSewingPoints(
  edges:
    readonly SampledPatternPieceEdge[],
): WorldPosition[] {
  if (
    edges.length === 0
  ) {
    throw new Error(
      'Sampled cutting contour requires at least one sampled edge.',
    )
  }

  const sewingPoints:
    WorldPosition[] = []

  edges.forEach(
    (
      sampledEdge,
      edgeIndex,
    ) => {
      if (
        sampledEdge.points.length <
        2
      ) {
        throw new Error(
          'Every sampled pattern piece edge must contain at least two points.',
        )
      }

      const firstPoint =
        sampledEdge.points[0]

      if (
        edgeIndex === 0
      ) {
        sewingPoints.push(
          copyPosition(
            firstPoint,
          ),
        )
      } else {
        const previousPoint =
          sewingPoints[
            sewingPoints.length -
            1
          ]

        if (
          !positionsAreClose(
            previousPoint,
            firstPoint,
          )
        ) {
          throw new Error(
            'Sampled pattern piece edges must connect continuously.',
          )
        }
      }

      for (
        let pointIndex = 1;
        pointIndex <
          sampledEdge.points.length;
        pointIndex += 1
      ) {
        sewingPoints.push(
          copyPosition(
            sampledEdge.points[
              pointIndex
            ],
          ),
        )
      }
    },
  )

  if (
    sewingPoints.length <
    4
  ) {
    throw new Error(
      'Sampled cutting contour requires at least three segments.',
    )
  }

  if (
    !positionsAreClose(
      sewingPoints[0],
      sewingPoints[
        sewingPoints.length - 1
      ],
    )
  ) {
    throw new Error(
      'Sampled cutting contour must be closed.',
    )
  }

  return sewingPoints
}

function appendPointWithoutDuplicate(
  target:
    WorldPosition[],

  point:
    WorldPosition,
): void {
  const copied =
    copyPosition(
      point,
    )

  const previous =
    target[
      target.length - 1
    ]

  if (
    previous &&
    positionsAreClose(
      previous,
      copied,
    )
  ) {
    return
  }

  target.push(
    copied,
  )
}

export function createSampledPatternPieceCuttingContour(
  contour:
    SampledPatternPieceContour,

  resolveOffsetMm:
    SampledPatternPieceEdgeOffsetResolver,

  miterLimit =
    DEFAULT_OFFSET_JOIN_MITER_LIMIT,
): SampledPatternPieceCuttingContour {
  const sewingPoints =
    getOrderedSewingPoints(
      contour.edges,
    )

  const winding =
    getClosedContourWinding(
      sewingPoints,
    )

  const edgeOffsetsMm =
    contour.edges.map(
      (
        sampledEdge,
        edgeIndex,
      ) => {
        const offsetMm =
          resolveOffsetMm(
            sampledEdge.edge,
            edgeIndex,
          )

        validateOffsetMm(
          offsetMm,
        )

        return offsetMm
      },
    )

  const segments:
    SampledSewingSegment[] =
      []

  contour.edges.forEach(
    (
      sampledEdge,
      edgeIndex,
    ) => {
      const offsetMm =
        edgeOffsetsMm[
          edgeIndex
        ]

      for (
        let pointIndex = 0;
        pointIndex <
          sampledEdge.points.length -
            1;
        pointIndex += 1
      ) {
        const start =
          sampledEdge.points[
            pointIndex
          ]

        const end =
          sampledEdge.points[
            pointIndex + 1
          ]

        if (
          positionsAreClose(
            start,
            end,
          )
        ) {
          throw new Error(
            'Sampled cutting contour cannot contain zero-length segments.',
          )
        }

        segments.push({
          edgeIndex,

          start:
            copyPosition(
              start,
            ),

          end:
            copyPosition(
              end,
            ),

          offsetSegment:
            offsetLineSegmentOutward(
              start,
              end,
              winding,
              offsetMm,
            ),
        })
      }
    },
  )

  if (
    segments.length < 3
  ) {
    throw new Error(
      'Sampled cutting contour requires at least three non-zero segments.',
    )
  }

  for (
    let segmentIndex = 1;
    segmentIndex <
      segments.length;
    segmentIndex += 1
  ) {
    if (
      !positionsAreClose(
        segments[
          segmentIndex - 1
        ].end,

        segments[
          segmentIndex
        ].start,
      )
    ) {
      throw new Error(
        'Sampled cutting contour segments must connect continuously.',
      )
    }
  }

  if (
    !positionsAreClose(
      segments[
        segments.length - 1
      ].end,

      segments[0].start,
    )
  ) {
    throw new Error(
      'Sampled cutting contour segment chain must be closed.',
    )
  }

  const cuttingPoints:
    WorldPosition[] = []

  const joinKinds:
    OffsetJoinKind[] = []

  for (
    let segmentIndex = 0;
    segmentIndex <
      segments.length;
    segmentIndex += 1
  ) {
    const previousIndex =
      (
        segmentIndex -
        1 +
        segments.length
      ) %
      segments.length

    const previous =
      segments[
        previousIndex
      ]

    const current =
      segments[
        segmentIndex
      ]

    const join =
      resolveOffsetSegmentJoin(
        previous.offsetSegment,
        current.offsetSegment,
        current.start,
        miterLimit,
      )

    joinKinds.push(
      join.kind,
    )

    for (
      const point of
      join.points
    ) {
      appendPointWithoutDuplicate(
        cuttingPoints,
        point,
      )
    }
  }

  if (
    cuttingPoints.length <
    3
  ) {
    throw new Error(
      'Sampled cutting contour did not produce a usable cutting boundary.',
    )
  }

  const firstCuttingPoint =
    cuttingPoints[0]

  const lastCuttingIndex =
    cuttingPoints.length - 1

  if (
    positionsAreClose(
      firstCuttingPoint,
      cuttingPoints[
        lastCuttingIndex
      ],
    )
  ) {
    cuttingPoints[
      lastCuttingIndex
    ] =
      copyPosition(
        firstCuttingPoint,
      )
  } else {
    cuttingPoints.push(
      copyPosition(
        firstCuttingPoint,
      ),
    )
  }

  return {
    winding,

    sewingPoints:
      sewingPoints.map(
        copyPosition,
      ),

    cuttingPoints,

    edgeOffsetsMm: [
      ...edgeOffsetsMm,
    ],

    joinKinds: [
      ...joinKinds,
    ],
  }
}