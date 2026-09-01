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

export const REFERENCE_TANK_V2_CURVE_IDS = {
  backNeckline:
    'V2_BACK_NECKLINE',

  frontNeckline:
    'V2_FRONT_NECKLINE',
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

export interface ReferenceTankV2Construction {
  formula:
    ReferenceTankV2Formula

  neckline:
    ReferenceTankV2NecklineMetrics

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

    document,
  }
}