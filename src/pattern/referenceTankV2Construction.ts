import {
  addCurve,
  addLine,
  addPoint,
  createEmptyDocument,
  type PatternDocument,
} from '../cad/document'

import {
  approximateCubicBezierLengthMm,
  type CubicBezierGeometry,
} from '../cad/bezier'

import {
  cubicBezierCurveLengthMm,
} from '../cad/curves'

import type {
  WorldPosition,
} from '../cad/coordinates'

import type {
  BodyMeasurements,
} from './measurements'

import {
  createReferenceTankV2Formula,
  type ReferenceTankV2Formula,
  type ReferenceTankV2FormulaOptions,
} from './referenceTankV2Formula'

/*
 * PAWTTERN MASTER BLOCK V2
 *
 * Primary drafting authority:
 * Video Reference 2.
 *
 * X+ = right
 * Y+ = down
 */

export const
  REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS =
    1000

export const
  REFERENCE_TANK_V2_ARMHOLE_LENGTH_SEGMENTS =
    1000

const QUARTER_ELLIPSE_KAPPA =
  4 *
  (
    Math.sqrt(2) -
    1
  ) /
  3

export const REFERENCE_TANK_V2_POINT_IDS = {
  backNeckCenter:
    'V2_BACK_NECK_CENTER',

  backNeckWidthBase:
    'V2_BACK_NECK_WIDTH_BASE',

  backSideNeck:
    'V2_BACK_SIDE_NECK',

  backShoulderOuter:
    'V2_BACK_SHOULDER_OUTER',

  backArmholeLevel:
    'V2_BACK_ARMHOLE_LEVEL',

  backArmGuide:
    'V2_BACK_ARM_GUIDE',

  backArmholePivot:
    'V2_BACK_ARMHOLE_PIVOT',

  commonArmpit:
    'V2_COMMON_ARMPIT',

  frontArmGuide:
    'V2_FRONT_ARM_GUIDE',

  frontArmholePivot:
    'V2_FRONT_ARMHOLE_PIVOT',

  frontArmholeLevel:
    'V2_FRONT_ARMHOLE_LEVEL',

  frontNeckCenter:
    'V2_FRONT_NECK_CENTER',

  frontNeckWidthBase:
    'V2_FRONT_NECK_WIDTH_BASE',

  frontSideNeck:
    'V2_FRONT_SIDE_NECK',

  frontShoulderOuter:
    'V2_FRONT_SHOULDER_OUTER',

  backBottom:
    'V2_BACK_BOTTOM',

  sideAxisTwoFifths:
    'V2_SIDE_AXIS_TWO_FIFTHS',

  sideAxisThreeFifths:
    'V2_SIDE_AXIS_THREE_FIFTHS',

  sideAxisFourFifths:
    'V2_SIDE_AXIS_FOUR_FIFTHS',

  sideShapingBack:
    'V2_SIDE_SHAPING_BACK',

  sideShapingBelly:
    'V2_SIDE_SHAPING_BELLY',

  backHemOneThird:
    'V2_BACK_HEM_ONE_THIRD',

  backHemTwoThirds:
    'V2_BACK_HEM_TWO_THIRDS',

  femaleBellyEndpoint:
    'V2_FEMALE_BELLY_ENDPOINT',

  maleBellyDefaultEndpoint:
    'V2_MALE_BELLY_DEFAULT_ENDPOINT',

  maleBellyUpperReference:
    'V2_MALE_BELLY_UPPER_REFERENCE',
} as const

export const REFERENCE_TANK_V2_LINE_IDS = {
  backCenterLength:
    'V2_BACK_CENTER_LENGTH',

  armholeDepth:
    'V2_ARMHOLE_DEPTH',

  backNeckWidthGuide:
    'V2_BACK_NECK_WIDTH_GUIDE',

  backNeckRiseGuide:
    'V2_BACK_NECK_RISE_GUIDE',

  backShoulder:
    'V2_BACK_SHOULDER',

  frontCenterNeckExtension:
    'V2_FRONT_CENTER_NECK_EXTENSION',

  frontNeckWidthGuide:
    'V2_FRONT_NECK_WIDTH_GUIDE',

  frontNeckRiseGuide:
    'V2_FRONT_NECK_RISE_GUIDE',

  frontShoulder:
    'V2_FRONT_SHOULDER',

  lowerBodySideAxis:
    'V2_LOWER_BODY_SIDE_AXIS',

  sideShapingWidth:
    'V2_SIDE_SHAPING_WIDTH',
} as const

