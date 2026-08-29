import type {
  WorldPosition,
} from './coordinates'

export interface CubicBezierGeometry {
  start: WorldPosition

  control1: WorldPosition
  control2: WorldPosition

  end: WorldPosition
}

function validatePosition(
  position: WorldPosition,
): void {
  if (
    !Number.isFinite(
      position.xMm,
    ) ||
    !Number.isFinite(
      position.yMm,
    )
  ) {
    throw new Error(
      'Bezier positions must contain finite coordinates.',
    )
  }
}

function validateCurve(
  curve: CubicBezierGeometry,
): void {
  validatePosition(
    curve.start,
  )

  validatePosition(
    curve.control1,
  )

  validatePosition(
    curve.control2,
  )

  validatePosition(
    curve.end,
  )
}

function validateParameter(
  t: number,
): void {
  if (
    !Number.isFinite(t) ||
    t < 0 ||
    t > 1
  ) {
    throw new Error(
      'Bezier parameter t must be between 0 and 1.',
    )
  }
}

export function evaluateCubicBezier(
  curve: CubicBezierGeometry,
  t: number,
): WorldPosition {
  validateCurve(curve)
  validateParameter(t)

  const oneMinusT =
    1 - t

  const oneMinusTSquared =
    oneMinusT *
    oneMinusT

  const tSquared =
    t * t

  const startWeight =
    oneMinusTSquared *
    oneMinusT

  const control1Weight =
    3 *
    oneMinusTSquared *
    t

  const control2Weight =
    3 *
    oneMinusT *
    tSquared

  const endWeight =
    tSquared * t

  return {
    xMm:
      startWeight *
        curve.start.xMm +
      control1Weight *
        curve.control1.xMm +
      control2Weight *
        curve.control2.xMm +
      endWeight *
        curve.end.xMm,

    yMm:
      startWeight *
        curve.start.yMm +
      control1Weight *
        curve.control1.yMm +
      control2Weight *
        curve.control2.yMm +
      endWeight *
        curve.end.yMm,
  }
}

export function cubicBezierDerivative(
  curve: CubicBezierGeometry,
  t: number,
): WorldPosition {
  validateCurve(curve)
  validateParameter(t)

  const oneMinusT =
    1 - t

  return {
    xMm:
      3 *
        oneMinusT *
        oneMinusT *
        (
          curve.control1.xMm -
          curve.start.xMm
        ) +
      6 *
        oneMinusT *
        t *
        (
          curve.control2.xMm -
          curve.control1.xMm
        ) +
      3 *
        t *
        t *
        (
          curve.end.xMm -
          curve.control2.xMm
        ),

    yMm:
      3 *
        oneMinusT *
        oneMinusT *
        (
          curve.control1.yMm -
          curve.start.yMm
        ) +
      6 *
        oneMinusT *
        t *
        (
          curve.control2.yMm -
          curve.control1.yMm
        ) +
      3 *
        t *
        t *
        (
          curve.end.yMm -
          curve.control2.yMm
        ),
  }
}

export function approximateCubicBezierLengthMm(
  curve: CubicBezierGeometry,
  segments = 100,
): number {
  validateCurve(curve)

  if (
    !Number.isInteger(
      segments,
    ) ||
    segments <= 0
  ) {
    throw new Error(
      'Bezier length segments must be a positive integer.',
    )
  }

  let lengthMm = 0

  let previous =
    evaluateCubicBezier(
      curve,
      0,
    )

  for (
    let index = 1;
    index <= segments;
    index += 1
  ) {
    const t =
      index / segments

    const current =
      evaluateCubicBezier(
        curve,
        t,
      )

    lengthMm +=
      Math.hypot(
        current.xMm -
          previous.xMm,

        current.yMm -
          previous.yMm,
      )

    previous =
      current
  }

  return lengthMm
}