import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  screenToWorld,
  worldToScreen,
  createViewport,
} from './viewport'

import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampZoom,
  zoomViewportAtScreenPoint,
} from './zoom'

describe(
  'PAWTTERN CAD zoom mathematics',
  () => {
    it(
      'keeps the world position under the mouse while zooming',
      () => {
        const viewport =
          createViewport(
            1,
            120,
            120,
          )

        const anchor = {
          xPx: 500,
          yPx: 300,
        }

        const before =
          screenToWorld(
            anchor,
            viewport,
          )

        const zoomed =
          zoomViewportAtScreenPoint(
            viewport,
            anchor,
            2,
          )

        const after =
          screenToWorld(
            anchor,
            zoomed,
          )

        expect(
          after.xMm,
        ).toBeCloseTo(
          before.xMm,
        )

        expect(
          after.yMm,
        ).toBeCloseTo(
          before.yMm,
        )
      },
    )

    it(
      'does not change real pattern coordinates',
      () => {
        const point = {
          xMm: 100,
          yMm: 50,
        }

        const viewport =
          createViewport()

        const zoomed =
          zoomViewportAtScreenPoint(
            viewport,
            {
              xPx: 300,
              yPx: 200,
            },
            2,
          )

        worldToScreen(
          point,
          zoomed,
        )

        expect(
          point.xMm,
        ).toBe(100)

        expect(
          point.yMm,
        ).toBe(50)
      },
    )

    it(
      'clamps zoom below the minimum',
      () => {
        expect(
          clampZoom(0.001),
        ).toBe(MIN_ZOOM)
      },
    )

    it(
      'clamps zoom above the maximum',
      () => {
        expect(
          clampZoom(100),
        ).toBe(MAX_ZOOM)
      },
    )

    it(
      'rejects invalid zoom values',
      () => {
        expect(() =>
          clampZoom(
            Number.NaN,
          ),
        ).toThrow()

        expect(() =>
          clampZoom(
            Number.POSITIVE_INFINITY,
          ),
        ).toThrow()
      },
    )
  },
)