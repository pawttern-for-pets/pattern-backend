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
   * inferred from nominal S/M/L sizes yet.
   *
   * Reference checkpoints currently used:
   * S  = 25 mm
   * M  = 30 mm
   * L  = 40 mm
   * XL = 45 mm
   */
  shoulderLengthMm:
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
   * Back side-neck:
   *
   * width = N/4
   * rise  = N/8
   */
  const backSideNeck:
    PatternPointMm = {
      xMm:
        neckGirthMm / 4,

      yMm:
        -neckGirthMm / 8,
    }

  /*
   * VIDEO 2 SHOULDER
   *
   * Both shoulders are exactly 45 degrees.
   *
   * At 45 degrees:
   *
   * dx = L / sqrt(2)
   * dy = L / sqrt(2)
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
   * rise upward from armhole-depth line:
   *
   * B/2 - 1 cm
   *
   * Therefore:
   *
   * Y =
   * B/5 - (B/2 - 10 mm)
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
   * FRONT SIDE-NECK
   *
   * width = N/5 toward the left
   * rise  = N/10 upward
   */
  const frontSideNeck:
    PatternPointMm = {
      xMm:
        halfBodyWidthMm -
        neckGirthMm / 5,

      yMm:
        frontNeckCenterY -
        neckGirthMm / 10,
    }

  /*
   * FRONT SHOULDER
   *
   * From Front Side-Neck:
   * LEFT + DOWN
   *
   * This is NOT a full mirror
   * of the back because the front
   * neck construction has its own
   * vertical position.
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