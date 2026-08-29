import type { RulerUnit } from './ruler'
import { MM_PER_INCH } from './units'

export const DEFAULT_MIN_RULER_LABEL_SPACING_PX =
  30

const NICE_MULTIPLIERS = [
  1,
  2,
  5,
  10,
  20,
  50,
  100,
  200,
  500,
  1000,
]

export function getRulerMajorSpacingMm(
  unit: RulerUnit,
): number {
  return unit === 'cm'
    ? 10
    : MM_PER_INCH
}

export function getRulerLabelEveryMajor(
  unit: RulerUnit,
  effectivePxPerMm: number,
  minimumLabelSpacingPx =
    DEFAULT_MIN_RULER_LABEL_SPACING_PX,
): number {
  if (
    !Number.isFinite(effectivePxPerMm) ||
    effectivePxPerMm <= 0
  ) {
    throw new Error(
      'Effective pixels per millimeter must be greater than zero.',
    )
  }

  if (
    !Number.isFinite(
      minimumLabelSpacingPx,
    ) ||
    minimumLabelSpacingPx <= 0
  ) {
    throw new Error(
      'Minimum ruler label spacing must be greater than zero.',
    )
  }

  const majorSpacingMm =
    getRulerMajorSpacingMm(unit)

  const majorSpacingPx =
    majorSpacingMm *
    effectivePxPerMm

  const requiredMultiplier =
    minimumLabelSpacingPx /
    majorSpacingPx

  for (
    const multiplier of
    NICE_MULTIPLIERS
  ) {
    if (
      multiplier >=
      requiredMultiplier
    ) {
      return multiplier
    }
  }

  const largest =
    NICE_MULTIPLIERS[
      NICE_MULTIPLIERS.length -
        1
    ]

  return (
    largest *
    Math.ceil(
      requiredMultiplier /
        largest,
    )
  )
}

export function shouldShowRulerLabel(
  positionMm: number,
  unit: RulerUnit,
  labelEveryMajor: number,
): boolean {
  if (
    !Number.isFinite(positionMm)
  ) {
    return false
  }

  if (
    !Number.isInteger(
      labelEveryMajor,
    ) ||
    labelEveryMajor <= 0
  ) {
    throw new Error(
      'Ruler label interval must be a positive integer.',
    )
  }

  const majorSpacingMm =
    getRulerMajorSpacingMm(unit)

  const majorIndex =
    Math.round(
      positionMm /
        majorSpacingMm,
    )

  const expectedPositionMm =
    majorIndex *
    majorSpacingMm

  const toleranceMm =
    0.000001

  if (
    Math.abs(
      positionMm -
        expectedPositionMm,
    ) > toleranceMm
  ) {
    return false
  }

  return (
    Math.abs(
      majorIndex %
        labelEveryMajor,
    ) === 0
  )
}