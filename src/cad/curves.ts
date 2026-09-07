import type {
  WorldPosition,
} from './coordinates'

import type {
  PointMap,
} from './lines'

import {
  isGeometryRole,
  type GeometryRole,
} from './geometryRole'

import {
  approximateCubicBezierLengthMm,
  type CubicBezierGeometry,
} from './bezier'

export interface CubicBezierCurve {
  id: string
  name: string

  startPointId: string
  endPointId: string

  control1: WorldPosition
  control2: WorldPosition

  role?: GeometryRole
}

export type CurveMap =
  Record<string, CubicBezierCurve>

function isFinitePosition(
  position: WorldPosition,
): boolean {
  return (
    Number.isFinite(
      position.xMm,
    ) &&
    Number.isFinite(
      position.yMm,
    )
  )
}

export function isValidCubicBezierCurve(
  curve: CubicBezierCurve,
  points: PointMap,
): boolean {
  if (
    curve.id.trim().length === 0 ||
    curve.name.trim().length === 0
  ) {
    return false
  }

  if (
    curve.role !== undefined &&
    !isGeometryRole(
      curve.role,
    )
  ) {
    return false
  }

  if (
    curve.startPointId ===
    curve.endPointId
  ) {
    return false
  }

  if (
    !points[
      curve.startPointId
    ] ||
    !points[
      curve.endPointId
    ]
  ) {
    return false
  }

  if (
    !isFinitePosition(
      curve.control1,
    ) ||
    !isFinitePosition(
      curve.control2,
    )
  ) {
    return false
  }

  return true
}

export function resolveCubicBezierGeometry(
  curve: CubicBezierCurve,
  points: PointMap,
): CubicBezierGeometry {
  if (
    !isValidCubicBezierCurve(
      curve,
      points,
    )
  ) {
    throw new Error(
      'Cannot resolve an invalid cubic Bezier curve.',
    )
  }

  const start =
    points[
      curve.startPointId
    ]

  const end =
    points[
      curve.endPointId
    ]

  return {
    start: {
      xMm: start.xMm,
      yMm: start.yMm,
    },

    control1: {
      xMm:
        curve.control1.xMm,

      yMm:
        curve.control1.yMm,
    },

    control2: {
      xMm:
        curve.control2.xMm,

      yMm:
        curve.control2.yMm,
    },

    end: {
      xMm: end.xMm,
      yMm: end.yMm,
    },
  }
}

export function cubicBezierCurveLengthMm(
  curve: CubicBezierCurve,
  points: PointMap,
  segments = 100,
): number {
  return approximateCubicBezierLengthMm(
    resolveCubicBezierGeometry(
      curve,
      points,
    ),
    segments,
  )
}