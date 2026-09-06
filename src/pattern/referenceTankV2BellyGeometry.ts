import type {
  CubicBezierGeometry,
} from '../cad/bezier'

import type {
  WorldPosition,
} from '../cad/coordinates'

/*
 * PAWTTERN MASTER BLOCK V2
 * BELLY / LOWER-FRONT GEOMETRY PROOF
 *
 * Source:
 * Video Reference 2 belly drafting
 * sequence around 8:08-9:17.
 *
 * Source-derived facts:
 *
 * - the finished belly edge begins at
 *   Side Shaping Belly;
 *
 * - the female version finishes at the
 *   3B/5 belly-center reference;
 *
 * - the default male version finishes at
 *   the B/2 belly-center reference;
 *
 * - the physical source uses a French
 *   curve to connect the two points.
 *
 * The source does not provide numerical
 * Bezier control coordinates.
 *
 * PAWTTERN digital translation:
 *
 * - use one quadratic curve;
 *
 * - place its control horizontally
 *   halfway between start and end;
 *
 * - place that control at the same Y as
 *   the belly-center endpoint;
 *
 * - this gives the finished curve a
 *   horizontal arrival into belly center
 *   while preserving one simple,
 *   deterministic French-curve-like
 *   sweep.
 *
 * This translation must remain separate
 * from the authoritative endpoint
 * formulas so that later visual or
 * physical evidence can refine the curve
 * law without changing B/C/N geometry.
 *
 * Pure geometry only:
 * - no PatternDocument mutation;
 * - no CAD/UI creation;
 * - no project-state mutation;
 * - no male/female selection.
 *
 * Coordinate system:
 * X+ = right
 * Y+ = down
 */

const POSITION_EPSILON_MM =
  1e-6

/*
 * Engineering translation only.
 *
 * This is NOT a measurement stated in
 * Video Reference 2.
 *
 * 0.5 means that the quadratic control
 * sits halfway across the horizontal
 * span from Side Shaping Belly to the
 * selected belly-center endpoint.
 */
export const
  REFERENCE_TANK_V2_BELLY_CONTROL_X_FRACTION =
    0.5

export interface ReferenceTankV2BellyGeometryInput {
  sideShapingBellyPoint:
    WorldPosition

  bellyEndpoint:
    WorldPosition
}

export interface ReferenceTankV2BellyGeometry {
  quadraticControl:
    WorldPosition

  finishedCurve:
    CubicBezierGeometry
}

function isFinitePosition(
  position:
    WorldPosition,
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
      clonePosition(
        start,
      ),

    control1: {
      xMm:
        start.xMm +
        (
          2 /
          3
        ) *
        (
          control.xMm -
          start.xMm
        ),

      yMm:
        start.yMm +
        (
          2 /
          3
        ) *
        (
          control.yMm -
          start.yMm
        ),
    },

    control2: {
      xMm:
        end.xMm +
        (
          2 /
          3
        ) *
        (
          control.xMm -
          end.xMm
        ),

      yMm:
        end.yMm +
        (
          2 /
          3
        ) *
        (
          control.yMm -
          end.yMm
        ),
    },

    end:
      clonePosition(
        end,
      ),
  }
}

export function createReferenceTankV2BellyGeometry(
  input:
    ReferenceTankV2BellyGeometryInput,
): ReferenceTankV2BellyGeometry {
  const {
    sideShapingBellyPoint:
      start,

    bellyEndpoint:
      end,
  } = input

  if (
    !isFinitePosition(
      start,
    ) ||
    !isFinitePosition(
      end,
    )
  ) {
    throw new Error(
      'V2 belly geometry requires finite construction points.',
    )
  }

  const horizontalSpanMm =
    end.xMm -
    start.xMm

  if (
    horizontalSpanMm <=
    POSITION_EPSILON_MM
  ) {
    throw new Error(
      'V2 belly endpoint must remain to the right of Side Shaping Belly.',
    )
  }

  /*
   * Both supported source variants rise
   * toward belly center:
   *
   * female:
   *   7B/10 -> 3B/5
   *
   * male default:
   *   7B/10 -> B/2
   *
   * Because Y+ points downward, the
   * endpoint therefore has the smaller Y.
   */
  if (
    end.yMm >=
    start.yMm -
      POSITION_EPSILON_MM
  ) {
    throw new Error(
      'V2 belly endpoint must remain above Side Shaping Belly.',
    )
  }

  /*
   * PAWTTERN digital French-curve
   * translation.
   *
   * Keeping the quadratic control at the
   * endpoint Y makes the final tangent
   * horizontal.
   */
  const quadraticControl:
    WorldPosition = {
      xMm:
        start.xMm +
        horizontalSpanMm *
        REFERENCE_TANK_V2_BELLY_CONTROL_X_FRACTION,

      yMm:
        end.yMm,
    }

  if (
    !(
      start.xMm <
        quadraticControl.xMm &&
      quadraticControl.xMm <
        end.xMm
    )
  ) {
    throw new Error(
      'V2 belly quadratic control falls outside the expected belly region.',
    )
  }

  return {
    quadraticControl:
      clonePosition(
        quadraticControl,
      ),

    finishedCurve:
      quadraticToCubic(
        start,
        quadraticControl,
        end,
      ),
  }
}