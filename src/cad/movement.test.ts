import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addLine,
  addPoint,
  createEmptyDocument,
} from './document'

import {
  lineLengthMm,
} from './lines'

import {
  movePointToWorldPosition,
} from './movement'

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

describe(
  'PAWTTERN CAD point movement',
  () => {
    it(
      'moves a point to an exact world position',
      () => {
        const document =
          createTestDocument()

        const result =
          movePointToWorldPosition(
            document,
            'B',
            {
              xMm: 125,
              yMm: 30,
            },
          )

        expect(
          result.points.B.xMm,
        ).toBe(125)

        expect(
          result.points.B.yMm,
        ).toBe(30)

        expect(
          result.points.A.xMm,
        ).toBe(0)

        expect(
          result.points.A.yMm,
        ).toBe(0)
      },
    )

    it(
      'keeps connected line references intact',
      () => {
        const document =
          createTestDocument()

        const result =
          movePointToWorldPosition(
            document,
            'B',
            {
              xMm: 150,
              yMm: 0,
            },
          )

        expect(
          result.lines.AB
            .startPointId,
        ).toBe('A')

        expect(
          result.lines.AB
            .endPointId,
        ).toBe('B')

        expect(
          lineLengthMm(
            result.lines.AB,
            result.points,
          ),
        ).toBeCloseTo(150)
      },
    )

    it(
      'snaps movement to the requested spacing',
      () => {
        const document =
          createTestDocument()

        const result =
          movePointToWorldPosition(
            document,
            'B',
            {
              xMm: 103,
              yMm: 7.4,
            },
            {
              snapSpacingMm: 5,
            },
          )

        expect(
          result.points.B.xMm,
        ).toBe(105)

        expect(
          result.points.B.yMm,
        ).toBe(5)
      },
    )

    it(
      'supports snapping to negative coordinates',
      () => {
        const document =
          createTestDocument()

        const result =
          movePointToWorldPosition(
            document,
            'A',
            {
              xMm: -12.6,
              yMm: -7.6,
            },
            {
              snapSpacingMm: 5,
            },
          )

        expect(
          result.points.A.xMm,
        ).toBe(-15)

        expect(
          result.points.A.yMm,
        ).toBe(-10)
      },
    )

    it(
      'does nothing when the point does not exist',
      () => {
        const document =
          createTestDocument()

        const result =
          movePointToWorldPosition(
            document,
            'missing',
            {
              xMm: 50,
              yMm: 50,
            },
          )

        expect(result).toBe(
          document,
        )
      },
    )

    it(
      'does not create a new document when the position is unchanged',
      () => {
        const document =
          createTestDocument()

        const result =
          movePointToWorldPosition(
            document,
            'B',
            {
              xMm: 100,
              yMm: 0,
            },
          )

        expect(result).toBe(
          document,
        )
      },
    )

    it(
      'does not mutate the original document',
      () => {
        const document =
          createTestDocument()

        const result =
          movePointToWorldPosition(
            document,
            'B',
            {
              xMm: 150,
              yMm: 25,
            },
          )

        expect(
          document.points.B.xMm,
        ).toBe(100)

        expect(
          document.points.B.yMm,
        ).toBe(0)

        expect(
          result.points.B.xMm,
        ).toBe(150)

        expect(
          result.points.B.yMm,
        ).toBe(25)
      },
    )

    it(
      'rejects invalid coordinates',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          movePointToWorldPosition(
            document,
            'B',
            {
              xMm:
                Number.NaN,
              yMm: 0,
            },
          ),
        ).toThrow()
      },
    )

    it(
      'rejects invalid snap spacing',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          movePointToWorldPosition(
            document,
            'B',
            {
              xMm: 120,
              yMm: 20,
            },
            {
              snapSpacingMm: 0,
            },
          ),
        ).toThrow()
      },
    )
  },
)