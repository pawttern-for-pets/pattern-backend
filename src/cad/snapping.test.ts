import { describe, expect, it } from 'vitest'
import type { Point } from './geometry'
import { snapPoint, snapValueMm } from './snapping'

describe('PAWTTERN CAD snapping', () => {
  it('snaps to the nearest 10 mm', () => {
    expect(snapValueMm(53, 10)).toBe(50)
    expect(snapValueMm(56, 10)).toBe(60)
  })

  it('snaps negative coordinates correctly', () => {
    expect(snapValueMm(-53, 10)).toBe(-50)
    expect(snapValueMm(-56, 10)).toBe(-60)
  })

  it('handles exact halfway positions consistently', () => {
    expect(snapValueMm(55, 10)).toBe(60)
    expect(snapValueMm(-55, 10)).toBe(-60)
  })

  it('snaps both coordinates of a point', () => {
    const point: Point = {
      id: 'A',
      name: 'A',
      xMm: 53,
      yMm: 26,
    }

    const snapped = snapPoint(point, 10)

    expect(snapped.xMm).toBe(50)
    expect(snapped.yMm).toBe(30)
  })

  it('supports imperial-derived snap spacing', () => {
    const oneEighthInchMm = 3.175

    expect(
      snapValueMm(6.2, oneEighthInchMm),
    ).toBeCloseTo(6.35)
  })

  it('rejects invalid snap spacing', () => {
    expect(() => snapValueMm(50, 0)).toThrow()
    expect(() => snapValueMm(50, -10)).toThrow()
    expect(() => snapValueMm(50, Number.NaN)).toThrow()
  })
})