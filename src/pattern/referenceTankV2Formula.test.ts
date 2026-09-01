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
     * shoulder length = 3 cm.
     *
     * No nominal size is assigned.
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
      'uses the unscaled Video-2 neck geometry by default',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        expect(
          result.neckGeometryScale,
        ).toBe(1)
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
      'constructs the default back side-neck from N/4 and N/8',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

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
      'constructs the default Video-2 front neck geometry',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            options,
          )

        expect(
          result.frontNeckCenter,
        ).toEqual({
          xMm:
            190,

          yMm:
            -56,
        })

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

        expect(
          result.frontShoulderOuter.xMm,
        ).toBeLessThan(
          result.frontSideNeck.xMm,
        )

        expect(
          result.frontShoulderOuter.yMm,
        ).toBeGreaterThan(
          result.frontSideNeck.yMm,
        )

        expect(
          result.frontShoulderOuter.xMm,
        ).toBeCloseTo(
          114.7867966,
          5,
        )
      },
    )

    it(
      'proportionally enlarges all four neck construction dimensions',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            {
              ...options,
              neckGeometryScale:
                1.1,
            },
          )

        /*
         * BACK
         *
         * N/4 = 67.5
         * N/8 = 33.75
         *
         * × 1.1
         */
        expect(
          result.backSideNeck.xMm,
        ).toBeCloseTo(
          74.25,
          8,
        )

        expect(
          result.backSideNeck.yMm,
        ).toBeCloseTo(
          -37.125,
          8,
        )

        /*
         * FRONT
         *
         * N/5 = 54
         * N/10 = 27
         *
         * × 1.1
         */
        expect(
          result.frontSideNeck.xMm,
        ).toBeCloseTo(
          130.6,
          8,
        )

        expect(
          result.frontSideNeck.yMm,
        ).toBeCloseTo(
          -85.7,
          8,
        )

        expect(
          result.neckGeometryScale,
        ).toBeCloseTo(
          1.1,
          8,
        )
      },
    )

    it(
      'keeps shoulder length and 45 degree direction after neck geometry enlargement',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            {
              ...options,
              neckGeometryScale:
                1.1,
            },
          )

        const backDx =
          result
            .backShoulderOuter
            .xMm -
          result
            .backSideNeck
            .xMm

        const backDy =
          result
            .backShoulderOuter
            .yMm -
          result
            .backSideNeck
            .yMm

        const frontDx =
          result
            .frontSideNeck
            .xMm -
          result
            .frontShoulderOuter
            .xMm

        const frontDy =
          result
            .frontShoulderOuter
            .yMm -
          result
            .frontSideNeck
            .yMm

        expect(
          backDx,
        ).toBeCloseTo(
          backDy,
          8,
        )

        expect(
          frontDx,
        ).toBeCloseTo(
          frontDy,
          8,
        )

        expect(
          Math.hypot(
            backDx,
            backDy,
          ),
        ).toBeCloseTo(
          30,
          8,
        )

        expect(
          Math.hypot(
            frontDx,
            frontDy,
          ),
        ).toBeCloseTo(
          30,
          8,
        )
      },
    )

    it(
      'does not mutate raw Neck Girth when neck geometry is enlarged',
      () => {
        const result =
          createReferenceTankV2Formula(
            measurements,
            {
              ...options,
              neckGeometryScale:
                1.25,
            },
          )

        expect(
          result.neckGirthMm,
        ).toBe(270)

        expect(
          measurements.neckGirthMm,
        ).toBe(270)

        expect(
          result.neckGeometryScale,
        ).toBe(1.25)
      },
    )

    it(
      'does not mutate the other raw body measurements',
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

    it(
      'rejects neck geometry shrinkage below the Video-2 base',
      () => {
        expect(() =>
          createReferenceTankV2Formula(
            measurements,
            {
              ...options,

              neckGeometryScale:
                0.99,
            },
          ),
        ).toThrow(
          'Neck geometry scale must be a finite number greater than or equal to 1.',
        )

        expect(() =>
          createReferenceTankV2Formula(
            measurements,
            {
              ...options,

              neckGeometryScale:
                Number.NaN,
            },
          ),
        ).toThrow()
      },
    )
  },
)