import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  createReferenceTankV2Formula,
  PAWTTERN_MASTER_V2_RULE_VERSION,
} from './referenceTankV2Formula'

describe(
  'PAWTTERN Master Block V2 formula',
  () => {
    const measurements =
      createBodyMeasurementsFromCm({
        backLengthCm:
          22,

        chestGirthCm:
          36,

        neckGirthCm:
          27,
      })

    /*
     * Development reference:
     *
     * +1 cm half-body allowance
     *
     * shoulder length = 3 cm
     * using the M reference checkpoint.
     *
     * This does NOT mean B22/C36/N27
     * is automatically classified M.
     */
    const options = {
      halfBodyAllowanceMm:
        10,

      shoulderLengthMm:
        30,
    }

    it(
      'identifies the formula as PAWTTERN Master V2',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        expect(
          result.ruleVersion,
        ).toBe(
          PAWTTERN_MASTER_V2_RULE_VERSION,
        )

        expect(
          result.shoulderAngleDeg,
        ).toBe(45)
      },
    )

    it(
      'calculates the Video-2 half-body width and fifth',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        /*
         * C = 36 cm
         *
         * W =
         * 36/2 + 1
         * = 19 cm
         */
        expect(
          result.halfBodyWidthMm,
        ).toBe(190)

        expect(
          result.fifthWidthMm,
        ).toBe(38)
      },
    )

    it(
      'calculates the B/5 armhole depth',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        /*
         * B = 22 cm
         *
         * B/5 = 4.4 cm
         */
        expect(
          result.armholeDepthMm,
        ).toBe(44)
      },
    )

    it(
      'calculates the Video-2 armhole guide positions',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        /*
         * U = 3.8 cm
         *
         * Back guide:
         * 2U + 0.5
         * = 8.1 cm
         *
         * Common armpit:
         * 3U
         * = 11.4 cm
         *
         * Front guide:
         * 4U + 0.5
         * = 15.7 cm
         */
        expect(
          result.backArmGuideXMm,
        ).toBe(81)

        expect(
          result.commonArmpitXMm,
        ).toBe(114)

        expect(
          result.frontArmGuideXMm,
        ).toBe(157)

        expect(
          result.commonArmpit,
        ).toEqual({
          xMm:
            114,

          yMm:
            44,
        })
      },
    )

    it(
      'constructs the back side-neck from N/4 and N/8',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        /*
         * N = 27 cm
         *
         * N/4 = 6.75 cm
         * N/8 = 3.375 cm
         */
        expect(
          result.backSideNeck.xMm,
        ).toBeCloseTo(
          67.5,
          8,
        )

        expect(
          result.backSideNeck.yMm,
        ).toBeCloseTo(
          -33.75,
          8,
        )
      },
    )

    it(
      'constructs the back shoulder at 45 degrees right and down',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        const delta =
          30 /
          Math.sqrt(2)

        expect(
          result.backShoulderOuter.xMm,
        ).toBeCloseTo(
          67.5 + delta,
          8,
        )

        expect(
          result.backShoulderOuter.yMm,
        ).toBeCloseTo(
          -33.75 + delta,
          8,
        )

        expect(
          result.backShoulderOuter.xMm,
        ).toBeGreaterThan(
          result.backSideNeck.xMm,
        )

        expect(
          result.backShoulderOuter.yMm,
        ).toBeGreaterThan(
          result.backSideNeck.yMm,
        )
      },
    )

    it(
      'constructs the Video-2 front neck geometry',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        /*
         * Front center Y:
         *
         * B/5 - (B/2 - 1cm)
         *
         * 4.4 - (11 - 1)
         * = -5.6 cm
         */
        expect(
          result.frontNeckCenter,
        ).toEqual({
          xMm:
            190,

          yMm:
            -56,
        })

        /*
         * Front side-neck:
         *
         * X =
         * 19 - 27/5
         * = 13.6 cm
         *
         * Y =
         * -5.6 - 27/10
         * = -8.3 cm
         */
        expect(
          result.frontSideNeck.xMm,
        ).toBeCloseTo(
          136,
          8,
        )

        expect(
          result.frontSideNeck.yMm,
        ).toBeCloseTo(
          -83,
          8,
        )
      },
    )

    it(
      'constructs the front shoulder at 45 degrees left and down',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        const delta =
          30 /
          Math.sqrt(2)

        expect(
          result.frontShoulderOuter.xMm,
        ).toBeCloseTo(
          136 - delta,
          8,
        )

        expect(
          result.frontShoulderOuter.yMm,
        ).toBeCloseTo(
          -83 + delta,
          8,
        )

        /*
         * Front shoulder travels LEFT.
         */
        expect(
          result.frontShoulderOuter.xMm,
        ).toBeLessThan(
          result.frontSideNeck.xMm,
        )

        /*
         * Y+ means visually DOWN.
         */
        expect(
          result.frontShoulderOuter.yMm,
        ).toBeGreaterThan(
          result.frontSideNeck.yMm,
        )

        /*
         * With the 3 cm reference shoulder,
         * the point naturally falls very near
         * the 3/5 common-armpit X position.
         */
        expect(
          result.frontShoulderOuter.xMm,
        ).toBeCloseTo(
          114.7867966,
          5,
        )
      },
    )

    it(
      'does not mutate the raw body measurements',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        expect(
          result.backLengthMm,
        ).toBe(220)

        expect(
          result.chestGirthMm,
        ).toBe(360)

        expect(
          result.neckGirthMm,
        ).toBe(270)

        expect(
          result.halfBodyAllowanceMm,
        ).toBe(10)
      },
    )

    it(
      'rejects invalid drafting parameters',
      () => {
        expect(() =>
          createReferenceTankV2Formula(
            measurements,
            {
              halfBodyAllowanceMm:
                -1,

              shoulderLengthMm:
                30,
            },
          ),
        ).toThrow(
          'Half-body allowance must be 0 mm or greater.',
        )

        expect(() =>
          createReferenceTankV2Formula(
            measurements,
            {
              halfBodyAllowanceMm:
                10,

              shoulderLengthMm:
                0,
            },
          ),
        ).toThrow(
          'Shoulder length must be greater than 0 mm.',
        )
      },
    )
  },
)