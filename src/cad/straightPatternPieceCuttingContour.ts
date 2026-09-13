import type {
  WorldPosition,
} from './coordinates'

import type {
  PatternDocument,
} from './document'

import {
  getClosedContourWinding,
  type ClosedContourWinding,
} from './closedContourGeometry'

import {
  intersectInfiniteLines,
  offsetLineSegmentOutward,
  type OffsetLineSegment,
} from './offsetGeometry'

import {
  isValidPatternPiece,
  resolvePatternPieceEdgeEndpoints,
  type PatternPiece,
  type PatternPieceEdge,
} from './patternPiece'

export type PatternPieceEdgeOffsetResolver =
  (
    edge: PatternPieceEdge,
    edgeIndex: number,
  ) => number

export interface StraightPatternPieceCuttingContour {
  winding:
    ClosedContourWinding

  sewingPoints:
    WorldPosition[]

  cuttingPoints:
    WorldPosition[]

  edgeOffsetsMm:
    number[]
}

function copyPosition(
  position:
    WorldPosition,
): WorldPosition {
  return {
    xMm:
      position.xMm,

    yMm:
      position.yMm,
  }
}

function getStraightSewingPoints(
  document:
    PatternDocument,

  piece:
    PatternPiece,
): WorldPosition[] {
  const points:
    WorldPosition[] = []

  piece.edges.forEach(
    (
      edge,
      edgeIndex,
    ) => {
      if (
        edge.kind !==
        'line'
      ) {
        throw new Error(
          'Straight cutting contour currently supports line edges only.',
        )
      }

      const endpoints =
        resolvePatternPieceEdgeEndpoints(
          document,
          edge,
        )

      const start =
        document.points[
          endpoints.startPointId
        ]

      const end =
        document.points[
          endpoints.endPointId
        ]

      if (
        !start ||
        !end
      ) {
        throw new Error(
          'Straight cutting contour has a missing sewing-line endpoint.',
        )
      }

      if (
        edgeIndex === 0
      ) {
        points.push(
          copyPosition(
            start,
          ),
        )
      }

      points.push(
        copyPosition(
          end,
        ),
      )
    },
  )

  return points
}

function validateResolvedOffset(
  offsetMm: number,
): void {
  if (
    !Number.isFinite(
      offsetMm,
    ) ||
    offsetMm < 0
  ) {
    throw new Error(
      'Pattern piece cutting contour offsets must be finite non-negative numbers.',
    )
  }
}

export function createStraightPatternPieceCuttingContour(
  document:
    PatternDocument,

  piece:
    PatternPiece,

  resolveOffsetMm:
    PatternPieceEdgeOffsetResolver,
): StraightPatternPieceCuttingContour {
  if (
    !isValidPatternPiece(
      piece,
      document,
    )
  ) {
    throw new Error(
      'Straight cutting contour requires a valid closed boundary piece.',
    )
  }

  if (
    piece.edges.some(
      (edge) =>
        edge.kind !==
        'line',
    )
  ) {
    throw new Error(
      'Straight cutting contour currently supports line edges only.',
    )
  }

  const sewingPoints =
    getStraightSewingPoints(
      document,
      piece,
    )

  const winding =
    getClosedContourWinding(
      sewingPoints,
    )

  const edgeOffsetsMm =
    piece.edges.map(
      (
        edge,
        edgeIndex,
      ) => {
        const offsetMm =
          resolveOffsetMm(
            edge,
            edgeIndex,
          )

        validateResolvedOffset(
          offsetMm,
        )

        return offsetMm
      },
    )

  const offsetSegments:
    OffsetLineSegment[] =
      piece.edges.map(
        (
          _edge,
          edgeIndex,
        ) =>
          offsetLineSegmentOutward(
            sewingPoints[
              edgeIndex
            ],

            sewingPoints[
              edgeIndex + 1
            ],

            winding,

            edgeOffsetsMm[
              edgeIndex
            ],
          ),
      )

  const cuttingPoints:
    WorldPosition[] = []

  for (
    let edgeIndex = 0;
    edgeIndex <
      offsetSegments.length;
    edgeIndex += 1
  ) {
    const previousIndex =
      (
        edgeIndex -
        1 +
        offsetSegments.length
      ) %
      offsetSegments.length

    const previous =
      offsetSegments[
        previousIndex
      ]

    const current =
      offsetSegments[
        edgeIndex
      ]

    const corner =
      intersectInfiniteLines(
        previous,
        current,
      )

    if (
      corner === null
    ) {
      throw new Error(
        'Straight cutting contour cannot resolve parallel adjacent offset edges.',
      )
    }

    cuttingPoints.push(
      copyPosition(
        corner,
      ),
    )
  }

  cuttingPoints.push(
    copyPosition(
      cuttingPoints[0],
    ),
  )

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
  }
}