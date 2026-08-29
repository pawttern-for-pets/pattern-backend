import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  getRulerLabelEveryMajor,
  shouldShowRulerLabel,
} from './rulerDisplay'

import {
  DEFAULT_PX_PER_MM,
} from './viewport'

describe(
  'adaptive ruler labels',
  () => {
    it(
      'shows every centimeter label at normal metric zoom',
      () => {
        expect(
          getRulerLabelEveryMajor(
            'cm',
            DEFAULT_PX_PER_MM,
          ),
        ).toBe(1)
      },
    )

    it(
      'reduces metric labels when zoomed far out',
      () => {
        const scale =
          DEFAULT_PX_PER_MM *
          0.35

        expect(
          getRulerLabelEveryMajor(
            'cm',
            scale,
          ),
        ).toBe(5)
      },
    )

    it(
      'shows every inch label at normal imperial zoom',
      () => {
        expect(
          getRulerLabelEveryMajor(
            'in',
            DEFAULT_PX_PER_MM,
          ),
        ).toBe(1)
      },
    )

    it(
      'reduces imperial labels when zoomed far out',
      () => {
        const scale =
          DEFAULT_PX_PER_MM *
          0.1

        expect(
          getRulerLabelEveryMajor(
            'in',
            scale,
          ),
        ).toBe(5)
      },
    )

    it(
      'shows labels at correct positive and negative intervals',
      () => {
        expect(
          shouldShowRulerLabel(
            0,
            'cm',
            5,
          ),
        ).toBe(true)

        expect(
          shouldShowRulerLabel(
            50,
            'cm',
            5,
          ),
        ).toBe(true)

        expect(
          shouldShowRulerLabel(
            -50,
            'cm',
            5,
          ),
        ).toBe(true)

        expect(
          shouldShowRulerLabel(
            10,
            'cm',
            5,
          ),
        ).toBe(false)
      },
    )

    it(
      'rejects invalid ruler display settings',
      () => {
        expect(() =>
          getRulerLabelEveryMajor(
            'cm',
            0,
          ),
        ).toThrow()

        expect(() =>
          shouldShowRulerLabel(
            0,
            'cm',
            0,
          ),
        ).toThrow()
      },
    )
  },
)