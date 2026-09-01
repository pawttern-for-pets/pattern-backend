import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  cubicBezierDerivative,
} from '../cad/bezier'

import {
  cubicBezierCurveLengthMm,
  resolveCubicBezierGeometry,
} from '../cad/curves'

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
  REFERENCE_TANK_V2_CURVE_IDS,
  REFERENCE_TANK_V2_LINE_IDS,
  REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
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

    const options = {
      halfBodyAllowanceMm: 10,
      shoulderLengthMm: 30,
      neckOpeningAllowanceMm: 0,
    }

    it(
      'creates the V2 construction document with two neckline curves',
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
        ).toHaveLength(2)
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
      'uses the unscaled Video-2 neckline when no enlargement is required',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        expect(
          result.formula.neckGeometryScale,
        ).toBe(1)
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
      'places the default back neck construction from N/4 and N/8',
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
      'places the default front neck construction from the Video-2 formulas',
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
          sideNeck.xMm,
        ).toBeCloseTo(
          136,
          8,
        )

        expect(
          sideNeck.yMm,
        ).toBeCloseTo(
          -83,
          8,
        )
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

        expect(
          dx,
        ).toBeGreaterThan(0)

        expect(
          dy,
        ).toBeGreaterThan(0)

        expect(
          dx,
        ).toBeCloseTo(
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

        expect(
          dx,
        ).toBeCloseTo(
          dy,
          8,
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

        expect(
          result.document.lines[
            'REF_SIDE_LINE'
          ],
        ).toBeUndefined()
      },
    )

    it(
      'connects the back neckline from Back Neck Center to Back Side Neck',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const curve =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .backNeckline
          ]

        expect(
          curve,
        ).toBeDefined()

        expect(
          curve.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .backNeckCenter,
        )

        expect(
          curve.endPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .backSideNeck,
        )
      },
    )

    it(
      'connects the front neckline from Front Neck Center to Front Side Neck',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const curve =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .frontNeckline
          ]

        expect(
          curve,
        ).toBeDefined()

        expect(
          curve.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .frontNeckCenter,
        )

        expect(
          curve.endPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .frontSideNeck,
        )
      },
    )

    it(
      'uses horizontal center-neck tangents and 45 degree approaches into both side-neck points',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const backCurve =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .backNeckline
          ]

        const frontCurve =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .frontNeckline
          ]

        const backGeometry =
          resolveCubicBezierGeometry(
            backCurve,
            result.document.points,
          )

        const frontGeometry =
          resolveCubicBezierGeometry(
            frontCurve,
            result.document.points,
          )

        const backStartTangent =
          cubicBezierDerivative(
            backGeometry,
            0,
          )

        const backEndTangent =
          cubicBezierDerivative(
            backGeometry,
            1,
          )

        const frontStartTangent =
          cubicBezierDerivative(
            frontGeometry,
            0,
          )

        const frontEndTangent =
          cubicBezierDerivative(
            frontGeometry,
            1,
          )

        expect(
          backStartTangent.yMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          frontStartTangent.yMm,
        ).toBeCloseTo(
          0,
          8,
        )

        /*
         * Back neckline approaches
         * Side Neck RIGHT + UP.
         */
        expect(
          backEndTangent.xMm,
        ).toBeGreaterThan(0)

        expect(
          backEndTangent.yMm,
        ).toBeLessThan(0)

        expect(
          Math.abs(
            backEndTangent.xMm,
          ),
        ).toBeCloseTo(
          Math.abs(
            backEndTangent.yMm,
          ),
          8,
        )

        /*
         * Front neckline approaches
         * Side Neck LEFT + UP.
         */
        expect(
          frontEndTangent.xMm,
        ).toBeLessThan(0)

        expect(
          frontEndTangent.yMm,
        ).toBeLessThan(0)

        expect(
          Math.abs(
            frontEndTangent.xMm,
          ),
        ).toBeCloseTo(
          Math.abs(
            frontEndTangent.yMm,
          ),
          8,
        )
      },
    )

    it(
      'reports neckline metrics from the actual cubic Bezier arc lengths',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const backCurve =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .backNeckline
          ]

        const frontCurve =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .frontNeckline
          ]

        const measuredBack =
          cubicBezierCurveLengthMm(
            backCurve,
            result.document.points,
            REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
          )

        const measuredFront =
          cubicBezierCurveLengthMm(
            frontCurve,
            result.document.points,
            REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
          )

        expect(
          result.neckline
            .backHalfNeckLengthMm,
        ).toBeCloseTo(
          measuredBack,
          8,
        )

        expect(
          result.neckline
            .frontHalfNeckLengthMm,
        ).toBeCloseTo(
          measuredFront,
          8,
        )

        expect(
          result.neckline
            .finishedNeckOpeningMm,
        ).toBeCloseTo(
          2 *
          (
            measuredBack +
            measuredFront
          ),
          8,
        )
      },
    )

    it(
      'keeps raw Neck Girth unchanged',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        expect(
          result.formula.neckGirthMm,
        ).toBe(270)

        expect(
          measurements.neckGirthMm,
        ).toBe(270)
      },
    )

    it(
      'automatically enlarges the neckline when plus 2 cm requires more opening',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            {
              ...options,
              neckOpeningAllowanceMm:
                20,
            },
          )

        expect(
          result.neckline
            .minimumNeckOpeningMm,
        ).toBe(290)

       expect(
  result.neckline
    .finishedNeckOpeningMm +
    0.001,
).toBeGreaterThanOrEqual(
  290,
)

        expect(
          Math.abs(
            result.neckline
              .finishedNeckOpeningMm -
            290,
          ),
        ).toBeLessThan(
          0.001,
        )

        /*
         * Raw N remains unchanged.
         */
        expect(
          result.formula.neckGirthMm,
        ).toBe(270)
      },
    )

    it(
      'automatically enlarges the neckline when plus 3 cm requires a 30 cm opening',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            {
              ...options,
              neckOpeningAllowanceMm:
                30,
            },
          )

        expect(
          result.neckline
            .minimumNeckOpeningMm,
        ).toBe(300)

        expect(
          result.formula.neckGeometryScale,
        ).toBeGreaterThan(1)

        expect(
          result.neckline
            .finishedNeckOpeningMm,
        ).toBeGreaterThanOrEqual(
          300,
        )

        expect(
          Math.abs(
            result.neckline
              .finishedNeckOpeningMm -
            300,
          ),
        ).toBeLessThan(
          0.001,
        )

        expect(
          result.formula.neckGirthMm,
        ).toBe(270)
      },
    )

    it(
      'keeps both shoulders 3 cm and 45 degrees after automatic neckline enlargement',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            {
              ...options,
              neckOpeningAllowanceMm:
                30,
            },
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

        expect(
          lineLengthMm(
            backLine,
            result.document.points,
          ),
        ).toBeCloseTo(
          30,
          8,
        )

        expect(
          lineLengthMm(
            frontLine,
            result.document.points,
          ),
        ).toBeCloseTo(
          30,
          8,
        )

        const backNeck =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .backSideNeck
          ]

        const backShoulder =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .backShoulderOuter
          ]

        const frontNeck =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .frontSideNeck
          ]

        const frontShoulder =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .frontShoulderOuter
          ]

        expect(
          backShoulder.xMm -
          backNeck.xMm,
        ).toBeCloseTo(
          backShoulder.yMm -
          backNeck.yMm,
          8,
        )

        expect(
          frontNeck.xMm -
          frontShoulder.xMm,
        ).toBeCloseTo(
          frontShoulder.yMm -
          frontNeck.yMm,
          8,
        )
      },
    )

    it(
      'rejects invalid neck opening allowance values',
      () => {
        expect(() =>
          createReferenceTankV2Construction(
            measurements,
            {
              ...options,

              neckOpeningAllowanceMm:
                -1,
            },
          ),
        ).toThrow()

        expect(() =>
          createReferenceTankV2Construction(
            measurements,
            {
              ...options,

              neckOpeningAllowanceMm:
                Number.NaN,
            },
          ),
        ).toThrow()
      },
    )
  },
)