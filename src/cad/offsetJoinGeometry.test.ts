import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  resolveOffsetSegmentJoin,
} from './offsetJoinGeometry'

describe(
  'offset join geometry',
  () => {
    it(
      'keeps consecutive collinear fold segments continuous',
      () => {
        const result =
          resolveOffsetSegmentJoin(
            {
              start: {
                xMm: 0,
                yMm: 100,
              },

              end: {
                xMm: 0,
                yMm: 50,
              },
            },

            {
              start: {
                xMm: 0,
                yMm: 50,
              },

              end: {
                xMm: 0,
                yMm: 0,
              },
            },

            {
              xMm: 0,
              yMm: 50,
            },
          )

        expect(
          result,
        ).toEqual({
          kind:
            'continuous',

          points: [
            {
              xMm: 0,
              yMm: 50,
            },
          ],
        })
      },
    )

    it(
      'creates an ordinary 90 degree miter',
      () => {
        const result =
          resolveOffsetSegmentJoin(
            {
              start: {
                xMm: 0,
                yMm: -10,
              },

              end: {
                xMm: 100,
                yMm: -10,
              },
            },

            {
              start: {
                xMm: 110,
                yMm: 0,
              },

              end: {
                xMm: 110,
                yMm: 100,
              },
            },

            {
              xMm: 100,
              yMm: 0,
            },
          )

        expect(
          result.kind,
        ).toBe(
          'miter',
        )

        expect(
          result.points,
        ).toHaveLength(1)

        expect(
          result.points[0].xMm,
        ).toBeCloseTo(
          110,
          10,
        )

        expect(
          result.points[0].yMm,
        ).toBeCloseTo(
          -10,
          10,
        )
      },
    )

    it(
      'uses a bevel for separated parallel offset lines',
      () => {
        const result =
          resolveOffsetSegmentJoin(
            {
              start: {
                xMm: 0,
                yMm: -10,
              },

              end: {
                xMm: 100,
                yMm: -10,
              },
            },

            {
              start: {
                xMm: 100,
                yMm: -5,
              },

              end: {
                xMm: 200,
                yMm: -5,
              },
            },

            {
              xMm: 100,
              yMm: 0,
            },
          )

        expect(
          result,
        ).toEqual({
          kind:
            'bevel',

          points: [
            {
              xMm: 100,
              yMm: -10,
            },

            {
              xMm: 100,
              yMm: -5,
            },
          ],
        })
      },
    )

    it(
      'rejects a near-parallel miter spike and safely uses a bevel',
      () => {
        const result =
          resolveOffsetSegmentJoin(
            {
              start: {
                xMm: 0,
                yMm: -10,
              },

              end: {
                xMm: 100,
                yMm: -10,
              },
            },

            {
              start: {
                xMm: 100,
                yMm: -9.9,
              },

              end: {
                xMm: 200,
                yMm: -9.8,
              },
            },

            {
              xMm: 100,
              yMm: 0,
            },
          )

        expect(
          result.kind,
        ).toBe(
          'bevel',
        )

        expect(
          result.points,
        ).toEqual([
          {
            xMm: 100,
            yMm: -10,
          },

          {
            xMm: 100,
            yMm: -9.9,
          },
        ])
      },
    )

    it(
      'allows the miter safety limit to be made stricter',
      () => {
        const result =
          resolveOffsetSegmentJoin(
            {
              start: {
                xMm: 0,
                yMm: -10,
              },

              end: {
                xMm: 100,
                yMm: -10,
              },
            },

            {
              start: {
                xMm: 110,
                yMm: 0,
              },

              end: {
                xMm: 110,
                yMm: 100,
              },
            },

            {
              xMm: 100,
              yMm: 0,
            },

            1.2,
          )

        expect(
          result.kind,
        ).toBe(
          'bevel',
        )
      },
    )

    it(
      'does not mutate input geometry',
      () => {
        const previous = {
          start: {
            xMm: 0,
            yMm: -10,
          },

          end: {
            xMm: 100,
            yMm: -10,
          },
        }

        const current = {
          start: {
            xMm: 110,
            yMm: 0,
          },

          end: {
            xMm: 110,
            yMm: 100,
          },
        }

        const vertex = {
          xMm: 100,
          yMm: 0,
        }

        const before =
          JSON.stringify({
            previous,
            current,
            vertex,
          })

        resolveOffsetSegmentJoin(
          previous,
          current,
          vertex,
        )

        expect(
          JSON.stringify({
            previous,
            current,
            vertex,
          }),
        ).toBe(
          before,
        )
      },
    )

    it(
      'rejects invalid miter limits',
      () => {
        expect(() =>
          resolveOffsetSegmentJoin(
            {
              start: {
                xMm: 0,
                yMm: -10,
              },

              end: {
                xMm: 100,
                yMm: -10,
              },
            },

            {
              start: {
                xMm: 110,
                yMm: 0,
              },

              end: {
                xMm: 110,
                yMm: 100,
              },
            },

            {
              xMm: 100,
              yMm: 0,
            },

            0.5,
          ),
        ).toThrow(
          /miter limit/i,
        )
      },
    )

    it(
      'rejects zero-length segments',
      () => {
        expect(() =>
          resolveOffsetSegmentJoin(
            {
              start: {
                xMm: 10,
                yMm: 10,
              },

              end: {
                xMm: 10,
                yMm: 10,
              },
            },

            {
              start: {
                xMm: 20,
                yMm: 20,
              },

              end: {
                xMm: 30,
                yMm: 20,
              },
            },

            {
              xMm: 10,
              yMm: 20,
            },
          ),
        ).toThrow(
          /zero-length/i,
        )
      },
    )
  },
)