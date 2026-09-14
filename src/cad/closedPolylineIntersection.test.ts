import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  closedPolylineHasSelfIntersection,
  findClosedPolylineSelfIntersections,
} from './closedPolylineIntersection'

describe(
  'closed polyline self-intersection',
  () => {
    it(
      'accepts a simple closed square',
      () => {
        const points = [
          {
            xMm: 0,
            yMm: 0,
          },
          {
            xMm: 100,
            yMm: 0,
          },
          {
            xMm: 100,
            yMm: 100,
          },
          {
            xMm: 0,
            yMm: 100,
          },
          {
            xMm: 0,
            yMm: 0,
          },
        ]

        expect(
          closedPolylineHasSelfIntersection(
            points,
          ),
        ).toBe(false)

        expect(
          findClosedPolylineSelfIntersections(
            points,
          ),
        ).toEqual([])
      },
    )

    it(
      'detects a bow-tie crossing',
      () => {
        const points = [
          {
            xMm: 0,
            yMm: 0,
          },
          {
            xMm: 100,
            yMm: 100,
          },
          {
            xMm: 0,
            yMm: 100,
          },
          {
            xMm: 100,
            yMm: 0,
          },
          {
            xMm: 0,
            yMm: 0,
          },
        ]

        expect(
          closedPolylineHasSelfIntersection(
            points,
          ),
        ).toBe(true)

        expect(
          findClosedPolylineSelfIntersections(
            points,
          ),
        ).toEqual([
          {
            firstSegmentIndex:
              0,

            secondSegmentIndex:
              2,
          },
        ])
      },
    )

    it(
      'ignores normal intersections between adjacent segments',
      () => {
        const points = [
          {
            xMm: 0,
            yMm: 0,
          },
          {
            xMm: 50,
            yMm: 0,
          },
          {
            xMm: 100,
            yMm: 50,
          },
          {
            xMm: 50,
            yMm: 100,
          },
          {
            xMm: 0,
            yMm: 50,
          },
          {
            xMm: 0,
            yMm: 0,
          },
        ]

        expect(
          closedPolylineHasSelfIntersection(
            points,
          ),
        ).toBe(false)
      },
    )

    it(
      'detects a non-adjacent segment touching another segment',
      () => {
        const points = [
          {
            xMm: 0,
            yMm: 0,
          },
          {
            xMm: 100,
            yMm: 0,
          },
          {
            xMm: 50,
            yMm: 50,
          },
          {
            xMm: 100,
            yMm: 100,
          },
          {
            xMm: 0,
            yMm: 100,
          },
          {
            xMm: 50,
            yMm: 0,
          },
          {
            xMm: 0,
            yMm: 0,
          },
        ]

        expect(
          closedPolylineHasSelfIntersection(
            points,
          ),
        ).toBe(true)
      },
    )

    it(
      'detects overlapping non-adjacent collinear segments',
      () => {
        const points = [
          {
            xMm: 0,
            yMm: 0,
          },
          {
            xMm: 100,
            yMm: 0,
          },
          {
            xMm: 100,
            yMm: 100,
          },
          {
            xMm: 25,
            yMm: 100,
          },
          {
            xMm: 75,
            yMm: 100,
          },
          {
            xMm: 0,
            yMm: 100,
          },
          {
            xMm: 0,
            yMm: 0,
          },
        ]

        expect(
          closedPolylineHasSelfIntersection(
            points,
          ),
        ).toBe(true)
      },
    )

    it(
      'rejects an open polyline',
      () => {
        expect(() =>
          closedPolylineHasSelfIntersection([
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 100,
              yMm: 0,
            },
            {
              xMm: 100,
              yMm: 100,
            },
            {
              xMm: 0,
              yMm: 100,
            },
          ]),
        ).toThrow(
          /repeat its first point/i,
        )
      },
    )

    it(
      'rejects zero-length segments',
      () => {
        expect(() =>
          closedPolylineHasSelfIntersection([
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 100,
              yMm: 0,
            },
            {
              xMm: 100,
              yMm: 0,
            },
            {
              xMm: 0,
              yMm: 100,
            },
            {
              xMm: 0,
              yMm: 0,
            },
          ]),
        ).toThrow(
          /zero-length/i,
        )
      },
    )

    it(
      'rejects non-finite coordinates',
      () => {
        expect(() =>
          closedPolylineHasSelfIntersection([
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm:
                Number.NaN,
              yMm: 0,
            },
            {
              xMm: 100,
              yMm: 100,
            },
            {
              xMm: 0,
              yMm: 0,
            },
          ]),
        ).toThrow(
          /finite/i,
        )
      },
    )
  },
)