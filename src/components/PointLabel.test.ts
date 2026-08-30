import {
  describe,
  expect,
  it,
} from 'vitest'

/*
 * PointLabel rendering itself is kept
 * deliberately simple and visually
 * inspected in the browser.
 *
 * This file exists only as a smoke
 * import so build/test catches module
 * resolution errors.
 */
import {
  PointLabel,
} from './PointLabel'

describe(
  'PAWTTERN point label component',
  () => {
    it(
      'exports the label renderer',
      () => {
        expect(
          typeof PointLabel,
        ).toBe('function')
      },
    )
  },
)
