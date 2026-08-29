import type {
  WorldPosition,
} from './coordinates'

import type {
  PatternDocument,
} from './document'

import {
  cubicBezierCurveLengthMm,
} from './curves'

export interface CurveProperties {
  curveId: string
  name: string

  startPointId: string
  endPointId: string

  control1: WorldPosition
  control2: WorldPosition

  lengthMm: number
}

export function getCurveProperties(
  document: PatternDocument,
  curveId: string,
  segments = 100,
): CurveProperties {
  const curve =
    document.curves[
      curveId
    ]

  if (!curve) {
    throw new Error(
      `Curve "${curveId}" does not exist.`,
    )
  }

  const lengthMm =
    cubicBezierCurveLengthMm(
      curve,
      document.points,
      segments,
    )

  return {
    curveId:
      curve.id,

    name:
      curve.name,

    startPointId:
      curve.startPointId,

    endPointId:
      curve.endPointId,

    /*
     * Return copies so a properties
     * panel cannot accidentally mutate
     * PatternDocument geometry.
     */
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

    lengthMm,
  }
}