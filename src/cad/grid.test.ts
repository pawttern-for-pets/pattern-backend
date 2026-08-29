import { describe, expect, it } from 'vitest'
import {
  getGridPositionsMm,
  getVisibleWorldBounds,
} from './grid'
import { createViewport } from './viewport'

describe('PAWTTERN CAD grid mathematics', () => {
  it('calculates visible world bounds', () => {
    const viewport = createViewport(
      1,
      0,
      0,
      1,
    )

    const bounds = getVisibleWorldBounds(
      viewport,
      100,
      50,
    )

    expect(bounds.minXMm).toBeCloseTo(0)
    expect(bounds.maxXMm).toBeCloseTo(100)
    expect(bounds.minYMm).toBeCloseTo(0)
    expect(bounds.maxYMm).toBeCloseTo(50)
  })

  it('accounts for pan correctly', () => {
    const viewport = createViewport(
      1,
      20,
      10,
      1,
    )

    const bounds = getVisibleWorldBounds(
      viewport,
      100,
      50,
    )

    expect(bounds.minXMm).toBeCloseTo(-20)
    expect(bounds.maxXMm).toBeCloseTo(80)

    expect(bounds.minYMm).toBeCloseTo(-10)
    expect(bounds.maxYMm).toBeCloseTo(40)
  })

  it('accounts for zoom correctly', () => {
    const viewport = createViewport(
      2,
      0,
      0,
      1,
    )

    const bounds = getVisibleWorldBounds(
      viewport,
      100,
      50,
    )

    expect(bounds.maxXMm).toBeCloseTo(50)
    expect(bounds.maxYMm).toBeCloseTo(25)
  })

  it('creates 10 mm metric grid positions', () => {
    const positions = getGridPositionsMm(
      -20,
      20,
      10,
    )

    expect(positions).toEqual([
      -20,
      -10,
      0,
      10,
      20,
    ])
  })

  it('supports quarter-inch grid spacing', () => {
    const quarterInchMm = 6.35

    const positions = getGridPositionsMm(
      0,
      25.4,
      quarterInchMm,
    )

    expect(positions).toHaveLength(5)

    expect(positions[0]).toBeCloseTo(0)
    expect(positions[1]).toBeCloseTo(6.35)
    expect(positions[2]).toBeCloseTo(12.7)
    expect(positions[3]).toBeCloseTo(19.05)
    expect(positions[4]).toBeCloseTo(25.4)
  })

  it('rejects invalid grid spacing', () => {
    expect(() =>
      getGridPositionsMm(0, 100, 0),
    ).toThrow()

    expect(() =>
      getGridPositionsMm(0, 100, -10),
    ).toThrow()

    expect(() =>
      getGridPositionsMm(
        0,
        100,
        Number.NaN,
      ),
    ).toThrow()
  })

  it('protects against excessive grid lines', () => {
    expect(() =>
      getGridPositionsMm(
        0,
        100000,
        1,
        5000,
      ),
    ).toThrow()
  })
})