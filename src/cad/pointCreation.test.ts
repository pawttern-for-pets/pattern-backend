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
  createPointAtWorldPosition,
  getNextPointId,
} from './pointCreation'

function createDocumentWithAB() {
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

  return document
}

describe(
  'PAWTTERN CAD point creation',
  () => {
    it(
      'creates the first automatic point as P1',
      () => {
        const document =
          createDocumentWithAB()

        const result =
          createPointAtWorldPosition(
            document,
            {
              xMm: 50,
              yMm: 25,
            },
          )

        expect(
          result.pointId,
        ).toBe('P1')

        expect(
          result.document
            .points.P1.xMm,
        ).toBe(50)

        expect(
          result.document
            .points.P1.yMm,
        ).toBe(25)
      },
    )

    it(
      'creates sequential point IDs',
      () => {
        let document =
          createDocumentWithAB()

        const first =
          createPointAtWorldPosition(
            document,
            {
              xMm: 10,
              yMm: 10,
            },
          )

        document =
          first.document

        const second =
          createPointAtWorldPosition(
            document,
            {
              xMm: 20,
              yMm: 20,
            },
          )

        expect(
          first.pointId,
        ).toBe('P1')

        expect(
          second.pointId,
        ).toBe('P2')
      },
    )

    it(
      'uses the first available automatic ID',
      () => {
        let document =
          createDocumentWithAB()

        document = addPoint(
          document,
          {
            id: 'P1',
            name: 'P1',
            xMm: 10,
            yMm: 10,
          },
        )

        document = addPoint(
          document,
          {
            id: 'P3',
            name: 'P3',
            xMm: 30,
            yMm: 30,
          },
        )

        expect(
          getNextPointId(
            document,
          ),
        ).toBe('P2')
      },
    )

    it(
      'snaps a manually created point',
      () => {
        const document =
          createDocumentWithAB()

        const result =
          createPointAtWorldPosition(
            document,
            {
              xMm: 12.6,
              yMm: 27.4,
            },
            {
              snapSpacingMm: 5,
            },
          )

        expect(
          result.document
            .points.P1.xMm,
        ).toBe(15)

        expect(
          result.document
            .points.P1.yMm,
        ).toBe(25)
      },
    )

    it(
      'supports negative snapped coordinates',
      () => {
        const document =
          createDocumentWithAB()

        const result =
          createPointAtWorldPosition(
            document,
            {
              xMm: -12.6,
              yMm: -7.6,
            },
            {
              snapSpacingMm: 5,
            },
          )

        expect(
          result.document
            .points.P1.xMm,
        ).toBe(-15)

        expect(
          result.document
            .points.P1.yMm,
        ).toBe(-10)
      },
    )

    it(
      'supports an explicit point ID and name',
      () => {
        const document =
          createDocumentWithAB()

        const result =
          createPointAtWorldPosition(
            document,
            {
              xMm: 75,
              yMm: 40,
            },
            {
              id: 'C',
              name: 'Chest',
            },
          )

        expect(
          result.pointId,
        ).toBe('C')

        expect(
          result.document
            .points.C.name,
        ).toBe('Chest')
      },
    )

    it(
      'does not mutate the original document',
      () => {
        const document =
          createDocumentWithAB()

        const result =
          createPointAtWorldPosition(
            document,
            {
              xMm: 50,
              yMm: 50,
            },
          )

        expect(
          document.points.P1,
        ).toBeUndefined()

        expect(
          result.document
            .points.P1,
        ).toBeDefined()
      },
    )

    it(
      'rejects duplicate explicit IDs',
      () => {
        const document =
          createDocumentWithAB()

        expect(() =>
          createPointAtWorldPosition(
            document,
            {
              xMm: 50,
              yMm: 50,
            },
            {
              id: 'A',
            },
          ),
        ).toThrow()
      },
    )

    it(
      'rejects invalid coordinates',
      () => {
        const document =
          createDocumentWithAB()

        expect(() =>
          createPointAtWorldPosition(
            document,
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
          createDocumentWithAB()

        expect(() =>
          createPointAtWorldPosition(
            document,
            {
              xMm: 20,
              yMm: 20,
            },
            {
              snapSpacingMm: 0,
            },
          ),
        ).toThrow()
      },
    )

    it(
      'rejects an empty automatic ID prefix',
      () => {
        const document =
          createDocumentWithAB()

        expect(() =>
          getNextPointId(
            document,
            '',
          ),
        ).toThrow()
      },
    )
  },
)