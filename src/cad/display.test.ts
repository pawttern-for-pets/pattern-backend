import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  formatLength,
  getGridSpacingMm,
  getSnapSpacingMm,
  getUnitLabel,
} from './display'

describe(
  'PAWTTERN CAD display units',
  () => {
    it(
      'uses a 10 mm grid in centimeter mode',
      () => {
        expect(
          getGridSpacingMm('cm'),
        ).toBe(10)
      },
    )

    it(
      'uses a quarter-inch grid in inch mode',
      () => {
        expect(
          getGridSpacingMm('in'),
        ).toBeCloseTo(6.35)
      },
    )

    it(
      'uses correct default snap spacing',
      () => {
        expect(
          getSnapSpacingMm('cm'),
        ).toBe(5)

        expect(
          getSnapSpacingMm('in'),
        ).toBeCloseTo(3.175)
      },
    )

    it(
      'formats the same 100 mm length correctly',
      () => {
        expect(
          formatLength(100, 'cm'),
        ).toBe('10.00 cm')

        expect(
          formatLength(100, 'in'),
        ).toBe('3.94 in')
      },
    )

    it(
      'returns the correct unit label',
      () => {
        expect(
          getUnitLabel('cm'),
        ).toBe('cm')

        expect(
          getUnitLabel('in'),
        ).toBe('in')
      },
    )
  },
)