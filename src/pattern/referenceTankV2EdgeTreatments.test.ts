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

describe(
  'PAWTTERN Master Block V2 edge treatments',
  () => {
    it(
      'marks exactly the four confirmed sewn edges as seams',
      () => {
        const pieces =
          createPieces(
            'female',
          )

        const seamEdges =
          [
            ...pieces.back.edges,
            ...pieces.frontBelly.edges,
          ].filter(
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
      'leaves every other perimeter edge intentionally unclassified',
      () => {
        const pieces =
          createPieces(
            'female',
          )

        const unclassified =
          [
            ...pieces.back.edges,
            ...pieces.frontBelly.edges,
          ].filter(
            (edge) =>
              edge.treatment ===
              undefined,
          )

        expect(
          unclassified,
        ).toHaveLength(13)
      },
    )

    it(
      'uses the same four seam treatments for male construction',
      () => {
        const pieces =
          createPieces(
            'male',
          )

        const seamGeometryIds =
          [
            ...pieces.back.edges,
            ...pieces.frontBelly.edges,
          ]
            .filter(
              (edge) =>
                edge.treatment ===
                'seam',
            )
            .map(
              (edge) =>
                edge.geometryId,
            )

        expect(
          seamGeometryIds,
        ).toHaveLength(4)

        expect(
          new Set(
            seamGeometryIds,
          ).size,
        ).toBe(4)
      },
    )
  },
)