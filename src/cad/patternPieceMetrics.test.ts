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
  patternPieceEdgeLengthMm,
} from './patternPieceMetrics'

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
    addLine(document, {
      id: 'boundaryLine',
      name: 'Boundary Line',
      startPointId: 'A',
      endPointId: 'B',
      role: 'boundary',
    })

  document =
    addCurve(document, {
      id: 'boundaryCurve',
      name: 'Boundary Curve',
      startPointId: 'B',
      endPointId: 'C',
      control1: {
        xMm: 10,
        yMm: 10 / 3,
      },
      control2: {
        xMm: 10,
        yMm: 20 / 3,
      },
      role: 'boundary',
    })

  document =
    addLine(document, {
      id: 'constructionLine',
      name: 'Construction Line',
      startPointId: 'A',
      endPointId: 'C',
      role: 'construction',
    })

  return document
}

describe(
  'PAWTTERN CAD pattern piece metrics',
  () => {
    it(
      'measures a straight boundary edge',
      () => {
        const document =
          createTestDocument()

        const length =
          patternPieceEdgeLengthMm(
            document,
            {
              kind: 'line',
              geometryId:
                'boundaryLine',
              direction:
                'forward',
            },
          )

        expect(
          length,
        ).toBeCloseTo(
          10,
          8,
        )
      },
    )

    it(
      'measures a cubic boundary edge',
      () => {
        const document =
          createTestDocument()

        const length =
          patternPieceEdgeLengthMm(
            document,
            {
              kind: 'curve',
              geometryId:
                'boundaryCurve',
              direction:
                'forward',
            },
          )

        expect(
          length,
        ).toBeCloseTo(
          10,
          8,
        )
      },
    )

    it(
      'gives the same physical length when traversal is reversed',
      () => {
        const document =
          createTestDocument()

        const forward =
          patternPieceEdgeLengthMm(
            document,
            {
              kind: 'curve',
              geometryId:
                'boundaryCurve',
              direction:
                'forward',
            },
          )

        const reverse =
          patternPieceEdgeLengthMm(
            document,
            {
              kind: 'curve',
              geometryId:
                'boundaryCurve',
              direction:
                'reverse',
            },
          )

        expect(
          reverse,
        ).toBeCloseTo(
          forward,
          10,
        )
      },
    )

    it(
      'rejects construction geometry as a finished piece edge',
      () => {
        const document =
          createTestDocument()

        expect(
          () =>
            patternPieceEdgeLengthMm(
              document,
              {
                kind: 'line',
                geometryId:
                  'constructionLine',
                direction:
                  'forward',
              },
            ),
        ).toThrow(
          'is not boundary geometry.',
        )
      },
    )

    it(
      'rejects an invalid curve length segment count',
      () => {
        const document =
          createTestDocument()

        expect(
          () =>
            patternPieceEdgeLengthMm(
              document,
              {
                kind: 'curve',
                geometryId:
                  'boundaryCurve',
                direction:
                  'forward',
              },
              0,
            ),
        ).toThrow(
          'Curve length segments must be a positive integer.',
        )
      },
    )
  },
)