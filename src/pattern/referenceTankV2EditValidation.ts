import type {
  CubicBezierCurve,
} from '../cad/curves'

import {
  cubicBezierCurveLengthMm,
} from '../cad/curves'

import type {
  PatternDocument,
} from '../cad/document'

import type {
  PatternProject,
} from './project'

import {
  PAWTTERN_MASTER_V2_RULE_VERSION,
} from './referenceTankV2Formula'

import {
  REFERENCE_TANK_V2_CURVE_IDS,
  REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
  REFERENCE_TANK_V2_POINT_IDS,
} from './referenceTankV2Construction'

const NECKLINE_TOLERANCE_MM =
  0.001

const POINT_POSITION_TOLERANCE_MM =
  0.000001

const NECKLINE_SHAPE_TOLERANCE_MM =
  0.001

const PROTECTED_NECK_POINT_IDS = [
  REFERENCE_TANK_V2_POINT_IDS.backNeckCenter,
  REFERENCE_TANK_V2_POINT_IDS.backNeckWidthBase,
  REFERENCE_TANK_V2_POINT_IDS.backSideNeck,
  REFERENCE_TANK_V2_POINT_IDS.backShoulderOuter,
  REFERENCE_TANK_V2_POINT_IDS.frontNeckCenter,
  REFERENCE_TANK_V2_POINT_IDS.frontNeckWidthBase,
  REFERENCE_TANK_V2_POINT_IDS.frontSideNeck,
  REFERENCE_TANK_V2_POINT_IDS.frontShoulderOuter,
] as const

export interface ReferenceTankV2EditValidationResult {
  isValid:
    boolean

  message:
    string | null

  finishedNeckOpeningMm:
    number | null

  minimumNeckOpeningMm:
    number | null
}

interface NecklineShapeDefinition {
  label:
    string

  startPointId:
    string

  endPointId:
    string

  xDirection:
    1 | -1

  endTangentXDirection:
    1 | -1
}

interface NecklinePoint {
  xMm:
    number

  yMm:
    number
}

function isSameCoordinate(
  first:
    number,

  second:
    number,
): boolean {
  return (
    Math.abs(
      first -
      second,
    ) <=
    POINT_POSITION_TOLERANCE_MM
  )
}

function isAtLeastWithTolerance(
  first:
    number,

  second:
    number,
): boolean {
  return (
    first +
    NECKLINE_SHAPE_TOLERANCE_MM >=
    second
  )
}

function isAtMostWithTolerance(
  first:
    number,

  second:
    number,
): boolean {
  return (
    first -
    NECKLINE_SHAPE_TOLERANCE_MM <=
    second
  )
}

function isBetweenInclusive(
  value:
    number,

  first:
    number,

  second:
    number,
): boolean {
  const minimum =
    Math.min(
      first,
      second,
    )

  const maximum =
    Math.max(
      first,
      second,
    )

  return (
    isAtLeastWithTolerance(
      value,
      minimum,
    ) &&
    isAtMostWithTolerance(
      value,
      maximum,
    )
  )
}

function validateProtectedNeckPoints(
  currentDocument:
    PatternDocument,

  candidateDocument:
    PatternDocument,
): string | null {
  for (
    const pointId
    of PROTECTED_NECK_POINT_IDS
  ) {
    const currentPoint =
      currentDocument.points[
        pointId
      ]

    if (!currentPoint) {
      continue
    }

    const candidatePoint =
      candidateDocument.points[
        pointId
      ]

    if (!candidatePoint) {
      return (
        `Generated pattern point ${pointId} cannot be deleted. ` +
        'Adjust the parametric pattern settings instead.'
      )
    }

    if (
      !isSameCoordinate(
        candidatePoint.xMm,
        currentPoint.xMm,
      ) ||
      !isSameCoordinate(
        candidatePoint.yMm,
        currentPoint.yMm,
      )
    ) {
      return (
        `Generated pattern point ${pointId} cannot be moved manually. ` +
        'Adjust the parametric pattern settings instead.'
      )
    }
  }

  return null
}

function validateCurveTopology(
  curve:
    CubicBezierCurve,

  definition:
    NecklineShapeDefinition,
): string | null {
  if (
    curve.startPointId !==
      definition.startPointId ||
    curve.endPointId !==
      definition.endPointId
  ) {
    return (
      `${definition.label} edit rejected. ` +
      'Generated neckline endpoints cannot be reassigned.'
    )
  }

  return null
}

function validateCurveInsideConstructionRectangle(
  curve:
    CubicBezierCurve,

  start:
    NecklinePoint,

  end:
    NecklinePoint,

  definition:
    NecklineShapeDefinition,
): string | null {
  const controls = [
    curve.control1,
    curve.control2,
  ]

  for (
    const control
    of controls
  ) {
    const insideX =
      isBetweenInclusive(
        control.xMm,
        start.xMm,
        end.xMm,
      )

    const insideY =
      isBetweenInclusive(
        control.yMm,
        start.yMm,
        end.yMm,
      )

    if (
      !insideX ||
      !insideY
    ) {
      return (
        `${definition.label} edit rejected. ` +
        'The neckline control handles must stay inside the neck construction area.'
      )
    }
  }

  return null
}

