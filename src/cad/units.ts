export type Unit = 'mm' | 'cm' | 'in'

export const MM_PER_CM = 10
export const MM_PER_INCH = 25.4

export function cmToMm(cm: number): number {
  return cm * MM_PER_CM
}

export function mmToCm(mm: number): number {
  return mm / MM_PER_CM
}

export function inchesToMm(inches: number): number {
  return inches * MM_PER_INCH
}

export function mmToInches(mm: number): number {
  return mm / MM_PER_INCH
}

export function toMm(value: number, unit: Unit): number {
  if (unit === 'mm') return value
  if (unit === 'cm') return cmToMm(value)

  return inchesToMm(value)
}

export function fromMm(valueMm: number, unit: Unit): number {
  if (unit === 'mm') return valueMm
  if (unit === 'cm') return mmToCm(valueMm)

  return mmToInches(valueMm)
}