import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addCurve,
  addPoint,
  createEmptyDocument,
} from './document'

import {
  createCurveBetweenPoints,
  getDefaultCurveControls,
  getNextCurveId,
} from './curveCreation'

import {
  cubicBezierCurveLengthMm,
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

  document = addPoint(
    document,
    {
      id: 'D',
      name: 'D',
      xMm: 120,
      yMm: 90,
    },
  )

  return document
}

describe(
  'PAWTTERN CAD curve creation',
  () => {
    it(
      'creates the first automatic curve as C1',
      () => {
        const document =
          createTestDocument()

        const result =
          createCurveBetweenPoints(
            document,
            'A',
            'B',
          )

        expect(
          result.curveId,
        ).toBe('C1')

        expect(
          result.document
            .curves.C1
            .startPointId,
        ).toBe('A')

        expect(
          result.document
            .curves.C1
            .endPointId,
        ).toBe('B')
      },
    )

    it(
      'creates sequential curve IDs',
      () => {
        let document =
          createTestDocument()

        const first =
          createCurveBetweenPoints(
            document,
            'A',
            'B',
          )

        document =
          first.document

        const second =
          createCurveBetweenPoints(
            document,
            'B',
            'D',
          )

        expect(
          first.curveId,
        ).toBe('C1')

        expect(
          second.curveId,
        ).toBe('C2')
      },
    )

    it(
      'uses the first available automatic curve ID',
      () => {
        let document =
          createTestDocument()

        document = addCurve(
          document,
          {
            id: 'C1',
            name: 'C1',
            startPointId: 'A',
            endPointId: 'B',

            control1: {
              xMm: 40,
              yMm: 0,
            },

            control2: {
              xMm: 80,
              yMm: 0,
            },
          },
        )

        document = addCurve(
          document,
          {
            id: 'C3',
            name: 'C3',
            startPointId: 'B',
            endPointId: 'D',

            control1: {
              xMm: 120,
              yMm: 30,
            },

            control2: {
              xMm: 120,
              yMm: 60,
            },
          },
        )

        expect(
          getNextCurveId(
            document,
          ),
        ).toBe('C2')
      },
    )

    it(
      'places default control handles at one-third and two-thirds',
      () => {
        const controls =
          getDefaultCurveControls(
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 120,
              yMm: 90,
            },
          )

        expect(
          controls.control1.xMm,
        ).toBeCloseTo(40)

        expect(
          controls.control1.yMm,
        ).toBeCloseTo(30)

        expect(
          controls.control2.xMm,
        ).toBeCloseTo(80)

        expect(
          controls.control2.yMm,
        ).toBeCloseTo(60)
      },
    )

    it(
      'creates a straight default curve between horizontal points',
      () => {
        const document =
          createTestDocument()

        const result =
          createCurveBetweenPoints(
            document,
            'A',
            'B',
          )

        const curve =
          result.document
            .curves.C1

        expect(
          curve.control1.xMm,
        ).toBeCloseTo(40)

        expect(
          curve.control1.yMm,
        ).toBeCloseTo(0)

        expect(
          curve.control2.xMm,
        ).toBeCloseTo(80)

        expect(
          curve.control2.yMm,
        ).toBeCloseTo(0)

        expect(
          cubicBezierCurveLengthMm(
            curve,
            result.document
              .points,
          ),
        ).toBeCloseTo(
          120,
          5,
        )
      },
    )

    it(
      'supports explicit control handles for a shaped curve',
      () => {
        const document =
          createTestDocument()

        const result =
          createCurveBetweenPoints(
            document,
            'A',
            'B',
            {
              control1: {
                xMm: 20,
                yMm: 50,
              },

              control2: {
                xMm: 100,
                yMm: 50,
              },
            },
          )

        expect(
          result.document
            .curves.C1
            .control1.yMm,
        ).toBe(50)

        expect(
          result.document
            .curves.C1
            .control2.yMm,
        ).toBe(50)

        expect(
          cubicBezierCurveLengthMm(
            result.document
              .curves.C1,
            result.document
              .points,
            200,
          ),
        ).toBeGreaterThan(
          120,
        )
      },
    )

    it(
      'supports an explicit curve ID and name',
      () => {
        const document =
          createTestDocument()

        const result =
          createCurveBetweenPoints(
            document,
            'A',
            'B',
            {
              id:
                'NECKLINE',

              name:
                'Front Neckline',
            },
          )

        expect(
          result.curveId,
        ).toBe(
          'NECKLINE',
        )

        expect(
          result.document
            .curves
            .NECKLINE
            .name,
        ).toBe(
          'Front Neckline',
        )
      },
    )

    it(
      'does not mutate the original document',
      () => {
        const document =
          createTestDocument()

        const result =
          createCurveBetweenPoints(
            document,
            'A',
            'B',
          )

        expect(
          document.curves.C1,
        ).toBeUndefined()

        expect(
          result.document
            .curves.C1,
        ).toBeDefined()
      },
    )

    it(
      'rejects a curve from a point to itself',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          createCurveBetweenPoints(
            document,
            'A',
            'A',
          ),
        ).toThrow()
      },
    )

    it(
      'rejects a missing start point',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          createCurveBetweenPoints(
            document,
            'missing',
            'B',
          ),
        ).toThrow()
      },
    )

    it(
      'rejects a missing end point',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          createCurveBetweenPoints(
            document,
            'A',
            'missing',
          ),
        ).toThrow()
      },
    )

    it(
      'rejects invalid explicit control coordinates',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          createCurveBetweenPoints(
            document,
            'A',
            'B',
            {
              control1: {
                xMm:
                  Number.NaN,

                yMm: 0,
              },
            },
          ),
        ).toThrow()
      },
    )

    it(
      'rejects an empty automatic curve ID prefix',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          getNextCurveId(
            document,
            '',
          ),
        ).toThrow()
      },
    )
  },
)