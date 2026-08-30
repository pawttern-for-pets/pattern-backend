import {
  addPoint,
  type PatternDocument,
} from '../cad/document'

import type {
  BodyMeasurements,
} from './measurements'

import {
  createReferenceTankNeckConstruction,
} from './referenceTankNeckConstruction'

import type {
  ReferenceTankFormula,
  ReferenceTankFormulaOptions,
} from './referenceTankFormula'

export const
  REFERENCE_TANK_ARMHOLE_POINT_IDS = {
    frontInset:
      'REF_FRONT_ARMHOLE_INSET',
  } as const

export interface ReferenceTankArmholeConstruction {
  formula:
    ReferenceTankFormula

  document:
    PatternDocument
}

function validateArmholeReference(
  formula:
    ReferenceTankFormula,
): void {
  /*
   * The C/10 - 1 cm reference
   * must remain inside the
   * HALF FRONT portion.
   */
  if (
    formula.frontArmholeInsetMm >=
    formula.halfFrontWidthMm
  ) {
    throw new Error(
      'Front armhole inset extends beyond the half-front construction area.',
    )
  }
}

export function createReferenceTankArmholeConstruction(
  measurements:
    BodyMeasurements,

  options:
    ReferenceTankFormulaOptions =
      {},
): ReferenceTankArmholeConstruction {
  const base =
    createReferenceTankNeckConstruction(
      measurements,
      options,
    )

  const {
    formula,
  } = base

  validateArmholeReference(
    formula,
  )

  let document =
    base.document

  /*
   * FRONT ARMHOLE REFERENCE
   *
   * Video formula:
   *
   * C / 10 - 1 cm
   *
   * It is measured inward
   * from Front Center along
   * the B/5 armhole-depth line.
   */

  const frontInsetXMm =
    formula.halfBodyWidthMm -
    formula.frontArmholeInsetMm

  document =
    addPoint(
      document,
      {
        id:
          REFERENCE_TANK_ARMHOLE_POINT_IDS
            .frontInset,

        name:
          'Front Armhole Inset',

        xMm:
          frontInsetXMm,

        yMm:
          formula.armholeDepthYMm,
      },
    )

  /*
   * The video raises a temporary
   * guide from this point but does
   * not provide its mathematical
   * height.
   *
   * We do NOT invent that geometry.
   * The shoulder construction will
   * establish the next reliable
   * armhole reference.
   */

  return {
    formula,
    document,
  }
}