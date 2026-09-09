import {
  addCurve,
  addLine,
  addPoint,
  type PatternDocument,
} from './document'

import {
  isValidPatternPiece,
  type PatternPiece,
  type PatternPieceEdge,
} from './patternPiece'

export interface PatternPieceLayoutCloneOptions {
  instanceId: string
  offsetXMm: number
  offsetYMm: number
}

export interface PatternPieceLayoutCloneResult {
  document: PatternDocument
  piece: PatternPiece
}

function createLayoutGeometryId(
  instanceId: string,
  kind:
    'point' |
    'line' |
    'curve' |
    'piece',
  sourceId: string,
): string {
  return (
    `${instanceId}::${kind}::${sourceId}`
  )
}

function validateLayoutOptions(
  options:
    PatternPieceLayoutCloneOptions,
): void {
  if (
    options.instanceId.trim().length ===
    0
  ) {
    throw new Error(
      'Pattern piece layout instance id cannot be empty.',
    )
  }

  if (
    !Number.isFinite(
      options.offsetXMm,
    ) ||
    !Number.isFinite(
      options.offsetYMm,
    )
  ) {
    throw new Error(
      'Pattern piece layout offsets must be finite numbers.',
    )
  }
}

export function addPatternPieceLayoutClone(
  targetDocument: PatternDocument,
  sourceDocument: PatternDocument,
  sourcePiece: PatternPiece,
  options:
    PatternPieceLayoutCloneOptions,
): PatternPieceLayoutCloneResult {
  validateLayoutOptions(
    options,
  )

  if (
    !isValidPatternPiece(
      sourcePiece,
      sourceDocument,
    )
  ) {
    throw new Error(
      'Pattern piece layout requires a valid closed boundary piece.',
    )
  }

  const instanceId =
    options.instanceId.trim()

  const clonedPointIds =
    new Map<string, string>()

  let nextDocument =
    targetDocument

  function ensureClonedPoint(
    sourcePointId: string,
  ): string {
    const existingCloneId =
      clonedPointIds.get(
        sourcePointId,
      )

    if (
      existingCloneId !==
      undefined
    ) {
      return existingCloneId
    }

    const sourcePoint =
      sourceDocument.points[
        sourcePointId
      ]

    if (!sourcePoint) {
      throw new Error(
        `Pattern piece layout source point "${sourcePointId}" does not exist.`,
      )
    }

    const clonePointId =
      createLayoutGeometryId(
        instanceId,
        'point',
        sourcePointId,
      )

    nextDocument =
      addPoint(
        nextDocument,
        {
          ...sourcePoint,

          id:
            clonePointId,

          xMm:
            sourcePoint.xMm +
            options.offsetXMm,

          yMm:
            sourcePoint.yMm +
            options.offsetYMm,
        },
      )

    clonedPointIds.set(
      sourcePointId,
      clonePointId,
    )

    return clonePointId
  }

  const clonedEdges:
    PatternPieceEdge[] = []

  for (
    const sourceEdge
    of sourcePiece.edges
  ) {
    if (
      sourceEdge.kind ===
      'line'
    ) {
      const sourceLine =
        sourceDocument.lines[
          sourceEdge.geometryId
        ]

      if (!sourceLine) {
        throw new Error(
          `Pattern piece layout source line "${sourceEdge.geometryId}" does not exist.`,
        )
      }

      const clonedLineId =
        createLayoutGeometryId(
          instanceId,
          'line',
          sourceLine.id,
        )

      const clonedStartPointId =
        ensureClonedPoint(
          sourceLine.startPointId,
        )

      const clonedEndPointId =
        ensureClonedPoint(
          sourceLine.endPointId,
        )

      nextDocument =
        addLine(
          nextDocument,
          {
            ...sourceLine,

            id:
              clonedLineId,

            startPointId:
              clonedStartPointId,

            endPointId:
              clonedEndPointId,
          },
        )

      clonedEdges.push({
        ...sourceEdge,

        geometryId:
          clonedLineId,
      })

      continue
    }

    const sourceCurve =
      sourceDocument.curves[
        sourceEdge.geometryId
      ]

    if (!sourceCurve) {
      throw new Error(
        `Pattern piece layout source curve "${sourceEdge.geometryId}" does not exist.`,
      )
    }

    const clonedCurveId =
      createLayoutGeometryId(
        instanceId,
        'curve',
        sourceCurve.id,
      )

    const clonedStartPointId =
      ensureClonedPoint(
        sourceCurve.startPointId,
      )

    const clonedEndPointId =
      ensureClonedPoint(
        sourceCurve.endPointId,
      )

    nextDocument =
      addCurve(
        nextDocument,
        {
          ...sourceCurve,

          id:
            clonedCurveId,

          startPointId:
            clonedStartPointId,

          endPointId:
            clonedEndPointId,

          control1: {
            xMm:
              sourceCurve
                .control1.xMm +
              options.offsetXMm,

            yMm:
              sourceCurve
                .control1.yMm +
              options.offsetYMm,
          },

          control2: {
            xMm:
              sourceCurve
                .control2.xMm +
              options.offsetXMm,

            yMm:
              sourceCurve
                .control2.yMm +
              options.offsetYMm,
          },
        },
      )

    clonedEdges.push({
      ...sourceEdge,

      geometryId:
        clonedCurveId,
    })
  }

  const clonedPiece:
    PatternPiece = {
      id:
        createLayoutGeometryId(
          instanceId,
          'piece',
          sourcePiece.id,
        ),

      name:
        sourcePiece.name,

      edges:
        clonedEdges,
    }

  if (
    !isValidPatternPiece(
      clonedPiece,
      nextDocument,
    )
  ) {
    throw new Error(
      'Pattern piece layout clone did not produce a valid closed boundary.',
    )
  }

  return {
    document:
      nextDocument,

    piece:
      clonedPiece,
  }
}