function validateCurveProgression(
  curve:
    CubicBezierCurve,

  start:
    NecklinePoint,

  end:
    NecklinePoint,

  definition:
    NecklineShapeDefinition,
): string | null {
  if (
    definition.xDirection ===
    1
  ) {
    const validX =
      isAtMostWithTolerance(
        start.xMm,
        curve.control1.xMm,
      ) &&
      isAtMostWithTolerance(
        curve.control1.xMm,
        curve.control2.xMm,
      ) &&
      isAtMostWithTolerance(
        curve.control2.xMm,
        end.xMm,
      )

    if (!validX) {
      return (
        `${definition.label} edit rejected. ` +
        'The neckline cannot reverse direction or curl before reaching Side Neck.'
      )
    }
  } else {
    const validX =
      isAtLeastWithTolerance(
        start.xMm,
        curve.control1.xMm,
      ) &&
      isAtLeastWithTolerance(
        curve.control1.xMm,
        curve.control2.xMm,
      ) &&
      isAtLeastWithTolerance(
        curve.control2.xMm,
        end.xMm,
      )

    if (!validX) {
      return (
        `${definition.label} edit rejected. ` +
        'The neckline cannot reverse direction or curl before reaching Side Neck.'
      )
    }
  }

  const validY =
    isAtLeastWithTolerance(
      start.yMm,
      curve.control1.yMm,
    ) &&
    isAtLeastWithTolerance(
      curve.control1.yMm,
      curve.control2.yMm,
    ) &&
    isAtLeastWithTolerance(
      curve.control2.yMm,
      end.yMm,
    )

  if (!validY) {
    return (
      `${definition.label} edit rejected. ` +
      'The neckline cannot dip downward, reverse vertically, or curl before reaching Side Neck.'
    )
  }

  return null
}

function validateCenterNeckTangent(
  curve:
    CubicBezierCurve,

  start:
    NecklinePoint,

  definition:
    NecklineShapeDefinition,
): string | null {
  if (
    Math.abs(
      curve.control1.yMm -
      start.yMm,
    ) >
    NECKLINE_SHAPE_TOLERANCE_MM
  ) {
    return (
      `${definition.label} edit rejected. ` +
      'The neckline must leave Center Neck horizontally.'
    )
  }

  const startDx =
    curve.control1.xMm -
    start.xMm

  if (
    definition.xDirection ===
      1
      ? startDx <=
        NECKLINE_SHAPE_TOLERANCE_MM
      : startDx >=
        -NECKLINE_SHAPE_TOLERANCE_MM
  ) {
    return (
      `${definition.label} edit rejected. ` +
      'The Center Neck control handle must point toward Side Neck.'
    )
  }

  return null
}

function validateSideNeckTangent(
  curve:
    CubicBezierCurve,

  end:
    NecklinePoint,

  definition:
    NecklineShapeDefinition,
): string | null {
  const dx =
    end.xMm -
    curve.control2.xMm

  const dy =
    end.yMm -
    curve.control2.yMm

  if (
    dy >=
    -NECKLINE_SHAPE_TOLERANCE_MM
  ) {
    return (
      `${definition.label} edit rejected. ` +
      'The neckline must approach Side Neck upward.'
    )
  }

  if (
    definition.endTangentXDirection ===
    1
  ) {
    if (
      dx <=
      NECKLINE_SHAPE_TOLERANCE_MM
    ) {
      return (
        `${definition.label} edit rejected. ` +
        'The Back neckline must approach Side Neck right and up.'
      )
    }
  } else if (
    dx >=
    -NECKLINE_SHAPE_TOLERANCE_MM
  ) {
    return (
      `${definition.label} edit rejected. ` +
      'The Front neckline must approach Side Neck left and up.'
    )
  }

  if (
    Math.abs(
      Math.abs(dx) -
      Math.abs(dy),
    ) >
    NECKLINE_SHAPE_TOLERANCE_MM
  ) {
    return (
      `${definition.label} edit rejected. ` +
      'The neckline must approach Side Neck at 45 degrees.'
    )
  }

  return null
}

