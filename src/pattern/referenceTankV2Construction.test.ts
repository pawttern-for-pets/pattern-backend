import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  lineLengthMm,
} from '../cad/lines'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  PAWTTERN_MASTER_V2_RULE_VERSION,
} from './referenceTankV2Formula'

import {
  createReferenceTankV2Construction,
  REFERENCE_TANK_V2_LINE_IDS,
  REFERENCE_TANK_V2_POINT_IDS,
} from './referenceTankV2Construction'

describe(
  'PAWTTERN Master Block V2 construction',
  () => {
    const measurements =
      createBodyMeasurementsFromCm({
        backLengthCm: 22,
        chestGirthCm: 36,
        neckGirthCm: 27,
      })

    /*
     * Development checkpoint only.
     *
     * +1 cm half-body allowance
     * 3 cm shoulder reference.
     *
     * This does NOT classify the
     * dog as a fixed "Medium" size.
     */
    const options = {
      halfBodyAllowanceMm: 10,
      shoulderLengthMm: 30,
    }

    it(
      'creates the V2 construction document',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        expect(
          Object.keys(
            result.document.points,
          ),
        ).toHaveLength(14)

        expect(
          Object.keys(
            result.document.lines,
          ),
        ).toHaveLength(9)

        expect(
          Object.keys(
            result.document.curves,
          ),
        ).toHaveLength(0)
      },
    )

    it(
      'uses only the PAWTTERN Master V2 rule version',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        expect(
          result.formula.ruleVersion,
        ).toBe(
          PAWTTERN_MASTER_V2_RULE_VERSION,
        )
      },
    )

    it(
      'places the Video-2 armhole-depth construction correctly',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const backLevel =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .backArmholeLevel
          ]

        const backGuide =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .backArmGuide
          ]

        const armpit =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .commonArmpit
          ]

        const frontGuide =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .frontArmGuide
          ]

        const frontLevel =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .frontArmholeLevel
          ]

        expect(
          backLevel,
        ).toMatchObject({
          xMm: 0,
          yMm: 44,
        })

        expect(
          backGuide,
        ).toMatchObject({
          xMm: 81,
          yMm: 44,
        })

        expect(
          armpit,
        ).toMatchObject({
          xMm: 114,
          yMm: 44,
        })

        expect(
          frontGuide,
        ).toMatchObject({
          xMm: 157,
          yMm: 44,
        })

        expect(
          frontLevel,
        ).toMatchObject({
          xMm: 190,
          yMm: 44,
        })
      },
    )

    it(
      'places the back neck construction from N/4 and N/8',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const sideNeck =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .backSideNeck
          ]

        expect(
          sideNeck.xMm,
        ).toBeCloseTo(
          67.5,
          8,
        )

        expect(
          sideNeck.yMm,
        ).toBeCloseTo(
          -33.75,
          8,
        )
      },
    )

    it(
      'places the front neck construction from the Video-2 formulas',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const center =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .frontNeckCenter
          ]

        const sideNeck =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .frontSideNeck
          ]

        expect(
          center,
        ).toMatchObject({
          xMm: 190,
          yMm: -56,
        })

        expect(
          sideNeck,
        ).toMatchObject({
          xMm: 136,
          yMm: -83,
        })
      },
    )

    it(
      'constructs equal 3 cm shoulder seams',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const backLine =
          result.document.lines[
            REFERENCE_TANK_V2_LINE_IDS
              .backShoulder
          ]

        const frontLine =
          result.document.lines[
            REFERENCE_TANK_V2_LINE_IDS
              .frontShoulder
          ]

        const backLength =
          lineLengthMm(
            backLine,
            result.document.points,
          )

        const frontLength =
          lineLengthMm(
            frontLine,
            result.document.points,
          )

        expect(
          backLength,
        ).toBeCloseTo(
          30,
          8,
        )

        expect(
          frontLength,
        ).toBeCloseTo(
          30,
          8,
        )

        expect(
          backLength,
        ).toBeCloseTo(
          frontLength,
          8,
        )
      },
    )

    it(
      'constructs the back shoulder right and down at 45 degrees',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const neck =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .backSideNeck
          ]

        const shoulder =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .backShoulderOuter
          ]

        const dx =
          shoulder.xMm -
          neck.xMm

        const dy =
          shoulder.yMm -
          neck.yMm

        expect(dx).toBeGreaterThan(0)
        expect(dy).toBeGreaterThan(0)

        /*
         * At 45 degrees:
         *
         * horizontal delta
         * =
         * vertical delta
         */
        expect(dx).toBeCloseTo(
          dy,
          8,
        )
      },
    )

    it(
      'constructs the front shoulder left and down at 45 degrees',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const neck =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .frontSideNeck
          ]

        const shoulder =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .frontShoulderOuter
          ]

        const dx =
          neck.xMm -
          shoulder.xMm

        const dy =
          shoulder.yMm -
          neck.yMm

        expect(
          shoulder.xMm,
        ).toBeLessThan(
          neck.xMm,
        )

        expect(
          shoulder.yMm,
        ).toBeGreaterThan(
          neck.yMm,
        )

        expect(dx).toBeCloseTo(
          dy,
          8,
        )

        expect(
          shoulder.xMm,
        ).toBeCloseTo(
          114.7867966,
          5,
        )
      },
    )

    it(
      'does not contain the retired Video-1 front armhole inset',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        expect(
          result.document.points[
            'REF_FRONT_ARMHOLE_INSET'
          ],
        ).toBeUndefined()
      },
    )

    it(
      'keeps the common armpit as a point rather than inventing a permanent full-height side seam',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .commonArmpit
          ],
        ).toBeDefined()

        /*
         * Old Video-1 Side Line
         * must not appear in V2.
         */
        expect(
          result.document.lines[
            'REF_SIDE_LINE'
          ],
        ).toBeUndefined()
      },
    )
  },
)