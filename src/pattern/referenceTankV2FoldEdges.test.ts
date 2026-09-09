import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  createReferenceTankV2Construction,
  REFERENCE_TANK_V2_LINE_IDS,
} from './referenceTankV2Construction'

import {
  createReferenceTankV2PatternPieces,
} from './referenceTankV2PatternPieces'

import {
  isReferenceTankV2BackFoldLineId,
  isReferenceTankV2FoldLineId,
  isReferenceTankV2FrontBellyFoldLineId,
  REFERENCE_TANK_V2_BACK_FOLD_LINE_IDS,
  REFERENCE_TANK_V2_FOLD_LINE_IDS,
  REFERENCE_TANK_V2_FRONT_BELLY_FOLD_LINE_IDS,
} from './referenceTankV2FoldEdges'

const measurements =
  createBodyMeasurementsFromCm({
    backLengthCm: 22,
    chestGirthCm: 36,
    neckGirthCm: 27,
  })

function createConstruction(
  bellyVariant: 'female' | 'male',
) {
  return createReferenceTankV2Construction(
    measurements,
    {
      bellyVariant,
      halfBodyAllowanceMm: 10,
      shoulderLengthMm: 30,
      neckOpeningAllowanceMm: 0,
    },
  )
}

describe(
  'PAWTTERN Master Block V2 fold edges',
  () => {
    it(
      'locks the approved Back fold line',
      () => {
        expect(
          REFERENCE_TANK_V2_BACK_FOLD_LINE_IDS,
        ).toEqual([
          REFERENCE_TANK_V2_LINE_IDS
            .backCenterLength,
        ])
      },
    )

    it(
      'locks the approved Front/Belly fold path',
      () => {
        expect(
          REFERENCE_TANK_V2_FRONT_BELLY_FOLD_LINE_IDS,
        ).toEqual([
          REFERENCE_TANK_V2_LINE_IDS
            .frontCenterBodyEdge,

          REFERENCE_TANK_V2_LINE_IDS
            .frontCenterNeckExtension,
        ])
      },
    )

    it(
      'treats only the approved center lines as fold lines',
      () => {
        expect(
          REFERENCE_TANK_V2_FOLD_LINE_IDS,
        ).toEqual([
          REFERENCE_TANK_V2_LINE_IDS
            .backCenterLength,

          REFERENCE_TANK_V2_LINE_IDS
            .frontCenterBodyEdge,

          REFERENCE_TANK_V2_LINE_IDS
            .frontCenterNeckExtension,
        ])

        expect(
          isReferenceTankV2FoldLineId(
            REFERENCE_TANK_V2_LINE_IDS
              .backCenterLength,
          ),
        ).toBe(true)

        expect(
          isReferenceTankV2FoldLineId(
            REFERENCE_TANK_V2_LINE_IDS
              .frontCenterBodyEdge,
          ),
        ).toBe(true)

        expect(
          isReferenceTankV2FoldLineId(
            REFERENCE_TANK_V2_LINE_IDS
              .frontCenterNeckExtension,
          ),
        ).toBe(true)

        expect(
          isReferenceTankV2FoldLineId(
            REFERENCE_TANK_V2_LINE_IDS
              .backShoulder,
          ),
        ).toBe(false)

        expect(
          isReferenceTankV2FoldLineId(
            REFERENCE_TANK_V2_LINE_IDS
              .frontShoulder,
          ),
        ).toBe(false)

        expect(
          isReferenceTankV2FoldLineId(
            REFERENCE_TANK_V2_LINE_IDS
              .backSideSeam,
          ),
        ).toBe(false)

        expect(
          isReferenceTankV2FoldLineId(
            REFERENCE_TANK_V2_LINE_IDS
              .frontBellySideSeam,
          ),
        ).toBe(false)
      },
    )

    it(
      'assigns the Back fold line only to the Back piece',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const pieces =
          createReferenceTankV2PatternPieces(
            construction.document,
          )

        const backLineIds =
          pieces.back.edges
            .filter(
              (edge) =>
                edge.kind === 'line',
            )
            .map(
              (edge) =>
                edge.geometryId,
            )

        const frontLineIds =
          pieces.frontBelly.edges
            .filter(
              (edge) =>
                edge.kind === 'line',
            )
            .map(
              (edge) =>
                edge.geometryId,
            )

        expect(
          backLineIds.filter(
            (lineId) =>
              isReferenceTankV2BackFoldLineId(
                lineId,
              ),
          ),
        ).toEqual([
          REFERENCE_TANK_V2_LINE_IDS
            .backCenterLength,
        ])

        expect(
          frontLineIds.filter(
            (lineId) =>
              isReferenceTankV2BackFoldLineId(
                lineId,
              ),
          ),
        ).toHaveLength(0)
      },
    )

    it(
      'assigns the Front/Belly fold lines only to the Front/Belly piece for the female variant',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const pieces =
          createReferenceTankV2PatternPieces(
            construction.document,
          )

        const backLineIds =
          pieces.back.edges
            .filter(
              (edge) =>
                edge.kind === 'line',
            )
            .map(
              (edge) =>
                edge.geometryId,
            )

        const frontLineIds =
          pieces.frontBelly.edges
            .filter(
              (edge) =>
                edge.kind === 'line',
            )
            .map(
              (edge) =>
                edge.geometryId,
            )

        expect(
          frontLineIds.filter(
            (lineId) =>
              isReferenceTankV2FrontBellyFoldLineId(
                lineId,
              ),
          ).sort(),
        ).toEqual(
          [
            REFERENCE_TANK_V2_LINE_IDS
              .frontCenterBodyEdge,

            REFERENCE_TANK_V2_LINE_IDS
              .frontCenterNeckExtension,
          ].sort(),
        )

        expect(
          backLineIds.filter(
            (lineId) =>
              isReferenceTankV2FrontBellyFoldLineId(
                lineId,
              ),
          ),
        ).toHaveLength(0)
      },
    )

    it(
      'assigns the same Front/Belly fold lines for the male variant',
      () => {
        const construction =
          createConstruction(
            'male',
          )

        const pieces =
          createReferenceTankV2PatternPieces(
            construction.document,
          )

        const frontLineIds =
          pieces.frontBelly.edges
            .filter(
              (edge) =>
                edge.kind === 'line',
            )
            .map(
              (edge) =>
                edge.geometryId,
            )

        expect(
          frontLineIds.filter(
            (lineId) =>
              isReferenceTankV2FrontBellyFoldLineId(
                lineId,
              ),
          ).sort(),
        ).toEqual(
          [
            REFERENCE_TANK_V2_LINE_IDS
              .frontCenterBodyEdge,

            REFERENCE_TANK_V2_LINE_IDS
              .frontCenterNeckExtension,
          ].sort(),
        )
      },
    )
  },
)