export const REFERENCE_TANK_V2_CURVE_IDS = {
  backNeckline:
    'V2_BACK_NECKLINE',

  frontNeckline:
    'V2_FRONT_NECKLINE',

  backArmholeShoulderToPivot:
    'V2_BACK_ARMHOLE_SHOULDER_TO_PIVOT',

  backArmholePivotToCommon:
    'V2_BACK_ARMHOLE_PIVOT_TO_COMMON',

  frontArmholeCommonToPivot:
    'V2_FRONT_ARMHOLE_COMMON_TO_PIVOT',

  frontArmholePivotToShoulder:
    'V2_FRONT_ARMHOLE_PIVOT_TO_SHOULDER',
} as const

export interface ReferenceTankV2ConstructionOptions
  extends ReferenceTankV2FormulaOptions {
  neckOpeningAllowanceMm:
    number
}

export interface ReferenceTankV2NecklineMetrics {
  backHalfNeckLengthMm:
    number

  frontHalfNeckLengthMm:
    number

  finishedNeckOpeningMm:
    number

  minimumNeckOpeningMm:
    number
}

export interface ReferenceTankV2ArmholeMetrics {
  /*
   * Seam-line geometry only.
   *
   * No seam allowance or arbitrary
   * fit/safety threshold is applied.
   */
  backArmholeLengthMm:
    number

  frontArmholeLengthMm:
    number

  oneSideArmholeOpeningMm:
    number
}

export interface ReferenceTankV2Construction {
  formula:
    ReferenceTankV2Formula

  neckline:
    ReferenceTankV2NecklineMetrics

  armhole:
    ReferenceTankV2ArmholeMetrics

  document:
    PatternDocument
}

interface NecklineControls {
  backControl1:
    WorldPosition

  backControl2:
    WorldPosition

  frontControl1:
    WorldPosition

  frontControl2:
    WorldPosition
}

interface CubicSegmentControls {
  control1:
    WorldPosition

  control2:
    WorldPosition
}

