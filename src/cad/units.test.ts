import { describe, expect, it } from 'vitest'
import {
  cmToMm,
  mmToCm,
  inchesToMm,
  mmToInches,
  toMm,
  fromMm,
} from './units'

describe('PAWTTERN CAD unit conversions', () => {
  it('converts millimeters and centimeters correctly', () => {
    expect(mmToCm(10)).toBe(1)
    expect(cmToMm(10)).toBe(100)
  })

  it('converts millimeters and inches correctly', () => {
    expect(inchesToMm(1)).toBe(25.4)
    expect(mmToInches(25.4)).toBeCloseTo(1)
  })

  it('converts 254 mm to 10 inches', () => {
    expect(mmToInches(254)).toBeCloseTo(10)
  })

  it('keeps the same physical size when changing display units', () => {
    const storedMm = toMm(10, 'cm')

    expect(storedMm).toBe(100)
    expect(fromMm(storedMm, 'cm')).toBe(10)
    expect(fromMm(storedMm, 'in')).toBeCloseTo(3.937007874)
  })
})