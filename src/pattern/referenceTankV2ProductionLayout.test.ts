import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  isValidPatternPiece,
} from '../cad/patternPiece'

import {
  patternPieceEdgeLengthMm,
} from '../cad/patternPieceMetrics'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  createReferenceTankV2Construction,
  REFERENCE_TANK_V2_LINE_IDS,
} from './referenceTankV2Construction'

import {
  createReferenceTankV2PatternPieces,
} from './referenceTankV2PatternPieces'

import {
  createReferenceTankV2ProductionLayout,
  REFERENCE_TANK_V2_PRODUCTION_LAYOUT_GAP_MM,
} from './referenceTankV2ProductionLayout'

const measurements =
  createBodyMeasurementsFromCm({
    backLengthCm: 22,
    chestGirthCm: 36,
    neckGirthCm: 27,
  })

function createConstruction(
  bellyVariant:
    'female' |
    'male',
) {
  return createReferenceTankV2Construction(
    measurements,
    {
      bellyVariant,

      halfBodyAllowanceMm:
        10,

      shoulderLengthMm:
        30,

      neckOpeningAllowanceMm:
        0,
    },
  )
}

describe(
  'PAWTTERN Master Block V2 production layout',
  () => {
    it(
      'creates separate valid Back and Front/Belly production pieces',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const layout =
          createReferenceTankV2ProductionLayout(
            construction.document,
          )

        expect(
          isValidPatternPiece(
            layout.back,
            layout.document,
          ),
        ).toBe(true)

        expect(
          isValidPatternPiece(
            layout.frontBelly,
            layout.document,
          ),
        ).toBe(true)

        expect(
          layout.back.edges,
        ).toHaveLength(9)

        expect(
          layout.frontBelly.edges,
        ).toHaveLength(8)

        expect(
          Object.keys(
            layout.document.lines,
          ),
        ).toHaveLength(8)

        expect(
          Object.keys(
            layout.document.curves,
          ),
        ).toHaveLength(9)

        expect(
          Object.keys(
            layout.document.points,
          ),
        ).toHaveLength(17)
      },
    )

    it(
      'separates the production pieces by the requested physical gap',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const layout =
          createReferenceTankV2ProductionLayout(
            construction.document,
          )

        expect(
          layout.backBounds.minXMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          layout.backBounds.minYMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          layout.frontBellyBounds.minYMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          layout.frontBellyBounds.minXMm -
          layout.backBounds.maxXMm,
        ).toBeCloseTo(
          REFERENCE_TANK_V2_PRODUCTION_LAYOUT_GAP_MM,
          8,
        )
      },
    )

    it(
      'preserves every V2 pattern edge length exactly after separation',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const sourcePieces =
          createReferenceTankV2PatternPieces(
            construction.document,
          )

        const layout =
          createReferenceTankV2ProductionLayout(
            construction.document,
          )

        const comparisons = [
          {
            source:
              sourcePieces.back,

            clone:
              layout.back,
          },

          {
            source:
              sourcePieces.frontBelly,

            clone:
              layout.frontBelly,
          },
        ]

        for (
          const comparison
          of comparisons
        ) {
          expect(
            comparison.clone.edges,
          ).toHaveLength(
            comparison.source
              .edges.length,
          )

          comparison.source
            .edges
            .forEach(
              (
                sourceEdge,
                index,
              ) => {
                const sourceLength =
                  patternPieceEdgeLengthMm(
                    construction.document,
                    sourceEdge,
                  )

                const cloneLength =
                  patternPieceEdgeLengthMm(
                    layout.document,
                    comparison.clone
                      .edges[
                        index
                      ],
                  )

                expect(
                  cloneLength,
                ).toBeCloseTo(
                  sourceLength,
                  8,
                )
              },
            )
        }
      },
    )

    it(
      'preserves all seam and fold treatments in the separated pieces',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const layout =
          createReferenceTankV2ProductionLayout(
            construction.document,
          )

        const edges = [
          ...layout.back.edges,
          ...layout.frontBelly.edges,
        ]

        expect(
          edges.filter(
            (edge) =>
              edge.treatment ===
              'seam',
          ),
        ).toHaveLength(4)

        expect(
          edges.filter(
            (edge) =>
              edge.treatment ===
              'fold',
          ),
        ).toHaveLength(3)

        expect(
          edges.filter(
            (edge) =>
              edge.treatment ===
              undefined,
          ),
        ).toHaveLength(10)
      },
    )

    it(
      'gives Back and Front/Belly independent clones of their shared Common Armpit',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const layout =
          createReferenceTankV2ProductionLayout(
            construction.document,
          )

        const backSideSeam =
          Object.values(
            layout.document.lines,
          ).find(
            (line) =>
              line.id.endsWith(
                `::${REFERENCE_TANK_V2_LINE_IDS.backSideSeam}`,
              ),
          )

        const frontSideSeam =
          Object.values(
            layout.document.lines,
          ).find(
            (line) =>
              line.id.endsWith(
                `::${REFERENCE_TANK_V2_LINE_IDS.frontBellySideSeam}`,
              ),
          )

        expect(
          backSideSeam,
        ).toBeDefined()

        expect(
          frontSideSeam,
        ).toBeDefined()

        expect(
          backSideSeam!
            .startPointId,
        ).not.toBe(
          frontSideSeam!
            .startPointId,
        )
      },
    )

    it(
      'works for both belly variants without mutating the canonical source document',
      () => {
        for (
          const bellyVariant
          of [
            'female',
            'male',
          ] as const
        ) {
          const construction =
            createConstruction(
              bellyVariant,
            )

          const before =
            JSON.stringify(
              construction.document,
            )

          const layout =
            createReferenceTankV2ProductionLayout(
              construction.document,
            )

          expect(
            JSON.stringify(
              construction.document,
            ),
          ).toBe(
            before,
          )

          expect(
            layout.frontBellyBounds.minXMm,
          ).toBeGreaterThan(
            layout.backBounds.maxXMm,
          )
        }
      },
    )

    it(
      'rejects invalid production layout gaps',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        expect(() =>
          createReferenceTankV2ProductionLayout(
            construction.document,
            -1,
          ),
        ).toThrow(
          /gap/i,
        )

        expect(() =>
          createReferenceTankV2ProductionLayout(
            construction.document,
            Number.NaN,
          ),
        ).toThrow(
          /gap/i,
        )
      },
    )
  },
)