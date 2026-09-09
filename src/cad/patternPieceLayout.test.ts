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

import type {
  PatternPiece,
} from './patternPiece'

import {
  patternPieceEdgeLengthMm,
} from './patternPieceMetrics'

import {
  addPatternPieceLayoutClone,
} from './patternPieceLayout'

function createSource(): {
  document: PatternDocument
  piece: PatternPiece
} {
  let document =
    createEmptyDocument()

  document =
    addPoint(
      document,
      {
        id: 'A',
        name: 'A',
        xMm: 0,
        yMm: 0,
      },
    )

  document =
    addPoint(
      document,
      {
        id: 'B',
        name: 'B',
        xMm: 30,
        yMm: 0,
      },
    )

  document =
    addPoint(
      document,
      {
        id: 'C',
        name: 'C',
        xMm: 0,
        yMm: 40,
      },
    )

  document =
    addPoint(
      document,
      {
        id: 'D',
        name: 'D',
        xMm: 50,
        yMm: 50,
      },
    )

  document =
    addPoint(
      document,
      {
        id: 'E',
        name: 'E',
        xMm: 70,
        yMm: 50,
      },
    )

  document =
    addLine(
      document,
      {
        id: 'AB',
        name: 'AB',
        startPointId: 'A',
        endPointId: 'B',
        role: 'boundary',
      },
    )

  document =
    addCurve(
      document,
      {
        id: 'BC',
        name: 'BC',
        startPointId: 'B',
        endPointId: 'C',

        control1: {
          xMm: 30,
          yMm: 20,
        },

        control2: {
          xMm: 10,
          yMm: 40,
        },

        role: 'boundary',
      },
    )

  document =
    addLine(
      document,
      {
        id: 'CA',
        name: 'CA',
        startPointId: 'C',
        endPointId: 'A',
        role: 'boundary',
      },
    )

  document =
    addLine(
      document,
      {
        id: 'GUIDE',
        name: 'Guide',
        startPointId: 'D',
        endPointId: 'E',
        role: 'construction',
      },
    )

  const piece:
    PatternPiece = {
      id: 'TEST_PIECE',
      name: 'Test Piece',

      edges: [
        {
          kind: 'line',
          geometryId: 'AB',
          direction: 'forward',
          treatment: 'seam',
        },

        {
          kind: 'curve',
          geometryId: 'BC',
          direction: 'forward',
          treatment:
            'finished-edge',
        },

        {
          kind: 'line',
          geometryId: 'CA',
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

describe(
  'generic pattern piece layout cloning',
  () => {
    it(
      'translates all endpoint points and Bezier controls by the exact requested offset',
      () => {
        const source =
          createSource()

        const result =
          addPatternPieceLayoutClone(
            createEmptyDocument(),
            source.document,
            source.piece,
            {
              instanceId:
                'DISPLAY_A',

              offsetXMm:
                100,

              offsetYMm:
                -25,
            },
          )

        const points =
          Object.values(
            result.document.points,
          )

        const pointA =
          points.find(
            (point) =>
              point.name === 'A',
          )

        const pointB =
          points.find(
            (point) =>
              point.name === 'B',
          )

        const pointC =
          points.find(
            (point) =>
              point.name === 'C',
          )

        expect(
          pointA,
        ).toMatchObject({
          xMm: 100,
          yMm: -25,
        })

        expect(
          pointB,
        ).toMatchObject({
          xMm: 130,
          yMm: -25,
        })

        expect(
          pointC,
        ).toMatchObject({
          xMm: 100,
          yMm: 15,
        })

        const curve =
          Object.values(
            result.document.curves,
          )[0]

        expect(
          curve.control1,
        ).toEqual({
          xMm: 130,
          yMm: -5,
        })

        expect(
          curve.control2,
        ).toEqual({
          xMm: 110,
          yMm: 15,
        })
      },
    )

    it(
      'preserves topology direction treatments roles and exact edge lengths',
      () => {
        const source =
          createSource()

        const result =
          addPatternPieceLayoutClone(
            createEmptyDocument(),
            source.document,
            source.piece,
            {
              instanceId:
                'DISPLAY_A',

              offsetXMm:
                80,

              offsetYMm:
                60,
            },
          )

        expect(
          result.piece.edges.map(
            (edge) => ({
              kind:
                edge.kind,

              direction:
                edge.direction,

              treatment:
                edge.treatment,
            }),
          ),
        ).toEqual([
          {
            kind: 'line',
            direction: 'forward',
            treatment: 'seam',
          },

          {
            kind: 'curve',
            direction: 'forward',
            treatment:
              'finished-edge',
          },

          {
            kind: 'line',
            direction: 'forward',
            treatment: 'fold',
          },
        ])

        expect(
          Object.values(
            result.document.lines,
          ).every(
            (line) =>
              line.role ===
              'boundary',
          ),
        ).toBe(true)

        expect(
          Object.values(
            result.document.curves,
          ).every(
            (curve) =>
              curve.role ===
              'boundary',
          ),
        ).toBe(true)

        source.piece.edges.forEach(
          (
            sourceEdge,
            index,
          ) => {
            const originalLength =
              patternPieceEdgeLengthMm(
                source.document,
                sourceEdge,
              )

            const clonedLength =
              patternPieceEdgeLengthMm(
                result.document,
                result.piece
                  .edges[
                    index
                  ],
              )

            expect(
              clonedLength,
            ).toBeCloseTo(
              originalLength,
              8,
            )
          },
        )
      },
    )

    it(
      'clones only geometry belonging to the pattern piece',
      () => {
        const source =
          createSource()

        const result =
          addPatternPieceLayoutClone(
            createEmptyDocument(),
            source.document,
            source.piece,
            {
              instanceId:
                'DISPLAY_A',

              offsetXMm: 0,
              offsetYMm: 0,
            },
          )

        expect(
          Object.keys(
            result.document.points,
          ),
        ).toHaveLength(3)

        expect(
          Object.keys(
            result.document.lines,
          ),
        ).toHaveLength(2)

        expect(
          Object.keys(
            result.document.curves,
          ),
        ).toHaveLength(1)

        expect(
          Object.values(
            result.document.lines,
          ).some(
            (line) =>
              line.name ===
              'Guide',
          ),
        ).toBe(false)
      },
    )

    it(
      'does not mutate the source or target documents',
      () => {
        const source =
          createSource()

        const target =
          createEmptyDocument()

        const sourceBefore =
          JSON.stringify(
            source.document,
          )

        const targetBefore =
          JSON.stringify(
            target,
          )

        addPatternPieceLayoutClone(
          target,
          source.document,
          source.piece,
          {
            instanceId:
              'DISPLAY_A',

            offsetXMm: 25,
            offsetYMm: 30,
          },
        )

        expect(
          JSON.stringify(
            source.document,
          ),
        ).toBe(
          sourceBefore,
        )

        expect(
          JSON.stringify(
            target,
          ),
        ).toBe(
          targetBefore,
        )
      },
    )

    it(
      'allows independent translated clones of the same source piece to coexist',
      () => {
        const source =
          createSource()

        const first =
          addPatternPieceLayoutClone(
            createEmptyDocument(),
            source.document,
            source.piece,
            {
              instanceId:
                'FIRST',

              offsetXMm: 0,
              offsetYMm: 0,
            },
          )

        const second =
          addPatternPieceLayoutClone(
            first.document,
            source.document,
            source.piece,
            {
              instanceId:
                'SECOND',

              offsetXMm: 100,
              offsetYMm: 0,
            },
          )

        expect(
          Object.keys(
            second.document.points,
          ),
        ).toHaveLength(6)

        expect(
          Object.keys(
            second.document.lines,
          ),
        ).toHaveLength(4)

        expect(
          Object.keys(
            second.document.curves,
          ),
        ).toHaveLength(2)

        const clonedAPoints =
          Object.values(
            second.document.points,
          )
            .filter(
              (point) =>
                point.name === 'A',
            )
            .map(
              (point) =>
                point.xMm,
            )
            .sort(
              (a, b) =>
                a - b,
            )

        expect(
          clonedAPoints,
        ).toEqual([
          0,
          100,
        ])

        expect(
          first.piece.id,
        ).not.toBe(
          second.piece.id,
        )
      },
    )

    it(
      'rejects invalid instance ids offsets and invalid source pieces',
      () => {
        const source =
          createSource()

        expect(() =>
          addPatternPieceLayoutClone(
            createEmptyDocument(),
            source.document,
            source.piece,
            {
              instanceId: '',
              offsetXMm: 0,
              offsetYMm: 0,
            },
          ),
        ).toThrow(
          /instance id/i,
        )

        expect(() =>
          addPatternPieceLayoutClone(
            createEmptyDocument(),
            source.document,
            source.piece,
            {
              instanceId:
                'BAD_OFFSET',

              offsetXMm:
                Number.NaN,

              offsetYMm: 0,
            },
          ),
        ).toThrow(
          /offset/i,
        )

        const invalidPiece:
          PatternPiece = {
            ...source.piece,

            edges:
              source.piece
                .edges
                .slice(
                  0,
                  2,
                ),
          }

        expect(() =>
          addPatternPieceLayoutClone(
            createEmptyDocument(),
            source.document,
            invalidPiece,
            {
              instanceId:
                'BAD_PIECE',

              offsetXMm: 0,
              offsetYMm: 0,
            },
          ),
        ).toThrow(
          /valid closed boundary/i,
        )
      },
    )
  },
)