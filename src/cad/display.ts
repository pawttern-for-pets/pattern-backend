import {
  fromMm,
  MM_PER_INCH,
} from './units'

export type DisplayUnit = 'cm' | 'in'

export function getGridSpacingMm(
  unit: DisplayUnit,
): number {
  if (unit === 'cm') {
    return 10
  }

  return MM_PER_INCH / 4
}

export function getSnapSpacingMm(
  unit: DisplayUnit,
): number {
  if (unit === 'cm') {
    return 5
  }

  return MM_PER_INCH / 8
}

export function getUnitLabel(
  unit: DisplayUnit,
): string {
  return unit === 'cm' ? 'cm' : 'in'
}

export function formatLength(
  valueMm: number,
  unit: DisplayUnit,
): string {
  if (!Number.isFinite(valueMm)) {
    throw new Error(
      'Length must be a finite number.',
    )
  }

  const converted =
    fromMm(valueMm, unit)

  return `${converted.toFixed(2)} ${getUnitLabel(unit)}`
}