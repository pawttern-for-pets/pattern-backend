import type {
  CubicBezierGeometry,
} from '../cad/bezier'

import type {
  WorldPosition,
} from '../cad/coordinates'

/*
 * PAWTTERN MASTER BLOCK V2
 * LOWER-BACK GEOMETRY PROOF
 *
 * Source:
 * Video Reference 2 lower-back shaping
 * sequence around 7:39-8:07.
 *
 * Pure geometry only:
 * - no PatternDocument mutation;
 * - no CAD/UI creation;
 * - no male/female belly selection.
 *
 * Coordinate system:
 * X+ = right
 * Y+ = down
 */

export const
  REFERENCE_TANK_V2_LOWER_BACK_BOW_MM =
    5

const POSITION_EPSILON_MM =
  1e-6

export interface ReferenceTankV2LowerBackGeometryInput {
  sideShapingBackPoint:
    WorldPosition

  backHemTwoThirdsPoint:
    WorldPosition

  backHemOneThirdPoint:
    WorldPosition
}

export interface ReferenceTankV2LowerBackGeometry {
  temporaryGuideMidpoint:
    WorldPosition

  bowNormalUnit:
    WorldPosition

  bowedCurveMidpoint:
    WorldPosition

  temporaryQuadraticControl:
    WorldPosition

  retainedUpperQuadraticControl:
    WorldPosition

  finalHemQuadraticControl:
    WorldPosition

  temporaryFrenchCurve:
    CubicBezierGeometry

  retainedUpperCurve:
    CubicBezierGeometry

  finalHemBlendCurve:
    CubicBezierGeometry
}

function isFinitePosition(
  position:
    WorldPosition,
): boolean {
  return (
    Number.isFinite(position.xMm) &&
    Number.isFinite(position.yMm)
  )
}

function clonePosition(
  position:
    WorldPosition,
): WorldPosition {
  return {
    xMm:
      position.xMm,

    yMm:
      position.yMm,
  }
}

function midpoint(
  first:
    WorldPosition,

  second:
    WorldPosition,
): WorldPosition {
  return {
    xMm:
      (
        first.xMm +
        second.xMm
      ) /
      2,

    yMm:
      (
        first.yMm +
        second.yMm
      ) /
      2,
  }
}

function distanceMm(
  first:
    WorldPosition,

  second:
    WorldPosition,
): number {
  return Math.hypot(
    second.xMm -
      first.xMm,

    second.yMm -
      first.yMm,
  )
}

function addScaled(
  base:
    WorldPosition,

  direction:
    WorldPosition,

  scale:
    number,
): WorldPosition {
  return {
    xMm:
      base.xMm +
      direction.xMm *
        scale,

    yMm:
      base.yMm +
      direction.yMm *
        scale,
  }
}

function quadraticToCubic(
  start:
    WorldPosition,

  control:
    WorldPosition,

  end:
    WorldPosition,
): CubicBezierGeometry {
  return {
    start:
      clonePosition(start),

    control1: {
      xMm:
        start.xMm +
        2 *
        (
          control.xMm -
          start.xMm
        ) /
        3,

      yMm:
        start.yMm +
        2 *
        (
          control.yMm -
          start.yMm
        ) /
        3,
    },

    control2: {
      xMm:
        end.xMm +
        2 *
        (
          control.xMm -
          end.xMm
        ) /
        3,

      yMm:
        end.yMm +
        2 *
        (
          control.yMm -
          end.yMm
        ) /
        3,
    },

    end:
      clonePosition(end),
  }
}

function validateInput(
  input:
    ReferenceTankV2LowerBackGeometryInput,
): void {
  const {
    sideShapingBackPoint,
    backHemTwoThirdsPoint,
    backHemOneThirdPoint,
  } = input

  if (
    !isFinitePosition(sideShapingBackPoint) ||
    !isFinitePosition(backHemTwoThirdsPoint) ||
    !isFinitePosition(backHemOneThirdPoint)
  ) {
    throw new Error(
      'V2 lower-back geometry requires finite construction points.',
    )
  }

  if (
    distanceMm(
      sideShapingBackPoint,
      backHemTwoThirdsPoint,
    ) <=
    POSITION_EPSILON_MM
  ) {
    throw new Error(
      'V2 lower-back temporary guide requires distinct Side Shaping Back and Back Hem 2/3 points.',
    )
  }

  if (
    Math.abs(
      backHemTwoThirdsPoint.yMm -
      backHemOneThirdPoint.yMm,
    ) >
    POSITION_EPSILON_MM
  ) {
    throw new Error(
      'V2 lower-back hem references must share the same horizontal hem level.',
    )
  }

  if (
    !(
      backHemOneThirdPoint.xMm <
      backHemTwoThirdsPoint.xMm &&
      backHemTwoThirdsPoint.xMm <
      sideShapingBackPoint.xMm
    )
  ) {
    throw new Error(
      'V2 lower-back horizontal point order is invalid.',
    )
  }

  if (
    !(
      sideShapingBackPoint.yMm <
      backHemTwoThirdsPoint.yMm
    )
  ) {
    throw new Error(
      'V2 lower-back Side Shaping Back point must remain above the hem.',
    )
  }
}

