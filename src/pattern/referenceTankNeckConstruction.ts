import {
  addLine,
  addPoint,
  type PatternDocument,
} from '../cad/document'

import type {
  BodyMeasurements,
} from './measurements'

import {
  createReferenceTankConstruction,
  REFERENCE_TANK_POINT_IDS,
} from './referenceTankConstruction'

import type {
  ReferenceTankFormula,
  ReferenceTankFormulaOptions,
} from './referenceTankFormula'

export const
  REFERENCE_TANK_NECK_POINT_IDS = {
    backNeckWidthBase:
      'REF_BACK_NECK_WIDTH_BASE',

    backNeckOuter:
      'REF_BACK_NECK_OUTER',

    frontNeckCenter:
      'REF_FRONT_NECK_CENTER',

    frontNeckWidthBase:
      'REF_FRONT_NECK_WIDTH_BASE',

    frontNeckOuter:
      'REF_FRONT_NECK_OUTER',
  } as const

export const
  REFERENCE_TANK_NECK_LINE_IDS = {
    backNeckWidthGuide:
      'REF_BACK_NECK_WIDTH_GUIDE',

    backNeckRiseGuide:
      'REF_BACK_NECK_RISE_GUIDE',

    frontCenterNeckExtension:
      'REF_FRONT_CENTER_NECK_EXTENSION',

    frontNeckWidthGuide:
      'REF_FRONT_NECK_WIDTH_GUIDE',

    frontNeckRiseGuide:
      'REF_FRONT_NECK_RISE_GUIDE',
  } as const

export interface ReferenceTankNeckConstruction {
  formula:
    ReferenceTankFormula

  document:
    PatternDocument
}

function validateNeckConstruction(
  formula:
    ReferenceTankFormula,
): void {
  /*
   * The back neck width must remain
   * inside the half-back portion.
   */
  if (
    formula.backNeckWidthMm >=
    formula.halfBackWidthMm
  ) {
    throw new Error(
      'Back neckline width extends beyond the half-back construction area.',
    )
  }

  /*
   * The front neckline width is
   * measured inward from Front Center.
   *
   * It must remain inside the
   * half-front portion rather than
   * crossing the side line.
   */
  if (
    formula.frontNeckWidthMm >=
    formula.halfFrontWidthMm
  ) {
    throw new Error(
      'Front neckline width extends beyond the half-front construction area.',
    )
  }
}

export function createReferenceTankNeckConstruction(
  measurements:
    BodyMeasurements,

  options:
    ReferenceTankFormulaOptions =
      {},
): ReferenceTankNeckConstruction {
  const base =
    createReferenceTankConstruction(
      measurements,
      options,
    )

  const {
    formula,
  } = base

  validateNeckConstruction(
    formula,
  )

  let document =
    base.document

  /*
   * ------------------------------------------------
   * BACK NECK
   * ------------------------------------------------
   *
   * Start:
   *
   * BACK_TOP = (0, 0)
   *
   * Width:
   *
   * N / 4
   *
   * Rise:
   *
   * N / 8 upward.
   *
   * Because PAWTTERN uses
   * Y+ downward:
   *
   * upward = negative Y.
   */

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_NECK_POINT_IDS
            .backNeckWidthBase,

        name:
          'Back Neck Width Base',

        xMm:
          formula.backNeckWidthMm,

        yMm:
          0,
      },
    )

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_NECK_POINT_IDS
            .backNeckOuter,

        name:
          'Back Neck Outer',

        xMm:
          formula.backNeckWidthMm,

        yMm:
          -formula.backNeckRiseMm,
      },
    )

  /*
   * ------------------------------------------------
   * FRONT NECK CENTER
   * ------------------------------------------------
   *
   * The video measures:
   *
   * B / 2 - 1 cm
   *
   * upward FROM the B/5
   * armhole-depth line.
   *
   * Therefore:
   *
   * frontNeckCenterY
   * =
   * armholeDepthY
   * -
   * frontCenterRise
   */

  const frontNeckCenterYMm =
    formula.armholeDepthYMm -
    formula.frontCenterRiseMm

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_NECK_POINT_IDS
            .frontNeckCenter,

        name:
          'Front Neck Center',

        xMm:
          formula.halfBodyWidthMm,

        yMm:
          frontNeckCenterYMm,
      },
    )

  /*
   * N / 5 is measured inward
   * from Front Center.
   *
   * Since Front Center is on
   * the right side of our block,
   * inward means decreasing X.
   */

  const frontNeckXMm =
    formula.halfBodyWidthMm -
    formula.frontNeckWidthMm

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_NECK_POINT_IDS
            .frontNeckWidthBase,

        name:
          'Front Neck Width Base',

        xMm:
          frontNeckXMm,

        yMm:
          frontNeckCenterYMm,
      },
    )

  /*
   * N / 10 upward.
   */

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_NECK_POINT_IDS
            .frontNeckOuter,

        name:
          'Front Neck Outer',

        xMm:
          frontNeckXMm,

        yMm:
          frontNeckCenterYMm -
          formula.frontNeckRiseMm,
      },
    )

  /*
   * ------------------------------------------------
   * BACK NECK GUIDE LINES
   * ------------------------------------------------
   */

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_NECK_LINE_IDS
            .backNeckWidthGuide,

        name:
          'Back Neck Width Guide',

        startPointId:
          REFERENCE_TANK_POINT_IDS
            .backTop,

        endPointId:
          REFERENCE_TANK_NECK_POINT_IDS
            .backNeckWidthBase,
      },
    )

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_NECK_LINE_IDS
            .backNeckRiseGuide,

        name:
          'Back Neck Rise Guide',

        startPointId:
          REFERENCE_TANK_NECK_POINT_IDS
            .backNeckWidthBase,

        endPointId:
          REFERENCE_TANK_NECK_POINT_IDS
            .backNeckOuter,
      },
    )

  /*
   * ------------------------------------------------
   * FRONT CENTER EXTENSION
   * ------------------------------------------------
   *
   * The basic construction already
   * contains Front Center beginning
   * at Y = 0.
   *
   * The front neck construction
   * extends that reference upward.
   *
   * We draw ONLY the missing
   * extension so we do not create
   * overlapping duplicate lines.
   */

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_NECK_LINE_IDS
            .frontCenterNeckExtension,

        name:
          'Front Center Neck Extension',

        startPointId:
          REFERENCE_TANK_NECK_POINT_IDS
            .frontNeckCenter,

        endPointId:
          REFERENCE_TANK_POINT_IDS
            .frontTop,
      },
    )

  /*
   * ------------------------------------------------
   * FRONT NECK GUIDE LINES
   * ------------------------------------------------
   */

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_NECK_LINE_IDS
            .frontNeckWidthGuide,

        name:
          'Front Neck Width Guide',

        startPointId:
          REFERENCE_TANK_NECK_POINT_IDS
            .frontNeckCenter,

        endPointId:
          REFERENCE_TANK_NECK_POINT_IDS
            .frontNeckWidthBase,
      },
    )

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_NECK_LINE_IDS
            .frontNeckRiseGuide,

        name:
          'Front Neck Rise Guide',

        startPointId:
          REFERENCE_TANK_NECK_POINT_IDS
            .frontNeckWidthBase,

        endPointId:
          REFERENCE_TANK_NECK_POINT_IDS
            .frontNeckOuter,
      },
    )

  return {
    formula,
    document,
  }
}