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
  evaluatePatternPieceEdgeCompatibility,
} from './patternPieceCompatibility'

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
    addPoint(document, {
      id: 'D',
      name: 'D',
      xMm: 10,
      yMm: 10,
    })

  document =
    addPoint(document, {
      id: 'E',
      name: 'E',
      xMm: 0,
      yMm: 20,
    })

  document =
    addPoint(document, {
      id: 'F',
      name: 'F',
      xMm: 12,
      yMm: 20,
    })

  document =
    addLine(document, {
      id: 'first10',
      name: 'First 10 mm',
      startPointId: 'A',
      endPointId: 'B',
      role: 'boundary',
    })

  document =
    addLine(document, {
      id: 'second10',
      name: 'Second 10 mm',
      startPointId: 'C',
      endPointId: 'D',
      role: 'boundary',
    })

  document =
    addLine(document, {
      id: 'twelve',
      name: 'Twelve mm',
      startPointId: 'E',
      endPointId: 'F',
      role: 'boundary',
    })

  document =
    addLine(document, {
      id: 'construction',
      name: 'Construction',
      startPointId: 'A',
      endPointId: 'C',
      role: 'construction',
    })

  return document
}

describe(
  'PAWTTERN CAD pattern piece edge compatibility',
  () => {
    it(
      'accepts exactly matching boundary edges with zero tolerance',
      () => {
        const document =
          createTestDocument()

        const result =
          evaluatePatternPieceEdgeCompatibility(
            document,
            {
              kind: 'line',
              geometryId:
                'first10',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'second10',
              direction:
                'reverse',
            },
            0,
          )

        expect(
          result.firstLengthMm,
        ).toBeCloseTo(
          10,
          8,
        )

        expect(
          result.secondLengthMm,
        ).toBeCloseTo(
          10,
          8,
        )

        expect(
          result.differenceMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          result.withinTolerance,
        ).toBe(true)
      },
    )

    it(
      'accepts a difference equal to the allowed tolerance',
      () => {
        const document =
          createTestDocument()

        const result =
          evaluatePatternPieceEdgeCompatibility(
            document,
            {
              kind: 'line',
              geometryId:
                'first10',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'twelve',
              direction:
                'forward',
            },
            2,
          )

        expect(
          result.differenceMm,
        ).toBeCloseTo(
          2,
          8,
        )

        expect(
          result.withinTolerance,
        ).toBe(true)
      },
    )

    it(
      'rejects a difference larger than the allowed tolerance',
      () => {
        const document =
          createTestDocument()

        const result =
          evaluatePatternPieceEdgeCompatibility(
            document,
            {
              kind: 'line',
              geometryId:
                'first10',
              direction:
                'forward',
            },
            {
              kind: 'line',
              geometryId:
                'twelve',
              direction:
                'forward',
            },
            1,
          )

        expect(
          result.differenceMm,
        ).toBeCloseTo(
          2,
          8,
        )

        expect(
          result.withinTolerance,
        ).toBe(false)
      },
    )

    it(
      'rejects construction geometry from a seam comparison',
      () => {
        const document =
          createTestDocument()

        expect(
          () =>
            evaluatePatternPieceEdgeCompatibility(
              document,
              {
                kind: 'line',
                geometryId:
                  'first10',
                direction:
                  'forward',
              },
              {
                kind: 'line',
                geometryId:
                  'construction',
                direction:
                  'forward',
              },
              0,
            ),
        ).toThrow(
          'is not boundary geometry.',
        )
      },
    )

    it(
      'rejects an invalid tolerance',
      () => {
        const document =
          createTestDocument()

        expect(
          () =>
            evaluatePatternPieceEdgeCompatibility(
              document,
              {
                kind: 'line',
                geometryId:
                  'first10',
                direction:
                  'forward',
              },
              {
                kind: 'line',
                geometryId:
                  'second10',
                direction:
                  'forward',
              },
              -1,
            ),
        ).toThrow(
          'Pattern piece edge compatibility tolerance must be a finite non-negative number.',
        )

        expect(
          () =>
            evaluatePatternPieceEdgeCompatibility(
              document,
              {
                kind: 'line',
                geometryId:
                  'first10',
                direction:
                  'forward',
              },
              {
                kind: 'line',
                geometryId:
                  'second10',
                direction:
                  'forward',
              },
              Number.POSITIVE_INFINITY,
            ),
        ).toThrow(
          'Pattern piece edge compatibility tolerance must be a finite non-negative number.',
        )
      },
    )
  },
)