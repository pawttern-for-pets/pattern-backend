import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  PatternPieceEdge,
} from './patternPiece'

import type {
  SampledPatternPieceContour,
  SampledPatternPieceEdge,
} from './patternPieceContour'

import {
  createSampledPatternPieceCuttingContour,
} from './sampledPatternPieceCuttingContour'

function edge(
  edgeIndex: number,
  geometryId: string,
  points: {
    xMm: number
    yMm: number
  }[],
  treatment?:
    PatternPieceEdge[
      'treatment'
    ],
): SampledPatternPieceEdge {
  return {
    edgeIndex,

    edge: {
      kind: 'line',
      geometryId,
      direction: 'forward',
      treatment,
    },

    points,
  }
}

function createSampledSquare(
  foldLeft = false,
): SampledPatternPieceContour {
  const edges = [
    edge(
      0,
      'TOP',
      [
        {
          xMm: 0,
          yMm: 0,
        },
        {
          xMm: 100,
          yMm: 0,
        },
      ],
    ),

    edge(
      1,
      'RIGHT',
      [
        {
          xMm: 100,
          yMm: 0,
        },
        {
          xMm: 100,
          yMm: 100,
        },
      ],
    ),

    edge(
      2,
      'BOTTOM',
      [
        {
          xMm: 100,
          yMm: 100,
        },
        {
          xMm: 0,
          yMm: 100,
        },
      ],
    ),

    edge(
      3,
      'LEFT',
      [
        {
          xMm: 0,
          yMm: 100,
        },
        {
          xMm: 0,
          yMm: 0,
        },
      ],

      foldLeft
        ? 'fold'
        : undefined,
    ),
  ]

  return {
    pieceId: 'SAMPLED_SQUARE',
    pieceName:
      'Sampled Square',

    edges,

    points: [
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
    ],
  }
}

function allowance(
  edgeValue:
    PatternPieceEdge,
): number {
  return edgeValue.treatment ===
    'fold'
    ? 0
    : 10
}

