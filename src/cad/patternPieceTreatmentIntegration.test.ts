import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addLine,
  addPoint,
  createEmptyDocument,
  type PatternDocument,
} from './document'

import {
  isValidPatternPiece,
  resolvePatternPieceEdgeEndpoints,
  type PatternPiece,
  type PatternPieceEdge,
} from './patternPiece'

function createTestDocument():
PatternDocument {
  let document =
    createEmptyDocument()

  document =
    addPoint(document, {
      id: 'A',
      name: 'A',
      xMm: 0,
      yMm: 0,
    })

  document =
    addPoint(document, {
      id: 'B',
      name: 'B',
      xMm: 10,
      yMm: 0,
    })

  document =
    addPoint(document, {
      id: 'C',
      name: 'C',
      xMm: 0,
      yMm: 10,
    })

  document =
    addLine(document, {
      id: 'AB',
      name: 'AB',
      startPointId: 'A',
      endPointId: 'B',
      role: 'boundary',
    })

  document =
    addLine(document, {
      id: 'BC',
      name: 'BC',
      startPointId: 'B',
      endPointId: 'C',
      role: 'boundary',
    })

  document =
    addLine(document, {
      id: 'CA',
      name: 'CA',
      startPointId: 'C',
      endPointId: 'A',
      role: 'boundary',
    })

  return document
}

describe(
  'PAWTTERN CAD pattern piece treatment integration',
  () => {
    it(
      'accepts a valid seam treatment on a boundary edge',
      () => {
        const document =
          createTestDocument()

        const piece:
          PatternPiece = {
            id: 'piece',
            name: 'Piece',

            edges: [
              {
                kind: 'line',
                geometryId: 'AB',
                direction: 'forward',
                treatment: 'seam',
              },

              {
                kind: 'line',
                geometryId: 'BC',
                direction: 'forward',
              },

              {
                kind: 'line',
                geometryId: 'CA',
                direction: 'forward',
              },
            ],
          }

        expect(
          isValidPatternPiece(
            piece,
            document,
          ),
        ).toBe(true)
      },
    )

    it(
      'keeps omitted treatment valid for backwards compatibility',
      () => {
        const document =
          createTestDocument()

        const piece:
          PatternPiece = {
            id: 'piece',
            name: 'Piece',

            edges: [
              {
                kind: 'line',
                geometryId: 'AB',
                direction: 'forward',
              },

              {
                kind: 'line',
                geometryId: 'BC',
                direction: 'forward',
              },

              {
                kind: 'line',
                geometryId: 'CA',
                direction: 'forward',
              },
            ],
          }

        expect(
          isValidPatternPiece(
            piece,
            document,
          ),
        ).toBe(true)
      },
    )

    it(
      'rejects an invalid runtime treatment',
      () => {
        const document =
          createTestDocument()

        const malformedEdge = {
          kind: 'line',
          geometryId: 'AB',
          direction: 'forward',
          treatment: 'dart',
        } as unknown as PatternPieceEdge

        expect(
          () =>
            resolvePatternPieceEdgeEndpoints(
              document,
              malformedEdge,
            ),
        ).toThrow(
          'Pattern piece edge treatment is invalid.',
        )

        const piece:
          PatternPiece = {
            id: 'piece',
            name: 'Piece',

            edges: [
              malformedEdge,

              {
                kind: 'line',
                geometryId: 'BC',
                direction: 'forward',
              },

              {
                kind: 'line',
                geometryId: 'CA',
                direction: 'forward',
              },
            ],
          }

        expect(
          isValidPatternPiece(
            piece,
            document,
          ),
        ).toBe(false)
      },
    )
  },
)