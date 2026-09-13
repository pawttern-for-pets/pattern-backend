import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addLine,
  addPoint,
  createEmptyDocument,
} from './document'

import type {
  PatternPiece,
} from './patternPiece'

import {
  createStraightPatternPieceCuttingContour,
} from './straightPatternPieceCuttingContour'

function createSquarePiece(
  reverse = false,
) {
  let document =
    createEmptyDocument()

  for (
    const point
    of [
      {
        id: 'A',
        name: 'A',
        xMm: 0,
        yMm: 0,
      },
      {
        id: 'B',
        name: 'B',
        xMm: 100,
        yMm: 0,
      },
      {
        id: 'C',
        name: 'C',
        xMm: 100,
        yMm: 100,
      },
      {
        id: 'D',
        name: 'D',
        xMm: 0,
        yMm: 100,
      },
    ]
  ) {
    document =
      addPoint(
        document,
        point,
      )
  }

  for (
    const line
    of [
      {
        id: 'AB',
        name: 'AB',
        startPointId: 'A',
        endPointId: 'B',
        role: 'boundary' as const,
      },
      {
        id: 'BC',
        name: 'BC',
        startPointId: 'B',
        endPointId: 'C',
        role: 'boundary' as const,
      },
      {
        id: 'CD',
        name: 'CD',
        startPointId: 'C',
        endPointId: 'D',
        role: 'boundary' as const,
      },
      {
        id: 'DA',
        name: 'DA',
        startPointId: 'D',
        endPointId: 'A',
        role: 'boundary' as const,
      },
    ]
  ) {
    document =
      addLine(
        document,
        line,
      )
  }

  const piece:
    PatternPiece =
      reverse
        ? {
            id: 'SQUARE_REVERSE',
            name: 'Square Reverse',

            edges: [
              {
                kind: 'line',
                geometryId: 'DA',
                direction: 'reverse',
                treatment: 'fold',
              },
              {
                kind: 'line',
                geometryId: 'CD',
                direction: 'reverse',
              },
              {
                kind: 'line',
                geometryId: 'BC',
                direction: 'reverse',
              },
              {
                kind: 'line',
                geometryId: 'AB',
                direction: 'reverse',
              },
            ],
          }
        : {
            id: 'SQUARE',
            name: 'Square',

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
                geometryId: 'CD',
                direction: 'forward',
              },
              {
                kind: 'line',
                geometryId: 'DA',
                direction: 'forward',
                treatment: 'fold',
              },
            ],
          }

  return {
    document,
    piece,
  }
}

function defaultAllowance(
  edge:
    PatternPiece[
      'edges'
    ][number],
): number {
  return edge.treatment ===
    'fold'
    ? 0
    : 10
}