describe(
  'sampled pattern piece cutting contour',
  () => {
    it(
      'creates a closed 10 mm cutting contour from sampled straight edges',
      () => {
        const source =
          createSampledSquare()

        const result =
          createSampledPatternPieceCuttingContour(
            source,
            () => 10,
          )

        expect(
          result.winding,
        ).toBe(
          'clockwise',
        )

        expect(
          result.cuttingPoints[0].xMm,
        ).toBeCloseTo(
          -10,
          10,
        )

        expect(
          result.cuttingPoints[0].yMm,
        ).toBeCloseTo(
          -10,
          10,
        )

        expect(
          result.cuttingPoints[
            result.cuttingPoints.length -
              1
          ],
        ).toEqual(
          result.cuttingPoints[0],
        )
      },
    )

    it(
      'keeps a CUT ON FOLD edge on the original fold axis',
      () => {
        const source =
          createSampledSquare(
            true,
          )

        const result =
          createSampledPatternPieceCuttingContour(
            source,
            allowance,
          )

        expect(
          result.edgeOffsetsMm,
        ).toEqual([
          10,
          10,
          10,
          0,
        ])

        const xs =
          result.cuttingPoints.map(
            (point) =>
              point.xMm,
          )

        expect(
          Math.min(...xs),
        ).toBeCloseTo(
          0,
          10,
        )

        expect(
          Math.max(...xs),
        ).toBeCloseTo(
          110,
          10,
        )
      },
    )

    it(
      'supports multiple sampled segments belonging to one curved edge',
      () => {
        const source =
          createSampledSquare()

        source.edges[0] =
          edge(
            0,
            'SAMPLED_CURVE',
            [
              {
                xMm: 0,
                yMm: 0,
              },
              {
                xMm: 50,
                yMm: 0,
              },
              {
                xMm: 100,
                yMm: 0,
              },
            ],
          )

        source.points = [
          {
            xMm: 0,
            yMm: 0,
          },
          {
            xMm: 50,
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
        ]

        const result =
          createSampledPatternPieceCuttingContour(
            source,
            () => 10,
          )

        expect(
          result.joinKinds,
        ).toContain(
          'continuous',
        )

        expect(
          result.cuttingPoints.some(
            (point) =>
              Math.abs(
                point.xMm -
                  50,
              ) <
                0.000001 &&
              Math.abs(
                point.yMm +
                  10,
              ) <
                0.000001,
          ),
        ).toBe(true)
      },
    )

    it(
      'offsets a bent sampled curve without producing non-finite points',
      () => {
        const source =
          createSampledSquare()

        source.edges[0] =
          edge(
            0,
            'BENT_CURVE',
            [
              {
                xMm: 0,
                yMm: 0,
              },
              {
                xMm: 50,
                yMm: -20,
              },
              {
                xMm: 100,
                yMm: 0,
              },
            ],
          )

        const result =
          createSampledPatternPieceCuttingContour(
            source,
            () => 10,
          )

        for (
          const point of
          result.cuttingPoints
        ) {
          expect(
            Number.isFinite(
              point.xMm,
            ),
          ).toBe(true)

          expect(
            Number.isFinite(
              point.yMm,
            ),
          ).toBe(true)
        }
      },
    )

    it(
      'uses one allowance value for every sampled segment belonging to the same edge',
      () => {
        const source =
          createSampledSquare()

        source.edges[0] =
          edge(
            0,
            'MULTI',
            [
              {
                xMm: 0,
                yMm: 0,
              },
              {
                xMm: 25,
                yMm: 0,
              },
              {
                xMm: 50,
                yMm: 0,
              },
              {
                xMm: 75,
                yMm: 0,
              },
              {
                xMm: 100,
                yMm: 0,
              },
            ],
          )

        const calls:
          number[] = []

        const result =
          createSampledPatternPieceCuttingContour(
            source,
            (
              _edge,
              edgeIndex,
            ) => {
              calls.push(
                edgeIndex,
              )

              return (
                edgeIndex + 1
              ) * 5
            },
          )

        expect(
          calls,
        ).toEqual([
          0,
          1,
          2,
          3,
        ])

        expect(
          result.edgeOffsetsMm,
        ).toEqual([
          5,
          10,
          15,
          20,
        ])
      },
    )

    it(
      'does not mutate the sampled sewing contour',
      () => {
        const source =
          createSampledSquare(
            true,
          )

        const before =
          JSON.stringify(
            source,
          )

        createSampledPatternPieceCuttingContour(
          source,
          allowance,
        )

        expect(
          JSON.stringify(
            source,
          ),
        ).toBe(
          before,
        )
      },
    )

    it(
      'rejects invalid edge allowance values',
      () => {
        const source =
          createSampledSquare()

        expect(() =>
          createSampledPatternPieceCuttingContour(
            source,
            () =>
              Number.NaN,
          ),
        ).toThrow(
          /offset/i,
        )

        expect(() =>
          createSampledPatternPieceCuttingContour(
            source,
            () => -1,
          ),
        ).toThrow(
          /offset/i,
        )
      },
    )

    it(
      'rejects disconnected sampled edges',
      () => {
        const source =
          createSampledSquare()

        source.edges[1] = {
          ...source.edges[1],

          points: [
            {
              xMm: 120,
              yMm: 0,
            },
            {
              xMm: 120,
              yMm: 100,
            },
          ],
        }

        expect(() =>
          createSampledPatternPieceCuttingContour(
            source,
            () => 10,
          ),
        ).toThrow(
          /connect continuously/i,
        )
      },
    )
    it(
      'contains exactly one explicit closing point',
      () => {
        const source =
          createSampledSquare()

        const result =
          createSampledPatternPieceCuttingContour(
            source,
            () => 10,
          )

        const first =
          result.cuttingPoints[0]

        const last =
          result.cuttingPoints[
            result.cuttingPoints.length -
              1
          ]

        const beforeLast =
          result.cuttingPoints[
            result.cuttingPoints.length -
              2
          ]

        expect(
          last,
        ).toEqual(
          first,
        )

        expect(
          Math.hypot(
            beforeLast.xMm -
              first.xMm,

            beforeLast.yMm -
              first.yMm,
          ),
        ).toBeGreaterThan(
          0.000000001,
        )
      },
    )

    it(
      'rejects zero-length sampled segments',
      () => {
        const source =
          createSampledSquare()

        source.edges[0] =
          edge(
            0,
            'ZERO_LENGTH',
            [
              {
                xMm: 0,
                yMm: 0,
              },
              {
                xMm: 0,
                yMm: 0,
              },
              {
                xMm: 100,
                yMm: 0,
              },
            ],
          )

        expect(() =>
          createSampledPatternPieceCuttingContour(
            source,
            () => 10,
          ),
        ).toThrow(
          /zero-length/i,
        )
      },
    )
  },
)
