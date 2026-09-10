import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  intersectInfiniteLines,
  offsetLineSegmentOutward,
} from './offsetGeometry'

describe(
  'generic outward offset geometry',
  () => {
    it(
      'offsets a clockwise top edge exactly 10 mm outward',
      () => {
        const result =
          offsetLineSegmentOutward(
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 100,
              yMm: 0,
            },
            'clockwise',
            10,
          )

        expect(
          result,
        ).toEqual({
          start: {
            xMm: 0,
            yMm: -10,
          },

          end: {
            xMm: 100,
            yMm: -10,
          },
        })
      },
    )

    it(
      'offsets a clockwise right edge exactly 10 mm outward',
      () => {
        const result =
          offsetLineSegmentOutward(
            {
              xMm: 100,
              yMm: 0,
            },
            {
              xMm: 100,
              yMm: 100,
            },
            'clockwise',
            10,
          )

        expect(
          result,
        ).toEqual({
          start: {
            xMm: 110,
            yMm: 0,
          },

          end: {
            xMm: 110,
            yMm: 100,
          },
        })
      },
    )

    it(
      'offsets the equivalent counter-clockwise edge toward the same physical outside',
      () => {
        const result =
          offsetLineSegmentOutward(
            {
              xMm: 100,
              yMm: 0,
            },
            {
              xMm: 0,
              yMm: 0,
            },
            'counter-clockwise',
            10,
          )

        expect(
          result,
        ).toEqual({
          start: {
            xMm: 100,
            yMm: -10,
          },

          end: {
            xMm: 0,
            yMm: -10,
          },
        })
      },
    )

    it(
      'keeps a fold-aligned segment unchanged when the requested offset is zero',
      () => {
        const result =
          offsetLineSegmentOutward(
            {
              xMm: 0,
              yMm: 20,
            },
            {
              xMm: 0,
              yMm: 100,
            },
            'clockwise',
            0,
          )

        expect(
          result,
        ).toEqual({
          start: {
            xMm: 0,
            yMm: 20,
          },

          end: {
            xMm: 0,
            yMm: 100,
          },
        })
      },
    )

    it(
      'intersects perpendicular offset lines at their cutting-line corner',
      () => {
        const horizontal =
          offsetLineSegmentOutward(
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 100,
              yMm: 0,
            },
            'clockwise',
            10,
          )

        const vertical =
          offsetLineSegmentOutward(
            {
              xMm: 100,
              yMm: 0,
            },
            {
              xMm: 100,
              yMm: 100,
            },
            'clockwise',
            10,
          )

        expect(
          intersectInfiniteLines(
            horizontal,
            vertical,
          ),
        ).toMatchObject({
          xMm: expect.closeTo(110, 10),
          yMm: expect.closeTo(-10, 10),
        })
      },
    )

    it(
      'returns null when infinite lines are parallel',
      () => {
        expect(
          intersectInfiniteLines(
            {
              start: {
                xMm: 0,
                yMm: 0,
              },
              end: {
                xMm: 100,
                yMm: 0,
              },
            },
            {
              start: {
                xMm: 0,
                yMm: 10,
              },
              end: {
                xMm: 100,
                yMm: 10,
              },
            },
          ),
        ).toBeNull()
      },
    )

    it(
      'does not mutate the original sewing-line coordinates',
      () => {
        const start = {
          xMm: 12,
          yMm: 34,
        }

        const end = {
          xMm: 56,
          yMm: 78,
        }

        const beforeStart =
          JSON.stringify(start)

        const beforeEnd =
          JSON.stringify(end)

        offsetLineSegmentOutward(
          start,
          end,
          'clockwise',
          10,
        )

        expect(
          JSON.stringify(start),
        ).toBe(
          beforeStart,
        )

        expect(
          JSON.stringify(end),
        ).toBe(
          beforeEnd,
        )
      },
    )

    it(
      'rejects invalid offsets and zero-length lines',
      () => {
        expect(() =>
          offsetLineSegmentOutward(
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 10,
              yMm: 0,
            },
            'clockwise',
            -1,
          ),
        ).toThrow(
          /offset distance/i,
        )

        expect(() =>
          offsetLineSegmentOutward(
            {
              xMm: 0,
              yMm: 0,
            },
            {
              xMm: 0,
              yMm: 0,
            },
            'clockwise',
            10,
          ),
        ).toThrow(
          /zero-length/i,
        )

        expect(() =>
          intersectInfiniteLines(
            {
              start: {
                xMm: 1,
                yMm: 1,
              },
              end: {
                xMm: 1,
                yMm: 1,
              },
            },
            {
              start: {
                xMm: 0,
                yMm: 0,
              },
              end: {
                xMm: 10,
                yMm: 0,
              },
            },
          ),
        ).toThrow(
          /zero-length/i,
        )
      },
    )
  },
)