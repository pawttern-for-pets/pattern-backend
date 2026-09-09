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

const measurements =
  createBodyMeasurementsFromCm({
    backLengthCm: 22,
    chestGirthCm: 36,
    neckGirthCm: 27,
  })

function createPieces(
  bellyVariant: 'female' | 'male',
) {
  const construction =
    createReferenceTankV2Construction(
      measurements,
      {
        bellyVariant,
        halfBodyAllowanceMm: 10,
        shoulderLengthMm: 30,
        neckOpeningAllowanceMm: 0,
      },
    )

  return createReferenceTankV2PatternPieces(
    construction.document,
  )
}

function allEdges(
  bellyVariant: 'female' | 'male',
) {
  const pieces =
    createPieces(
      bellyVariant,
    )

  return [
    ...pieces.back.edges,
    ...pieces.frontBelly.edges,
  ]
}

describe(
  'PAWTTERN Master Block V2 edge treatments',
  () => {
    it(
      'marks exactly the four confirmed sewn edges as seams',
      () => {
        const seamEdges =
          allEdges(
            'female',
          ).filter(
            (edge) =>
              edge.treatment ===
              'seam',
          )

        expect(
          seamEdges,
        ).toHaveLength(4)

        expect(
          seamEdges.map(
            (edge) =>
              edge.geometryId,
          ).sort(),
        ).toEqual(
          [
            REFERENCE_TANK_V2_LINE_IDS
              .backShoulder,

            REFERENCE_TANK_V2_LINE_IDS
              .frontShoulder,

            REFERENCE_TANK_V2_LINE_IDS
              .backSideSeam,

            REFERENCE_TANK_V2_LINE_IDS
              .frontBellySideSeam,
          ].sort(),
        )
      },
    )

    it(
      'marks exactly the approved center lines as fold edges',
      () => {
        const foldEdges =
          allEdges(
            'female',
          ).filter(
            (edge) =>
              edge.treatment ===
              'fold',
          )

        expect(
          foldEdges,
        ).toHaveLength(3)

        expect(
          foldEdges.map(
            (edge) =>
              edge.geometryId,
          ).sort(),
        ).toEqual(
          [
            REFERENCE_TANK_V2_LINE_IDS
              .backCenterLength,

            REFERENCE_TANK_V2_LINE_IDS
              .frontCenterBodyEdge,

            REFERENCE_TANK_V2_LINE_IDS
              .frontCenterNeckExtension,
          ].sort(),
        )
      },
    )

    it(
      'leaves the remaining ten perimeter edges intentionally unclassified',
      () => {
        const unclassified =
          allEdges(
            'female',
          ).filter(
            (edge) =>
              edge.treatment ===
              undefined,
          )

        expect(
          unclassified,
        ).toHaveLength(10)
      },
    )

    it(
      'uses the same seam and fold treatments for male construction',
      () => {
        const edges =
          allEdges(
            'male',
          )

        const seamGeometryIds =
          edges
            .filter(
              (edge) =>
                edge.treatment ===
                'seam',
            )
            .map(
              (edge) =>
                edge.geometryId,
            )

        const foldGeometryIds =
          edges
            .filter(
              (edge) =>
                edge.treatment ===
                'fold',
            )
            .map(
              (edge) =>
                edge.geometryId,
            )

        expect(
          seamGeometryIds,
        ).toHaveLength(4)

        expect(
          foldGeometryIds,
        ).toHaveLength(3)

        expect(
          new Set(
            seamGeometryIds,
          ).size,
        ).toBe(4)

        expect(
          new Set(
            foldGeometryIds,
          ).size,
        ).toBe(3)
      },
    )
  },
)