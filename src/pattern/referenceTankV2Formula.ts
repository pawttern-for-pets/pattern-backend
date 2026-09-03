import type {
  BodyMeasurements,
} from './measurements'

/*
 * PAWTTERN MASTER BLOCK V2
 *
 * Primary drafting authority:
 * Video Reference 2 - "drafting dog body"
 *
 * Units:
 * All internal values are millimeters.
 *
 * Coordinate system:
 * X+ = right
 * Y+ = down
 *
 * Back Neck Center is the construction origin:
 * (0, 0)
 */

export const PAWTTERN_MASTER_V2_RULE_VERSION =
  'PAWTTERN_MASTER_V2' as const

/*
 * VIDEO 2 LOWER-BODY SHAPING
 *
 * The tutorial marks 1 cm on each side
 * of the Common Armpit vertical axis.
 *
 * Total shaping width = 2 cm.
 *
 * This is a source-faithful internal
 * drafting constant for V2. It is not
 * a user-adjustable fit parameter.
 */
export const
  REFERENCE_TANK_V2_SIDE_SHAPING_HALF_WIDTH_MM =
    10

export interface ReferenceTankV2FormulaOptions {
  /*
   * Explicit half-body/chest allowance.
   *
   * Video 2 reference default:
   * +10 mm = +1 cm on the half body.
   *
   * This does NOT modify raw chest girth.
   */
  halfBodyAllowanceMm:
    number

  /*
   * Explicit shoulder length.
   *
   * This must NOT be automatically
   * inferred from nominal S/M/L sizes.
   */
  shoulderLengthMm:
    number

  /*
   * INTERNAL PAWTTERN PARAMETER.
   *
   * Default = 1.
   *
   * Video-2 neck proportions remain
   * unchanged at scale 1.
   *
   * Values above 1 proportionally
   * enlarge:
   *
   * Back N/4 and N/8
   * Front N/5 and N/10
   *
   * Raw Neck Girth N is NEVER changed.
   *
   * The user does not manually choose
   * this value. The neckline fitting
   * engine will calculate it.
   */
  neckGeometryScale?:
    number
}

export interface PatternPointMm {
  xMm: number
  yMm: number
}

export interface ReferenceTankV2Formula {
  ruleVersion:
    typeof PAWTTERN_MASTER_V2_RULE_VERSION

  /*
   * Raw measurements copied through
   * without mutation.
   */
  backLengthMm:
    number

  chestGirthMm:
    number

  neckGirthMm:
    number

  /*
   * Explicit drafting parameters.
   */
  halfBodyAllowanceMm:
    number

  shoulderLengthMm:
    number

  /*
   * Internal PAWTTERN neckline
   * geometry multiplier.
   *
   * Dimensionless.
   */
  neckGeometryScale:
    number

  shoulderAngleDeg:
    45

  /*
   * Main Video-2 construction values.
   */
  halfBodyWidthMm:
    number

  fifthWidthMm:
    number

  armholeDepthMm:
    number

  backArmGuideXMm:
    number

  commonArmpitXMm:
    number

  frontArmGuideXMm:
    number

  /*
   * VIDEO 2 LOWER-BODY SCAFFOLD
   *
   * These are mathematically certain
   * construction references recovered
   * from the tutorial beginning at 6:33.
   *
   * No lower-body finished curves are
   * defined here yet.
   */
  backLengthTwoFifthsMm:
    number

  backLengthThreeFifthsMm:
    number

  backLengthFourFifthsMm:
    number

  sideShapingBaseYMm:
    number

  sideShapingHalfWidthMm:
    number

  /*
   * Important construction points.
   */
  backNeckCenter:
    PatternPointMm

  backSideNeck:
    PatternPointMm

  backShoulderOuter:
    PatternPointMm

  /*
   * VIDEO 2 BACK ARMHOLE
   *
   * Midpoint of the vertical
   * Back Arm Guide.
   *
   * The back guide is divided into 2.
   */
  backArmholePivot:
    PatternPointMm

  commonArmpit:
    PatternPointMm

  /*
   * VIDEO 2 LOWER-BODY SCAFFOLD
   *
   * The Common Armpit X coordinate is
   * extended downward as the center axis
   * for the 2 cm side-shaping separation.
   */
  sideShapingBackPoint:
    PatternPointMm

  sideShapingBellyPoint:
    PatternPointMm