function validateNecklineCurveShape(
  document:
    PatternDocument,

  curve:
    CubicBezierCurve,

  definition:
    NecklineShapeDefinition,
): string | null {
  const topologyError =
    validateCurveTopology(
      curve,
      definition,
    )

  if (
    topologyError !==
    null
  ) {
    return topologyError
  }

  const start =
    document.points[
      definition.startPointId
    ]

  const end =
    document.points[
      definition.endPointId
    ]

  if (
    !start ||
    !end
  ) {
    return (
      `${definition.label} edit rejected because its generated endpoints are missing.`
    )
  }

  const rectangleError =
    validateCurveInsideConstructionRectangle(
      curve,
      start,
      end,
      definition,
    )

  if (
    rectangleError !==
    null
  ) {
    return rectangleError
  }

  const progressionError =
    validateCurveProgression(
      curve,
      start,
      end,
      definition,
    )

  if (
    progressionError !==
    null
  ) {
    return progressionError
  }

  const centerTangentError =
    validateCenterNeckTangent(
      curve,
      start,
      definition,
    )

  if (
    centerTangentError !==
    null
  ) {
    return centerTangentError
  }

  const sideTangentError =
    validateSideNeckTangent(
      curve,
      end,
      definition,
    )

  if (
    sideTangentError !==
    null
  ) {
    return sideTangentError
  }

  return null
}

export function validateReferenceTankV2DocumentEdit(
  project:
    PatternProject,

  candidateDocument:
    PatternDocument,
): ReferenceTankV2EditValidationResult {
  if (
    project.draftingRuleVersion !==
      PAWTTERN_MASTER_V2_RULE_VERSION ||
    project.measurements === null
  ) {
    return {
      isValid:
        true,

      message:
        null,

      finishedNeckOpeningMm:
        null,

      minimumNeckOpeningMm:
        null,
    }
  }

  const minimumNeckOpeningMm =
    project.measurements.neckGirthMm +
    project.neckOpeningAllowanceMm

  const protectedPointError =
    validateProtectedNeckPoints(
      project.document,
      candidateDocument,
    )

  if (
    protectedPointError !==
    null
  ) {
    return {
      isValid:
        false,

      message:
        protectedPointError,

      finishedNeckOpeningMm:
        null,

      minimumNeckOpeningMm,
    }
  }

  const backCurve =
    candidateDocument.curves[
      REFERENCE_TANK_V2_CURVE_IDS.backNeckline
    ]

  const frontCurve =
    candidateDocument.curves[
      REFERENCE_TANK_V2_CURVE_IDS.frontNeckline
    ]

  if (
    !backCurve ||
    !frontCurve
  ) {
    return {
      isValid:
        false,

      message:
        'The generated V2 neckline curves cannot be deleted.',

      finishedNeckOpeningMm:
        null,

      minimumNeckOpeningMm,
    }
  }

  try {
    const backHalfNeckLengthMm =
      cubicBezierCurveLengthMm(
        backCurve,
        candidateDocument.points,
        REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
      )

    const frontHalfNeckLengthMm =
      cubicBezierCurveLengthMm(
        frontCurve,
        candidateDocument.points,
        REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
      )

    const finishedNeckOpeningMm =
      2 *
      (
        backHalfNeckLengthMm +
        frontHalfNeckLengthMm
      )

    if (
      finishedNeckOpeningMm +
        NECKLINE_TOLERANCE_MM <
      minimumNeckOpeningMm
    ) {
      return {
        isValid:
          false,

        message:
          `Neckline edit rejected. Finished opening would be ${finishedNeckOpeningMm.toFixed(2)} mm, but the minimum is ${minimumNeckOpeningMm.toFixed(2)} mm.`,

        finishedNeckOpeningMm,

        minimumNeckOpeningMm,
      }
    }

    const backShapeError =
      validateNecklineCurveShape(
        candidateDocument,
        backCurve,
        {
          label:
            'Back neckline',

          startPointId:
            REFERENCE_TANK_V2_POINT_IDS.backNeckCenter,

          endPointId:
            REFERENCE_TANK_V2_POINT_IDS.backSideNeck,

          xDirection:
            1,

          endTangentXDirection:
            1,
        },
      )

    if (
      backShapeError !==
      null
    ) {
      return {
        isValid:
          false,

        message:
          backShapeError,

        finishedNeckOpeningMm,

        minimumNeckOpeningMm,
      }
    }

    const frontShapeError =
      validateNecklineCurveShape(
        candidateDocument,
        frontCurve,
        {
          label:
            'Front neckline',

          startPointId:
            REFERENCE_TANK_V2_POINT_IDS.frontNeckCenter,

          endPointId:
            REFERENCE_TANK_V2_POINT_IDS.frontSideNeck,

          xDirection:
            -1,

          endTangentXDirection:
            -1,
        },
      )

    if (
      frontShapeError !==
      null
    ) {
      return {
        isValid:
          false,

        message:
          frontShapeError,

        finishedNeckOpeningMm,

        minimumNeckOpeningMm,
      }
    }

    return {
      isValid:
        true,

      message:
        null,

      finishedNeckOpeningMm,

      minimumNeckOpeningMm,
    }
  } catch {
    return {
      isValid:
        false,

      message:
        'Neckline edit rejected because the V2 neckline geometry could not be measured.',

      finishedNeckOpeningMm:
        null,

      minimumNeckOpeningMm,
    }
  }
}
