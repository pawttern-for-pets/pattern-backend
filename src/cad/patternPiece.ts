import type {
  PatternDocument,
} from './document'

import {
  isValidLine,
} from './lines'

import {
  isValidCubicBezierCurve,
} from './curves'

export type PatternPieceEdgeKind =
  'line' |
  'curve'

export type PatternPieceEdgeDirection =
  'forward' |
  'reverse'

export interface PatternPieceEdge {
  kind: PatternPieceEdgeKind
  geometryId: string
  direction:
    PatternPieceEdgeDirection
}

export interface PatternPiece {
  id: string
  name: string
  edges: PatternPieceEdge[]
}

export interface PatternPieceEdgeEndpoints {
  startPointId: string
  endPointId: string
}

function isPatternPieceEdgeKind(
  value: unknown,
): value is PatternPieceEdgeKind {
  return (
    value === 'line' ||
    value === 'curve'
  )
}

function isPatternPieceEdgeDirection(
  value: unknown,
): value is PatternPieceEdgeDirection {
  return (
    value === 'forward' ||
    value === 'reverse'
  )
}

export function resolvePatternPieceEdgeEndpoints(
  document: PatternDocument,
  edge: PatternPieceEdge,
): PatternPieceEdgeEndpoints {
  if (
    !isPatternPieceEdgeKind(
      edge.kind,
    )
  ) {
    throw new Error(
      'Pattern piece edge kind is invalid.',
    )
  }

  if (
    !isPatternPieceEdgeDirection(
      edge.direction,
    )
  ) {
    throw new Error(
      'Pattern piece edge direction is invalid.',
    )
  }

  if (
    edge.geometryId.trim().length ===
    0
  ) {
    throw new Error(
      'Pattern piece edge geometry id cannot be empty.',
    )
  }

  const geometry =
    edge.kind === 'line'
      ? document.lines[
          edge.geometryId
        ]
      : document.curves[
          edge.geometryId
        ]

  if (!geometry) {
    throw new Error(
      `Pattern piece ${edge.kind} "${edge.geometryId}" does not exist.`,
    )
  }

  const geometryIsValid =
    edge.kind === 'line'
      ? isValidLine(
          document.lines[
            edge.geometryId
          ],
          document.points,
        )
      : isValidCubicBezierCurve(
          document.curves[
            edge.geometryId
          ],
          document.points,
        )

  if (!geometryIsValid) {
    throw new Error(
      `Pattern piece ${edge.kind} "${edge.geometryId}" is invalid.`,
    )
  }

  if (
    geometry.role !==
    'boundary'
  ) {
    throw new Error(
      `Pattern piece ${edge.kind} "${edge.geometryId}" is not boundary geometry.`,
    )
  }

  if (
    edge.direction ===
    'forward'
  ) {
    return {
      startPointId:
        geometry.startPointId,

      endPointId:
        geometry.endPointId,
    }
  }

  return {
    startPointId:
      geometry.endPointId,

    endPointId:
      geometry.startPointId,
  }
}

export function isValidPatternPiece(
  piece: PatternPiece,
  document: PatternDocument,
): boolean {
  if (
    piece.id.trim().length === 0 ||
    piece.name.trim().length === 0 ||
    piece.edges.length < 2
  ) {
    return false
  }

  const seenGeometry =
    new Set<string>()

  let firstStartPointId:
    string | undefined

  let previousEndPointId:
    string | undefined

  for (
    const edge of piece.edges
  ) {
    if (
      !isPatternPieceEdgeKind(
        edge.kind,
      ) ||
      !isPatternPieceEdgeDirection(
        edge.direction,
      ) ||
      edge.geometryId.trim().length ===
        0
    ) {
      return false
    }

    const geometryKey =
      `${edge.kind}:${edge.geometryId}`

    if (
      seenGeometry.has(
        geometryKey,
      )
    ) {
      return false
    }

    seenGeometry.add(
      geometryKey,
    )

    let endpoints:
      PatternPieceEdgeEndpoints

    try {
      endpoints =
        resolvePatternPieceEdgeEndpoints(
          document,
          edge,
        )
    } catch {
      return false
    }

    if (
      firstStartPointId ===
      undefined
    ) {
      firstStartPointId =
        endpoints.startPointId
    }

    if (
      previousEndPointId !==
        undefined &&
      previousEndPointId !==
        endpoints.startPointId
    ) {
      return false
    }

    previousEndPointId =
      endpoints.endPointId
  }

  return (
    firstStartPointId !==
      undefined &&
    previousEndPointId ===
      firstStartPointId
  )
}