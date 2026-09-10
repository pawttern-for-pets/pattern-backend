import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  PatternPieceEdge,
} from '../cad/patternPiece'

import {
  DEFAULT_SEAM_ALLOWANCE_MM,
  getPatternPieceEdgeSeamAllowanceMm,
} from './seamAllowancePolicy'

function createEdge(
  treatment?:
    PatternPieceEdge[
      'treatment'
    ],
): PatternPieceEdge {
  return {
    kind: 'line',
    geometryId:
      'TEST_EDGE',

    direction:
      'forward',

    treatment,
  }
}

describe(
  'PAWTTERN seam allowance policy',
  () => {
    it(
      'uses 10 mm as the standard 1 cm seam allowance',
      () => {
        expect(
          DEFAULT_SEAM_ALLOWANCE_MM,
        ).toBe(10)
      },
    )

    it(
      'applies 10 mm to confirmed seam edges',
      () => {
        expect(
          getPatternPieceEdgeSeamAllowanceMm(
            createEdge(
              'seam',
            ),
          ),
        ).toBe(10)
      },
    )

    it(
      'applies 10 mm to finished edges',
      () => {
        expect(
          getPatternPieceEdgeSeamAllowanceMm(
            createEdge(
              'finished-edge',
            ),
          ),
        ).toBe(10)
      },
    )

    it(
      'applies 10 mm to currently unclassified perimeter edges',
      () => {
        expect(
          getPatternPieceEdgeSeamAllowanceMm(
            createEdge(),
          ),
        ).toBe(10)
      },
    )

    it(
      'applies zero allowance to CUT ON FOLD edges',
      () => {
        expect(
          getPatternPieceEdgeSeamAllowanceMm(
            createEdge(
              'fold',
            ),
          ),
        ).toBe(0)
      },
    )

    it(
      'allows a future custom seam allowance without changing the fold rule',
      () => {
        expect(
          getPatternPieceEdgeSeamAllowanceMm(
            createEdge(
              'seam',
            ),
            6,
          ),
        ).toBe(6)

        expect(
          getPatternPieceEdgeSeamAllowanceMm(
            createEdge(
              'fold',
            ),
            6,
          ),
        ).toBe(0)
      },
    )

    it(
      'rejects invalid seam allowance values',
      () => {
        expect(() =>
          getPatternPieceEdgeSeamAllowanceMm(
            createEdge(),
            -1,
          ),
        ).toThrow(
          /seam allowance/i,
        )

        expect(() =>
          getPatternPieceEdgeSeamAllowanceMm(
            createEdge(),
            Number.NaN,
          ),
        ).toThrow(
          /seam allowance/i,
        )
      },
    )
  },
)