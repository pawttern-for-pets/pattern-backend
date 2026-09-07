import { describe, expect, it } from 'vitest'
import {
  isValidCubicBezierCurve,
  type CubicBezierCurve,
} from './curves'
import type { PointMap } from './lines'

describe('PAWTTERN CAD cubic Bezier curves', () => {
  it('validates optional geometry roles', () => {
    const points: PointMap = {
      A: { id: 'A', name: 'A', xMm: 0, yMm: 0 },
      B: { id: 'B', name: 'B', xMm: 100, yMm: 0 },
    }

    const legacyCurve: CubicBezierCurve = {
      id: 'C1',
      name: 'C1',
      startPointId: 'A',
      endPointId: 'B',
      control1: { xMm: 25, yMm: 20 },
      control2: { xMm: 75, yMm: 20 },
    }

    expect(isValidCubicBezierCurve(legacyCurve, points)).toBe(true)
    expect(isValidCubicBezierCurve({ ...legacyCurve, role: 'boundary' }, points)).toBe(true)
    expect(isValidCubicBezierCurve({ ...legacyCurve, role: 'construction' }, points)).toBe(true)

    const invalidCurve = {
      ...legacyCurve,
      role: 'banana',
    } as unknown as CubicBezierCurve

    expect(isValidCubicBezierCurve(invalidCurve, points)).toBe(false)
  })
})