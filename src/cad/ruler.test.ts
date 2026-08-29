import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  getRulerTicks,
} from './ruler'

describe(
  'PAWTTERN CAD ruler mathematics',
  () => {
    it('creates metric ruler ticks', () => {
      const ticks =
        getRulerTicks(0, 20, 'cm')

      expect(ticks).toHaveLength(21)

      const major =
        ticks.filter(
          (tick) =>
            tick.kind === 'major',
        )

      expect(
        major.map(
          (tick) => tick.positionMm,
        ),
      ).toEqual([
        0,
        10,
        20,
      ])

      expect(
        major.map(
          (tick) => tick.label,
        ),
      ).toEqual([
        '0',
        '1',
        '2',
      ])
    })

    it(
      'creates 5 mm medium metric ticks',
      () => {
        const ticks =
          getRulerTicks(0, 10, 'cm')

        const medium =
          ticks.filter(
            (tick) =>
              tick.kind === 'medium',
          )

        expect(
          medium.map(
            (tick) => tick.positionMm,
          ),
        ).toEqual([5])
      },
    )

    it(
      'supports negative metric positions',
      () => {
        const ticks =
          getRulerTicks(
            -10,
            10,
            'cm',
          )

        const major =
          ticks.filter(
            (tick) =>
              tick.kind === 'major',
          )

        expect(
          major.map(
            (tick) => tick.label,
          ),
        ).toEqual([
          '-1',
          '0',
          '1',
        ])
      },
    )

    it(
      'creates eighth-inch ruler ticks',
      () => {
        const ticks =
          getRulerTicks(
            0,
            25.4,
            'in',
          )

        expect(ticks).toHaveLength(9)
        expect(ticks[0].kind)
          .toBe('major')
        expect(ticks[4].kind)
          .toBe('medium')
        expect(ticks[8].kind)
          .toBe('major')
      },
    )

    it(
      'labels whole inches correctly',
      () => {
        const ticks =
          getRulerTicks(
            0,
            50.8,
            'in',
          )

        const major =
          ticks.filter(
            (tick) =>
              tick.kind === 'major',
          )

        expect(
          major.map(
            (tick) => tick.label,
          ),
        ).toEqual([
          '0',
          '1',
          '2',
        ])
      },
    )

    it(
      'protects against excessive tick counts',
      () => {
        expect(() =>
          getRulerTicks(
            0,
            100000,
            'cm',
            5000,
          ),
        ).toThrow()
      },
    )
  },
)