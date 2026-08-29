import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addCurve,
  addLine,
  addPoint,
  createEmptyDocument,
  removeCurve,
  removePoint,
  updatePoint,
} from './document'

import {
  cubicBezierCurveLengthMm,
  resolveCubicBezierGeometry,
  type CubicBezierCurve,
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
      xMm: 100,
      yMm: 0,
    },
  )

  document = addPoint(
    document,
    {
      id: 'C',
      name: 'C',
      xMm: 200,
      yMm: 0,
    },
  )

  document = addLine(
    document,
    {
      id: 'AB',
      name: 'AB',
      startPointId: 'A',
      endPointId: 'B',
    },
  )

  return document
}

function createTestCurve():
CubicBezierCurve {
  return {
    id: 'C1',
    name: 'C1',

    startPointId: 'A',
    endPointId: 'B',

    control1: {
      xMm: 0,
      yMm: 50,
    },

    control2: {
      xMm: 100,
      yMm: 50,
    },
  }
}

describe(
  'PAWTTERN CAD curve document storage',
  () => {
    it(
      'creates an empty curve collection',
      () => {
        const document =
          createEmptyDocument()

        expect(
          document.curves,
        ).toEqual({})
      },
    )

    it(
      'adds a valid cubic Bezier curve',
      () => {
        const document =
          createTestDocument()

        const result =
          addCurve(
            document,
            createTestCurve(),
          )

        expect(
          result.curves.C1,
        ).toBeDefined()

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
      'does not mutate the original document when adding a curve',
      () => {
        const document =
          createTestDocument()

        const result =
          addCurve(
            document,
            createTestCurve(),
          )

        expect(
          document.curves.C1,
        ).toBeUndefined()

        expect(
          result.curves.C1,
        ).toBeDefined()
      },
    )

    it(
      'rejects a duplicate curve ID',
      () => {
        let document =
          createTestDocument()

        document = addCurve(
          document,
          createTestCurve(),
        )

        expect(() =>
          addCurve(
            document,
            createTestCurve(),
          ),
        ).toThrow()
      },
    )

    it(
      'rejects a curve with a missing endpoint',
      () => {
        const document =
          createTestDocument()

        const curve =
          createTestCurve()

        curve.endPointId =
          'missing'

        expect(() =>
          addCurve(
            document,
            curve,
          ),
        ).toThrow()
      },
    )

    it(
      'rejects invalid control coordinates',
      () => {
        const document =
          createTestDocument()

        const curve =
          createTestCurve()

        curve.control1.xMm =
          Number.NaN

        expect(() =>
          addCurve(
            document,
            curve,
          ),
        ).toThrow()
      },
    )

    it(
      'removes a curve without deleting its points or lines',
      () => {
        let document =
          createTestDocument()

        document = addCurve(
          document,
          createTestCurve(),
        )

        const result =
          removeCurve(
            document,
            'C1',
          )

        expect(
          result.curves.C1,
        ).toBeUndefined()

        expect(
          result.points.A,
        ).toBeDefined()

        expect(
          result.points.B,
        ).toBeDefined()

        expect(
          result.lines.AB,
        ).toBeDefined()
      },
    )

    it(
      'removes connected curves when an endpoint point is deleted',
      () => {
        let document =
          createTestDocument()

        document = addCurve(
          document,
          createTestCurve(),
        )

        const result =
          removePoint(
            document,
            'A',
          )

        expect(
          result.curves.C1,
        ).toBeUndefined()

        expect(
          result.lines.AB,
        ).toBeUndefined()

        expect(
          result.points.B,
        ).toBeDefined()
      },
    )

    it(
      'preserves a curve when an unrelated point is deleted',
      () => {
        let document =
          createTestDocument()

        document = addCurve(
          document,
          createTestCurve(),
        )

        const result =
          removePoint(
            document,
            'C',
          )

        expect(
          result.curves.C1,
        ).toBeDefined()
      },
    )

    it(
      'resolves curve endpoints from live document points',
      () => {
        let document =
          createTestDocument()

        document = addCurve(
          document,
          createTestCurve(),
        )

        document =
          updatePoint(
            document,
            'B',
            {
              xMm: 150,
              yMm: 25,
            },
          )

        const geometry =
          resolveCubicBezierGeometry(
            document.curves.C1,
            document.points,
          )

        expect(
          geometry.end.xMm,
        ).toBe(150)

        expect(
          geometry.end.yMm,
        ).toBe(25)
      },
    )

    it(
      'calculates a curved path longer than its endpoint chord',
      () => {
        let document =
          createTestDocument()

        document = addCurve(
          document,
          createTestCurve(),
        )

        const length =
          cubicBezierCurveLengthMm(
            document.curves.C1,
            document.points,
            200,
          )

        expect(
          length,
        ).toBeGreaterThan(
          100,
        )
      },
    )
  },
)