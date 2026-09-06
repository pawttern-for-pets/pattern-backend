import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createReferenceTankV2BellyGeometry,
  REFERENCE_TANK_V2_BELLY_CONTROL_X_FRACTION,
} from './referenceTankV2BellyGeometry'

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

function expectMonotonicBellySweep(
  curve:
    TestCubic,
): void {
  let previous =
    evaluateCubic(
      curve,
      0,
    )

  for (
    let step = 1;
    step <= 20;
    step += 1
  ) {
    const current =
      evaluateCubic(
        curve,
        step / 20,
      )

    /*
     * The belly curve travels toward
     * increasing X / belly center.
     */
    expect(
      current.xMm,
    ).toBeGreaterThanOrEqual(
      previous.xMm -
        1e-8,
    )

    /*
     * Y+ points downward.
     *
     * Therefore a belly curve that rises
     * toward the belly-center endpoint
     * must have decreasing Y.
     */
    expect(
      current.yMm,
    ).toBeLessThanOrEqual(
      previous.yMm +
        1e-8,
    )

    previous =
      current
  }
}

describe(
  'PAWTTERN Master Block V2 belly geometry proof',
  () => {
    const referenceFemaleInput = {
      /*
       * B = 22 cm
       * C = 36 cm
       * half-body allowance = +1 cm
       *
       * W = 190 mm
       * A = 114 mm
       *
       * Side Shaping Belly:
       * A + 10 mm = 124 mm
       * Y = 7B/10 = 154 mm
       *
       * Female belly endpoint:
       * X = W = 190 mm
       * Y = 3B/5 = 132 mm
       */
      sideShapingBellyPoint: {
        xMm:
          124,

        yMm:
          154,
      },

      bellyEndpoint: {
        xMm:
          190,

        yMm:
          132,
      },
    }

    const referenceMaleInput = {
      /*
       * Same B22 / C36 construction.
       *
       * Default male belly endpoint:
       * X = W = 190 mm
       * Y = B/2 = 110 mm
       */
      sideShapingBellyPoint: {
        xMm:
          124,

        yMm:
          154,
      },

      bellyEndpoint: {
        xMm:
          190,

        yMm:
          110,
      },
    }

    it(
      'documents the current PAWTTERN digital French-curve control fraction',
      () => {
        expect(
          REFERENCE_TANK_V2_BELLY_CONTROL_X_FRACTION,
        ).toBe(
          0.5,
        )
      },
    )

    it(
      'constructs the B22 C36 female belly curve from Side Shaping Belly to 3B/5',
      () => {
        const result =
          createReferenceTankV2BellyGeometry(
            referenceFemaleInput,
          )

        expect(
          result.quadraticControl,
        ).toEqual({
          xMm:
            157,

          yMm:
            132,
        })

        expect(
          result.finishedCurve.start,
        ).toEqual(
          referenceFemaleInput
            .sideShapingBellyPoint,
        )

        expect(
          result.finishedCurve.end,
        ).toEqual(
          referenceFemaleInput
            .bellyEndpoint,
        )
      },
    )

    it(
      'constructs the B22 C36 default male belly curve from Side Shaping Belly to B/2',
      () => {
        const result =
          createReferenceTankV2BellyGeometry(
            referenceMaleInput,
          )

        expect(
          result.quadraticControl,
        ).toEqual({
          xMm:
            157,

          yMm:
            110,
        })

        expect(
          result.finishedCurve.start,
        ).toEqual(
          referenceMaleInput
            .sideShapingBellyPoint,
        )

        expect(
          result.finishedCurve.end,
        ).toEqual(
          referenceMaleInput
            .bellyEndpoint,
        )
      },
    )

    it(
      'arrives horizontally at the female belly-center endpoint',
      () => {
        const result =
          createReferenceTankV2BellyGeometry(
            referenceFemaleInput,
          )

        const endTangent =
          tangentAtCubicEnd(
            result.finishedCurve,
          )

        expect(
          endTangent.yMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          endTangent.xMm,
        ).toBeGreaterThan(
          0,
        )
      },
    )

    it(
      'arrives horizontally at the default male belly-center endpoint',
      () => {
        const result =
          createReferenceTankV2BellyGeometry(
            referenceMaleInput,
          )

        const endTangent =
          tangentAtCubicEnd(
            result.finishedCurve,
          )

        expect(
          endTangent.yMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          endTangent.xMm,
        ).toBeGreaterThan(
          0,
        )
      },
    )

    it(
      'produces a monotonic single-sweep female belly curve without reversal',
      () => {
        const result =
          createReferenceTankV2BellyGeometry(
            referenceFemaleInput,
          )

        expectMonotonicBellySweep(
          result.finishedCurve,
        )
      },
    )

    it(
      'produces a monotonic single-sweep default male belly curve without reversal',
      () => {
        const result =
          createReferenceTankV2BellyGeometry(
            referenceMaleInput,
          )

        expectMonotonicBellySweep(
          result.finishedCurve,
        )
      },
    )

    it(
      'remains finite and monotonic for long-narrow and short-broad female stress proportions',
      () => {
        const stressCases = [
          {
            /*
             * B38 / C40
             *
             * W = 210
             * A = 126
             *
             * Side Belly:
             * (136,266)
             *
             * Female 3B/5:
             * (210,228)
             */
            sideShapingBellyPoint: {
              xMm:
                136,

              yMm:
                266,
            },

            bellyEndpoint: {
              xMm:
                210,

              yMm:
                228,
            },
          },

          {
            /*
             * B18 / C52
             *
             * W = 270
             * A = 162
             *
             * Side Belly:
             * (172,126)
             *
             * Female 3B/5:
             * (270,108)
             */
            sideShapingBellyPoint: {
              xMm:
                172,

              yMm:
                126,
            },

            bellyEndpoint: {
              xMm:
                270,

              yMm:
                108,
            },
          },
        ]

        for (
          const input
          of stressCases
        ) {
          const result =
            createReferenceTankV2BellyGeometry(
              input,
            )

          expectMonotonicBellySweep(
            result.finishedCurve,
          )

          for (
            const point
            of [
              result.quadraticControl,
              result.finishedCurve.control1,
              result.finishedCurve.control2,
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

          const endTangent =
            tangentAtCubicEnd(
              result.finishedCurve,
            )

          expect(
            endTangent.yMm,
          ).toBeCloseTo(
            0,
            8,
          )

          expect(
            endTangent.xMm,
          ).toBeGreaterThan(
            0,
          )
        }
      },
    )

    it(
      'remains finite and monotonic for long-narrow and short-broad default male stress proportions',
      () => {
        const stressCases = [
          {
            /*
             * B38 / C40
             *
             * Male B/2:
             * (210,190)
             */
            sideShapingBellyPoint: {
              xMm:
                136,

              yMm:
                266,
            },

            bellyEndpoint: {
              xMm:
                210,

              yMm:
                190,
            },
          },

          {
            /*
             * B18 / C52
             *
             * Male B/2:
             * (270,90)
             */
            sideShapingBellyPoint: {
              xMm:
                172,

              yMm:
                126,
            },

            bellyEndpoint: {
              xMm:
                270,

              yMm:
                90,
            },
          },
        ]

        for (
          const input
          of stressCases
        ) {
          const result =
            createReferenceTankV2BellyGeometry(
              input,
            )

          expectMonotonicBellySweep(
            result.finishedCurve,
          )

          const endTangent =
            tangentAtCubicEnd(
              result.finishedCurve,
            )

          expect(
            endTangent.yMm,
          ).toBeCloseTo(
            0,
            8,
          )

          expect(
            endTangent.xMm,
          ).toBeGreaterThan(
            0,
          )
        }
      },
    )

    it(
      'rejects malformed belly construction inputs instead of drawing invalid geometry',
      () => {
        expect(() =>
          createReferenceTankV2BellyGeometry({
            ...referenceFemaleInput,

            sideShapingBellyPoint: {
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
          createReferenceTankV2BellyGeometry({
            ...referenceFemaleInput,

            bellyEndpoint: {
              xMm:
                120,

              yMm:
                132,
            },
          }),
        ).toThrow(
          /must remain to the right/i,
        )

        expect(() =>
          createReferenceTankV2BellyGeometry({
            ...referenceFemaleInput,

            bellyEndpoint: {
              xMm:
                190,

              yMm:
                160,
            },
          }),
        ).toThrow(
          /must remain above/i,
        )

        expect(() =>
          createReferenceTankV2BellyGeometry({
            ...referenceFemaleInput,

            bellyEndpoint: {
              xMm:
                124,

              yMm:
                132,
            },
          }),
        ).toThrow(
          /must remain to the right/i,
        )
      },
    )
  },
)