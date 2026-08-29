import { fromMm, MM_PER_INCH } from './units'

export type RulerUnit = 'cm' | 'in'

export type RulerTickKind =
  | 'major'
  | 'medium'
  | 'minor'

export interface RulerTick {
  positionMm: number
  kind: RulerTickKind
  label: string | null
}

interface RulerScale {
  minorSpacingMm: number
  mediumEvery: number
  majorEvery: number
}

function getRulerScale(
  unit: RulerUnit,
): RulerScale {
  if (unit === 'cm') {
    return {
      minorSpacingMm: 1,
      mediumEvery: 5,
      majorEvery: 10,
    }
  }

  return {
    minorSpacingMm: MM_PER_INCH / 8,
    mediumEvery: 4,
    majorEvery: 8,
  }
}

function formatMajorLabel(
  positionMm: number,
  unit: RulerUnit,
): string {
  const converted = fromMm(
    positionMm,
    unit,
  )

  const normalized =
    Math.abs(converted) < 1e-10
      ? 0
      : converted

  const nearestInteger =
    Math.round(normalized)

  if (
    Math.abs(
      normalized - nearestInteger,
    ) < 1e-9
  ) {
    return String(nearestInteger)
  }

  return normalized
    .toFixed(2)
    .replace(/\.?0+$/, '')
}

export function getRulerTicks(
  minMm: number,
  maxMm: number,
  unit: RulerUnit,
  maxTicks = 5000,
): RulerTick[] {
  if (
    !Number.isFinite(minMm) ||
    !Number.isFinite(maxMm)
  ) {
    throw new Error(
      'Ruler bounds must be finite numbers.',
    )
  }

  if (
    !Number.isInteger(maxTicks) ||
    maxTicks <= 0
  ) {
    throw new Error(
      'Maximum ruler tick count must be a positive integer.',
    )
  }

  const scale = getRulerScale(unit)

  const low = Math.min(minMm, maxMm)
  const high = Math.max(minMm, maxMm)

  const tolerance =
    scale.minorSpacingMm * 1e-10

  const startIndex = Math.ceil(
    (low - tolerance) /
      scale.minorSpacingMm,
  )

  const endIndex = Math.floor(
    (high + tolerance) /
      scale.minorSpacingMm,
  )

  const count =
    endIndex - startIndex + 1

  if (count <= 0) {
    return []
  }

  if (count > maxTicks) {
    throw new Error(
      'Too many ruler ticks requested.',
    )
  }

  return Array.from(
    { length: count },
    (_, offset) => {
      const index =
        startIndex + offset

      const rawPosition =
        index * scale.minorSpacingMm

      const positionMm =
        Math.abs(rawPosition) < 1e-10
          ? 0
          : rawPosition

      const absoluteIndex =
        Math.abs(index)

      if (
        absoluteIndex %
          scale.majorEvery ===
        0
      ) {
        return {
          positionMm,
          kind: 'major',
          label: formatMajorLabel(
            positionMm,
            unit,
          ),
        }
      }

      if (
        absoluteIndex %
          scale.mediumEvery ===
        0
      ) {
        return {
          positionMm,
          kind: 'medium',
          label: null,
        }
      }

      return {
        positionMm,
        kind: 'minor',
        label: null,
      }
    },
  )
}