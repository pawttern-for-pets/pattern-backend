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
  REFERENCE_TANK_V2_ARMHOLE_LENGTH_SEGMENTS,
  REFERENCE_TANK_V2_CURVE_IDS,
  REFERENCE_TANK_V2_LINE_IDS,
  REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
  REFERENCE_TANK_V2_POINT_IDS,
} from './referenceTankV2Construction'

function expectSameTangentDirection(
  first: {
    xMm: number
    yMm: number
  },

  second: {
    xMm: number
    yMm: number
  },
): void {
  const firstLength =
    Math.hypot(
      first.xMm,
      first.yMm,
    )

  const secondLength =
    Math.hypot(
      second.xMm,
      second.yMm,
    )

  expect(
    firstLength,
  ).toBeGreaterThan(0)

  expect(
    secondLength,
  ).toBeGreaterThan(0)

  const normalizedCross =
    (
      first.xMm *
        second.yMm -
      first.yMm *
        second.xMm
    ) /
    (
      firstLength *
      secondLength
    )

  const normalizedDot =
    (
      first.xMm *
        second.xMm +
      first.yMm *
        second.yMm
    ) /
    (
      firstLength *
      secondLength
    )

  /*
   * Adjacent cubic segments use their
   * own local t parameter, so their
   * derivative MAGNITUDES do not need
   * to match.
   *
   * For a visually smooth join, their
   * tangent DIRECTIONS must match.
   */
  expect(
    normalizedCross,
  ).toBeCloseTo(
    0,
    8,
  )

  expect(
    normalizedDot,
  ).toBeGreaterThan(
    0.999999,
  )
}

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
      'creates the V2 construction document with the approved upper block, lower-body scaffold, and finished lower-back edge',
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
        ).toHaveLength(27)

        expect(
          Object.keys(
            result.document.lines,
          ),
        ).toHaveLength(12)

        expect(
          Object.keys(
            result.document.curves,
          ),
        ).toHaveLength(9)
      },
    )

    it(
      'places the 2/5, 3/5, and 4/5 Back-Length references on the Common Armpit vertical axis',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .sideAxisTwoFifths
          ],
        ).toMatchObject({
          xMm:
            114,

          yMm:
            88,
        })

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .sideAxisThreeFifths
          ],
        ).toMatchObject({
          xMm:
            114,

          yMm:
            132,
        })

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .sideAxisFourFifths
          ],
        ).toMatchObject({
          xMm:
            114,

          yMm:
            176,
        })
      },
    )

    it(
      'places the two Video-2 side-shaping points exactly 2 cm apart at 7B/10',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .sideShapingBack
          ],
        ).toMatchObject({
          xMm:
            104,

          yMm:
            154,
        })

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .sideShapingBelly
          ],
        ).toMatchObject({
          xMm:
            124,

          yMm:
            154,
        })

        const shapingLine =
          result.document.lines[
            REFERENCE_TANK_V2_LINE_IDS
              .sideShapingWidth
          ]

        expect(
          shapingLine.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .sideShapingBack,
        )

        expect(
          shapingLine.endPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .sideShapingBelly,
        )

        expect(
          lineLengthMm(
            shapingLine,
            result.document.points,
          ),
        ).toBeCloseTo(
          20,
          8,
        )
      },
    )

    it(
      'places the one-third and two-thirds Back hem construction references at full Back Length',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .backHemOneThird
          ],
        ).toMatchObject({
          xMm:
            38,

          yMm:
            220,
        })

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .backHemTwoThirds
          ],
        ).toMatchObject({
          xMm:
            76,

          yMm:
            220,
        })
      },
    )

    it(
      'places the female and male belly-edge references on the Front Center edge',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .femaleBellyEndpoint
          ],
        ).toMatchObject({
          xMm:
            190,

          yMm:
            132,
        })

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .maleBellyDefaultEndpoint
          ],
        ).toMatchObject({
          xMm:
            190,

          yMm:
            110,
        })

        expect(
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .maleBellyUpperReference
          ],
        ).toMatchObject({
          xMm:
            190,

          yMm:
            88,
        })
      },
    )

    it(
      'keeps one vertical lower-body side axis while integrating only the finished Back lower edge',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const sideAxis =
          result.document.lines[
            REFERENCE_TANK_V2_LINE_IDS
              .lowerBodySideAxis
          ]

        expect(
          sideAxis.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .commonArmpit,
        )

        expect(
          sideAxis.endPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .sideAxisFourFifths,
        )

        expect(
          lineLengthMm(
            sideAxis,
            result.document.points,
          ),
        ).toBeCloseTo(
          132,
          8,
        )

        /*
         * Two lower-back curves are now
         * integrated in addition to the
         * two neckline and four armhole
         * curves.
         *
         * One female belly-edge curve is now
         * integrated for visual proof.
         */
        expect(
          Object.keys(
            result.document.curves,
          ),
        ).toHaveLength(9)

        const bellyCurve =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .bellyEdge
          ]

        expect(
          bellyCurve,
        ).toBeDefined()

        expect(
          bellyCurve.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .sideShapingBelly,
        )

        expect(
          bellyCurve.endPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .femaleBellyEndpoint,
        )

        expect(
          bellyCurve.endPointId,
        ).not.toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .maleBellyDefaultEndpoint,
        )

        expect(
          bellyCurve.endPointId,
        ).not.toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .maleBellyUpperReference,
        )
      },
    )

    it(
      'places the source-derived 0.5 cm bowed lower-back midpoint at the expected B22 C36 position',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const midpoint =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .lowerBackCurveMidpoint
          ]

        expect(
          midpoint.xMm,
        ).toBeCloseTo(
          85.3970910906,
          8,
        )

        expect(
          midpoint.yMm,
        ).toBeCloseTo(
          185.0472507657,
          8,
        )

        /*
         * The midpoint bows toward
         * Back Center compared with the
         * straight-guide midpoint X=90.
         */
        expect(
          midpoint.xMm,
        ).toBeLessThan(90)
      },
    )

    it(
      'connects the finished lower-back edge through the bowed midpoint to Back Hem 1/3 while keeping Back Hem 2/3 construction-only',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const upperCurve =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .lowerBackUpper
          ]

        const hemBlendCurve =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .lowerBackHemBlend
          ]

        expect(
          upperCurve.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .sideShapingBack,
        )

        expect(
          upperCurve.endPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .lowerBackCurveMidpoint,
        )

        expect(
          hemBlendCurve.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .lowerBackCurveMidpoint,
        )

        expect(
          hemBlendCurve.endPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .backHemOneThird,
        )

        /*
         * Video-2 Back Hem 2/3 is only
         * a temporary French-curve target.
         * It must not become a finished
         * lower-back curve endpoint.
         */
        expect(
          Object.values(
            result.document.curves,
          ).some(
            (curve) =>
              curve.startPointId ===
                REFERENCE_TANK_V2_POINT_IDS
                  .backHemTwoThirds ||
              curve.endPointId ===
                REFERENCE_TANK_V2_POINT_IDS
                  .backHemTwoThirds,
          ),
        ).toBe(false)
      },
    )

    it(
      'keeps the finished lower-back join tangent-smooth and arrives horizontally at Back Hem 1/3',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const upperGeometry =
          resolveCubicBezierGeometry(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .lowerBackUpper
            ],
            result.document.points,
          )

        const hemBlendGeometry =
          resolveCubicBezierGeometry(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .lowerBackHemBlend
            ],
            result.document.points,
          )

        expectSameTangentDirection(
          cubicBezierDerivative(
            upperGeometry,
            1,
          ),

          cubicBezierDerivative(
            hemBlendGeometry,
            0,
          ),
        )

        const hemTangent =
          cubicBezierDerivative(
            hemBlendGeometry,
            1,
          )

        expect(
          hemTangent.yMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          hemTangent.xMm,
        ).toBeLessThan(0)
      },
    )

    it(
      'connects Back Length Bottom directly to Back Hem 1/3 as the finished straight Back hem',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const backHemLine =
          result.document.lines[
            REFERENCE_TANK_V2_LINE_IDS
              .backHemCenterToOneThird
          ]

        expect(
          backHemLine.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .backBottom,
        )

        expect(
          backHemLine.endPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .backHemOneThird,
        )

        /*
         * Reference block:
         *
         * Back Bottom = (0, 220)
         * Back Hem 1/3 = (38, 220)
         *
         * Therefore the finished straight
         * hem segment is exactly 38 mm.
         */
        expect(
          lineLengthMm(
            backHemLine,
            result.document.points,
          ),
        ).toBeCloseTo(
          38,
          8,
        )

        /*
         * Back Hem 2/3 must remain
         * construction-only and must not
         * be part of this finished hem.
         */
        expect(
          backHemLine.startPointId,
        ).not.toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .backHemTwoThirds,
        )

        expect(
          backHemLine.endPointId,
        ).not.toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .backHemTwoThirds,
        )
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
      'places the Video-2 back armhole midpoint pivot',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const pivot =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .backArmholePivot
          ]

        expect(
          pivot,
        ).toBeDefined()

        expect(
          pivot,
        ).toMatchObject({
          xMm:
            81,

          yMm:
            22,
        })
      },
    )

    it(
      'places the Video-2 lower-third front armhole pivot',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const pivot =
          result.document.points[
            REFERENCE_TANK_V2_POINT_IDS
              .frontArmholePivot
          ]

        expect(
          pivot,
        ).toBeDefined()

        expect(
          pivot.xMm,
        ).toBe(157)

        expect(
          pivot.yMm,
        ).toBeCloseTo(
          10.6666666667,
          8,
        )
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
      'connects the five-point armhole spline through the authoritative Video-2 references in order',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const backShoulderToPivot =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .backArmholeShoulderToPivot
          ]

        const backPivotToCommon =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .backArmholePivotToCommon
          ]

        const frontCommonToPivot =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .frontArmholeCommonToPivot
          ]

        const frontPivotToShoulder =
          result.document.curves[
            REFERENCE_TANK_V2_CURVE_IDS
              .frontArmholePivotToShoulder
          ]

        expect(
          [
            backShoulderToPivot.startPointId,
            backShoulderToPivot.endPointId,
            backPivotToCommon.endPointId,
            frontCommonToPivot.endPointId,
            frontPivotToShoulder.endPointId,
          ],
        ).toEqual([
          REFERENCE_TANK_V2_POINT_IDS
            .backShoulderOuter,

          REFERENCE_TANK_V2_POINT_IDS
            .backArmholePivot,

          REFERENCE_TANK_V2_POINT_IDS
            .commonArmpit,

          REFERENCE_TANK_V2_POINT_IDS
            .frontArmholePivot,

          REFERENCE_TANK_V2_POINT_IDS
            .frontShoulderOuter,
        ])

        expect(
          backPivotToCommon.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .backArmholePivot,
        )

        expect(
          frontCommonToPivot.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .commonArmpit,
        )

        expect(
          frontPivotToShoulder.startPointId,
        ).toBe(
          REFERENCE_TANK_V2_POINT_IDS
            .frontArmholePivot,
        )
      },
    )

    it(
      'glides smoothly through the Back Armhole Pivot instead of turning sharply',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const incomingGeometry =
          resolveCubicBezierGeometry(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .backArmholeShoulderToPivot
            ],
            result.document.points,
          )

        const outgoingGeometry =
          resolveCubicBezierGeometry(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .backArmholePivotToCommon
            ],
            result.document.points,
          )

        expectSameTangentDirection(
          cubicBezierDerivative(
            incomingGeometry,
            1,
          ),

          cubicBezierDerivative(
            outgoingGeometry,
            0,
          ),
        )
      },
    )

    it(
      'glides smoothly through Common Armpit without forcing the lower arm guides onto the finished edge',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const backGeometry =
          resolveCubicBezierGeometry(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .backArmholePivotToCommon
            ],
            result.document.points,
          )

        const frontGeometry =
          resolveCubicBezierGeometry(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .frontArmholeCommonToPivot
            ],
            result.document.points,
          )

        expectSameTangentDirection(
          cubicBezierDerivative(
            backGeometry,
            1,
          ),

          cubicBezierDerivative(
            frontGeometry,
            0,
          ),
        )

        expect(
          Object.values(
            result.document.curves,
          ).some(
            (curve) =>
              curve.endPointId ===
                REFERENCE_TANK_V2_POINT_IDS
                  .backArmGuide ||
              curve.startPointId ===
                REFERENCE_TANK_V2_POINT_IDS
                  .backArmGuide ||
              curve.endPointId ===
                REFERENCE_TANK_V2_POINT_IDS
                  .frontArmGuide ||
              curve.startPointId ===
                REFERENCE_TANK_V2_POINT_IDS
                  .frontArmGuide,
          ),
        ).toBe(false)
      },
    )

    it(
      'glides smoothly through the Front Armhole Pivot instead of turning sharply',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const incomingGeometry =
          resolveCubicBezierGeometry(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .frontArmholeCommonToPivot
            ],
            result.document.points,
          )

        const outgoingGeometry =
          resolveCubicBezierGeometry(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .frontArmholePivotToShoulder
            ],
            result.document.points,
          )

        expectSameTangentDirection(
          cubicBezierDerivative(
            incomingGeometry,
            1,
          ),

          cubicBezierDerivative(
            outgoingGeometry,
            0,
          ),
        )
      },
    )

    it(
      'reports Back and Front armhole metrics from the actual generated Bezier arc lengths',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const backExpectedMm =
          cubicBezierCurveLengthMm(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .backArmholeShoulderToPivot
            ],
            result.document.points,
            REFERENCE_TANK_V2_ARMHOLE_LENGTH_SEGMENTS,
          ) +
          cubicBezierCurveLengthMm(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .backArmholePivotToCommon
            ],
            result.document.points,
            REFERENCE_TANK_V2_ARMHOLE_LENGTH_SEGMENTS,
          )

        const frontExpectedMm =
          cubicBezierCurveLengthMm(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .frontArmholeCommonToPivot
            ],
            result.document.points,
            REFERENCE_TANK_V2_ARMHOLE_LENGTH_SEGMENTS,
          ) +
          cubicBezierCurveLengthMm(
            result.document.curves[
              REFERENCE_TANK_V2_CURVE_IDS
                .frontArmholePivotToShoulder
            ],
            result.document.points,
            REFERENCE_TANK_V2_ARMHOLE_LENGTH_SEGMENTS,
          )

        expect(
          result.armhole
            .backArmholeLengthMm,
        ).toBeCloseTo(
          backExpectedMm,
          8,
        )

        expect(
          result.armhole
            .frontArmholeLengthMm,
        ).toBeCloseTo(
          frontExpectedMm,
          8,
        )

        expect(
          result.armhole
            .backArmholeLengthMm,
        ).toBeGreaterThan(0)

        expect(
          result.armhole
            .frontArmholeLengthMm,
        ).toBeGreaterThan(0)
      },
    )

    it(
      'reports one-side armhole opening as Back plus Front with no fit threshold applied',
      () => {
        const result =
          createReferenceTankV2Construction(
            measurements,
            options,
          )

        const expectedOneSideMm =
          result.armhole
            .backArmholeLengthMm +
          result.armhole
            .frontArmholeLengthMm

        expect(
          result.armhole
            .oneSideArmholeOpeningMm,
        ).toBeCloseTo(
          expectedOneSideMm,
          8,
        )

        /*
         * This metric is diagnostic only.
         *
         * It deliberately reports the
         * actual generated seam-line arc
         * and does not assert a universal
         * anatomical minimum, percentage,
         * or safety threshold.
         */
        expect(
          Number.isFinite(
            result.armhole
              .oneSideArmholeOpeningMm,
          ),
        ).toBe(true)
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