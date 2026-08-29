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
} from './document'

import {
  deleteSelection,
} from './editing'

import {
  evaluateCubicBezier,
} from './bezier'

import {
  resolveCubicBezierGeometry,
} from './curves'

import {
  findSelectionAtScreenPoint,
} from './selection'

import {
  createViewport,
  worldToScreen,
} from './viewport'

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

  document = addCurve(
    document,
    {
      id: 'C1',
      name: 'C1',

      startPointId: 'A',
      endPointId: 'B',

      control1: {
        xMm: 0,
        yMm: 100,
      },

      control2: {
        xMm: 100,
        yMm: 100,
      },
    },
  )

  return document
}

describe(
  'PAWTTERN CAD curve selection and editing',
  () => {
    it(
      'selects a curve near its visible path',
      () => {
        const document =
          createTestDocument()

        const viewport =
          createViewport(
            1,
            120,
            120,
          )

        const geometry =
          resolveCubicBezierGeometry(
            document.curves.C1,
            document.points,
          )

        const midpoint =
          evaluateCubicBezier(
            geometry,
            0.5,
          )

        const screen =
          worldToScreen(
            midpoint,
            viewport,
          )

        const selection =
          findSelectionAtScreenPoint(
            document,
            viewport,
            screen,
          )

        expect(
          selection,
        ).toEqual({
          kind: 'curve',
          id: 'C1',
        })
      },
    )

    it(
      'keeps point selection priority at a curve endpoint',
      () => {
        const document =
          createTestDocument()

        const viewport =
          createViewport(
            1,
            120,
            120,
          )

        const screen =
          worldToScreen(
            document.points.A,
            viewport,
          )

        const selection =
          findSelectionAtScreenPoint(
            document,
            viewport,
            screen,
          )

        expect(
          selection,
        ).toEqual({
          kind: 'point',
          id: 'A',
        })
      },
    )

    it(
      'deletes a selected curve without deleting its points or line',
      () => {
        const document =
          createTestDocument()

        const result =
          deleteSelection(
            document,
            {
              kind: 'curve',
              id: 'C1',
            },
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
      'deleting a selected endpoint point removes its dependent curve and line',
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
  },
)