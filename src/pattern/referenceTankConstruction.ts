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
  calculateReferenceTankFormula,
  type ReferenceTankFormula,
  type ReferenceTankFormulaOptions,
} from './referenceTankFormula'

export const REFERENCE_TANK_POINT_IDS = {
  backTop: 'REF_BACK_TOP',
  sideTop: 'REF_SIDE_TOP',
  frontTop: 'REF_FRONT_TOP',

  backArmhole:
    'REF_BACK_ARMHOLE',
  sideArmhole:
    'REF_SIDE_ARMHOLE',
  frontArmhole:
    'REF_FRONT_ARMHOLE',

  backBottom:
    'REF_BACK_BOTTOM',
  sideBottom:
    'REF_SIDE_BOTTOM',
  frontBottom:
    'REF_FRONT_BOTTOM',
} as const

export const REFERENCE_TANK_LINE_IDS = {
  topBack:
    'REF_TOP_BACK',

  topFront:
    'REF_TOP_FRONT',

  armholeBack:
    'REF_ARMHOLE_BACK',

  armholeFront:
    'REF_ARMHOLE_FRONT',

  bottomBack:
    'REF_BOTTOM_BACK',

  bottomFront:
    'REF_BOTTOM_FRONT',

  backCenter:
    'REF_BACK_CENTER',

  sideLine:
    'REF_SIDE_LINE',

  frontCenter:
    'REF_FRONT_CENTER',
} as const

export interface ReferenceTankConstruction {
  /*
   * Keep the calculated formula
   * values with the construction.
   *
   * This lets later layers inspect
   * exactly why each point exists.
   */
  formula:
    ReferenceTankFormula

  /*
   * Real PAWTTERN CAD geometry.
   */
  document:
    PatternDocument
}

export function createReferenceTankConstruction(
  measurements:
    BodyMeasurements,

  options:
    ReferenceTankFormulaOptions =
      {},
): ReferenceTankConstruction {
  const formula =
    calculateReferenceTankFormula(
      measurements,
      options,
    )

  const {
    backLengthMm,
    halfBodyWidthMm,
    halfBackWidthMm,
    armholeDepthYMm,
  } = formula

  /*
   * Coordinate system:
   *
   * X+ = right
   * Y+ = down
   *
   * Back center begins at:
   *
   * (0, 0)
   */

  let document =
    createEmptyDocument()

  /*
   * TOP ROW
   */

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_POINT_IDS
            .backTop,

        name:
          'Back Center Top',

        xMm: 0,
        yMm: 0,
      },
    )

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_POINT_IDS
            .sideTop,

        name:
          'Side Top',

        xMm:
          halfBackWidthMm,

        yMm: 0,
      },
    )

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_POINT_IDS
            .frontTop,

        name:
          'Front Center Top',

        xMm:
          halfBodyWidthMm,

        yMm: 0,
      },
    )

  /*
   * B / 5
   * ARMHOLE-DEPTH ROW
   */

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_POINT_IDS
            .backArmhole,

        name:
          'Back Armhole Level',

        xMm: 0,

        yMm:
          armholeDepthYMm,
      },
    )

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_POINT_IDS
            .sideArmhole,

        name:
          'Side Armhole Level',

        xMm:
          halfBackWidthMm,

        yMm:
          armholeDepthYMm,
      },
    )

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_POINT_IDS
            .frontArmhole,

        name:
          'Front Armhole Level',

        xMm:
          halfBodyWidthMm,

        yMm:
          armholeDepthYMm,
      },
    )

  /*
   * BOTTOM ROW
   *
   * Y = full Back Length.
   */

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_POINT_IDS
            .backBottom,

        name:
          'Back Center Bottom',

        xMm: 0,

        yMm:
          backLengthMm,
      },
    )

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_POINT_IDS
            .sideBottom,

        name:
          'Side Bottom',

        xMm:
          halfBackWidthMm,

        yMm:
          backLengthMm,
      },
    )

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_POINT_IDS
            .frontBottom,

        name:
          'Front Center Bottom',

        xMm:
          halfBodyWidthMm,

        yMm:
          backLengthMm,
      },
    )

  /*
   * TOP HORIZONTAL
   */

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_LINE_IDS
            .topBack,

        name:
          'Top - Half Back',

        startPointId:
          REFERENCE_TANK_POINT_IDS
            .backTop,

        endPointId:
          REFERENCE_TANK_POINT_IDS
            .sideTop,
      },
    )

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_LINE_IDS
            .topFront,

        name:
          'Top - Half Front',

        startPointId:
          REFERENCE_TANK_POINT_IDS
            .sideTop,

        endPointId:
          REFERENCE_TANK_POINT_IDS
            .frontTop,
      },
    )

  /*
   * B / 5 HORIZONTAL
   */

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_LINE_IDS
            .armholeBack,

        name:
          'Armhole Depth - Back',

        startPointId:
          REFERENCE_TANK_POINT_IDS
            .backArmhole,

        endPointId:
          REFERENCE_TANK_POINT_IDS
            .sideArmhole,
      },
    )

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_LINE_IDS
            .armholeFront,

        name:
          'Armhole Depth - Front',

        startPointId:
          REFERENCE_TANK_POINT_IDS
            .sideArmhole,

        endPointId:
          REFERENCE_TANK_POINT_IDS
            .frontArmhole,
      },
    )

  /*
   * BOTTOM HORIZONTAL
   */

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_LINE_IDS
            .bottomBack,

        name:
          'Bottom - Half Back',

        startPointId:
          REFERENCE_TANK_POINT_IDS
            .backBottom,

        endPointId:
          REFERENCE_TANK_POINT_IDS
            .sideBottom,
      },
    )

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_LINE_IDS
            .bottomFront,

        name:
          'Bottom - Half Front',

        startPointId:
          REFERENCE_TANK_POINT_IDS
            .sideBottom,

        endPointId:
          REFERENCE_TANK_POINT_IDS
            .frontBottom,
      },
    )

  /*
   * VERTICALS
   */

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_LINE_IDS
            .backCenter,

        name:
          'Back Center',

        startPointId:
          REFERENCE_TANK_POINT_IDS
            .backTop,

        endPointId:
          REFERENCE_TANK_POINT_IDS
            .backBottom,
      },
    )

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_LINE_IDS
            .sideLine,

        name:
          'Side Line',

        startPointId:
          REFERENCE_TANK_POINT_IDS
            .sideTop,

        endPointId:
          REFERENCE_TANK_POINT_IDS
            .sideBottom,
      },
    )

  document =
    addLine(
      document,
      {
        id:
          REFERENCE_TANK_LINE_IDS
            .frontCenter,

        name:
          'Front Center',

        startPointId:
          REFERENCE_TANK_POINT_IDS
            .frontTop,

        endPointId:
          REFERENCE_TANK_POINT_IDS
            .frontBottom,
      },
    )

  return {
    formula,
    document,
  }
}