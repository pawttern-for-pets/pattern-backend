import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createViewport,
  worldToScreen,
} from './viewport'

import {
  panViewportByScreenDelta,
} from './pan'

describe(
  'PAWTTERN CAD pan mathematics',
  () => {
    it(
      'moves the viewport by the requested screen delta',
      () => {
        const viewport =
          createViewport(
            1,
            120,
            120,
          )

        const panned =
          panViewportByScreenDelta(
            viewport,
            50,
            -25,
          )

        expect(
          panned.panXPx,
        ).toBe(170)

        expect(
          panned.panYPx,
        ).toBe(95)
      },
    )

    it(
      'moves displayed geometry without changing world coordinates',
      () => {
        const point = {
          xMm: 100,
          yMm: 50,
        }

        const viewport =
          createViewport(
            1,
            120,
            120,
          )

        const before =
          worldToScreen(
            point,
            viewport,
          )

        const panned =
          panViewportByScreenDelta(
            viewport,
            40,
            30,
          )

        const after =
          worldToScreen(
            point,
            panned,
          )

        expect(
          after.xPx -
            before.xPx,
        ).toBeCloseTo(40)

        expect(
          after.yPx -
            before.yPx,
        ).toBeCloseTo(30)

        expect(
          point.xMm,
        ).toBe(100)

        expect(
          point.yMm,
        ).toBe(50)
      },
    )

    it(
      'allows negative pan movement',
      () => {
        const viewport =
          createViewport(
            1,
            120,
            120,
          )

        const panned =
          panViewportByScreenDelta(
            viewport,
            -200,
            -150,
          )

        expect(
          panned.panXPx,
        ).toBe(-80)

        expect(
          panned.panYPx,
        ).toBe(-30)
      },
    )

    it(
      'rejects invalid pan values',
      () => {
        const viewport =
          createViewport()

        expect(() =>
          panViewportByScreenDelta(
            viewport,
            Number.NaN,
            10,
          ),
        ).toThrow()

        expect(() =>
          panViewportByScreenDelta(
            viewport,
            10,
            Number.POSITIVE_INFINITY,
          ),
        ).toThrow()
      },
    )
  },
)