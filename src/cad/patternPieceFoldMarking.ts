import type {
  WorldPosition,
} from './coordinates'

import type {
  PatternDocument,
} from './document'

import {
  resolvePatternPieceEdgeEndpoints,
  type PatternPiece,
  type PatternPieceEdge,
} from './patternPiece'

export interface PatternPieceFoldMarking {
  edgeIndexes: number[]

  start:
    WorldPosition

  end:
    WorldPosition

  midpoint:
    WorldPosition

  direction: {
    x: number
    y: number
  }

  lengthMm: number
}

const POSITION_TOLERANCE_MM =
  0.000000001

function copyPosition(
  point:
    WorldPosition,
): WorldPosition {
  return {
    xMm:
      point.xMm,

    yMm:
      point.yMm,
  }
}

function distanceMm(
  first:
    WorldPosition,

  second:
    WorldPosition,
): number {
  return Math.hypot(
    second.xMm -
      first.xMm,

    second.yMm -
      first.yMm,
  )
}

function pointsAreClose(
  first:
    WorldPosition,

  second:
    WorldPosition,
): boolean {
  return (
    distanceMm(
      first,
      second,
    ) <=
    POSITION_TOLERANCE_MM
  )
}

function resolveFoldLineEndpoints(
  document:
    PatternDocument,

  edge:
    PatternPieceEdge,
): {
  start: WorldPosition
  end: WorldPosition
} {
  if (
    edge.kind !==
    'line'
  ) {
    throw new Error(
      'Pattern piece fold marking currently requires straight fold edges.',
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
      'Pattern piece fold marking has a missing endpoint.',
    )
  }

  return {
    start:
      copyPosition(
        start,
      ),

    end:
      copyPosition(
        end,
      ),
  }
}

function createFoldMarking(
  document:
    PatternDocument,

  piece:
    PatternPiece,

  edgeIndexes:
    number[],
): PatternPieceFoldMarking {
  if (
    edgeIndexes.length === 0
  ) {
    throw new Error(
      'Pattern piece fold marking requires at least one fold edge.',
    )
  }

  const resolved =
    edgeIndexes.map(
      (edgeIndex) =>
        resolveFoldLineEndpoints(
          document,
          piece.edges[
            edgeIndex
          ],
        ),
    )

  for (
    let index = 1;
    index <
      resolved.length;
    index += 1
  ) {
    if (
      !pointsAreClose(
        resolved[
          index - 1
        ].end,

        resolved[
          index
        ].start,
      )
    ) {
      throw new Error(
        'Consecutive fold edges must form one continuous path.',
      )
    }
  }

  const start =
    resolved[0].start

  const end =
    resolved[
      resolved.length - 1
    ].end

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
    POSITION_TOLERANCE_MM
  ) {
    throw new Error(
      'Pattern piece fold marking cannot use a zero-length fold path.',
    )
  }

  return {
    edgeIndexes: [
      ...edgeIndexes,
    ],

    start:
      copyPosition(
        start,
      ),

    end:
      copyPosition(
        end,
      ),

    midpoint: {
      xMm:
        (
          start.xMm +
          end.xMm
        ) / 2,

      yMm:
        (
          start.yMm +
          end.yMm
        ) / 2,
    },

    direction: {
      x:
        deltaX /
        lengthMm,

      y:
        deltaY /
        lengthMm,
    },

    lengthMm,
  }
}

export function createPatternPieceFoldMarkings(
  document:
    PatternDocument,

  piece:
    PatternPiece,
): PatternPieceFoldMarking[] {
  const markings:
    PatternPieceFoldMarking[] =
      []

  let currentIndexes:
    number[] = []

  const flushCurrent =
    () => {
      if (
        currentIndexes.length ===
        0
      ) {
        return
      }

      markings.push(
        createFoldMarking(
          document,
          piece,
          currentIndexes,
        ),
      )

      currentIndexes = []
    }

  piece.edges.forEach(
    (
      edge,
      edgeIndex,
    ) => {
      if (
        edge.treatment ===
        'fold'
      ) {
        currentIndexes.push(
          edgeIndex,
        )

        return
      }

      flushCurrent()
    },
  )

  flushCurrent()

  return markings
}