interface NaturalSplineSegment
  extends CubicSegmentControls {
  start:
    WorldPosition

  end:
    WorldPosition
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

function addScaledPosition(
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

function subtractScaledPosition(
  base:
    WorldPosition,

  direction:
    WorldPosition,

  scale:
    number,
): WorldPosition {
  return {
    xMm:
      base.xMm -
      direction.xMm *
        scale,

    yMm:
      base.yMm -
      direction.yMm *
        scale,
  }
}

/*
 * NATURAL CUBIC SPLINE THROUGH THE
 * VIDEO-2 ARMHOLE REFERENCES
 *
 * Why this is used:
 *
 * The physical tutorial shapes one
 * continuous armhole with a French
 * curve. PAWTTERN's approved digital
 * translation interpolates the two
 * vertical pivots and Common Armpit
 * between the shoulder endpoints.
 *
 * The lower Back/Front Arm Guide points
 * remain construction references only;
 * they are not forced onto the finished
 * armhole edge.
 *
 * A natural cubic spline gives PAWTTERN
 * a deterministic digital equivalent:
 *
 * - every Video-2 reference is hit
 *   exactly;
 * - first derivative is continuous;
 * - second derivative is continuous;
 * - both pivots and Common Armpit are
 *   smooth glide-through points rather
 *   than corners.
 *
 * Chord-length parameterization is used
 * so uneven spacing between drafting
 * references does not distort the curve.
 */
function createNaturalCubicSplineSegments(
  points:
    readonly WorldPosition[],
): NaturalSplineSegment[] {
  if (
    points.length <
    2
  ) {
    throw new Error(
      'A natural cubic spline requires at least two points.',
    )
  }

  const intervalCount =
    points.length -
    1

  const h: number[] = []

  for (
    let index =
      0;
    index <
      intervalCount;
    index +=
      1
  ) {
    const intervalLength =
      distanceMm(
        points[index],
        points[index + 1],
      )

    if (
      !Number.isFinite(
        intervalLength,
      ) ||
      intervalLength <=
        0
    ) {
      throw new Error(
        'V2 armhole spline contains coincident or invalid reference points.',
      )
    }

    h.push(
      intervalLength,
    )
  }

  /*
   * Natural boundary conditions:
   *
   * second derivative at the two
   * shoulder endpoints = 0.
   *
   * We solve the interior second
   * derivatives with the Thomas
   * tridiagonal algorithm.
   */
  const secondDerivatives:
    WorldPosition[] =
      points.map(
        () => ({
          xMm:
            0,

          yMm:
            0,
        }),
      )

  const interiorCount =
    points.length -
    2

  if (
    interiorCount >
    0
  ) {
    const lower: number[] =
      new Array(
        interiorCount,
      ).fill(0)

    const diagonal: number[] =
      new Array(
        interiorCount,
      ).fill(0)

    const upper: number[] =
      new Array(
        interiorCount,
      ).fill(0)

    const rhs:
      WorldPosition[] =
        new Array(
          interiorCount,
        ).fill(null)
          .map(
            () => ({
              xMm:
                0,

              yMm:
                0,
            }),
          )

    for (
      let interiorIndex =
        0;
      interiorIndex <
        interiorCount;
      interiorIndex +=
        1
    ) {
      const pointIndex =
        interiorIndex +
        1

      const previousH =
        h[
          pointIndex -
          1
        ]

      const nextH =
        h[
          pointIndex
        ]

      lower[
        interiorIndex
      ] =
        previousH

      diagonal[
        interiorIndex
      ] =
        2 *
        (
          previousH +
          nextH
        )

      upper[
        interiorIndex
      ] =
        nextH

      rhs[
        interiorIndex
      ] = {
        xMm:
          6 *
          (
            (
              points[
                pointIndex +
                1
              ].xMm -
              points[
                pointIndex
              ].xMm
            ) /
              nextH -
            (
              points[
                pointIndex
              ].xMm -
              points[
                pointIndex -
                1
              ].xMm
            ) /
              previousH
          ),

        yMm:
          6 *
          (
            (
              points[
                pointIndex +
                1
              ].yMm -
              points[
                pointIndex
              ].yMm
            ) /
              nextH -
            (
              points[
                pointIndex
              ].yMm -
              points[
                pointIndex -
                1
              ].yMm
            ) /
              previousH
          ),
      }
    }

    /*
     * Natural boundaries mean the
     * outside second derivatives are
     * zero, so the first and last
     * off-diagonal terms need no
     * additional RHS contribution.
     */
    for (
      let index =
        1;
      index <
        interiorCount;
      index +=
        1
    ) {
      const factor =
        lower[index] /
        diagonal[
          index -
          1
        ]

      diagonal[index] -=
        factor *
        upper[
          index -
          1
        ]

      rhs[index] = {
        xMm:
          rhs[index].xMm -
          factor *
            rhs[
              index -
              1
            ].xMm,

        yMm:
          rhs[index].yMm -
          factor *
            rhs[
              index -
              1
            ].yMm,
      }
    }

    const solved:
      WorldPosition[] =
        new Array(
          interiorCount,
        ).fill(null)
          .map(
            () => ({
              xMm:
                0,

              yMm:
                0,
            }),
          )

    const lastInteriorIndex =
      interiorCount -
      1

    solved[
      lastInteriorIndex
    ] = {
      xMm:
        rhs[
          lastInteriorIndex
        ].xMm /
        diagonal[
          lastInteriorIndex
        ],

      yMm:
        rhs[
          lastInteriorIndex
        ].yMm /
        diagonal[
          lastInteriorIndex
        ],
    }

    for (
      let index =
        lastInteriorIndex -
        1;
      index >=
        0;
      index -=
        1
    ) {
      solved[index] = {
        xMm:
          (
            rhs[index].xMm -
            upper[index] *
              solved[
                index +
                1
              ].xMm
          ) /
          diagonal[index],

        yMm:
          (
            rhs[index].yMm -
            upper[index] *
              solved[
                index +
                1
              ].yMm
          ) /
          diagonal[index],
      }
    }

    for (
      let interiorIndex =
        0;
      interiorIndex <
        interiorCount;
      interiorIndex +=
        1
    ) {
      secondDerivatives[
        interiorIndex +
        1
      ] =
        solved[
          interiorIndex
        ]
    }
  }

  const segments:
    NaturalSplineSegment[] =
      []

  for (
    let index =
      0;
    index <
      intervalCount;
    index +=
      1
  ) {
    const start =
      points[index]

    const end =
      points[
        index +
        1
      ]

    const intervalLength =
      h[index]

    const startSecond =
      secondDerivatives[
        index
      ]

    const endSecond =
      secondDerivatives[
        index +
        1
      ]

    /*
     * Natural-spline endpoint
     * derivatives for this interval.
     */
    const startDerivative:
      WorldPosition = {
        xMm:
          (
            end.xMm -
            start.xMm
          ) /
            intervalLength -
          intervalLength *
          (
            2 *
              startSecond.xMm +
            endSecond.xMm
          ) /
            6,

        yMm:
          (
            end.yMm -
            start.yMm
          ) /
            intervalLength -
          intervalLength *
          (
            2 *
              startSecond.yMm +
            endSecond.yMm
          ) /
            6,
      }

    const endDerivative:
      WorldPosition = {
        xMm:
          (
            end.xMm -
            start.xMm
          ) /
            intervalLength +
          intervalLength *
          (
            startSecond.xMm +
            2 *
              endSecond.xMm
          ) /
            6,

        yMm:
          (
            end.yMm -
            start.yMm
          ) /
            intervalLength +
          intervalLength *
          (
            startSecond.yMm +
            2 *
              endSecond.yMm
          ) /
            6,
      }

    /*
     * Exact cubic-spline interval
     * -> cubic Bezier conversion.
     *
     * The spline derivative is with
     * respect to chord-length parameter,
     * therefore multiply by h/3.
     */
    const control1 =
      addScaledPosition(
        start,
        startDerivative,
        intervalLength /
          3,
      )

    const control2 =
      subtractScaledPosition(
        end,
        endDerivative,
        intervalLength /
          3,
      )

    segments.push({
      start,

      end,

      control1,

      control2,
    })
  }

  return segments
}

function createArmholeSplineSegments(
  formula:
    ReferenceTankV2Formula,
): NaturalSplineSegment[] {
  return (
    createNaturalCubicSplineSegments([
      /*
       * VIDEO-2 CONTINUOUS ARMHOLE PATH
       *
       * The finished armhole uses five
       * authoritative on-curve points:
       *
       * Back Shoulder Outer
       * -> Back Armhole Pivot
       * -> Common Armpit
       * -> Front Armhole Pivot
       * -> Front Shoulder Outer
       *
       * Back/Front Arm Guide bottom
       * intersections remain visible
       * construction references only.
       */
      formula.backShoulderOuter,

      formula.backArmholePivot,

      formula.commonArmpit,

      formula.frontArmholePivot,

      formula.frontShoulderOuter,
    ])
  )
}

function validateNeckOpeningAllowance(
  neckOpeningAllowanceMm:
    number,
): void {
  if (
    !Number.isFinite(
      neckOpeningAllowanceMm,
    ) ||
    neckOpeningAllowanceMm < 0
  ) {
    throw new Error(
      'V2 neck opening allowance must be a finite number greater than or equal to 0 mm.',
    )
  }
}

function validateV2Geometry(
  formula:
    ReferenceTankV2Formula,
): void {
  if (
    formula.backArmGuideXMm <= 0 ||
    formula.backArmGuideXMm >=
      formula.commonArmpitXMm
  ) {
    throw new Error(
      'V2 back armhole guide does not fall before the common armpit.',
    )
  }

  if (
    formula.frontArmGuideXMm <=
      formula.commonArmpitXMm ||
    formula.frontArmGuideXMm >=
      formula.halfBodyWidthMm
  ) {
    throw new Error(
      'V2 front armhole guide does not fall between the common armpit and Front Center.',
    )
  }

  if (
    formula.backSideNeck.xMm <= 0 ||
    formula.backSideNeck.xMm >=
      formula.halfBodyWidthMm
  ) {
    throw new Error(
      'V2 back side-neck falls outside the construction width.',
    )
  }

  if (
    formula.frontSideNeck.xMm <= 0 ||
    formula.frontSideNeck.xMm >=
      formula.halfBodyWidthMm
  ) {
    throw new Error(
      'V2 front side-neck falls outside the construction width.',
    )
  }

  if (
    formula.frontNeckCenter.yMm >=
      formula.armholeDepthMm
  ) {
    throw new Error(
      'V2 Front Neck Center must remain above the armhole-depth line.',
    )
  }
}

function createNecklineControls(
  formula:
    ReferenceTankV2Formula,
): NecklineControls {
  const backNeckDx =
    formula.backSideNeck.xMm -
    formula.backNeckCenter.xMm

  const backNeckDy =
    formula.backNeckCenter.yMm -
    formula.backSideNeck.yMm

  const frontNeckDx =
    formula.frontSideNeck.xMm -
    formula.frontNeckCenter.xMm

  const frontNeckDy =
    formula.frontNeckCenter.yMm -
    formula.frontSideNeck.yMm

  return {
    /*
     * BACK
     *
     * Center-neck leaves horizontally.
     *
     * Side-neck approach:
     * RIGHT + UP at 45°.
     */
    backControl1: {
      xMm:
        formula.backNeckCenter.xMm +
        QUARTER_ELLIPSE_KAPPA *
          backNeckDx,

      yMm:
        formula.backNeckCenter.yMm,
    },

    backControl2: {
      xMm:
        formula.backSideNeck.xMm -
        QUARTER_ELLIPSE_KAPPA *
          backNeckDy,

      yMm:
        formula.backSideNeck.yMm +
        QUARTER_ELLIPSE_KAPPA *
          backNeckDy,
    },

    /*
     * FRONT
     *
     * Center-neck leaves horizontally.
     *
     * Side-neck approach:
     * LEFT + UP at 45°.
     */
    frontControl1: {
      xMm:
        formula.frontNeckCenter.xMm +
        QUARTER_ELLIPSE_KAPPA *
          frontNeckDx,

      yMm:
        formula.frontNeckCenter.yMm,
    },

    frontControl2: {
      xMm:
        formula.frontSideNeck.xMm +
        QUARTER_ELLIPSE_KAPPA *
          frontNeckDy,

      yMm:
        formula.frontSideNeck.yMm +
        QUARTER_ELLIPSE_KAPPA *
          frontNeckDy,
    },
  }
}

function measureFormulaNecklineMm(
  formula:
    ReferenceTankV2Formula,
): number {
  const controls =
    createNecklineControls(
      formula,
    )

  const backGeometry:
    CubicBezierGeometry = {
      start:
        formula.backNeckCenter,

      control1:
        controls.backControl1,

      control2:
        controls.backControl2,

      end:
        formula.backSideNeck,
    }

  const frontGeometry:
    CubicBezierGeometry = {
      start:
        formula.frontNeckCenter,

      control1:
        controls.frontControl1,

      control2:
        controls.frontControl2,

      end:
        formula.frontSideNeck,
    }

  const backLengthMm =
    approximateCubicBezierLengthMm(
      backGeometry,
      REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
    )

  const frontLengthMm =
    approximateCubicBezierLengthMm(
      frontGeometry,
      REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
    )

  return (
    2 *
    (
      backLengthMm +
      frontLengthMm
    )
  )
}

function createFittedFormula(
  measurements:
    BodyMeasurements,

  options:
    ReferenceTankV2ConstructionOptions,
): ReferenceTankV2Formula {
  /*
   * Always begin from the unscaled
   * Video-2 neck construction.
   */
  const baseFormula =
    createReferenceTankV2Formula(
      measurements,
      {
        halfBodyAllowanceMm:
          options.halfBodyAllowanceMm,

        shoulderLengthMm:
          options.shoulderLengthMm,

        neckGeometryScale:
          1,
      },
    )

  validateV2Geometry(
    baseFormula,
  )

  const minimumNeckOpeningMm =
    baseFormula.neckGirthMm +
    options.neckOpeningAllowanceMm

  const baseOpeningMm =
    measureFormulaNecklineMm(
      baseFormula,
    )

  /*
   * Never shrink below Video-2 base.
   *
   * If the source geometry already
   * clears the requested minimum,
   * scale remains exactly 1.
   */
  const requiredScale =
    Math.max(
      1,
      minimumNeckOpeningMm /
        baseOpeningMm,
    )

  if (
    requiredScale === 1
  ) {
    return baseFormula
  }

  const fittedFormula =
    createReferenceTankV2Formula(
      measurements,
      {
        halfBodyAllowanceMm:
          options.halfBodyAllowanceMm,

        shoulderLengthMm:
          options.shoulderLengthMm,

        neckGeometryScale:
          requiredScale,
      },
    )

  validateV2Geometry(
    fittedFormula,
  )

  return fittedFormula
}

export function createReferenceTankV2Construction(
  measurements:
    BodyMeasurements,

  options:
    ReferenceTankV2ConstructionOptions,
): ReferenceTankV2Construction {
  validateNeckOpeningAllowance(
    options.neckOpeningAllowanceMm,
  )

  const formula =
    createFittedFormula(
      measurements,
      options,
    )

  const controls =
    createNecklineControls(
      formula,
    )

  const armholeSplineSegments =
    createArmholeSplineSegments(
      formula,
    )

  let document =
    createEmptyDocument()

  /*
   * BACK CENTER
   */

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backNeckCenter,

      name:
        'V2 Back Neck Center',

      xMm:
        formula.backNeckCenter.xMm,

      yMm:
        formula.backNeckCenter.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backBottom,

      name:
        'V2 Back Length Bottom',

      xMm:
        0,

      yMm:
        formula.backLengthMm,
    })

  /*
   * VIDEO-2 LOWER-BODY SCAFFOLD
   *
   * Keep 2B/5, 3B/5 and 4B/5 as
   * reference points on the Common
   * Armpit vertical axis instead of
   * drawing three full-width lines.
   */

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .sideAxisTwoFifths,

      name:
        'V2 Side Axis 2/5 B',

      xMm:
        formula.commonArmpitXMm,

      yMm:
        formula.backLengthTwoFifthsMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .sideAxisThreeFifths,

      name:
        'V2 Side Axis 3/5 B',

      xMm:
        formula.commonArmpitXMm,

      yMm:
        formula.backLengthThreeFifthsMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .sideAxisFourFifths,

      name:
        'V2 Side Axis 4/5 B',

      xMm:
        formula.commonArmpitXMm,

      yMm:
        formula.backLengthFourFifthsMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .sideShapingBack,

      name:
        'V2 Side Shaping Back',

      xMm:
        formula.sideShapingBackPoint.xMm,

      yMm:
        formula.sideShapingBackPoint.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .sideShapingBelly,

      name:
        'V2 Side Shaping Belly',

      xMm:
        formula.sideShapingBellyPoint.xMm,

      yMm:
        formula.sideShapingBellyPoint.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backHemOneThird,

      name:
        'V2 Back Hem 1/3',

      xMm:
        formula.backHemOneThirdPoint.xMm,

      yMm:
        formula.backHemOneThirdPoint.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backHemTwoThirds,

      name:
        'V2 Back Hem 2/3',

      xMm:
        formula.backHemTwoThirdsPoint.xMm,

      yMm:
        formula.backHemTwoThirdsPoint.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .femaleBellyEndpoint,

      name:
        'V2 Female Belly Endpoint',

      xMm:
        formula.femaleBellyEndpoint.xMm,

      yMm:
        formula.femaleBellyEndpoint.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .maleBellyDefaultEndpoint,

      name:
        'V2 Male Belly Default Endpoint',

      xMm:
        formula.maleBellyDefaultEndpoint.xMm,

      yMm:
        formula.maleBellyDefaultEndpoint.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .maleBellyUpperReference,

      name:
        'V2 Male Belly Upper Reference',

      xMm:
        formula.maleBellyUpperReference.xMm,

      yMm:
        formula.maleBellyUpperReference.yMm,
    })

  /*
   * ARMHOLE DEPTH ROW
   */

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backArmholeLevel,

      name:
        'V2 Back Armhole Level',

      xMm:
        0,

      yMm:
        formula.armholeDepthMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backArmGuide,

      name:
        'V2 Back Arm Guide',

      xMm:
        formula.backArmGuideXMm,

      yMm:
        formula.armholeDepthMm,
    })

  /*
   * VIDEO 2 BACK ARMHOLE PIVOT
   *
   * Midpoint of the vertical Back Arm
   * Guide after the guide is divided
   * into 2 equal sections.
   */
  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backArmholePivot,

      name:
        'V2 Back Armhole Pivot',

      xMm:
        formula.backArmholePivot.xMm,

      yMm:
        formula.backArmholePivot.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .commonArmpit,

      name:
        'V2 Common Armpit',

      xMm:
        formula.commonArmpit.xMm,

      yMm:
        formula.commonArmpit.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .frontArmGuide,

      name:
        'V2 Front Arm Guide',

      xMm:
        formula.frontArmGuideXMm,

      yMm:
        formula.armholeDepthMm,
    })

  /*
   * VIDEO 2 FRONT ARMHOLE PIVOT
   *
   * Lower division point of the
   * vertical Front Arm Guide after
   * the guide is divided into 3.
   *
   * This is 2/3 downward from the top,
   * or 1/3 upward from the armhole
   * depth line.
   */
  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .frontArmholePivot,

      name:
        'V2 Front Armhole Pivot',

      xMm:
        formula.frontArmholePivot.xMm,

      yMm:
        formula.frontArmholePivot.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .frontArmholeLevel,

      name:
        'V2 Front Armhole Level',

      xMm:
        formula.halfBodyWidthMm,

      yMm:
        formula.armholeDepthMm,
    })

  /*
   * BACK NECK
   */

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backNeckWidthBase,

      name:
        'V2 Back Neck Width Base',

      xMm:
        formula.backSideNeck.xMm,

      yMm:
        formula.backNeckCenter.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backSideNeck,

      name:
        'V2 Back Side Neck',

      xMm:
        formula.backSideNeck.xMm,

      yMm:
        formula.backSideNeck.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backShoulderOuter,

      name:
        'V2 Back Shoulder Outer',

      xMm:
        formula.backShoulderOuter.xMm,

      yMm:
        formula.backShoulderOuter.yMm,
    })

  /*
   * FRONT NECK
   */

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .frontNeckCenter,

      name:
        'V2 Front Neck Center',

      xMm:
        formula.frontNeckCenter.xMm,

      yMm:
        formula.frontNeckCenter.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .frontNeckWidthBase,

      name:
        'V2 Front Neck Width Base',

      xMm:
        formula.frontSideNeck.xMm,

      yMm:
        formula.frontNeckCenter.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .frontSideNeck,

      name:
        'V2 Front Side Neck',

      xMm:
        formula.frontSideNeck.xMm,

      yMm:
        formula.frontSideNeck.yMm,
    })

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .frontShoulderOuter,

      name:
        'V2 Front Shoulder Outer',

      xMm:
        formula.frontShoulderOuter.xMm,

      yMm:
        formula.frontShoulderOuter.yMm,
    })

  /*
   * NECKLINE CURVES
   */

  document =
    addCurve(document, {
      id:
        REFERENCE_TANK_V2_CURVE_IDS
          .backNeckline,

      name:
        'V2 Back Neckline',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backNeckCenter,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backSideNeck,

      control1:
        controls.backControl1,

      control2:
        controls.backControl2,
    })

  document =
    addCurve(document, {
      id:
        REFERENCE_TANK_V2_CURVE_IDS
          .frontNeckline,

      name:
        'V2 Front Neckline',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontNeckCenter,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontSideNeck,

      control1:
        controls.frontControl1,

      control2:
        controls.frontControl2,
    })

  /*
   * FIXED VIDEO-2 ARMHOLE SPLINE
   *
   * Four cubic segments form one smooth
   * logical French-curve sweep through
   * five authoritative Video-2 points.
   *
   * The Back/Front Arm Guide bottom
   * points remain construction guides
   * only and do not constrain the
   * finished armhole edge.
   */
  const [
    backShoulderToPivot,
    backPivotToCommon,
    frontCommonToPivot,
    frontPivotToShoulder,
  ] =
    armholeSplineSegments

  document =
    addCurve(document, {
      id:
        REFERENCE_TANK_V2_CURVE_IDS
          .backArmholeShoulderToPivot,

      name:
        'V2 Back Armhole Shoulder to Pivot',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backShoulderOuter,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backArmholePivot,

      control1:
        backShoulderToPivot.control1,

      control2:
        backShoulderToPivot.control2,
    })

  document =
    addCurve(document, {
      id:
        REFERENCE_TANK_V2_CURVE_IDS
          .backArmholePivotToCommon,

      name:
        'V2 Back Armhole Pivot to Common',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backArmholePivot,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .commonArmpit,

      control1:
        backPivotToCommon.control1,

      control2:
        backPivotToCommon.control2,
    })

  document =
    addCurve(document, {
      id:
        REFERENCE_TANK_V2_CURVE_IDS
          .frontArmholeCommonToPivot,

      name:
        'V2 Front Armhole Common to Pivot',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .commonArmpit,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontArmholePivot,

      control1:
        frontCommonToPivot.control1,

      control2:
        frontCommonToPivot.control2,
    })

  document =
    addCurve(document, {
      id:
        REFERENCE_TANK_V2_CURVE_IDS
          .frontArmholePivotToShoulder,

      name:
        'V2 Front Armhole Pivot to Shoulder',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontArmholePivot,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontShoulderOuter,

      control1:
        frontPivotToShoulder.control1,

      control2:
        frontPivotToShoulder.control2,
    })

  /*
   * ARMHOLE QA METRICS
   *
   * The Master Block armhole is fixed
   * formula-controlled geometry, but we
   * still measure the actual generated
   * Bézier curves for diagnostics and
   * later physical-fit validation.
   *
   * Back = Back Shoulder Outer
   *        -> Back Pivot
   *        -> Common Armpit
   *
   * Front = Common Armpit
   *         -> Front Pivot
   *         -> Front Shoulder Outer
   *
   * One-side opening is the seam-line
   * sum of Back + Front.
   *
   * No arbitrary minimum/percentage is
   * enforced here.
   */
  const backArmholeLengthMm =
    cubicBezierCurveLengthMm(
      document.curves[
        REFERENCE_TANK_V2_CURVE_IDS
          .backArmholeShoulderToPivot
      ],

      document.points,

      REFERENCE_TANK_V2_ARMHOLE_LENGTH_SEGMENTS,
    ) +
    cubicBezierCurveLengthMm(
      document.curves[
        REFERENCE_TANK_V2_CURVE_IDS
          .backArmholePivotToCommon
      ],

      document.points,

      REFERENCE_TANK_V2_ARMHOLE_LENGTH_SEGMENTS,
    )

  const frontArmholeLengthMm =
    cubicBezierCurveLengthMm(
      document.curves[
        REFERENCE_TANK_V2_CURVE_IDS
          .frontArmholeCommonToPivot
      ],

      document.points,

      REFERENCE_TANK_V2_ARMHOLE_LENGTH_SEGMENTS,
    ) +
    cubicBezierCurveLengthMm(
      document.curves[
        REFERENCE_TANK_V2_CURVE_IDS
          .frontArmholePivotToShoulder
      ],

      document.points,

      REFERENCE_TANK_V2_ARMHOLE_LENGTH_SEGMENTS,
    )

  const oneSideArmholeOpeningMm =
    backArmholeLengthMm +
    frontArmholeLengthMm

  const backHalfNeckLengthMm =
    cubicBezierCurveLengthMm(
      document.curves[
        REFERENCE_TANK_V2_CURVE_IDS
          .backNeckline
      ],

      document.points,

      REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
    )

  const frontHalfNeckLengthMm =
    cubicBezierCurveLengthMm(
      document.curves[
        REFERENCE_TANK_V2_CURVE_IDS
          .frontNeckline
      ],

      document.points,

      REFERENCE_TANK_V2_NECKLINE_LENGTH_SEGMENTS,
    )

  const finishedNeckOpeningMm =
    2 *
    (
      backHalfNeckLengthMm +
      frontHalfNeckLengthMm
    )

  const minimumNeckOpeningMm =
    formula.neckGirthMm +
    options.neckOpeningAllowanceMm

  /*
   * Final verification uses the actual
   * curves stored in PatternDocument.
   */
  if (
    finishedNeckOpeningMm +
      0.001 <
    minimumNeckOpeningMm
  ) {
    throw new Error(
      `V2 generated neckline opening (${finishedNeckOpeningMm.toFixed(3)} mm) is smaller than the required minimum (${minimumNeckOpeningMm.toFixed(3)} mm).`,
    )
  }

  /*
   * CONSTRUCTION LINES
   */

  /*
   * VIDEO-2 LOWER-BODY GUIDE LINES
   *
   * Use one vertical side axis and one
   * 2 cm shaping-width marker only.
   * Avoid full-width 2/5, 3/5 and 4/5
   * lines so the workspace stays clear.
   */
  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .lowerBodySideAxis,

      name:
        'V2 Lower Body Side Axis',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .commonArmpit,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .sideAxisFourFifths,
    })

  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .sideShapingWidth,

      name:
        'V2 Side Shaping Width 2 cm',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .sideShapingBack,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .sideShapingBelly,
    })

  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .backCenterLength,

      name:
        'V2 Back Center Length',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backNeckCenter,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backBottom,
    })

  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .armholeDepth,

      name:
        'V2 Armhole Depth',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backArmholeLevel,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontArmholeLevel,
    })

  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .backNeckWidthGuide,

      name:
        'V2 Back Neck Width Guide',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backNeckCenter,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backNeckWidthBase,
    })

  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .backNeckRiseGuide,

      name:
        'V2 Back Neck Rise Guide',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backNeckWidthBase,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backSideNeck,
    })

  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .backShoulder,

      name:
        'V2 Back Shoulder 45°',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backSideNeck,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .backShoulderOuter,
    })

  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .frontCenterNeckExtension,

      name:
        'V2 Front Center Neck Extension',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontNeckCenter,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontArmholeLevel,
    })

  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .frontNeckWidthGuide,

      name:
        'V2 Front Neck Width Guide',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontNeckCenter,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontNeckWidthBase,
    })

  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .frontNeckRiseGuide,

      name:
        'V2 Front Neck Rise Guide',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontNeckWidthBase,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontSideNeck,
    })

  document =
    addLine(document, {
      id:
        REFERENCE_TANK_V2_LINE_IDS
          .frontShoulder,

      name:
        'V2 Front Shoulder 45°',

      startPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontSideNeck,

      endPointId:
        REFERENCE_TANK_V2_POINT_IDS
          .frontShoulderOuter,
    })

  return {
    formula,

    neckline: {
      backHalfNeckLengthMm,
      frontHalfNeckLengthMm,
      finishedNeckOpeningMm,
      minimumNeckOpeningMm,
    },

    armhole: {
      backArmholeLengthMm,
      frontArmholeLengthMm,
      oneSideArmholeOpeningMm,
    },

    document,
  }
}