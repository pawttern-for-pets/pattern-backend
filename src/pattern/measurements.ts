import {
  cmToMm,
  mmToCm,
} from '../cad/units'

export interface BodyMeasurements {
  /*
   * Canonical internal values.
   *
   * NEVER store cm or inches here.
   * The pattern engine always works
   * in physical millimeters.
   */

  backLengthMm: number

  chestGirthMm: number

  neckGirthMm: number
}

export interface BodyMeasurementsCm {
  /*
   * User-facing input/output shape.
   *
   * PAWTTERN currently uses cm for
   * pattern measurements.
   */

  backLengthCm: number

  chestGirthCm: number

  neckGirthCm: number
}

export type BodyMeasurementKey =
  keyof BodyMeasurements

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isPositiveFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  )
}

export function isValidBodyMeasurements(
  value: unknown,
): value is BodyMeasurements {
  if (!isRecord(value)) {
    return false
  }

  return (
    isPositiveFiniteNumber(
      value.backLengthMm,
    ) &&
    isPositiveFiniteNumber(
      value.chestGirthMm,
    ) &&
    isPositiveFiniteNumber(
      value.neckGirthMm,
    )
  )
}

function validateCentimeterInput(
  input: BodyMeasurementsCm,
): void {
  if (
    !isPositiveFiniteNumber(
      input.backLengthCm,
    ) ||
    !isPositiveFiniteNumber(
      input.chestGirthCm,
    ) ||
    !isPositiveFiniteNumber(
      input.neckGirthCm,
    )
  ) {
    throw new Error(
      'Body measurements must be finite positive values.',
    )
  }
}

export function createBodyMeasurementsFromCm(
  input: BodyMeasurementsCm,
): BodyMeasurements {
  validateCentimeterInput(
    input,
  )

  return {
    backLengthMm:
      cmToMm(
        input.backLengthCm,
      ),

    chestGirthMm:
      cmToMm(
        input.chestGirthCm,
      ),

    neckGirthMm:
      cmToMm(
        input.neckGirthCm,
      ),
  }
}

export function bodyMeasurementsToCm(
  measurements:
    BodyMeasurements,
): BodyMeasurementsCm {
  if (
    !isValidBodyMeasurements(
      measurements,
    )
  ) {
    throw new Error(
      'Cannot convert invalid body measurements.',
    )
  }

  return {
    backLengthCm:
      mmToCm(
        measurements
          .backLengthMm,
      ),

    chestGirthCm:
      mmToCm(
        measurements
          .chestGirthMm,
      ),

    neckGirthCm:
      mmToCm(
        measurements
          .neckGirthMm,
      ),
  }
}

export function updateBodyMeasurementMm(
  measurements:
    BodyMeasurements,

  key:
    BodyMeasurementKey,

  valueMm:
    number,
): BodyMeasurements {
  if (
    !isValidBodyMeasurements(
      measurements,
    )
  ) {
    throw new Error(
      'Cannot update invalid body measurements.',
    )
  }

  if (
    !isPositiveFiniteNumber(
      valueMm,
    )
  ) {
    throw new Error(
      'Measurement must be a finite positive value.',
    )
  }

  if (
    measurements[key] ===
    valueMm
  ) {
    return measurements
  }

  return {
    ...measurements,

    [key]:
      valueMm,
  }
}