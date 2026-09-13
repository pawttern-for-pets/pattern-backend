import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addLine,
  addPoint,
  createEmptyDocument,
} from '../cad/document'

import type {
  PatternPiece,
} from '../cad/patternPiece'

import {
  createStraightPatternPieceSeamAllowanceContour,
} from './straightPatternPieceSeamAllowance'

function createFoldSquare() {
  let document =
    createEmptyDocument()

  for (
    const point of [
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
    const line of [
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
    PatternPiece = {
      id: 'FOLD_SQUARE',
      name: 'Fold Square',

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
          geometryId: 'CD',
          direction: 'forward',
          treatment:
            'finished-edge',
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

describe(
  'straight pattern piece seam allowance',
  () => {
    it(
      'automatically applies the PAWTTERN default 10 mm allowance to every non-fold edge',
      () => {
        const source =
          createFoldSquare()

        const result =
          createStraightPatternPieceSeamAllowanceContour(
            source.document,
            source.piece,
          )

        expect(
          result.edgeOffsetsMm,
        ).toEqual([
          10,
          10,
          10,
          0,
        ])
      },
    )

    it(
      'keeps the cutting contour exactly on the CUT ON FOLD edge',
      () => {
        const source =
          createFoldSquare()

        const result =
          createStraightPatternPieceSeamAllowanceContour(
            source.document,
            source.piece,
          )

        expect(
          result.cuttingPoints[0].xMm,
        ).toBeCloseTo(
          0,
          10,
        )

        expect(
          result.cuttingPoints[3].xMm,
        ).toBeCloseTo(
          0,
          10,
        )

        expect(
          result.cuttingPoints[0].yMm,
        ).toBeCloseTo(
          -10,
          10,
        )

        expect(
          result.cuttingPoints[3].yMm,
        ).toBeCloseTo(
          110,
          10,
        )
      },
    )

    it(
      'applies a custom allowance to non-fold edges while preserving zero allowance on fold',
      () => {
        const source =
          createFoldSquare()

        const result =
          createStraightPatternPieceSeamAllowanceContour(
            source.document,
            source.piece,
            15,
          )

        expect(
          result.edgeOffsetsMm,
        ).toEqual([
          15,
          15,
          15,
          0,
        ])

        expect(
          result.cuttingPoints[0].xMm,
        ).toBeCloseTo(
          0,
          10,
        )

        expect(
          result.cuttingPoints[0].yMm,
        ).toBeCloseTo(
          -15,
          10,
        )
      },
    )

    it(
      'does not alter the original sewing-line document or pattern piece',
      () => {
        const source =
          createFoldSquare()

        const documentBefore =
          JSON.stringify(
            source.document,
          )

        const pieceBefore =
          JSON.stringify(
            source.piece,
          )

        createStraightPatternPieceSeamAllowanceContour(
          source.document,
          source.piece,
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
      'rejects an invalid custom seam allowance through the shared policy',
      () => {
        const source =
          createFoldSquare()

        expect(() =>
          createStraightPatternPieceSeamAllowanceContour(
            source.document,
            source.piece,
            -1,
          ),
        ).toThrow()
      },
    )
  },
)