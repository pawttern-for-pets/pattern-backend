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
  getCurveProperties,
} from './curveProperties'

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

  const result =
    createCurveBetweenPoints(
      document,
      'A',
      'B',
    )

  return result.document
}

describe(
  'PAWTTERN CAD curve properties',
  () => {
    it(
      'returns the curve identity',
      () => {
        const document =
          createTestDocument()

        const properties =
          getCurveProperties(
            document,
            'C1',
          )

        expect(
          properties.curveId,
        ).toBe('C1')

        expect(
          properties.name,
        ).toBe('C1')
      },
    )

    it(
      'returns the endpoint references',
      () => {
        const document =
          createTestDocument()

        const properties =
          getCurveProperties(
            document,
            'C1',
          )

        expect(
          properties.startPointId,
        ).toBe('A')

        expect(
          properties.endPointId,
        ).toBe('B')
      },
    )

    it(
      'reports 100 mm for the default straight curve',
      () => {
        const document =
          createTestDocument()

        const properties =
          getCurveProperties(
            document,
            'C1',
            200,
          )

        expect(
          properties.lengthMm,
        ).toBeCloseTo(
          100,
          5,
        )
      },
    )

    it(
      'reports a longer length after shaping the curve',
      () => {
        let document =
          createTestDocument()

        document =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm: 20,
              yMm: 50,
            },
          )

        document =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control2',
            {
              xMm: 80,
              yMm: 50,
            },
          )

        const properties =
          getCurveProperties(
            document,
            'C1',
            200,
          )

        expect(
          properties.lengthMm,
        ).toBeGreaterThan(
          100,
        )
      },
    )

    it(
      'returns the current control handle coordinates',
      () => {
        let document =
          createTestDocument()

        document =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm: 25,
              yMm: 40,
            },
          )

        const properties =
          getCurveProperties(
            document,
            'C1',
          )

        expect(
          properties.control1,
        ).toEqual({
          xMm: 25,
          yMm: 40,
        })
      },
    )

    it(
      'returns copies of control coordinates',
      () => {
        const document =
          createTestDocument()

        const properties =
          getCurveProperties(
            document,
            'C1',
          )

        properties.control1.xMm =
          999

        expect(
          document.curves.C1
            .control1.xMm,
        ).not.toBe(999)
      },
    )

    it(
      'updates its reported length from current document geometry',
      () => {
        let document =
          createTestDocument()

        const before =
          getCurveProperties(
            document,
            'C1',
            200,
          )

        document =
          moveCurveControlToWorldPosition(
            document,
            'C1',
            'control1',
            {
              xMm: 0,
              yMm: 80,
            },
          )

        const after =
          getCurveProperties(
            document,
            'C1',
            200,
          )

        expect(
          after.lengthMm,
        ).toBeGreaterThan(
          before.lengthMm,
        )
      },
    )

    it(
      'rejects a missing curve',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          getCurveProperties(
            document,
            'missing',
          ),
        ).toThrow()
      },
    )
  },
)