import type {
  PatternDocument,
} from './document'

import type {
  PointMap,
  Line,
} from './lines'

import {
  isValidLine,
} from './lines'

import type {
  CurveMap,
  CubicBezierCurve,
} from './curves'

import {
  isValidCubicBezierCurve,
} from './curves'

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  )
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

function isValidPointMap(
  value: unknown,
): value is PointMap {
  if (!isRecord(value)) {
    return false
  }

  for (
    const [
      key,
      rawPoint,
    ] of Object.entries(value)
  ) {
    if (!isRecord(rawPoint)) {
      return false
    }

    if (
      !isNonEmptyString(
        rawPoint.id,
      ) ||
      rawPoint.id !== key
    ) {
      return false
    }

    if (
      !isNonEmptyString(
        rawPoint.name,
      )
    ) {
      return false
    }

    if (
      !isFiniteNumber(
        rawPoint.xMm,
      ) ||
      !isFiniteNumber(
        rawPoint.yMm,
      )
    ) {
      return false
    }
  }

  return true
}

function isValidLineMap(
  value: unknown,
  points: PointMap,
): value is Record<
  string,
  Line
> {
  if (!isRecord(value)) {
    return false
  }

  for (
    const [
      key,
      rawLine,
    ] of Object.entries(value)
  ) {
    if (!isRecord(rawLine)) {
      return false
    }

    if (
      !isNonEmptyString(
        rawLine.id,
      ) ||
      rawLine.id !== key ||
      !isNonEmptyString(
        rawLine.name,
      ) ||
      !isNonEmptyString(
        rawLine.startPointId,
      ) ||
      !isNonEmptyString(
        rawLine.endPointId,
      )
    ) {
      return false
    }

    const line: Line = {
      id:
        rawLine.id,

      name:
        rawLine.name,

      startPointId:
        rawLine.startPointId,

      endPointId:
        rawLine.endPointId,
    }

    if (
      !isValidLine(
        line,
        points,
      )
    ) {
      return false
    }
  }

  return true
}

function isValidCurveMap(
  value: unknown,
  points: PointMap,
): value is CurveMap {
  if (!isRecord(value)) {
    return false
  }

  for (
    const [
      key,
      rawCurve,
    ] of Object.entries(value)
  ) {
    if (!isRecord(rawCurve)) {
      return false
    }

    if (
      !isNonEmptyString(
        rawCurve.id,
      ) ||
      rawCurve.id !== key ||
      !isNonEmptyString(
        rawCurve.name,
      ) ||
      !isNonEmptyString(
        rawCurve.startPointId,
      ) ||
      !isNonEmptyString(
        rawCurve.endPointId,
      )
    ) {
      return false
    }

    if (
      !isRecord(
        rawCurve.control1,
      ) ||
      !isRecord(
        rawCurve.control2,
      )
    ) {
      return false
    }

    if (
      !isFiniteNumber(
        rawCurve.control1.xMm,
      ) ||
      !isFiniteNumber(
        rawCurve.control1.yMm,
      ) ||
      !isFiniteNumber(
        rawCurve.control2.xMm,
      ) ||
      !isFiniteNumber(
        rawCurve.control2.yMm,
      )
    ) {
      return false
    }

    const curve:
      CubicBezierCurve = {
        id:
          rawCurve.id,

        name:
          rawCurve.name,

        startPointId:
          rawCurve.startPointId,

        endPointId:
          rawCurve.endPointId,

        control1: {
          xMm:
            rawCurve.control1.xMm,

          yMm:
            rawCurve.control1.yMm,
        },

        control2: {
          xMm:
            rawCurve.control2.xMm,

          yMm:
            rawCurve.control2.yMm,
        },
      }

    if (
      !isValidCubicBezierCurve(
        curve,
        points,
      )
    ) {
      return false
    }
  }

  return true
}

export function isValidPatternDocument(
  value: unknown,
): value is PatternDocument {
  if (!isRecord(value)) {
    return false
  }

  /*
   * V1 is the first persistent
   * PAWTTERN CAD file format.
   */
  if (
    value.schemaVersion !== 1
  ) {
    return false
  }

  const rawPoints =
    value.points

  const rawLines =
    value.lines

  const rawCurves =
    value.curves

  if (
    !isValidPointMap(
      rawPoints,
    )
  ) {
    return false
  }

  if (
    !isValidLineMap(
      rawLines,
      rawPoints,
    )
  ) {
    return false
  }

  if (
    !isValidCurveMap(
      rawCurves,
      rawPoints,
    )
  ) {
    return false
  }

  return true
}

export function serializePatternDocument(
  document: PatternDocument,
): string {
  /*
   * Never save invalid geometry.
   */
  if (
    !isValidPatternDocument(
      document,
    )
  ) {
    throw new Error(
      'Cannot serialize an invalid PAWTTERN CAD document.',
    )
  }

  return JSON.stringify(
    document,
    null,
    2,
  )
}

export function deserializePatternDocument(
  json: string,
): PatternDocument {
  let parsed: unknown

  try {
    parsed =
      JSON.parse(json)
  } catch {
    throw new Error(
      'Pattern file is not valid JSON.',
    )
  }

  if (
    !isValidPatternDocument(
      parsed,
    )
  ) {
    throw new Error(
      'Pattern file is not a valid PAWTTERN CAD document.',
    )
  }

  return parsed
}