import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addPoint,
  createEmptyDocument,
} from './document'

import {
  createCurveBetweenPoints,
} from './curveCreation'

import {
  moveCurveControlToWorldPosition,
} from './curveEditing'

import {
  resolveCubicBezierGeometry,
} from './curves'

function createTestDocument() {
  let document =
    createEmptyDocument()

  document = addPoint(
    document,
    {
      id: 'A',
      name: 'A',
      xMm: 0,
      yMm: 0,
    },
  )

  document = addPoint(
    document,
    {
      id: 'B',
      name: 'B',
      xMm: 120,
      yMm: 0,
    },
  )

  const result =
    createCurveBetweenPoints(
      document,
      'A',
      'B',
    )

  return result.document
}

describe(
  'PAWTTERN CAD curve control editing',
  () => {
    it(
      'moves control1 to an exact world position',
      () => {
        const document =
          createTestDocument()

        const result =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm: 25,
              yMm: 40,
            },
          )

        expect(
          result.curves.C1
            .control1.xMm,
        ).toBe(25)

        expect(
          result.curves.C1
            .control1.yMm,
        ).toBe(40)
      },
    )

    it(
      'moves control2 to an exact world position',
      () => {
        const document =
          createTestDocument()

        const result =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control2',
            {
              xMm: 95,
              yMm: -30,
            },
          )

        expect(
          result.curves.C1
            .control2.xMm,
        ).toBe(95)

        expect(
          result.curves.C1
            .control2.yMm,
        ).toBe(-30)
      },
    )

    it(
      'snaps a control handle to the requested spacing',
      () => {
        const document =
          createTestDocument()

        const result =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm: 53,
              yMm: 27,
            },
            {
              snapSpacingMm: 10,
            },
          )

        expect(
          result.curves.C1
            .control1.xMm,
        ).toBe(50)

        expect(
          result.curves.C1
            .control1.yMm,
        ).toBe(30)
      },
    )

    it(
      'uses the CAD negative-coordinate snapping rule',
      () => {
        const document =
          createTestDocument()

        const result =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm: -55,
              yMm: -25,
            },
            {
              snapSpacingMm: 10,
            },
          )

        expect(
          result.curves.C1
            .control1.xMm,
        ).toBe(-60)

        expect(
          result.curves.C1
            .control1.yMm,
        ).toBe(-30)
      },
    )

    it(
      'preserves the curve endpoint references',
      () => {
        const document =
          createTestDocument()

        const result =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm: 20,
              yMm: 60,
            },
          )

        expect(
          result.curves.C1
            .startPointId,
        ).toBe('A')

        expect(
          result.curves.C1
            .endPointId,
        ).toBe('B')
      },
    )

    it(
      'preserves the other control handle',
      () => {
        const document =
          createTestDocument()

        const originalControl2 = {
          ...document.curves.C1
            .control2,
        }

        const result =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm: 20,
              yMm: 60,
            },
          )

        expect(
          result.curves.C1
            .control2,
        ).toEqual(
          originalControl2,
        )
      },
    )

    it(
      'does not mutate the original document or curve',
      () => {
        const document =
          createTestDocument()

        const originalCurve =
          document.curves.C1

        const originalControl1 = {
          ...originalCurve.control1,
        }

        const result =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm: 10,
              yMm: 80,
            },
          )

        expect(
          document.curves.C1,
        ).toBe(
          originalCurve,
        )

        expect(
          document.curves.C1
            .control1,
        ).toEqual(
          originalControl1,
        )

        expect(
          result,
        ).not.toBe(
          document,
        )

        expect(
          result.curves.C1,
        ).not.toBe(
          originalCurve,
        )
      },
    )

    it(
      'returns the same document when the control position does not change',
      () => {
        const document =
          createTestDocument()

        const control =
          document.curves.C1
            .control1

        const result =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm:
                control.xMm,

              yMm:
                control.yMm,
            },
          )

        expect(
          result,
        ).toBe(
          document,
        )
      },
    )

    it(
      'returns the same document for a missing curve',
      () => {
        const document =
          createTestDocument()

        const result =
          moveCurveControlToWorldPosition(
            document,
            'missing',
            'control1',
            {
              xMm: 20,
              yMm: 30,
            },
          )

        expect(
          result,
        ).toBe(
          document,
        )
      },
    )

    it(
      'changes the resolved Bezier geometry without moving the endpoints',
      () => {
        const document =
          createTestDocument()

        const result =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm: 20,
              yMm: 60,
            },
          )

        const geometry =
          resolveCubicBezierGeometry(
            result.curves.C1,
            result.points,
          )

        expect(
          geometry.start.xMm,
        ).toBe(0)

        expect(
          geometry.start.yMm,
        ).toBe(0)

        expect(
          geometry.end.xMm,
        ).toBe(120)

        expect(
          geometry.end.yMm,
        ).toBe(0)

        expect(
          geometry.control1
            .xMm,
        ).toBe(20)

        expect(
          geometry.control1
            .yMm,
        ).toBe(60)
      },
    )

    it(
      'rejects a non-finite target position',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm:
                Number.NaN,

              yMm: 20,
            },
          ),
        ).toThrow()

        expect(() =>
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control2',
            {
              xMm: 20,

              yMm:
                Number.POSITIVE_INFINITY,
            },
          ),
        ).toThrow()
      },
    )
  },
)