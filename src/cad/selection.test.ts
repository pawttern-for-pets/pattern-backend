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
  createViewport,
  worldToScreen,
} from './viewport'

import {
  distanceToSegmentPx,
  findSelectionAtScreenPoint,
  screenDistancePx,
} from './selection'

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
  'PAWTTERN CAD selection engine',
  () => {
    it(
      'calculates screen distance',
      () => {
        expect(
          screenDistancePx(
            {
              xPx: 0,
              yPx: 0,
            },
            {
              xPx: 3,
              yPx: 4,
            },
          ),
        ).toBe(5)
      },
    )

    it(
      'calculates distance to a line segment',
      () => {
        expect(
          distanceToSegmentPx(
            {
              xPx: 50,
              yPx: 5,
            },
            {
              xPx: 0,
              yPx: 0,
            },
            {
              xPx: 100,
              yPx: 0,
            },
          ),
        ).toBeCloseTo(5)
      },
    )

    it(
      'selects a point near the cursor',
      () => {
        const document =
          createTestDocument()

        const viewport =
          createViewport(
            1,
            120,
            120,
          )

        const pointA =
          worldToScreen(
            document.points.A,
            viewport,
          )

        expect(
          findSelectionAtScreenPoint(
            document,
            viewport,
            {
              xPx:
                pointA.xPx + 4,
              yPx:
                pointA.yPx + 3,
            },
          ),
        ).toEqual({
          kind: 'point',
          id: 'A',
        })
      },
    )

    it(
      'gives a point priority over its connected line',
      () => {
        const document =
          createTestDocument()

        const viewport =
          createViewport(
            1,
            120,
            120,
          )

        const pointA =
          worldToScreen(
            document.points.A,
            viewport,
          )

        expect(
          findSelectionAtScreenPoint(
            document,
            viewport,
            pointA,
          ),
        ).toEqual({
          kind: 'point',
          id: 'A',
        })
      },
    )

    it(
      'selects a line near its middle',
      () => {
        const document =
          createTestDocument()

        const viewport =
          createViewport(
            1,
            120,
            120,
          )

        const middle =
          worldToScreen(
            {
              xMm: 50,
              yMm: 0,
            },
            viewport,
          )

        expect(
          findSelectionAtScreenPoint(
            document,
            viewport,
            {
              xPx: middle.xPx,
              yPx:
                middle.yPx + 4,
            },
          ),
        ).toEqual({
          kind: 'line',
          id: 'AB',
        })
      },
    )

    it(
      'returns null when clicking empty space',
      () => {
        const document =
          createTestDocument()

        const viewport =
          createViewport(
            1,
            120,
            120,
          )

        expect(
          findSelectionAtScreenPoint(
            document,
            viewport,
            {
              xPx: 800,
              yPx: 600,
            },
          ),
        ).toBeNull()
      },
    )

    it(
      'keeps the click tolerance screen-based at different zoom levels',
      () => {
        const document =
          createTestDocument()

        const zoom100 =
          createViewport(
            1,
            120,
            120,
          )

        const zoom400 =
          createViewport(
            4,
            120,
            120,
          )

        const pointAt100 =
          worldToScreen(
            document.points.A,
            zoom100,
          )

        const pointAt400 =
          worldToScreen(
            document.points.A,
            zoom400,
          )

        expect(
          findSelectionAtScreenPoint(
            document,
            zoom100,
            {
              xPx:
                pointAt100.xPx +
                8,
              yPx:
                pointAt100.yPx,
            },
          ),
        ).toEqual({
          kind: 'point',
          id: 'A',
        })

        expect(
          findSelectionAtScreenPoint(
            document,
            zoom400,
            {
              xPx:
                pointAt400.xPx +
                8,
              yPx:
                pointAt400.yPx,
            },
          ),
        ).toEqual({
          kind: 'point',
          id: 'A',
        })
      },
    )

    it(
      'rejects invalid selection tolerance',
      () => {
        const document =
          createTestDocument()

        const viewport =
          createViewport()

        expect(() =>
          findSelectionAtScreenPoint(
            document,
            viewport,
            {
              xPx: 100,
              yPx: 100,
            },
            {
              pointPx: -1,
              linePx: 6,
            },
          ),
        ).toThrow()
      },
    )
  },
)