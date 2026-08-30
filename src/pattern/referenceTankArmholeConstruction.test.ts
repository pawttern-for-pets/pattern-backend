import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  createReferenceTankArmholeConstruction,
  REFERENCE_TANK_ARMHOLE_POINT_IDS,
} from './referenceTankArmholeConstruction'

describe(
  'PAWTTERN reference tank armhole construction',
  () => {
    const measurements =
      createBodyMeasurementsFromCm({
        backLengthCm: 22,
        chestGirthCm: 36,
        neckGirthCm: 27,
      })

    it(
      'adds only one deterministic armhole reference point',
      () => {
        const result =
          createReferenceTankArmholeConstruction(
            measurements,
          )

        /*
         * Base construction:
         * 9 points
         *
         * Neck construction:
         * 5 points
         *
         * Armhole:
         * 1 point
         */
        expect(
          Object.keys(
            result.document.points,
          ),
        ).toHaveLength(15)

        /*
         * No unsupported armhole
         * line or curve yet.
         */
        expect(
          Object.keys(
            result.document.lines,
          ),
        ).toHaveLength(14)

        expect(
          Object.keys(
            result.document.curves,
          ),
        ).toHaveLength(0)
      },
    )

    it(
      'calculates C divided by ten minus one centimeter',
      () => {
        const result =
          createReferenceTankArmholeConstruction(
            measurements,
          )

        /*
         * C = 36 cm
         *
         * 36 / 10 - 1
         * = 2.6 cm
         * = 26 mm
         */
        expect(
          result.formula
            .frontArmholeInsetMm,
        ).toBe(26)
      },
    )

    it(
      'places the inset inward from Front Center on the B divided by five row',
      () => {
        const result =
          createReferenceTankArmholeConstruction(
            measurements,
          )

        const point =
          result.document.points[
            REFERENCE_TANK_ARMHOLE_POINT_IDS
              .frontInset
          ]

        /*
         * Half body:
         * C / 2 = 180 mm
         *
         * Inset:
         * 26 mm
         *
         * X = 180 - 26
         *   = 154 mm
         *
         * Y = B / 5
         *   = 44 mm
         */

        expect(
          point.xMm,
        ).toBe(154)

        expect(
          point.yMm,
        ).toBe(44)
      },
    )

    it(
      'keeps the reference inside the half-front area',
      () => {
        const result =
          createReferenceTankArmholeConstruction(
            measurements,
          )

        const point =
          result.document.points[
            REFERENCE_TANK_ARMHOLE_POINT_IDS
              .frontInset
          ]

        expect(
          point.xMm,
        ).toBeGreaterThan(
          result.formula
            .sideLineXMm,
        )

        expect(
          point.xMm,
        ).toBeLessThan(
          result.formula
            .halfBodyWidthMm,
        )
      },
    )

    it(
      'moves with explicit half-body allowance without changing the C-based inset',
      () => {
        const result =
          createReferenceTankArmholeConstruction(
            measurements,
            {
              halfBodyAllowanceMm:
                10,
            },
          )

        expect(
          result.formula
            .halfBodyWidthMm,
        ).toBe(190)

        expect(
          result.formula
            .frontArmholeInsetMm,
        ).toBe(26)

        expect(
          result.document.points[
            REFERENCE_TANK_ARMHOLE_POINT_IDS
              .frontInset
          ].xMm,
        ).toBe(164)
      },
    )

    it(
      'rejects an armhole reference that specifically crosses the side seam',
      () => {
        /*
         * This special test set is
         * intentionally chosen so
         * the neckline is still
         * mathematically valid.
         *
         * That allows us to isolate
         * and test the ARMHOLE
         * validation itself.
         *
         * C = 36 cm
         * N = 10 cm
         *
         * Base half-body width:
         * 180 mm
         *
         * Explicit adjustment:
         * -120 mm
         *
         * Working width:
         * 60 mm
         *
         * Half Back:
         * 36 mm
         *
         * Half Front:
         * 24 mm
         *
         * Back neck:
         * N/4 = 25 mm
         * so 25 < 36 ✓
         *
         * Front neck:
         * N/5 = 20 mm
         * so 20 < 24 ✓
         *
         * Front armhole inset:
         * C/10 - 10
         * = 26 mm
         *
         * 26 >= 24
         *
         * Therefore the armhole
         * itself is the first
         * invalid condition.
         */

        const armholeTestMeasurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 22,
            chestGirthCm: 36,
            neckGirthCm: 10,
          })

        expect(() =>
          createReferenceTankArmholeConstruction(
            armholeTestMeasurements,
            {
              halfBodyAllowanceMm:
                -120,
            },
          ),
        ).toThrow(
          'Front armhole inset extends beyond the half-front construction area.',
        )
      },
    )
  },
)