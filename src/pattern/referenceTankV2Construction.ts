import {
  addLine,
  addPoint,
  createEmptyDocument,
  type PatternDocument,
} from '../cad/document'

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
 * Construction geometry based primarily
 * on Video Reference 2.
 *
 * X+ = right
 * Y+ = down
 *
 * IMPORTANT:
 *
 * The 3W/5 position is treated as the
 * COMMON ARMPIT point.
 *
 * We deliberately do NOT draw the old
 * full-height "Side Line" yet because
 * Video 2 constructs the lower-body
 * shaping separately later.
 */

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

  commonArmpit:
    'V2_COMMON_ARMPIT',

  frontArmGuide:
    'V2_FRONT_ARM_GUIDE',

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
} as const

export interface ReferenceTankV2Construction {
  formula:
    ReferenceTankV2Formula

  document:
    PatternDocument
}

function validateV2Construction(
  formula: ReferenceTankV2Formula,
): void {
  /*
   * VIDEO 2:
   *
   * Back Arm Guide
   * must fall before Common Armpit.
   */
  if (
    formula.backArmGuideXMm <= 0 ||
    formula.backArmGuideXMm >=
      formula.commonArmpitXMm
  ) {
    throw new Error(
      'V2 back armhole guide does not fall before the common armpit.',
    )
  }

  /*
   * Front Arm Guide must fall after
   * Common Armpit but before
   * Front Center.
   */
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

  /*
   * Back side-neck must remain
   * inside the drafting width.
   */
  if (
    formula.backSideNeck.xMm <= 0 ||
    formula.backSideNeck.xMm >=
      formula.halfBodyWidthMm
  ) {
    throw new Error(
      'V2 back side-neck falls outside the construction width.',
    )
  }

  /*
   * Front side-neck must also remain
   * inside the drafting width.
   */
  if (
    formula.frontSideNeck.xMm <= 0 ||
    formula.frontSideNeck.xMm >=
      formula.halfBodyWidthMm
  ) {
    throw new Error(
      'V2 front side-neck falls outside the construction width.',
    )
  }

  /*
   * Front Neck Center must remain
   * above the B/5 armhole-depth row.
   */
  if (
    formula.frontNeckCenter.yMm >=
    formula.armholeDepthMm
  ) {
    throw new Error(
      'V2 Front Neck Center must remain above the armhole-depth line.',
    )
  }
}

export function createReferenceTankV2Construction(
  measurements: BodyMeasurements,
  options: ReferenceTankV2FormulaOptions,
): ReferenceTankV2Construction {
  const formula =
    createReferenceTankV2Formula(
      measurements,
      options,
    )

  validateV2Construction(formula)

  let document =
    createEmptyDocument()

  /*
   * --------------------------------
   * BACK CENTER
   * --------------------------------
   *
   * Origin:
   *
   * (0, 0)
   *
   * Back Length ends at:
   *
   * (0, B)
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

      xMm: 0,

      yMm:
        formula.backLengthMm,
    })

  /*
   * --------------------------------
   * B / 5 ARMHOLE-DEPTH ROW
   * --------------------------------
   */

  document =
    addPoint(document, {
      id:
        REFERENCE_TANK_V2_POINT_IDS
          .backArmholeLevel,

      name:
        'V2 Back Armhole Level',

      xMm: 0,

      yMm:
        formula.armholeDepthMm,
    })

  /*
   * Video 2:
   *
   * Back armhole guide:
   *
   * 2W/5 + 0.5 cm
   */

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
   * Video 2:
   *
   * Common Armpit:
   *
   * X = 3W/5
   * Y = B/5
   *
   * Both future armhole curves
   * terminate here.
   */

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

  /*
   * Video 2:
   *
   * Front armhole guide:
   *
   * 4W/5 + 0.5 cm
   */

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
   * --------------------------------
   * BACK NECK
   * --------------------------------
   *
   * Width:
   *
   * N / 4
   *
   * Rise:
   *
   * N / 8
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

      yMm: 0,
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

  /*
   * --------------------------------
   * BACK SHOULDER
   * --------------------------------
   *
   * Video 2:
   *
   * Exactly 45 degrees.
   *
   * RIGHT + DOWN
   */

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
   * --------------------------------
   * FRONT NECK
   * --------------------------------
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

  /*
   * Horizontal N/5 guide base.
   */

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

  /*
   * N/10 upward from the
   * front neck-width base.
   */

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

  /*
   * --------------------------------
   * FRONT SHOULDER
   * --------------------------------
   *
   * Video 2:
   *
   * Exactly 45 degrees.
   *
   * LEFT + DOWN
   */

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
   * =================================
   * CONSTRUCTION LINES
   * =================================
   */

  /*
   * Full Back Length reference.
   */

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

  /*
   * Complete B/5 armhole-depth line.
   *
   * We deliberately use ONE line
   * instead of artificially splitting
   * it into "Back" and "Front".
   *
   * Video 2 treats the full width as
   * one five-part construction.
   */

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

  /*
   * BACK NECK GUIDES
   */

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

  /*
   * BACK 45° SHOULDER
   */

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

  /*
   * FRONT CENTER NECK EXTENSION
   *
   * The line is drawn only between
   * Front Neck Center and the B/5
   * reference row.
   */

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

  /*
   * FRONT NECK GUIDES
   */

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

  /*
   * FRONT 45° SHOULDER
   */

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
    document,
  }
}