  /*
   * Back hem division references.
   *
   * The 2/3 point is construction-only.
   * The finished lower-back outline is
   * solved in a later milestone.
   */
  backHemOneThirdPoint:
    PatternPointMm

  backHemTwoThirdsPoint:
    PatternPointMm

  /*
   * Belly/right-edge reference points.
   *
   * Female source endpoint = 3B/5.
   *
   * Male default source endpoint = B/2.
   *
   * Male upper adjustment reference =
   * 2B/5.
   *
   * These are geometry references only;
   * no sex selector/UI is introduced yet.
   */
  femaleBellyEndpoint:
    PatternPointMm

  maleBellyDefaultEndpoint:
    PatternPointMm

  maleBellyUpperReference:
    PatternPointMm

  frontNeckCenter:
    PatternPointMm

  frontSideNeck:
    PatternPointMm

  frontShoulderOuter:
    PatternPointMm

  /*
   * VIDEO 2 FRONT ARMHOLE
   *
   * The Front Arm Guide is divided
   * into 3 equal vertical sections.
   *
   * The armhole shaping reference is
   * the lower division point:
   * 2/3 downward from the top,
   * or 1/3 upward from the
   * armhole-depth line.
   */
  frontArmholePivot:
    PatternPointMm
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

function validateMeasurements(
  measurements:
    BodyMeasurements,
): void {
  if (
    !isFiniteNumber(
      measurements.backLengthMm,
    ) ||
    measurements.backLengthMm <= 0
  ) {
    throw new Error(
      'Back length must be greater than 0 mm.',
    )
  }

  if (
    !isFiniteNumber(
      measurements.chestGirthMm,
    ) ||
    measurements.chestGirthMm <= 0
  ) {
    throw new Error(
      'Chest girth must be greater than 0 mm.',
    )
  }

  if (
    !isFiniteNumber(
      measurements.neckGirthMm,
    ) ||
    measurements.neckGirthMm <= 0
  ) {
    throw new Error(
      'Neck girth must be greater than 0 mm.',
    )
  }
}

function validateOptions(
  options:
    ReferenceTankV2FormulaOptions,
): void {
  if (
    !isFiniteNumber(
      options.halfBodyAllowanceMm,
    ) ||
    options.halfBodyAllowanceMm < 0
  ) {
    throw new Error(
      'Half-body allowance must be 0 mm or greater.',
    )
  }

  if (
    !isFiniteNumber(
      options.shoulderLengthMm,
    ) ||
    options.shoulderLengthMm <= 0
  ) {
    throw new Error(
      'Shoulder length must be greater than 0 mm.',
    )
  }

  const neckGeometryScale =
    options.neckGeometryScale ??
    1

  /*
   * PAWTTERN currently permits only
   * enlargement of the source neck
   * geometry.
   *
   * We do not automatically shrink
   * below the Video-2 base geometry.
   */
  if (
    !isFiniteNumber(
      neckGeometryScale,
    ) ||
    neckGeometryScale < 1
  ) {
    throw new Error(
      'Neck geometry scale must be a finite number greater than or equal to 1.',
    )
  }
}

export function createReferenceTankV2Formula(
  measurements:
    BodyMeasurements,

  options:
    ReferenceTankV2FormulaOptions,
): ReferenceTankV2Formula {
  validateMeasurements(
    measurements,
  )

  validateOptions(
    options,
  )

  const {
    backLengthMm,
    chestGirthMm,
    neckGirthMm,
  } = measurements

  const {
    halfBodyAllowanceMm,
    shoulderLengthMm,
  } = options

  const neckGeometryScale =
    options.neckGeometryScale ??
    1

  /*
   * VIDEO 2
   *
   * W = C/2 + explicit half-body allowance
   */
  const halfBodyWidthMm =
    chestGirthMm / 2 +
    halfBodyAllowanceMm

  /*
   * Video 2 divides W into five.
   *
   * U = W/5
   */
  const fifthWidthMm =
    halfBodyWidthMm / 5

  /*
   * Armhole-depth horizontal level:
   *
   * B/5
   */
  const armholeDepthMm =
    backLengthMm / 5

  /*
   * Video-2 upper-body guides.
   *
   * Back arm guide:
   * 2W/5 + 0.5 cm
   */
  const backArmGuideXMm =
    2 * fifthWidthMm +
    5

  /*
   * Common Side / Armpit:
   * 3W/5
   */
  const commonArmpitXMm =
    3 * fifthWidthMm

  /*
   * Front arm guide:
   * 4W/5 + 0.5 cm
   */
  const frontArmGuideXMm =
    4 * fifthWidthMm +
    5

  /*
   * VIDEO 2 LOWER-BODY SCAFFOLD
   *
   * The tutorial marks horizontal
   * Back-Length levels at:
   *
   * 2B/5
   * 3B/5
   * 4B/5
   */
  const backLengthTwoFifthsMm =
    2 * backLengthMm / 5

  const backLengthThreeFifthsMm =
    3 * backLengthMm / 5

  const backLengthFourFifthsMm =
    4 * backLengthMm / 5

  /*
   * The distance between 3B/5 and 4B/5
   * is divided into two.
   *
   * midpoint =
   * (3B/5 + 4B/5) / 2
   * = 7B/10
   */
  const sideShapingBaseYMm =
    7 * backLengthMm / 10

  const sideShapingHalfWidthMm =
    REFERENCE_TANK_V2_SIDE_SHAPING_HALF_WIDTH_MM

  /*
   * The shaping points sit 1 cm to each
   * side of the Common Armpit vertical
   * axis X = 3W/5.
   */
  const sideShapingBackPoint:
    PatternPointMm = {
      xMm:
        commonArmpitXMm -
        sideShapingHalfWidthMm,

      yMm:
        sideShapingBaseYMm,
    }

  const sideShapingBellyPoint:
    PatternPointMm = {
      xMm:
        commonArmpitXMm +
        sideShapingHalfWidthMm,

      yMm:
        sideShapingBaseYMm,
    }

  /*
   * Defensive geometry check.
   *
   * The fixed +/- 1 cm source rule must
   * remain inside the half-body block.
   * If an extremely narrow/impossible
   * input would push either point outside,
   * fail explicitly rather than silently
   * producing crossed geometry.
   */
  if (
    sideShapingBackPoint.xMm <= 0 ||
    sideShapingBellyPoint.xMm >=
      halfBodyWidthMm
  ) {
    throw new Error(
      'Video-2 side-shaping points do not fit inside the generated half-body width. Increase the body width or review the input measurements.',
    )
  }

  /*
   * BACK HEM REFERENCES
   *
   * Video 2 divides the Back-side span
   * from X = 0 to the Common Armpit axis
   * into thirds at full Back Length B.
   */
  const backHemOneThirdPoint:
    PatternPointMm = {
      xMm:
        commonArmpitXMm / 3,

      yMm:
        backLengthMm,
    }

  const backHemTwoThirdsPoint:
    PatternPointMm = {
      xMm:
        2 * commonArmpitXMm / 3,

      yMm:
        backLengthMm,
    }

  /*
   * BELLY / RIGHT-EDGE REFERENCES
   *
   * These remain separate source points
   * for later lower-body curve work.
   */
  const femaleBellyEndpoint:
    PatternPointMm = {
      xMm:
        halfBodyWidthMm,

      yMm:
        backLengthThreeFifthsMm,
    }

  const maleBellyDefaultEndpoint:
    PatternPointMm = {
      xMm:
        halfBodyWidthMm,

      yMm:
        backLengthMm / 2,
    }

  const maleBellyUpperReference:
    PatternPointMm = {
      xMm:
        halfBodyWidthMm,

      yMm:
        backLengthTwoFifthsMm,
    }

  /*
   * BACK NECK
   *
   * Back Neck Center is our origin.
   */
  const backNeckCenter:
    PatternPointMm = {
      xMm:
        0,

      yMm:
        0,
    }

  /*
   * VIDEO-2 BASE:
   *
   * width = N/4
   * rise  = N/8
   *
   * PAWTTERN may proportionally
   * enlarge those dimensions using
   * neckGeometryScale.
   *
   * Raw N remains untouched.
   */
  const backSideNeck:
    PatternPointMm = {
      xMm:
        (
          neckGirthMm / 4
        ) *
        neckGeometryScale,

      yMm:
        -(
          neckGirthMm / 8
        ) *
        neckGeometryScale,
    }

  /*
   * VIDEO 2 SHOULDER
   *
   * Both shoulders are exactly
   * 45 degrees.
   */
  const shoulderDeltaMm =
    shoulderLengthMm /
    Math.sqrt(2)

  /*
   * BACK SHOULDER
   *
   * From Back Side-Neck:
   * RIGHT + DOWN
   */
  const backShoulderOuter:
    PatternPointMm = {
      xMm:
        backSideNeck.xMm +
        shoulderDeltaMm,

      yMm:
        backSideNeck.yMm +
        shoulderDeltaMm,
    }

  /*
   * VIDEO 2 BACK ARMHOLE PIVOT
   *
   * The vertical Back Arm Guide runs
   * from:
   *
   * Y = 0
   *
   * to:
   *
   * Y = B/5
   *
   * Video 2 divides this guide into 2.
   *
   * Therefore its midpoint is:
   *
   * Y = (B/5) / 2
   *   = B/10
   *
   * X remains on the Back Arm Guide:
   *
   * X = 2W/5 + 5 mm
   */
  const backArmholePivot:
    PatternPointMm = {
      xMm:
        backArmGuideXMm,

      yMm:
        armholeDepthMm / 2,
    }

  /*
   * Common lower armhole point.
   *
   * X = 3W/5
   * Y = B/5
   */
  const commonArmpit:
    PatternPointMm = {
      xMm:
        commonArmpitXMm,

      yMm:
        armholeDepthMm,
    }

  /*
   * FRONT NECK CENTER
   *
   * Video 2:
   *
   * rise upward from armhole-depth:
   *
   * B/2 - 1 cm
   */
  const frontNeckCenterY =
    armholeDepthMm -
    (
      backLengthMm / 2 -
      10
    )

  const frontNeckCenter:
    PatternPointMm = {
      xMm:
        halfBodyWidthMm,

      yMm:
        frontNeckCenterY,
    }

  /*
   * VIDEO-2 BASE:
   *
   * width = N/5 toward left
   * rise  = N/10 upward
   *
   * PAWTTERN applies the same
   * proportional neckGeometryScale.
   */
  const frontSideNeck:
    PatternPointMm = {
      xMm:
        halfBodyWidthMm -
        (
          neckGirthMm / 5
        ) *
        neckGeometryScale,

      yMm:
        frontNeckCenterY -
        (
          neckGirthMm / 10
        ) *
        neckGeometryScale,
    }

  /*
   * FRONT SHOULDER
   *
   * From Front Side-Neck:
   * LEFT + DOWN
   */
  const frontShoulderOuter:
    PatternPointMm = {
      xMm:
        frontSideNeck.xMm -
        shoulderDeltaMm,

      yMm:
        frontSideNeck.yMm +
        shoulderDeltaMm,
    }

  /*
   * VIDEO 2 FRONT ARMHOLE PIVOT
   *
   * The Front Arm Guide runs vertically
   * from Front Neck Center level down to
   * the Armhole Depth line.
   *
   * Guide height:
   *
   * ArmholeDepth - FrontNeckCenterY
   *
   * which is equivalent to:
   *
   * B/2 - 10 mm
   *
   * Video 2 divides this guide into 3.
   *
   * The shaping reference used by the
   * armhole is the LOWER division:
   *
   * 2/3 downward from the top
   *
   * which is equivalent to:
   *
   * 1/3 upward from the bottom.
   */
  const frontArmGuideHeightMm =
    armholeDepthMm -
    frontNeckCenterY

  const frontArmholePivot:
    PatternPointMm = {
      xMm:
        frontArmGuideXMm,

      yMm:
        armholeDepthMm -
        frontArmGuideHeightMm / 3,
    }

  return {
    ruleVersion:
      PAWTTERN_MASTER_V2_RULE_VERSION,

    backLengthMm,

    chestGirthMm,

    neckGirthMm,

    halfBodyAllowanceMm,

    shoulderLengthMm,

    neckGeometryScale,

    shoulderAngleDeg:
      45,

    halfBodyWidthMm,

    fifthWidthMm,

    armholeDepthMm,

    backArmGuideXMm,

    commonArmpitXMm,

    frontArmGuideXMm,

    backLengthTwoFifthsMm,

    backLengthThreeFifthsMm,

    backLengthFourFifthsMm,

    sideShapingBaseYMm,

    sideShapingHalfWidthMm,

    backNeckCenter,

    backSideNeck,

    backShoulderOuter,

    backArmholePivot,

    commonArmpit,

    sideShapingBackPoint,

    sideShapingBellyPoint,

    backHemOneThirdPoint,

    backHemTwoThirdsPoint,

    femaleBellyEndpoint,

    maleBellyDefaultEndpoint,

    maleBellyUpperReference,

    frontNeckCenter,

    frontSideNeck,

    frontShoulderOuter,

    frontArmholePivot,
  }
}