export function createReferenceTankV2LowerBackGeometry(
  input:
    ReferenceTankV2LowerBackGeometryInput,
): ReferenceTankV2LowerBackGeometry {
  validateInput(input)

  const {
    sideShapingBackPoint:
      start,

    backHemTwoThirdsPoint:
      temporaryTarget,

    backHemOneThirdPoint:
      finalHem,
  } = input

  const guideDxMm =
    temporaryTarget.xMm -
    start.xMm

  const guideDyMm =
    temporaryTarget.yMm -
    start.yMm

  const guideLengthMm =
    Math.hypot(
      guideDxMm,
      guideDyMm,
    )

  const temporaryGuideMidpoint =
    midpoint(
      start,
      temporaryTarget,
    )

  let bowNormalUnit:
    WorldPosition = {
      xMm:
        -guideDyMm /
        guideLengthMm,

      yMm:
        guideDxMm /
        guideLengthMm,
    }

  if (
    bowNormalUnit.xMm >
    0
  ) {
    bowNormalUnit = {
      xMm:
        -bowNormalUnit.xMm,

      yMm:
        -bowNormalUnit.yMm,
    }
  }

  /*
   * Source rule:
   * the CURVE is 5 mm from the straight
   * guide at its midpoint.
   */
  const bowedCurveMidpoint =
    addScaled(
      temporaryGuideMidpoint,
      bowNormalUnit,
      REFERENCE_TANK_V2_LOWER_BACK_BOW_MM,
    )

  /*
   * For a quadratic Bezier:
   *
   * B(0.5)
   * = 0.25*S + 0.5*C + 0.25*T
   *
   * Therefore the quadratic control must
   * sit 10 mm from the guide midpoint for
   * the actual curve to bow exactly 5 mm.
   */
  const temporaryQuadraticControl =
    addScaled(
      temporaryGuideMidpoint,
      bowNormalUnit,
      2 *
      REFERENCE_TANK_V2_LOWER_BACK_BOW_MM,
    )

  /*
   * Exact subdivision of the temporary
   * quadratic at t = 0.5.
   */
  const retainedUpperQuadraticControl =
    midpoint(
      start,
      temporaryQuadraticControl,
    )

  if (
    Math.abs(
      guideDyMm,
    ) <=
    POSITION_EPSILON_MM
  ) {
    throw new Error(
      'V2 lower-back final blend cannot be solved from a horizontal temporary guide.',
    )
  }

  /*
   * The retained first segment reaches
   * bowedCurveMidpoint parallel to S->T.
   *
   * The final segment must continue that
   * tangent and arrive horizontally at
   * Back Hem 1/3.
   *
   * The unique quadratic control is the
   * intersection of those two tangent
   * lines.
   */
  const tangentScaleToHem =
    (
      finalHem.yMm -
      bowedCurveMidpoint.yMm
    ) /
    guideDyMm

  if (
    !Number.isFinite(
      tangentScaleToHem,
    ) ||
    tangentScaleToHem <=
      0
  ) {
    throw new Error(
      'V2 lower-back final blend tangent does not reach the hem in the forward drafting direction.',
    )
  }

  const finalHemQuadraticControl:
    WorldPosition = {
      xMm:
        bowedCurveMidpoint.xMm +
        guideDxMm *
        tangentScaleToHem,

      yMm:
        finalHem.yMm,
    }

  if (
    !(
      finalHem.xMm <
      finalHemQuadraticControl.xMm &&
      finalHemQuadraticControl.xMm <
      bowedCurveMidpoint.xMm
    )
  ) {
    throw new Error(
      'V2 lower-back final blend control falls outside the expected Back-side region.',
    )
  }

  return {
    temporaryGuideMidpoint:
      clonePosition(
        temporaryGuideMidpoint,
      ),

    bowNormalUnit:
      clonePosition(
        bowNormalUnit,
      ),

    bowedCurveMidpoint:
      clonePosition(
        bowedCurveMidpoint,
      ),

    temporaryQuadraticControl:
      clonePosition(
        temporaryQuadraticControl,
      ),

    retainedUpperQuadraticControl:
      clonePosition(
        retainedUpperQuadraticControl,
      ),

    finalHemQuadraticControl:
      clonePosition(
        finalHemQuadraticControl,
      ),

    temporaryFrenchCurve:
      quadraticToCubic(
        start,
        temporaryQuadraticControl,
        temporaryTarget,
      ),

    retainedUpperCurve:
      quadraticToCubic(
        start,
        retainedUpperQuadraticControl,
        bowedCurveMidpoint,
      ),

    finalHemBlendCurve:
      quadraticToCubic(
        bowedCurveMidpoint,
        finalHemQuadraticControl,
        finalHem,
      ),
  }
}
