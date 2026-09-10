import type {
  WorldPosition,
} from './coordinates'

import type {
  PatternDocument,
} from './document'

import {
  evaluateCubicBezier,
  type CubicBezierGeometry,
} from './bezier'

import {
  resolveCubicBezierGeometry,
} from './curves'

import {
  isValidPatternPiece,
  resolvePatternPieceEdgeEndpoints,
  type PatternPiece,
  type PatternPieceEdge,
} from './patternPiece'

export const
DEFAULT_PATTERN_PIECE_CURVE_SEGMENTS =
  100

export interface SampledPatternPieceEdge {
  edgeIndex: number
  edge: PatternPieceEdge
  points: WorldPosition[]
}

export interface SampledPatternPieceContour {
  pieceId: string
  pieceName: string

  edges:
    SampledPatternPieceEdge[]

  /*
   * Ordered sewing-line contour.
   *
   * The first point is repeated as the
   * final point so this is explicitly
   * represented as a closed contour.
   */
  points: WorldPosition[]
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

function reverseCubicBezierGeometry(
  geometry:
    CubicBezierGeometry,
): CubicBezierGeometry {
  return {
    start:
      copyPosition(
        geometry.end,
      ),

    control1:
      copyPosition(
        geometry.control2,
      ),

    control2:
      copyPosition(
        geometry.control1,
      ),

    end:
      copyPosition(
        geometry.start,
      ),
  }
}

function sampleLineEdge(
  document:
    PatternDocument,

  edge:
    PatternPieceEdge,
): WorldPosition[] {
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
      'Pattern piece contour line has a missing endpoint.',
    )
  }

  return [
    {
      xMm: start.xMm,
      yMm: start.yMm,
    },

    {
      xMm: end.xMm,
      yMm: end.yMm,
    },
  ]
}

function sampleCurveEdge(
  document:
    PatternDocument,

  edge:
    PatternPieceEdge,

  curveSegments:
    number,
): WorldPosition[] {
  const curve =
    document.curves[
      edge.geometryId
    ]

  if (!curve) {
    throw new Error(
      `Pattern piece contour curve "${edge.geometryId}" does not exist.`,
    )
  }

  const originalGeometry =
    resolveCubicBezierGeometry(
      curve,
      document.points,
    )

  const traversalGeometry =
    edge.direction ===
    'forward'
      ? originalGeometry
      : reverseCubicBezierGeometry(
          originalGeometry,
        )

  const points:
    WorldPosition[] = []

  for (
    let index = 0;
    index <= curveSegments;
    index += 1
  ) {
    points.push(
      evaluateCubicBezier(
        traversalGeometry,
        index /
          curveSegments,
      ),
    )
  }

  return points
}

export function samplePatternPieceSewingContour(
  document:
    PatternDocument,

  piece:
    PatternPiece,

  curveSegments =
    DEFAULT_PATTERN_PIECE_CURVE_SEGMENTS,
): SampledPatternPieceContour {
  if (
    !Number.isInteger(
      curveSegments,
    ) ||
    curveSegments <= 0
  ) {
    throw new Error(
      'Pattern piece contour curve segments must be a positive integer.',
    )
  }

  if (
    !isValidPatternPiece(
      piece,
      document,
    )
  ) {
    throw new Error(
      'Pattern piece contour requires a valid closed boundary piece.',
    )
  }

  const sampledEdges:
    SampledPatternPieceEdge[] = []

  const contourPoints:
    WorldPosition[] = []

  piece.edges.forEach(
    (
      edge,
      edgeIndex,
    ) => {
      const edgePoints =
        edge.kind === 'line'
          ? sampleLineEdge(
              document,
              edge,
            )
          : sampleCurveEdge(
              document,
              edge,
              curveSegments,
            )

      sampledEdges.push({
        edgeIndex,

        edge: {
          ...edge,
        },

        points:
          edgePoints.map(
            copyPosition,
          ),
      })

      if (
        edgeIndex === 0
      ) {
        contourPoints.push(
          ...edgePoints.map(
            copyPosition,
          ),
        )

        return
      }

      /*
       * Adjacent pattern-piece edges
       * share their join point.
       *
       * Skip the first sampled point of
       * every later edge so interior
       * vertices are not duplicated.
       *
       * The final edge endpoint is NOT
       * removed because it intentionally
       * closes the contour by repeating
       * the first point.
       */
      contourPoints.push(
        ...edgePoints
          .slice(1)
          .map(
            copyPosition,
          ),
      )
    },
  )

  if (
    contourPoints.length <
    4
  ) {
    throw new Error(
      'Pattern piece contour did not produce enough points for a closed boundary.',
    )
  }

  const first =
    contourPoints[0]

  const last =
    contourPoints[
      contourPoints.length - 1
    ]

  if (
    first.xMm !== last.xMm ||
    first.yMm !== last.yMm
  ) {
    throw new Error(
      'Pattern piece contour did not close.',
    )
  }

  return {
    pieceId:
      piece.id,

    pieceName:
      piece.name,

    edges:
      sampledEdges,

    points:
      contourPoints,
  }
}