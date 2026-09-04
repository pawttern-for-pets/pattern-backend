import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createReferenceTankV2LowerBackGeometry,
  REFERENCE_TANK_V2_LOWER_BACK_BOW_MM,
} from './referenceTankV2LowerBackGeometry'

interface TestPosition {
  xMm: number
  yMm: number
}

interface TestCubic {
  start:
    TestPosition

  control1:
    TestPosition

  control2:
    TestPosition

  end:
    TestPosition
}

function distanceMm(
  first:
    TestPosition,

  second:
    TestPosition,
): number {
  return Math.hypot(
    second.xMm -
      first.xMm,

    second.yMm -
      first.yMm,
  )
}

function evaluateCubic(
  curve:
    TestCubic,

  t:
    number,
): TestPosition {
  const oneMinusT =
    1 -
    t

  const startWeight =
    oneMinusT *
    oneMinusT *
    oneMinusT

  const control1Weight =
    3 *
    oneMinusT *
    oneMinusT *
    t

  const control2Weight =
    3 *
    oneMinusT *
    t *
    t

  const endWeight =
    t *
    t *
    t

  return {
    xMm:
      startWeight *
        curve.start.xMm +
      control1Weight *
        curve.control1.xMm +
      control2Weight *
        curve.control2.xMm +
      endWeight *
        curve.end.xMm,

    yMm:
      startWeight *
        curve.start.yMm +
      control1Weight *
        curve.control1.yMm +
      control2Weight *
        curve.control2.yMm +
      endWeight *
        curve.end.yMm,
  }
}

function pointToInfiniteLineDistanceMm(
  point:
    TestPosition,

  lineStart:
    TestPosition,

  lineEnd:
    TestPosition,
): number {
  const dx =
    lineEnd.xMm -
    lineStart.xMm

  const dy =
    lineEnd.yMm -
    lineStart.yMm

  const numerator =
    Math.abs(
      dx *
        (
          lineStart.yMm -
          point.yMm
        ) -
      (
        lineStart.xMm -
        point.xMm
      ) *
        dy,
    )

  return (
    numerator /
    Math.hypot(
      dx,
      dy,
    )
  )
}

function tangentAtCubicStart(
  curve:
    TestCubic,
): TestPosition {
  return {
    xMm:
      curve.control1.xMm -
      curve.start.xMm,

    yMm:
      curve.control1.yMm -
      curve.start.yMm,
  }
}

function tangentAtCubicEnd(
  curve:
    TestCubic,
): TestPosition {
  return {
    xMm:
      curve.end.xMm -
      curve.control2.xMm,

    yMm:
      curve.end.yMm -
      curve.control2.yMm,
  }
}

function cross(
  first:
    TestPosition,

  second:
    TestPosition,
): number {
  return (
    first.xMm *
      second.yMm -
    first.yMm *
      second.xMm
  )
}

function dot(
  first:
    TestPosition,

  second:
    TestPosition,
): number {
  return (
    first.xMm *
      second.xMm +
    first.yMm *
      second.yMm
  )
}

