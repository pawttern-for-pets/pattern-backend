import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addCurve,
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
      xMm: 10,
      yMm: 10,
    })

  document =
    addPoint(document, {
      id: 'D',
      name: 'D',
      xMm: 0,
      yMm: 10,
    })

  document =
    addLine(document, {
      id: 'bottom',
      name: 'Bottom',
      startPointId: 'A',
      endPointId: 'B',
      role: 'boundary',
    })

  document =
    addCurve(document, {
      id: 'rightCurve',
      name: 'Right Curve',
      startPointId: 'B',
      endPointId: 'C',
      control1: {
        xMm: 11,
        yMm: 3,
      },
      control2: {
        xMm: 11,
        yMm: 7,
      },
      role: 'boundary',
    })

  document =
    addLine(document, {
      id: 'rightReverse',
      name: 'Right Reverse',
      startPointId: 'C',
      endPointId: 'B',
      role: 'boundary',
    })

  document =
    addLine(document, {
      id: 'top',
      name: 'Top',
      startPointId: 'C',
      endPointId: 'D',
      role: 'boundary',
    })

  document =
    addLine(document, {
      id: 'left',
      name: 'Left',
      startPointId: 'D',
      endPointId: 'A',
      role: 'boundary',
    })

  document =
    addLine(document, {
      id: 'constructionDiagonal',
      name: 'Construction Diagonal',
      startPointId: 'A',
      endPointId: 'C',
      role: 'construction',
    })

  return document
}

describe('PAWTTERN CAD pattern pieces', () => {
  it(
    'accepts a closed boundary loop containing lines and curves',
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
              geometryId:
                'bottom',
              direction:
                'forward',
            },
            {
              kind: 'curve',
              geometryId:
                'rightCurve',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'top',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'left',
              direction:
                'forward',
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
    'supports reverse edge traversal',
    () => {
      const document =
        createTestDocument()

      const endpoints =
        resolvePatternPieceEdgeEndpoints(
          document,
          {
            kind: 'line',
            geometryId:
              'rightReverse',
            direction:
              'reverse',
          },
        )

      expect(
        endpoints,
      ).toEqual({
        startPointId: 'B',
        endPointId: 'C',
      })

      const piece:
        PatternPiece = {
          id: 'piece',
          name: 'Piece',
          edges: [
            {
              kind: 'line',
              geometryId:
                'bottom',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'rightReverse',
              direction:
                'reverse',
            },
            {
              kind: 'line',
              geometryId:
                'top',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'left',
              direction:
                'forward',
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
    'rejects construction geometry from a finished piece',
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
              geometryId:
                'constructionDiagonal',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'top',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'left',
              direction:
                'forward',
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

  it(
    'rejects a broken boundary loop',
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
              geometryId:
                'bottom',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'top',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'left',
              direction:
                'forward',
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

  it(
    'rejects missing geometry',
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
              geometryId:
                'missing',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'left',
              direction:
                'forward',
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

  it(
    'rejects duplicate geometry in one piece',
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
              geometryId:
                'bottom',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'bottom',
              direction:
                'reverse',
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

  it(
    'rejects an invalid runtime edge direction',
    () => {
      const document =
        createTestDocument()

      const malformedEdge = {
        kind: 'line',
        geometryId: 'bottom',
        direction: 'sideways',
      } as unknown as PatternPieceEdge

      expect(
        () =>
          resolvePatternPieceEdgeEndpoints(
            document,
            malformedEdge,
          ),
      ).toThrow(
        'Pattern piece edge direction is invalid.',
      )
    },
  )

  it(
    'rejects an invalid runtime edge kind',
    () => {
      const document =
        createTestDocument()

      const malformedEdge = {
        kind: 'arc',
        geometryId: 'rightCurve',
        direction: 'forward',
      } as unknown as PatternPieceEdge

      expect(
        () =>
          resolvePatternPieceEdgeEndpoints(
            document,
            malformedEdge,
          ),
      ).toThrow(
        'Pattern piece edge kind is invalid.',
      )
    },
  )
})