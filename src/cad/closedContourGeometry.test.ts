import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  calculateClosedContourSignedAreaMm2,
  getClosedContourWinding,
  getOutwardUnitNormalForSegment,
} from './closedContourGeometry'

const clockwiseSquare = [
  {
    xMm: 0,
    yMm: 0,
  },
  {
    xMm: 10,
    yMm: 0,
  },
  {
    xMm: 10,
    yMm: 10,
  },
  {
    xMm: 0,
    yMm: 10,
  },
  {
    xMm: 0,
    yMm: 0,
  },
]

const counterClockwiseSquare = [
  {
    xMm: 0,
    yMm: 0,
  },
  {
    xMm: 0,
    yMm: 10,
  },
  {
    xMm: 10,
    yMm: 10,
  },
  {
    xMm: 10,
    yMm: 0,
  },
  {
    xMm: 0,
    yMm: 0,
  },
]

describe(
  'closed contour geometry',
  () => {
    it(
      'calculates positive signed area for a clockwise PAWTTERN contour',
      () => {
        expect(
          calculateClosedContourSignedAreaMm2(
            clockwiseSquare,
          ),
        ).toBeCloseTo(
          100,
          8,
        )
      },
    )

    it(
      'calculates negative signed area for the reversed contour',
      () => {
        expect(
          calculateClosedContourSignedAreaMm2(
            counterClockwiseSquare,
          ),
        ).toBeCloseTo(
          -100,
          8,
        )
      },
    )

    it(
      'identifies clockwise and counter-clockwise winding',
      () => {
        expect(
          getClosedContourWinding(
            clockwiseSquare,
          ),
        ).toBe(
          'clockwise',
        )

        expect(
          getClosedContourWinding(
            counterClockwiseSquare,
          ),
        ).toBe(
          'counter-clockwise',
        )
      },
    )

    it(
      'points outward above the top edge of a clockwise contour',
      () => {
        expect(
          getOutwardUnitNormalForSegment(
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 10,
              yMm: 0,
            },
            'clockwise',
          ),
        ).toEqual({
          xMm: 0,
          yMm: -1,
        })
      },
    )

    it(
      'uses the opposite normal for counter-clockwise traversal',
      () => {
        expect(
          getOutwardUnitNormalForSegment(
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 10,
              yMm: 0,
            },
            'counter-clockwise',
          ),
        ).toEqual({
          xMm: 0,
          yMm: 1,
        })
      },
    )

    it(
      'returns a perpendicular unit normal for diagonal segments',
      () => {
        const normal =
          getOutwardUnitNormalForSegment(
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 3,
              yMm: 4,
            },
            'clockwise',
          )

        expect(
          Math.hypot(
            normal.xMm,
            normal.yMm,
          ),
        ).toBeCloseTo(
          1,
          10,
        )

        expect(
          3 * normal.xMm +
          4 * normal.yMm,
        ).toBeCloseTo(
          0,
          10,
        )
      },
    )

    it(
      'rejects open and non-finite contours',
      () => {
        expect(() =>
          getClosedContourWinding([
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 10,
              yMm: 0,
            },
            {
              xMm: 10,
              yMm: 10,
            },
            {
              xMm: 0,
              yMm: 10,
            },
          ]),
        ).toThrow(
          /starting point/i,
        )

        expect(() =>
          getClosedContourWinding([
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
              xMm: 10,
              yMm: 10,
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

    it(
      'rejects degenerate contours and zero-length normal segments',
      () => {
        expect(() =>
          getClosedContourWinding([
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 10,
              yMm: 0,
            },
            {
              xMm: 20,
              yMm: 0,
            },
            {
              xMm: 0,
              yMm: 0,
            },
          ]),
        ).toThrow(
          /degenerate/i,
        )

        expect(() =>
          getOutwardUnitNormalForSegment(
            {
              xMm: 5,
              yMm: 5,
            },
            {
              xMm: 5,
              yMm: 5,
            },
            'clockwise',
          ),
        ).toThrow(
          /zero-length/i,
        )
      },
    )
  },
)