describe(
  'PAWTTERN Master Block V2 lower-back geometry proof',
  () => {
    const referenceInput = {
      /*
       * B = 22 cm
       * C = 36 cm
       * half-body allowance = +1 cm
       *
       * Common side axis A = 114 mm
       *
       * Side Shaping Back:
       * A - 10 mm = 104 mm
       * Y = 7B/10 = 154 mm
       *
       * Back Hem 2/3:
       * X = 76 mm
       * Y = 220 mm
       *
       * Back Hem 1/3:
       * X = 38 mm
       * Y = 220 mm
       */
      sideShapingBackPoint: {
        xMm:
          104,

        yMm:
          154,
      },

      backHemTwoThirdsPoint: {
        xMm:
          76,

        yMm:
          220,
      },

      backHemOneThirdPoint: {
        xMm:
          38,

        yMm:
          220,
      },
    }

    it(
      'uses the source-faithful fixed 0.5 cm lower-back bow',
      () => {
        expect(
          REFERENCE_TANK_V2_LOWER_BACK_BOW_MM,
        ).toBe(5)
      },
    )

    it(
      'calculates the B22 C36 temporary guide midpoint and Back-center bow direction',
      () => {
        const result =
          createReferenceTankV2LowerBackGeometry(
            referenceInput,
          )

        expect(
          result.temporaryGuideMidpoint,
        ).toEqual({
          xMm:
            90,

          yMm:
            187,
        })

        expect(
          result.bowNormalUnit.xMm,
        ).toBeCloseTo(
          -0.9205817819,
          8,
        )

        expect(
          result.bowNormalUnit.yMm,
        ).toBeCloseTo(
          -0.3905498469,
          8,
        )

        /*
         * Negative X confirms that the
         * bow points toward Back Center.
         */
        expect(
          result.bowNormalUnit.xMm,
        ).toBeLessThan(0)

        expect(
          Math.hypot(
            result.bowNormalUnit.xMm,
            result.bowNormalUnit.yMm,
          ),
        ).toBeCloseTo(
          1,
          8,
        )
      },
    )

    it(
      'places the actual temporary curve midpoint exactly 5 mm perpendicular from the straight guide',
      () => {
        const result =
          createReferenceTankV2LowerBackGeometry(
            referenceInput,
          )

        expect(
          result.bowedCurveMidpoint.xMm,
        ).toBeCloseTo(
          85.3970910906,
          8,
        )

        expect(
          result.bowedCurveMidpoint.yMm,
        ).toBeCloseTo(
          185.0472507657,
          8,
        )

        expect(
          distanceMm(
            result.temporaryGuideMidpoint,
            result.bowedCurveMidpoint,
          ),
        ).toBeCloseTo(
          5,
          8,
        )

        expect(
          pointToInfiniteLineDistanceMm(
            result.bowedCurveMidpoint,
            referenceInput
              .sideShapingBackPoint,
            referenceInput
              .backHemTwoThirdsPoint,
          ),
        ).toBeCloseTo(
          5,
          8,
        )
      },
    )

    it(
      'uses a 10 mm quadratic control offset so the curve itself bows 5 mm',
      () => {
        const result =
          createReferenceTankV2LowerBackGeometry(
            referenceInput,
          )

        /*
         * A quadratic control placed only
         * 5 mm from the guide would make
         * the curve bow only 2.5 mm.
         *
         * The control is therefore 10 mm
         * from the guide midpoint.
         */
        expect(
          distanceMm(
            result.temporaryGuideMidpoint,
            result.temporaryQuadraticControl,
          ),
        ).toBeCloseTo(
          10,
          8,
        )

        const cubicMidpoint =
          evaluateCubic(
            result.temporaryFrenchCurve,
            0.5,
          )

        expect(
          cubicMidpoint.xMm,
        ).toBeCloseTo(
          result.bowedCurveMidpoint.xMm,
          8,
        )

        expect(
          cubicMidpoint.yMm,
        ).toBeCloseTo(
          result.bowedCurveMidpoint.yMm,
          8,
        )
      },
    )

    it(
      'keeps only the upper half of the temporary 2/3 curve and finishes at Back Hem 1/3',
      () => {
        const result =
          createReferenceTankV2LowerBackGeometry(
            referenceInput,
          )

        expect(
          result.temporaryFrenchCurve.start,
        ).toEqual(
          referenceInput
            .sideShapingBackPoint,
        )

        expect(
          result.temporaryFrenchCurve.end,
        ).toEqual(
          referenceInput
            .backHemTwoThirdsPoint,
        )

        expect(
          result.retainedUpperCurve.start,
        ).toEqual(
          referenceInput
            .sideShapingBackPoint,
        )

        expect(
          result.retainedUpperCurve.end.xMm,
        ).toBeCloseTo(
          result.bowedCurveMidpoint.xMm,
          8,
        )

        expect(
          result.retainedUpperCurve.end.yMm,
        ).toBeCloseTo(
          result.bowedCurveMidpoint.yMm,
          8,
        )

        expect(
          result.finalHemBlendCurve.start.xMm,
        ).toBeCloseTo(
          result.bowedCurveMidpoint.xMm,
          8,
        )

        expect(
          result.finalHemBlendCurve.start.yMm,
        ).toBeCloseTo(
          result.bowedCurveMidpoint.yMm,
          8,
        )

        expect(
          result.finalHemBlendCurve.end,
        ).toEqual(
          referenceInput
            .backHemOneThirdPoint,
        )

        expect(
          result.finalHemBlendCurve.end,
        ).not.toEqual(
          referenceInput
            .backHemTwoThirdsPoint,
        )
      },
    )

    it(
      'preserves a smooth forward tangent where the retained curve joins the final hem blend',
      () => {
        const result =
          createReferenceTankV2LowerBackGeometry(
            referenceInput,
          )

        const arrivingTangent =
          tangentAtCubicEnd(
            result.retainedUpperCurve,
          )

        const leavingTangent =
          tangentAtCubicStart(
            result.finalHemBlendCurve,
          )

        /*
         * Cross product = 0:
         * same tangent line.
         */
        expect(
          cross(
            arrivingTangent,
            leavingTangent,
          ),
        ).toBeCloseTo(
          0,
          8,
        )

        /*
         * Positive dot product:
         * same forward direction rather
         * than a 180-degree reversal.
         */
        expect(
          dot(
            arrivingTangent,
            leavingTangent,
          ),
        ).toBeGreaterThan(0)
      },
    )

    it(
      'arrives horizontally into the finished Back Hem 1/3 point',
      () => {
        const result =
          createReferenceTankV2LowerBackGeometry(
            referenceInput,
          )

        const hemTangent =
          tangentAtCubicEnd(
            result.finalHemBlendCurve,
          )

        expect(
          result.finalHemQuadraticControl.yMm,
        ).toBe(
          referenceInput
            .backHemOneThirdPoint
            .yMm,
        )

        expect(
          hemTangent.yMm,
        ).toBeCloseTo(
          0,
          8,
        )

        /*
         * The curve travels toward
         * decreasing X / Back Center.
         */
        expect(
          hemTangent.xMm,
        ).toBeLessThan(0)
      },
    )

    it(
      'remains finite and source-consistent for long-narrow and short-broad stress proportions',
      () => {
        const stressCases = [
          {
            /*
             * B38 / C40
             */
            sideShapingBackPoint: {
              xMm:
                116,

              yMm:
                266,
            },

            backHemTwoThirdsPoint: {
              xMm:
                84,

              yMm:
                380,
            },

            backHemOneThirdPoint: {
              xMm:
                42,

              yMm:
                380,
            },
          },

          {
            /*
             * B18 / C52
             */
            sideShapingBackPoint: {
              xMm:
                152,

              yMm:
                126,
            },

            backHemTwoThirdsPoint: {
              xMm:
                108,

              yMm:
                180,
            },

            backHemOneThirdPoint: {
              xMm:
                54,

              yMm:
                180,
            },
          },
        ]

        for (
          const input
          of stressCases
        ) {
          const result =
            createReferenceTankV2LowerBackGeometry(
              input,
            )

          expect(
            pointToInfiniteLineDistanceMm(
              result.bowedCurveMidpoint,
              input.sideShapingBackPoint,
              input.backHemTwoThirdsPoint,
            ),
          ).toBeCloseTo(
            5,
            8,
          )

          const arrivingTangent =
            tangentAtCubicEnd(
              result.retainedUpperCurve,
            )

          const leavingTangent =
            tangentAtCubicStart(
              result.finalHemBlendCurve,
            )

          expect(
            cross(
              arrivingTangent,
              leavingTangent,
            ),
          ).toBeCloseTo(
            0,
            8,
          )

          expect(
            dot(
              arrivingTangent,
              leavingTangent,
            ),
          ).toBeGreaterThan(0)

          const hemTangent =
            tangentAtCubicEnd(
              result.finalHemBlendCurve,
            )

          expect(
            hemTangent.yMm,
          ).toBeCloseTo(
            0,
            8,
          )

          expect(
            result.finalHemQuadraticControl.xMm,
          ).toBeGreaterThan(
            input.backHemOneThirdPoint.xMm,
          )

          expect(
            result.finalHemQuadraticControl.xMm,
          ).toBeLessThan(
            result.bowedCurveMidpoint.xMm,
          )

          for (
            const point
            of [
              result.bowedCurveMidpoint,
              result.temporaryQuadraticControl,
              result.retainedUpperQuadraticControl,
              result.finalHemQuadraticControl,
            ]
          ) {
            expect(
              Number.isFinite(
                point.xMm,
              ),
            ).toBe(true)

            expect(
              Number.isFinite(
                point.yMm,
              ),
            ).toBe(true)
          }
        }
      },
    )

    it(
      'rejects malformed lower-back construction inputs instead of drawing invalid geometry',
      () => {
        expect(() =>
          createReferenceTankV2LowerBackGeometry({
            ...referenceInput,

            sideShapingBackPoint: {
              xMm:
                Number.NaN,

              yMm:
                154,
            },
          }),
        ).toThrow(
          /finite construction points/i,
        )

        expect(() =>
          createReferenceTankV2LowerBackGeometry({
            ...referenceInput,

            backHemOneThirdPoint: {
              xMm:
                38,

              yMm:
                219,
            },
          }),
        ).toThrow(
          /share the same horizontal hem level/i,
        )

        expect(() =>
          createReferenceTankV2LowerBackGeometry({
            ...referenceInput,

            backHemOneThirdPoint: {
              xMm:
                90,

              yMm:
                220,
            },
          }),
        ).toThrow(
          /horizontal point order is invalid/i,
        )

        expect(() =>
          createReferenceTankV2LowerBackGeometry({
            ...referenceInput,

            sideShapingBackPoint: {
              xMm:
                104,

              yMm:
                225,
            },
          }),
        ).toThrow(
          /must remain above the hem/i,
        )
      },
    )
  },
)
