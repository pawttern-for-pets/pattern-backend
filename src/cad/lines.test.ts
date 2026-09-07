import { describe, expect, it } from 'vitest'
import type { Point } from './geometry'
import {
  isValidLine,
  lineLengthMm,
  type Line,
  type PointMap,
} from './lines'

describe('PAWTTERN CAD referenced lines', () => {
  it('measures a line using its referenced points', () => {
    const points: PointMap = {
      A: {
        id: 'A',
        name: 'A',
        xMm: 0,
        yMm: 0,
      },
      B: {
        id: 'B',
        name: 'B',
        xMm: 100,
        yMm: 0,
      },
    }

    const line: Line = {
      id: 'AB',
      name: 'AB',
      startPointId: 'A',
      endPointId: 'B',
    }

    expect(lineLengthMm(line, points)).toBe(100)
  })

  it('automatically changes length when a referenced point moves', () => {
    const points: PointMap = {
      A: {
        id: 'A',
        name: 'A',
        xMm: 0,
        yMm: 0,
      },
      B: {
        id: 'B',
        name: 'B',
        xMm: 100,
        yMm: 0,
      },
    }

    const line: Line = {
      id: 'AB',
      name: 'AB',
      startPointId: 'A',
      endPointId: 'B',
    }

    expect(lineLengthMm(line, points)).toBe(100)

    points.B.xMm = 150

    expect(lineLengthMm(line, points)).toBe(150)
  })

  it('rejects a line with a missing point', () => {
    const points: PointMap = {
      A: {
        id: 'A',
        name: 'A',
        xMm: 0,
        yMm: 0,
      },
    }

    const line: Line = {
      id: 'AB',
      name: 'AB',
      startPointId: 'A',
      endPointId: 'B',
    }

    expect(isValidLine(line, points)).toBe(false)
    expect(() => lineLengthMm(line, points)).toThrow()
  })

  it('rejects a line that starts and ends on the same point', () => {
    const pointA: Point = {
      id: 'A',
      name: 'A',
      xMm: 0,
      yMm: 0,
    }

    const points: PointMap = {
      A: pointA,
    }

    const line: Line = {
      id: 'AA',
      name: 'AA',
      startPointId: 'A',
      endPointId: 'A',
    }

    expect(isValidLine(line, points)).toBe(false)
  })

  it('validates optional geometry roles', () => {
    const points: PointMap = {
      A: { id: 'A', name: 'A', xMm: 0, yMm: 0 },
      B: { id: 'B', name: 'B', xMm: 100, yMm: 0 },
    }

    const legacyLine: Line = {
      id: 'AB',
      name: 'AB',
      startPointId: 'A',
      endPointId: 'B',
    }

    expect(isValidLine(legacyLine, points)).toBe(true)
    expect(isValidLine({ ...legacyLine, role: 'boundary' }, points)).toBe(true)
    expect(isValidLine({ ...legacyLine, role: 'construction' }, points)).toBe(true)

    const invalidLine = {
      ...legacyLine,
      role: 'banana',
    } as unknown as Line

    expect(isValidLine(invalidLine, points)).toBe(false)
  })
})
