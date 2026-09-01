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
   * Important construction points.
   */
  backNeckCenter:
    PatternPointMm

  backSideNeck:
    PatternPointMm

  backShoulderOuter:
    PatternPointMm

  commonArmpit:
    PatternPointMm

  frontNeckCenter:
    PatternPointMm

  frontSideNeck:
    PatternPointMm

  frontShoulderOuter:
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

    backNeckCenter,

    backSideNeck,

    backShoulderOuter,

    commonArmpit,

    frontNeckCenter,

    frontSideNeck,

    frontShoulderOuter,
  }
}