describe(
  'straight pattern piece cutting contour',
  () => {
    it(
      'creates a closed 10 mm cutting contour around a square',
      () => {
        const source =
          createSquarePiece()

        const result =
          createStraightPatternPieceCuttingContour(
            source.document,
            source.piece,
            () => 10,
          )

        expect(
          result.winding,
        ).toBe(
          'clockwise',
        )

        expect(
          result.cuttingPoints,
        ).toHaveLength(5)

        expect(
          result.cuttingPoints[0].xMm,
        ).toBeCloseTo(-10, 10)

        expect(
          result.cuttingPoints[0].yMm,
        ).toBeCloseTo(-10, 10)

        expect(
          result.cuttingPoints[1].xMm,
        ).toBeCloseTo(110, 10)

        expect(
          result.cuttingPoints[1].yMm,
        ).toBeCloseTo(-10, 10)

        expect(
          result.cuttingPoints[2].xMm,
        ).toBeCloseTo(110, 10)

        expect(
          result.cuttingPoints[2].yMm,
        ).toBeCloseTo(110, 10)

        expect(
          result.cuttingPoints[3].xMm,
        ).toBeCloseTo(-10, 10)

        expect(
          result.cuttingPoints[3].yMm,
        ).toBeCloseTo(110, 10)

        expect(
          result.cuttingPoints[4],
        ).toEqual(
          result.cuttingPoints[0],
        )
      },
    )

    it(
      'keeps the CUT ON FOLD side exactly on the original fold line',
      () => {
        const source =
          createSquarePiece()

        const result =
          createStraightPatternPieceCuttingContour(
            source.document,
            source.piece,
            defaultAllowance,
          )

        expect(
          result.edgeOffsetsMm,
        ).toEqual([
          10,
          10,
          10,
          0,
        ])

        expect(
          result.cuttingPoints[0].xMm,
        ).toBeCloseTo(0, 10)

        expect(
          result.cuttingPoints[3].xMm,
        ).toBeCloseTo(0, 10)

        expect(
          result.cuttingPoints[0].yMm,
        ).toBeCloseTo(-10, 10)

        expect(
          result.cuttingPoints[3].yMm,
        ).toBeCloseTo(110, 10)
      },
    )

    it(
      'creates the same physical fold boundary when traversal is reversed',
      () => {
        const source =
          createSquarePiece(
            true,
          )

        const result =
          createStraightPatternPieceCuttingContour(
            source.document,
            source.piece,
            defaultAllowance,
          )

        expect(
          result.winding,
        ).toBe(
          'counter-clockwise',
        )

        const xs =
          result.cuttingPoints
            .slice(
              0,
              -1,
            )
            .map(
              (point) =>
                point.xMm,
            )

        expect(
          Math.min(...xs),
        ).toBeCloseTo(0, 10)

        expect(
          Math.max(...xs),
        ).toBeCloseTo(110, 10)
      },
    )

    it(
      'supports different allowances on different edges',
      () => {
        const source =
          createSquarePiece()

        const allowances = [
          5,
          10,
          15,
          0,
        ]

        const result =
          createStraightPatternPieceCuttingContour(
            source.document,
            source.piece,
            (
              _edge,
              index,
            ) =>
              allowances[
                index
              ],
          )

        expect(
          result.edgeOffsetsMm,
        ).toEqual(
          allowances,
        )

        expect(
          result.cuttingPoints[0].xMm,
        ).toBeCloseTo(0, 10)

        expect(
          result.cuttingPoints[0].yMm,
        ).toBeCloseTo(-5, 10)

        expect(
          result.cuttingPoints[2].xMm,
        ).toBeCloseTo(110, 10)

        expect(
          result.cuttingPoints[2].yMm,
        ).toBeCloseTo(115, 10)
      },
    )

    it(
      'preserves the original sewing contour unchanged',
      () => {
        const source =
          createSquarePiece()

        const documentBefore =
          JSON.stringify(
            source.document,
          )

        const pieceBefore =
          JSON.stringify(
            source.piece,
          )

        const result =
          createStraightPatternPieceCuttingContour(
            source.document,
            source.piece,
            defaultAllowance,
          )

        expect(
          result.sewingPoints,
        ).toEqual([
          {
            xMm: 0,
            yMm: 0,
          },
          {
            xMm: 100,
            yMm: 0,
          },
          {
            xMm: 100,
            yMm: 100,
          },
          {
            xMm: 0,
            yMm: 100,
          },
          {
            xMm: 0,
            yMm: 0,
          },
        ])

        expect(
          JSON.stringify(
            source.document,
          ),
        ).toBe(
          documentBefore,
        )

        expect(
          JSON.stringify(
            source.piece,
          ),
        ).toBe(
          pieceBefore,
        )
      },
    )

    it(
      'rejects invalid resolved allowance values',
      () => {
        const source =
          createSquarePiece()

        expect(() =>
          createStraightPatternPieceCuttingContour(
            source.document,
            source.piece,
            () =>
              Number.NaN,
          ),
        ).toThrow(
          /offset/i,
        )

        expect(() =>
          createStraightPatternPieceCuttingContour(
            source.document,
            source.piece,
            () => -1,
          ),
        ).toThrow(
          /offset/i,
        )
      },
    )

    it(
      'rejects pattern pieces containing curves at this stage',
      () => {
        const source =
          createSquarePiece()

        const malformed = {
          ...source.piece,

          edges: [
            {
              ...source.piece
                .edges[0],

              kind:
                'curve' as const,
            },

            ...source.piece
              .edges
              .slice(1),
          ],
        }

        expect(() =>
          createStraightPatternPieceCuttingContour(
            source.document,
            malformed,
            defaultAllowance,
          ),
        ).toThrow()
      },
    )

    it(
      'rejects an invalid open pattern piece',
      () => {
        const source =
          createSquarePiece()

        const openPiece:
          PatternPiece = {
            ...source.piece,

            edges:
              source.piece
                .edges
                .slice(
                  0,
                  3,
                ),
          }

        expect(() =>
          createStraightPatternPieceCuttingContour(
            source.document,
            openPiece,
            defaultAllowance,
          ),
        ).toThrow(
          /valid closed boundary/i,
        )
      },
    )
  },
)