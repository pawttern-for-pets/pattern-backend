import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  createReferenceTankV2Construction,
} from './referenceTankV2Construction'

import {
  createReferenceTankV2ProductionLayout,
} from './referenceTankV2ProductionLayout'

import {
  createReferenceTankV2ProductionCuttingContours,
} from './referenceTankV2ProductionCuttingContours'

import {
  DEFAULT_SEAM_ALLOWANCE_MM,
} from './seamAllowancePolicy'

const measurements =
  createBodyMeasurementsFromCm({
    backLengthCm: 22,
    chestGirthCm: 36,
    neckGirthCm: 27,
  })

function createLayout(
  bellyVariant:
    'female' |
    'male' =
      'female',
) {
  const construction =
    createReferenceTankV2Construction(
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

  return createReferenceTankV2ProductionLayout(
    construction.document,
  )
}

describe(
  'PAWTTERN V2 production cutting contours',
  () => {
    it(
      'creates validated Back and Front/Belly cutting contours',
      () => {
        const result =
          createReferenceTankV2ProductionCuttingContours(
            createLayout(),
          )

        expect(
          result.seamAllowanceMm,
        ).toBe(
          DEFAULT_SEAM_ALLOWANCE_MM,
        )

        expect(
          result.curveSegments,
        ).toBe(100)

        expect(
          result.back.cuttingPoints[0],
        ).toEqual(
          result.back.cuttingPoints[
            result.back.cuttingPoints
              .length - 1
          ],
        )

        expect(
          result.frontBelly
            .cuttingPoints[0],
        ).toEqual(
          result.frontBelly
            .cuttingPoints[
              result.frontBelly
                .cuttingPoints
                .length - 1
            ],
        )
      },
    )

    it(
      'applies 10 mm to non-fold edges and zero to folds',
      () => {
        const result =
          createReferenceTankV2ProductionCuttingContours(
            createLayout(),
          )

        expect(
          result.back.edgeOffsetsMm
            .filter(
              (value) =>
                value === 0,
            ),
        ).toHaveLength(1)

        expect(
          result.back.edgeOffsetsMm
            .filter(
              (value) =>
                value ===
                DEFAULT_SEAM_ALLOWANCE_MM,
            ),
        ).toHaveLength(8)

        expect(
          result.frontBelly
            .edgeOffsetsMm
            .filter(
              (value) =>
                value === 0,
            ),
        ).toHaveLength(2)

        expect(
          result.frontBelly
            .edgeOffsetsMm
            .filter(
              (value) =>
                value ===
                DEFAULT_SEAM_ALLOWANCE_MM,
            ),
        ).toHaveLength(6)
      },
    )

    it(
      'supports both female and male belly variants',
      () => {
        for (
          const bellyVariant
          of [
            'female',
            'male',
          ] as const
        ) {
          const result =
            createReferenceTankV2ProductionCuttingContours(
              createLayout(
                bellyVariant,
              ),
            )

          expect(
            result.back.cuttingPoints
              .length,
          ).toBeGreaterThan(3)

          expect(
            result.frontBelly
              .cuttingPoints
              .length,
          ).toBeGreaterThan(3)
        }
      },
    )

    it(
      'supports an explicit seam allowance while folds remain zero',
      () => {
        const result =
          createReferenceTankV2ProductionCuttingContours(
            createLayout(),
            15,
          )

        expect(
          result.seamAllowanceMm,
        ).toBe(15)

        expect(
          result.back.edgeOffsetsMm
            .filter(
              (value) =>
                value === 15,
            ),
        ).toHaveLength(8)

        expect(
          result.back.edgeOffsetsMm
            .filter(
              (value) =>
                value === 0,
            ),
        ).toHaveLength(1)
      },
    )

    it(
      'does not mutate the production layout',
      () => {
        const layout =
          createLayout()

        const before =
          JSON.stringify(
            layout,
          )

        createReferenceTankV2ProductionCuttingContours(
          layout,
        )

        expect(
          JSON.stringify(
            layout,
          ),
        ).toBe(
          before,
        )
      },
    )

    it(
      'rejects invalid seam allowance and sampling resolution',
      () => {
        const layout =
          createLayout()

        expect(() =>
          createReferenceTankV2ProductionCuttingContours(
            layout,
            -1,
          ),
        ).toThrow(
          /seam allowance/i,
        )

        expect(() =>
          createReferenceTankV2ProductionCuttingContours(
            layout,
            10,
            0,
          ),
        ).toThrow(
          /curve segments/i,
        )
      },
    )
  },
)