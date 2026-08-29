import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  displayCoordinatesToWorld,
  worldCoordinatesToDisplay,
} from './coordinateInput'

describe(
  'PAWTTERN CAD exact coordinate input',
  () => {
    it(
      'converts centimeters to internal millimeters',
      () => {
        const result =
          displayCoordinatesToWorld(
            {
              x: 12.35,
              y: 4.2,
            },
            'cm',
          )

        expect(
          result.xMm,
        ).toBeCloseTo(123.5)

        expect(
          result.yMm,
        ).toBeCloseTo(42)
      },
    )

    it(
      'converts inches to internal millimeters',
      () => {
        const result =
          displayCoordinatesToWorld(
            {
              x: 1,
              y: 2.5,
            },
            'in',
          )

        expect(
          result.xMm,
        ).toBeCloseTo(25.4)

        expect(
          result.yMm,
        ).toBeCloseTo(63.5)
      },
    )

    it(
      'converts internal millimeters to centimeters',
      () => {
        const result =
          worldCoordinatesToDisplay(
            {
              xMm: 123.5,
              yMm: 42,
            },
            'cm',
          )

        expect(
          result.x,
        ).toBeCloseTo(12.35)

        expect(
          result.y,
        ).toBeCloseTo(4.2)
      },
    )

    it(
      'converts internal millimeters to inches',
      () => {
        const result =
          worldCoordinatesToDisplay(
            {
              xMm: 25.4,
              yMm: 63.5,
            },
            'in',
          )

        expect(
          result.x,
        ).toBeCloseTo(1)

        expect(
          result.y,
        ).toBeCloseTo(2.5)
      },
    )

    it(
      'supports negative coordinates',
      () => {
        const result =
          displayCoordinatesToWorld(
            {
              x: -2.5,
              y: -1.25,
            },
            'cm',
          )

        expect(
          result.xMm,
        ).toBeCloseTo(-25)

        expect(
          result.yMm,
        ).toBeCloseTo(-12.5)
      },
    )

    it(
      'round trips metric coordinates without changing geometry',
      () => {
        const original = {
          xMm: 137.25,
          yMm: -48.5,
        }

        const displayed =
          worldCoordinatesToDisplay(
            original,
            'cm',
          )

        const restored =
          displayCoordinatesToWorld(
            displayed,
            'cm',
          )

        expect(
          restored.xMm,
        ).toBeCloseTo(
          original.xMm,
        )

        expect(
          restored.yMm,
        ).toBeCloseTo(
          original.yMm,
        )
      },
    )

    it(
      'round trips imperial coordinates without changing geometry',
      () => {
        const original = {
          xMm: 254,
          yMm: -127,
        }

        const displayed =
          worldCoordinatesToDisplay(
            original,
            'in',
          )

        const restored =
          displayCoordinatesToWorld(
            displayed,
            'in',
          )

        expect(
          restored.xMm,
        ).toBeCloseTo(
          original.xMm,
        )

        expect(
          restored.yMm,
        ).toBeCloseTo(
          original.yMm,
        )
      },
    )

    it(
      'rejects invalid display coordinates',
      () => {
        expect(() =>
          displayCoordinatesToWorld(
            {
              x: Number.NaN,
              y: 0,
            },
            'cm',
          ),
        ).toThrow()

        expect(() =>
          displayCoordinatesToWorld(
            {
              x: 0,
              y:
                Number.POSITIVE_INFINITY,
            },
            'cm',
          ),
        ).toThrow()
      },
    )

    it(
      'rejects invalid world coordinates',
      () => {
        expect(() =>
          worldCoordinatesToDisplay(
            {
              xMm:
                Number.NaN,
              yMm: 0,
            },
            'cm',
          ),
        ).toThrow()
      },
    )
  },
)