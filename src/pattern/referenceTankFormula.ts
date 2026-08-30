import {
  isValidBodyMeasurements,
  type BodyMeasurements,
} from './measurements'

export interface ReferenceTankFormulaOptions {
  /*
   * Explicit adjustment to the
   * HALF-BODY construction width.
   *
   * PAWTTERN NEVER adds this
   * automatically.
   *
   * Default = 0 mm.
   *
   * To reproduce the reference
   * video's +1 cm:
   *
   * halfBodyAllowanceMm = 10
   */
  halfBodyAllowanceMm?: number
}

export interface ReferenceTankFormula {
  /*
   * Raw measurements.
   *
   * These remain unchanged.
   */
  backLengthMm: number
  chestGirthMm: number
  neckGirthMm: number

  /*
   * Explicit user-controlled
   * half-body allowance.
   */
  halfBodyAllowanceMm: number

  /*
   * Main construction block.
   */
  halfBodyWidthMm: number

  backFifthMm: number
  widthFifthMm: number

  /*
   * Half Back = 3/5
   * Half Front = 2/5
   */
  halfBackWidthMm: number
  halfFrontWidthMm: number

  sideLineXMm: number

  /*
   * Main horizontal construction
   * level from the reference video.
   */
  armholeDepthYMm: number

  /*
   * Neckline reference values.
   *
   * These are BASE values only.
   * Users will be able to adjust
   * the final neckline later.
   */
  backNeckWidthMm: number
  backNeckRiseMm: number

  frontNeckWidthMm: number
  frontNeckRiseMm: number

  /*
   * Other deterministic reference
   * values from the video.
   */
  frontCenterRiseMm: number
  frontArmholeInsetMm: number

  frontHemGuideMm: number
  sideHemGuideMm: number
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

export function calculateReferenceTankFormula(
  measurements: BodyMeasurements,

  options: ReferenceTankFormulaOptions = {},
): ReferenceTankFormula {
  if (
    !isValidBodyMeasurements(
      measurements,
    )
  ) {
    throw new Error(
      'Cannot calculate tank formula from invalid body measurements.',
    )
  }

  const halfBodyAllowanceMm =
    options.halfBodyAllowanceMm ??
    0

  if (
    !isFiniteNumber(
      halfBodyAllowanceMm,
    )
  ) {
    throw new Error(
      'Half-body allowance must be a finite number.',
    )
  }

  const {
    backLengthMm,
    chestGirthMm,
    neckGirthMm,
  } = measurements

  /*
   * Combined HALF BACK +
   * HALF FRONT construction width.
   *
   * No hidden ease.
   */
  const halfBodyWidthMm =
    chestGirthMm / 2 +
    halfBodyAllowanceMm

  if (
    halfBodyWidthMm <= 0
  ) {
    throw new Error(
      'Half-body construction width must be greater than zero.',
    )
  }

  /*
   * Reference video divides
   * both B and the half-body
   * width into fifths.
   */
  const backFifthMm =
    backLengthMm / 5

  const widthFifthMm =
    halfBodyWidthMm / 5

  /*
   * 3/5 belongs to HALF BACK.
   * 2/5 belongs to HALF FRONT.
   */
  const halfBackWidthMm =
    widthFifthMm * 3

  const halfFrontWidthMm =
    widthFifthMm * 2

  const sideLineXMm =
    halfBackWidthMm

  /*
   * B / 5
   */
  const armholeDepthYMm =
    backFifthMm

  /*
   * Back neckline:
   *
   * width = N / 4
   * rise  = N / 8
   */
  const backNeckWidthMm =
    neckGirthMm / 4

  const backNeckRiseMm =
    neckGirthMm / 8

  /*
   * Front neckline:
   *
   * width = N / 5
   * rise  = N / 10
   *
   * Note:
   * 27 / 10 = 2.7 cm.
   */
  const frontNeckWidthMm =
    neckGirthMm / 5

  const frontNeckRiseMm =
    neckGirthMm / 10

  /*
   * Reference video:
   *
   * B / 2 - 1 cm
   */
  const frontCenterRiseMm =
    backLengthMm / 2 -
    10

  /*
   * Reference video:
   *
   * C / 10 - 1 cm
   */
  const frontArmholeInsetMm =
    chestGirthMm / 10 -
    10

  if (
    frontCenterRiseMm <= 0
  ) {
    throw new Error(
      'Back length is too small for the reference front-center formula.',
    )
  }

  if (
    frontArmholeInsetMm <= 0
  ) {
    throw new Error(
      'Chest girth is too small for the reference armhole formula.',
    )
  }

  /*
   * Lower-front reference levels.
   */
  const frontHemGuideMm =
    backLengthMm *
    (2 / 5)

  const sideHemGuideMm =
    backLengthMm *
    (3 / 5)

  return {
    backLengthMm,
    chestGirthMm,
    neckGirthMm,

    halfBodyAllowanceMm,

    halfBodyWidthMm,

    backFifthMm,
    widthFifthMm,

    halfBackWidthMm,
    halfFrontWidthMm,

    sideLineXMm,

    armholeDepthYMm,

    backNeckWidthMm,
    backNeckRiseMm,

    frontNeckWidthMm,
    frontNeckRiseMm,

    frontCenterRiseMm,
    frontArmholeInsetMm,

    frontHemGuideMm,
    sideHemGuideMm,
  }
}