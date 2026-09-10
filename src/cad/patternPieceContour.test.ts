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
} from './document'

import type {
  PatternPiece,
} from './patternPiece'

import {
  samplePatternPieceSewingContour,
} from './patternPieceContour'

function createTrianglePiece() {
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
        xMm: 30,
        yMm: 0,
      },
      {
        id: 'C',
        name: 'C',
        xMm: 0,
        yMm: 40,
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
        id: 'CA',
        name: 'CA',
        startPointId: 'C',
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
    PatternPiece = {
      id: 'TRIANGLE',
      name: 'Triangle',

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
          treatment: 'fold',
        },
      ],
    }

  return {
    document,
    piece,
  }
}

function createCurvePiece() {
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
        xMm: 40,
        yMm: 0,
      },
      {
        id: 'C',
        name: 'C',
        xMm: 0,
        yMm: 40,
      },
    ]
  ) {
    document =
      addPoint(
        document,
        point,
      )
  }

  document =
    addCurve(
      document,
      {
        id: 'AB_CURVE',
        name: 'AB Curve',
        startPointId: 'A',
        endPointId: 'B',

        control1: {
          xMm: 10,
          yMm: 20,
        },

        control2: {
          xMm: 30,
          yMm: 20,
        },

        role: 'boundary',
      },
    )

  document =
    addLine(
      document,
      {
        id: 'BC',
        name: 'BC',
        startPointId: 'B',
        endPointId: 'C',
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

  const piece:
    PatternPiece = {
      id: 'CURVE_PIECE',
      name: 'Curve Piece',

      edges: [
        {
          kind: 'curve',
          geometryId:
            'AB_CURVE',
          direction:
            'forward',
        },
        {
          kind: 'line',
          geometryId: 'BC',
          direction:
            'forward',
        },
        {
          kind: 'line',
          geometryId: 'CA',
          direction:
            'forward',
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
  'generic pattern piece sewing contour sampling',
  () => {
    it(
      'creates an ordered explicitly closed contour from straight edges',
      () => {
        const source =
          createTrianglePiece()

        const contour =
          samplePatternPieceSewingContour(
            source.document,
            source.piece,
          )

        expect(
          contour.points,
        ).toEqual([
          {
            xMm: 0,
            yMm: 0,
          },
          {
            xMm: 30,
            yMm: 0,
          },
          {
            xMm: 0,
            yMm: 40,
          },
          {
            xMm: 0,
            yMm: 0,
          },
        ])
      },
    )

    it(
      'samples cubic Bezier edges with the requested resolution',
      () => {
        const source =
          createCurvePiece()

        const contour =
          samplePatternPieceSewingContour(
            source.document,
            source.piece,
            4,
          )

        const curveEdge =
          contour.edges[0]

        expect(
          curveEdge.points,
        ).toHaveLength(5)

        expect(
          curveEdge.points[0],
        ).toEqual({
          xMm: 0,
          yMm: 0,
        })

        expect(
          curveEdge.points[2],
        ).toEqual({
          xMm: 20,
          yMm: 15,
        })

        expect(
          curveEdge.points[4],
        ).toEqual({
          xMm: 40,
          yMm: 0,
        })
      },
    )

    it(
      'respects reverse traversal for cubic Bezier edges',
      () => {
        const source =
          createCurvePiece()

        const reversedPiece:
          PatternPiece = {
            id: 'REVERSED',
            name: 'Reversed',

            edges: [
              {
                kind: 'line',
                geometryId: 'CA',
                direction: 'reverse',
                treatment: 'fold',
              },
              {
                kind: 'line',
                geometryId: 'BC',
                direction: 'reverse',
              },
              {
                kind: 'curve',
                geometryId:
                  'AB_CURVE',
                direction:
                  'reverse',
              },
            ],
          }

        const contour =
          samplePatternPieceSewingContour(
            source.document,
            reversedPiece,
            4,
          )

        const curveEdge =
          contour.edges[2]

        expect(
          curveEdge.points[0],
        ).toEqual({
          xMm: 40,
          yMm: 0,
        })

        expect(
          curveEdge.points[2],
        ).toEqual({
          xMm: 20,
          yMm: 15,
        })

        expect(
          curveEdge.points[4],
        ).toEqual({
          xMm: 0,
          yMm: 0,
        })
      },
    )

    it(
      'does not duplicate interior edge joins in the flattened contour',
      () => {
        const source =
          createCurvePiece()

        const contour =
          samplePatternPieceSewingContour(
            source.document,
            source.piece,
            4,
          )

        /*
         * Curve:
         * 5 samples.
         *
         * BC:
         * +1 new endpoint.
         *
         * CA:
         * +1 final closure endpoint.
         */
        expect(
          contour.points,
        ).toHaveLength(7)

        expect(
          contour.points[
            contour.points.length -
              1
          ],
        ).toEqual(
          contour.points[0],
        )
      },
    )

    it(
      'preserves edge order direction and sewing treatment metadata',
      () => {
        const source =
          createTrianglePiece()

        const contour =
          samplePatternPieceSewingContour(
            source.document,
            source.piece,
          )

        expect(
          contour.edges.map(
            ({
              edgeIndex,
              edge,
            }) => ({
              edgeIndex,

              geometryId:
                edge.geometryId,

              direction:
                edge.direction,

              treatment:
                edge.treatment,
            }),
          ),
        ).toEqual([
          {
            edgeIndex: 0,
            geometryId: 'AB',
            direction: 'forward',
            treatment: 'seam',
          },
          {
            edgeIndex: 1,
            geometryId: 'BC',
            direction: 'forward',
            treatment: undefined,
          },
          {
            edgeIndex: 2,
            geometryId: 'CA',
            direction: 'forward',
            treatment: 'fold',
          },
        ])
      },
    )

    it(
      'does not mutate the source document or pattern piece',
      () => {
        const source =
          createCurvePiece()

        const documentBefore =
          JSON.stringify(
            source.document,
          )

        const pieceBefore =
          JSON.stringify(
            source.piece,
          )

        samplePatternPieceSewingContour(
          source.document,
          source.piece,
          8,
        )

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
      'rejects invalid curve sampling resolutions',
      () => {
        const source =
          createCurvePiece()

        for (
          const invalid
          of [
            0,
            -1,
            1.5,
            Number.NaN,
          ]
        ) {
          expect(() =>
            samplePatternPieceSewingContour(
              source.document,
              source.piece,
              invalid,
            ),
          ).toThrow(
            /curve segments/i,
          )
        }
      },
    )

    it(
      'rejects an invalid or open pattern piece',
      () => {
        const source =
          createTrianglePiece()

        const openPiece:
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
          samplePatternPieceSewingContour(
            source.document,
            openPiece,
          ),
        ).toThrow(
          /valid closed boundary/i,
        )
      },
    )
  },
)