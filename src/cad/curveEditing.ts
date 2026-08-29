import type {
  WorldPosition,
} from './coordinates'

import type {
  PatternDocument,
} from './document'

import {
  snapValueMm,
} from './snapping'

export type CurveControlHandle =
  | 'control1'
  | 'control2'

export interface MoveCurveControlOptions {
  snapSpacingMm?: number | null
}

export function moveCurveControlToWorldPosition(
  document: PatternDocument,
  curveId: string,
  handle: CurveControlHandle,
  target: WorldPosition,
  options: MoveCurveControlOptions = {},
): PatternDocument {
  if (
    !Number.isFinite(
      target.xMm,
    ) ||
    !Number.isFinite(
      target.yMm,
    )
  ) {
    throw new Error(
      'Curve control target must contain finite coordinates.',
    )
  }

  const curve =
    document.curves[
      curveId
    ]

  /*
   * A stale UI selection should not
   * damage the document.
   */
  if (!curve) {
    return document
  }

  let nextXMm =
    target.xMm

  let nextYMm =
    target.yMm

  if (
    options.snapSpacingMm !==
      undefined &&
    options.snapSpacingMm !==
      null
  ) {
    nextXMm =
      snapValueMm(
        nextXMm,
        options.snapSpacingMm,
      )

    nextYMm =
      snapValueMm(
        nextYMm,
        options.snapSpacingMm,
      )
  }

  const currentControl =
    curve[handle]

  /*
   * Avoid creating a new document
   * when nothing actually changed.
   */
  if (
    currentControl.xMm ===
      nextXMm &&
    currentControl.yMm ===
      nextYMm
  ) {
    return document
  }

  const nextCurve = {
    ...curve,

    [handle]: {
      xMm:
        nextXMm,

      yMm:
        nextYMm,
    },
  }

  return {
    ...document,

    curves: {
      ...document.curves,

      [curveId]:
        nextCurve,
    },
  }
}