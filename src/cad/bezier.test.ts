import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  approximateCubicBezierLengthMm,
  cubicBezierDerivative,
  evaluateCubicBezier,
  type CubicBezierGeometry,
} from './bezier'

const archCurve:
  CubicBezierGeometry = {
    start: {
      xMm: 0,
      yMm: 0,
    },

    control1: {
      xMm: 0,
      yMm: 100,
    },

    control2: {
      xMm: 100,
      yMm: 100,
    },

    end: {
      xMm: 100,
      yMm: 0,
    },
  }

describe(
  'PAWTTERN CAD cubic Bezier geometry',
  () => {
    it(
      'returns the exact start point at t=0',
      () => {
        const result =
          evaluateCubicBezier(
            archCurve,
            0,
          )

        expect(
          result.xMm,
        ).toBeCloseTo(0)

        expect(
          result.yMm,
        ).toBeCloseTo(0)
      },
    )

    it(
      'returns the exact end point at t=1',
      () => {
        const result =
          evaluateCubicBezier(
            archCurve,
            1,
          )

        expect(
          result.xMm,
        ).toBeCloseTo(100)

        expect(
          result.yMm,
        ).toBeCloseTo(0)
      },
    )

    it(
      'calculates the correct midpoint of a symmetric curve',
      () => {
        const result =
          evaluateCubicBezier(
            archCurve,
            0.5,
          )

        expect(
          result.xMm,
        ).toBeCloseTo(50)

        expect(
          result.yMm,
        ).toBeCloseTo(75)
      },
    )

    it(
      'calculates the starting tangent direction',
      () => {
        const result =
          cubicBezierDerivative(
            archCurve,
            0,
          )

        expect(
          result.xMm,
        ).toBeCloseTo(0)

        expect(
          result.yMm,
        ).toBeCloseTo(300)
      },
    )

    it(
      'calculates the ending tangent direction',
      () => {
        const result =
          cubicBezierDerivative(
            archCurve,
            1,
          )

        expect(
          result.xMm,
        ).toBeCloseTo(0)

        expect(
          result.yMm,
        ).toBeCloseTo(-300)
      },
    )

    it(
      'measures a straight Bezier curve as its straight-line length',
      () => {
        const straight:
          CubicBezierGeometry = {
            start: {
              xMm: 0,
              yMm: 0,
            },

            control1: {
              xMm:
                100 / 3,
              yMm: 0,
            },

            control2: {
              xMm:
                200 / 3,
              yMm: 0,
            },

            end: {
              xMm: 100,
              yMm: 0,
            },
          }

        expect(
          approximateCubicBezierLengthMm(
            straight,
          ),
        ).toBeCloseTo(
          100,
          6,
        )
      },
    )

    it(
      'reports a curved path longer than its endpoint chord',
      () => {
        const length =
          approximateCubicBezierLengthMm(
            archCurve,
            200,
          )

        expect(
          length,
        ).toBeGreaterThan(
          100,
        )

        expect(
          length,
        ).toBeLessThan(
          250,
        )
      },
    )

    it(
      'supports negative coordinates',
      () => {
        const curve:
          CubicBezierGeometry = {
            start: {
              xMm: -100,
              yMm: -50,
            },

            control1: {
              xMm: -75,
              yMm: -25,
            },

            control2: {
              xMm: -25,
              yMm: -25,
            },

            end: {
              xMm: 0,
              yMm: -50,
            },
          }

        const midpoint =
          evaluateCubicBezier(
            curve,
            0.5,
          )

        expect(
          Number.isFinite(
            midpoint.xMm,
          ),
        ).toBe(true)

        expect(
          Number.isFinite(
            midpoint.yMm,
          ),
        ).toBe(true)

        expect(
          midpoint.xMm,
        ).toBeLessThan(0)
      },
    )

    it(
      'rejects a parameter below zero',
      () => {
        expect(() =>
          evaluateCubicBezier(
            archCurve,
            -0.1,
          ),
        ).toThrow()
      },
    )

    it(
      'rejects a parameter above one',
      () => {
        expect(() =>
          evaluateCubicBezier(
            archCurve,
            1.1,
          ),
        ).toThrow()
      },
    )

    it(
      'rejects an invalid length segment count',
      () => {
        expect(() =>
          approximateCubicBezierLengthMm(
            archCurve,
            0,
          ),
        ).toThrow()

        expect(() =>
          approximateCubicBezierLengthMm(
            archCurve,
            1.5,
          ),
        ).toThrow()
      },
    )
  },
)