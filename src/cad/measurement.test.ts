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
  measureBetweenPoints,
} from './measurement'

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
      xMm: 100,
      yMm: 50,
    },
  )

  document = addPoint(
    document,
    {
      id: 'D',
      name: 'D',
      xMm: 30,
      yMm: 40,
    },
  )

  document = addPoint(
    document,
    {
      id: 'E',
      name: 'E',
      xMm: -20,
      yMm: -30,
    },
  )

  return document
}

describe(
  'PAWTTERN CAD point measurement',
  () => {
    it(
      'measures a horizontal distance',
      () => {
        const document =
          createTestDocument()

        const result =
          measureBetweenPoints(
            document,
            'A',
            'B',
          )

        expect(
          result.deltaXMm,
        ).toBe(100)

        expect(
          result.deltaYMm,
        ).toBe(0)

        expect(
          result.distanceMm,
        ).toBeCloseTo(100)
      },
    )

    it(
      'measures a vertical distance',
      () => {
        const document =
          createTestDocument()

        const result =
          measureBetweenPoints(
            document,
            'B',
            'C',
          )

        expect(
          result.deltaXMm,
        ).toBe(0)

        expect(
          result.deltaYMm,
        ).toBe(50)

        expect(
          result.distanceMm,
        ).toBeCloseTo(50)
      },
    )

    it(
      'measures a diagonal 3-4-5 distance',
      () => {
        const document =
          createTestDocument()

        const result =
          measureBetweenPoints(
            document,
            'A',
            'D',
          )

        expect(
          result.deltaXMm,
        ).toBe(30)

        expect(
          result.deltaYMm,
        ).toBe(40)

        expect(
          result.distanceMm,
        ).toBeCloseTo(50)
      },
    )

    it(
      'preserves signed coordinate differences',
      () => {
        const document =
          createTestDocument()

        const result =
          measureBetweenPoints(
            document,
            'A',
            'E',
          )

        expect(
          result.deltaXMm,
        ).toBe(-20)

        expect(
          result.deltaYMm,
        ).toBe(-30)

        expect(
          result.distanceMm,
        ).toBeCloseTo(
          Math.hypot(
            20,
            30,
          ),
        )
      },
    )

    it(
      'reverses delta signs when measurement direction is reversed',
      () => {
        const document =
          createTestDocument()

        const forward =
          measureBetweenPoints(
            document,
            'A',
            'D',
          )

        const reverse =
          measureBetweenPoints(
            document,
            'D',
            'A',
          )

        expect(
          reverse.deltaXMm,
        ).toBe(
          -forward.deltaXMm,
        )

        expect(
          reverse.deltaYMm,
        ).toBe(
          -forward.deltaYMm,
        )

        expect(
          reverse.distanceMm,
        ).toBeCloseTo(
          forward.distanceMm,
        )
      },
    )

    it(
      'returns zero when measuring a point to itself',
      () => {
        const document =
          createTestDocument()

        const result =
          measureBetweenPoints(
            document,
            'A',
            'A',
          )

        expect(
          result.deltaXMm,
        ).toBe(0)

        expect(
          result.deltaYMm,
        ).toBe(0)

        expect(
          result.distanceMm,
        ).toBe(0)
      },
    )

    it(
      'includes the measured point IDs',
      () => {
        const document =
          createTestDocument()

        const result =
          measureBetweenPoints(
            document,
            'B',
            'C',
          )

        expect(
          result.startPointId,
        ).toBe('B')

        expect(
          result.endPointId,
        ).toBe('C')
      },
    )

    it(
      'rejects a missing start point',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          measureBetweenPoints(
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
          measureBetweenPoints(
            document,
            'A',
            'missing',
          ),
        ).toThrow()
      },
    )
  },
)