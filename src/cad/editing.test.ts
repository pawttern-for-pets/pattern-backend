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
  deleteSelection,
} from './editing'

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
  'PAWTTERN CAD editing engine',
  () => {
    it(
      'deletes a selected line without deleting its points',
      () => {
        const document =
          createTestDocument()

        const result =
          deleteSelection(
            document,
            {
              kind: 'line',
              id: 'AB',
            },
          )

        expect(
          result.lines.AB,
        ).toBeUndefined()

        expect(
          result.points.A,
        ).toBeDefined()

        expect(
          result.points.B,
        ).toBeDefined()
      },
    )

    it(
      'deletes a selected point and its connected line',
      () => {
        const document =
          createTestDocument()

        const result =
          deleteSelection(
            document,
            {
              kind: 'point',
              id: 'A',
            },
          )

        expect(
          result.points.A,
        ).toBeUndefined()

        expect(
          result.points.B,
        ).toBeDefined()

        expect(
          result.lines.AB,
        ).toBeUndefined()
      },
    )

    it(
      'does nothing when there is no selection',
      () => {
        const document =
          createTestDocument()

        const result =
          deleteSelection(
            document,
            null,
          )

        expect(result).toBe(
          document,
        )
      },
    )

    it(
      'does nothing when the selected point no longer exists',
      () => {
        const document =
          createTestDocument()

        const result =
          deleteSelection(
            document,
            {
              kind: 'point',
              id: 'missing',
            },
          )

        expect(result).toBe(
          document,
        )
      },
    )

    it(
      'does nothing when the selected line no longer exists',
      () => {
        const document =
          createTestDocument()

        const result =
          deleteSelection(
            document,
            {
              kind: 'line',
              id: 'missing',
            },
          )

        expect(result).toBe(
          document,
        )
      },
    )
  },
)