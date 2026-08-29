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
  createLineBetweenPoints,
  getNextLineId,
} from './lineCreation'

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

  return document
}

describe(
  'PAWTTERN CAD line creation',
  () => {
    it(
      'creates the first automatic line as L1',
      () => {
        const document =
          createTestDocument()

        const result =
          createLineBetweenPoints(
            document,
            'A',
            'B',
          )

        expect(
          result.lineId,
        ).toBe('L1')

        expect(
          result.document
            .lines.L1
            .startPointId,
        ).toBe('A')

        expect(
          result.document
            .lines.L1
            .endPointId,
        ).toBe('B')
      },
    )

    it(
      'creates sequential line IDs',
      () => {
        let document =
          createTestDocument()

        const first =
          createLineBetweenPoints(
            document,
            'A',
            'B',
          )

        document =
          first.document

        const second =
          createLineBetweenPoints(
            document,
            'B',
            'C',
          )

        expect(
          first.lineId,
        ).toBe('L1')

        expect(
          second.lineId,
        ).toBe('L2')
      },
    )

    it(
      'uses the first available automatic line ID',
      () => {
        let document =
          createTestDocument()

        document = addLine(
          document,
          {
            id: 'L1',
            name: 'L1',
            startPointId: 'A',
            endPointId: 'B',
          },
        )

        document = addLine(
          document,
          {
            id: 'L3',
            name: 'L3',
            startPointId: 'B',
            endPointId: 'C',
          },
        )

        expect(
          getNextLineId(
            document,
          ),
        ).toBe('L2')
      },
    )

    it(
      'preserves references to its endpoint points',
      () => {
        const document =
          createTestDocument()

        const result =
          createLineBetweenPoints(
            document,
            'A',
            'C',
          )

        expect(
          result.document
            .lines.L1
            .startPointId,
        ).toBe('A')

        expect(
          result.document
            .lines.L1
            .endPointId,
        ).toBe('C')
      },
    )

    it(
      'has the correct geometric length',
      () => {
        const document =
          createTestDocument()

        const result =
          createLineBetweenPoints(
            document,
            'A',
            'B',
          )

        expect(
          lineLengthMm(
            result.document
              .lines.L1,
            result.document
              .points,
          ),
        ).toBeCloseTo(100)
      },
    )

    it(
      'supports an explicit line ID and name',
      () => {
        const document =
          createTestDocument()

        const result =
          createLineBetweenPoints(
            document,
            'A',
            'B',
            {
              id: 'SIDE',
              name:
                'Side Seam',
            },
          )

        expect(
          result.lineId,
        ).toBe('SIDE')

        expect(
          result.document
            .lines.SIDE.name,
        ).toBe(
          'Side Seam',
        )
      },
    )

    it(
      'does not mutate the original document',
      () => {
        const document =
          createTestDocument()

        const result =
          createLineBetweenPoints(
            document,
            'A',
            'B',
          )

        expect(
          document.lines.L1,
        ).toBeUndefined()

        expect(
          result.document
            .lines.L1,
        ).toBeDefined()
      },
    )

    it(
      'rejects a line from a point to itself',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          createLineBetweenPoints(
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
          createLineBetweenPoints(
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
          createLineBetweenPoints(
            document,
            'A',
            'missing',
          ),
        ).toThrow()
      },
    )

    it(
      'rejects a duplicate explicit line ID',
      () => {
        let document =
          createTestDocument()

        document =
          createLineBetweenPoints(
            document,
            'A',
            'B',
            {
              id: 'TEST',
            },
          ).document

        expect(() =>
          createLineBetweenPoints(
            document,
            'B',
            'C',
            {
              id: 'TEST',
            },
          ),
        ).toThrow()
      },
    )

    it(
      'rejects an empty automatic ID prefix',
      () => {
        const document =
          createTestDocument()

        expect(() =>
          getNextLineId(
            document,
            '',
          ),
        ).toThrow()
      },
    )
  },
)