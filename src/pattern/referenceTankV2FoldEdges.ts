import {
  REFERENCE_TANK_V2_LINE_IDS,
} from './referenceTankV2Construction'

export const REFERENCE_TANK_V2_BACK_FOLD_LINE_IDS = [
  REFERENCE_TANK_V2_LINE_IDS
    .backCenterLength,
] as const

export const REFERENCE_TANK_V2_FRONT_BELLY_FOLD_LINE_IDS = [
  REFERENCE_TANK_V2_LINE_IDS
    .frontCenterBodyEdge,

  REFERENCE_TANK_V2_LINE_IDS
    .frontCenterNeckExtension,
] as const

export const REFERENCE_TANK_V2_FOLD_LINE_IDS = [
  ...REFERENCE_TANK_V2_BACK_FOLD_LINE_IDS,
  ...REFERENCE_TANK_V2_FRONT_BELLY_FOLD_LINE_IDS,
] as const

const BACK_FOLD_LINE_ID_SET =
  new Set<string>(
    REFERENCE_TANK_V2_BACK_FOLD_LINE_IDS,
  )

const FRONT_BELLY_FOLD_LINE_ID_SET =
  new Set<string>(
    REFERENCE_TANK_V2_FRONT_BELLY_FOLD_LINE_IDS,
  )

const FOLD_LINE_ID_SET =
  new Set<string>(
    REFERENCE_TANK_V2_FOLD_LINE_IDS,
  )

export function isReferenceTankV2BackFoldLineId(
  lineId: string,
): boolean {
  return BACK_FOLD_LINE_ID_SET.has(
    lineId,
  )
}

export function isReferenceTankV2FrontBellyFoldLineId(
  lineId: string,
): boolean {
  return FRONT_BELLY_FOLD_LINE_ID_SET.has(
    lineId,
  )
}

export function isReferenceTankV2FoldLineId(
  lineId: string,
): boolean {
  return FOLD_LINE_ID_SET.has(
    lineId,
  )
}