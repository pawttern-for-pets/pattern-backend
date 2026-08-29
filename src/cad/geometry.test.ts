import { describe, expect, it } from 'vitest'
import { distanceMm, isValidPoint, type Point } from './geometry'

describe('PAWTTERN CAD point geometry', () => {
  it('measures a 100 mm horizontal distance', () => {
    const a: Point = {
      id: 'A',
      name: 'A',
      xMm: 0,
      yMm: 0,
    }

    const b: Point = {
      id: 'B',
      name: 'B',
      xMm: 100,
      yMm: 0,
    }

    expect(distanceMm(a, b)).toBe(100)
  })

  it('measures a diagonal distance correctly', () => {
    const a: Point = {
      id: 'A',
      name: 'A',
      xMm: 0,
      yMm: 0,
    }

    const b: Point = {
      id: 'B',
      name: 'B',
      xMm: 30,
      yMm: 40,
    }

    expect(distanceMm(a, b)).toBe(50)
  })

  it('allows negative coordinates', () => {
    const a: Point = {
      id: 'A',
      name: 'A',
      xMm: -50,
      yMm: 0,
    }

    const b: Point = {
      id: 'B',
      name: 'B',
      xMm: 50,
      yMm: 0,
    }

    expect(distanceMm(a, b)).toBe(100)
  })

  it('rejects invalid coordinates', () => {
    const invalidPoint: Point = {
      id: 'A',
      name: 'A',
      xMm: Number.NaN,
      yMm: 0,
    }

    expect(isValidPoint(invalidPoint)).toBe(false)
  })
})