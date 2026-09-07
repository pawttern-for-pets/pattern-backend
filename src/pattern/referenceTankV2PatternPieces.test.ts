import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  isValidPatternPiece,
} from '../cad/patternPiece'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  createReferenceTankV2Construction,
  REFERENCE_TANK_V2_CURVE_IDS,
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

function geometryKey(
  kind: 'line' | 'curve',
  id: string,
): string {
  return `${kind}:${id}`
}

describe(
  'PAWTTERN Master Block V2 pattern pieces',
  () => {
    it(
      'extracts closed female Back and Front/Belly pieces',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const pieces =
          createReferenceTankV2PatternPieces(
            construction.document,
          )

        expect(
          pieces.back.edges,
        ).toHaveLength(9)

        expect(
          pieces.frontBelly.edges,
        ).toHaveLength(8)

        expect(
          isValidPatternPiece(
            pieces.back,
            construction.document,
          ),
        ).toBe(true)

        expect(
          isValidPatternPiece(
            pieces.frontBelly,
            construction.document,
          ),
        ).toBe(true)
      },
    )

    it(
      'extracts closed male Back and Front/Belly pieces',
      () => {
        const construction =
          createConstruction(
            'male',
          )

        const pieces =
          createReferenceTankV2PatternPieces(
            construction.document,
          )

        expect(
          pieces.back.edges,
        ).toHaveLength(9)

        expect(
          pieces.frontBelly.edges,
        ).toHaveLength(8)

        expect(
          isValidPatternPiece(
            pieces.back,
            construction.document,
          ),
        ).toBe(true)

        expect(
          isValidPatternPiece(
            pieces.frontBelly,
            construction.document,
          ),
        ).toBe(true)
      },
    )

    it(
      'locks the approved ordered Back and Front/Belly topology',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const pieces =
          createReferenceTankV2PatternPieces(
            construction.document,
          )

        expect(
          pieces.back.edges,
        ).toEqual([
          {
            kind: 'curve',
            geometryId:
              REFERENCE_TANK_V2_CURVE_IDS
                .backNeckline,
            direction: 'forward',
          },
          {
            kind: 'line',
            geometryId:
              REFERENCE_TANK_V2_LINE_IDS
                .backShoulder,
            direction: 'forward',
          },
          {
            kind: 'curve',
            geometryId:
              REFERENCE_TANK_V2_CURVE_IDS
                .backArmholeShoulderToPivot,
            direction: 'forward',
          },
          {
            kind: 'curve',
            geometryId:
              REFERENCE_TANK_V2_CURVE_IDS
                .backArmholePivotToCommon,
            direction: 'forward',
          },
          {
            kind: 'line',
            geometryId:
              REFERENCE_TANK_V2_LINE_IDS
                .backSideSeam,
            direction: 'forward',
          },
          {
            kind: 'curve',
            geometryId:
              REFERENCE_TANK_V2_CURVE_IDS
                .lowerBackUpper,
            direction: 'forward',
          },
          {
            kind: 'curve',
            geometryId:
              REFERENCE_TANK_V2_CURVE_IDS
                .lowerBackHemBlend,
            direction: 'forward',
          },
          {
            kind: 'line',
            geometryId:
              REFERENCE_TANK_V2_LINE_IDS
                .backHemCenterToOneThird,
            direction: 'reverse',
          },
          {
            kind: 'line',
            geometryId:
              REFERENCE_TANK_V2_LINE_IDS
                .backCenterLength,
            direction: 'reverse',
          },
        ])

        expect(
          pieces.frontBelly.edges,
        ).toEqual([
          {
            kind: 'curve',
            geometryId:
              REFERENCE_TANK_V2_CURVE_IDS
                .frontNeckline,
            direction: 'forward',
          },
          {
            kind: 'line',
            geometryId:
              REFERENCE_TANK_V2_LINE_IDS
                .frontShoulder,
            direction: 'forward',
          },
          {
            kind: 'curve',
            geometryId:
              REFERENCE_TANK_V2_CURVE_IDS
                .frontArmholePivotToShoulder,
            direction: 'reverse',
          },
          {
            kind: 'curve',
            geometryId:
              REFERENCE_TANK_V2_CURVE_IDS
                .frontArmholeCommonToPivot,
            direction: 'reverse',
          },
          {
            kind: 'line',
            geometryId:
              REFERENCE_TANK_V2_LINE_IDS
                .frontBellySideSeam,
            direction: 'forward',
          },
          {
            kind: 'curve',
            geometryId:
              REFERENCE_TANK_V2_CURVE_IDS
                .bellyEdge,
            direction: 'forward',
          },
          {
            kind: 'line',
            geometryId:
              REFERENCE_TANK_V2_LINE_IDS
                .frontCenterBodyEdge,
            direction: 'reverse',
          },
          {
            kind: 'line',
            geometryId:
              REFERENCE_TANK_V2_LINE_IDS
                .frontCenterNeckExtension,
            direction: 'reverse',
          },
        ])
      },
    )

    it(
      'assigns every V2 boundary entity exactly once',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const pieces =
          createReferenceTankV2PatternPieces(
            construction.document,
          )

        const assigned =
          [
            ...pieces.back.edges,
            ...pieces.frontBelly.edges,
          ].map(
            (edge) =>
              geometryKey(
                edge.kind,
                edge.geometryId,
              ),
          )

        const assignedUnique =
          new Set(
            assigned,
          )

        const expectedBoundary =
          [
            ...Object.values(
              construction.document.lines,
            )
              .filter(
                (line) =>
                  line.role ===
                  'boundary',
              )
              .map(
                (line) =>
                  geometryKey(
                    'line',
                    line.id,
                  ),
              ),

            ...Object.values(
              construction.document.curves,
            )
              .filter(
                (curve) =>
                  curve.role ===
                  'boundary',
              )
              .map(
                (curve) =>
                  geometryKey(
                    'curve',
                    curve.id,
                  ),
              ),
          ]

        expect(
          assigned,
        ).toHaveLength(17)

        expect(
          assignedUnique.size,
        ).toBe(17)

        expect(
          [...assignedUnique].sort(),
        ).toEqual(
          expectedBoundary.sort(),
        )
      },
    )

    it(
      'excludes all V2 construction geometry from finished pieces',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const pieces =
          createReferenceTankV2PatternPieces(
            construction.document,
          )

        const assigned =
          new Set(
            [
              ...pieces.back.edges,
              ...pieces.frontBelly.edges,
            ].map(
              (edge) =>
                geometryKey(
                  edge.kind,
                  edge.geometryId,
                ),
            ),
          )

        const constructionGeometry =
          [
            ...Object.values(
              construction.document.lines,
            )
              .filter(
                (line) =>
                  line.role ===
                  'construction',
              )
              .map(
                (line) =>
                  geometryKey(
                    'line',
                    line.id,
                  ),
              ),

            ...Object.values(
              construction.document.curves,
            )
              .filter(
                (curve) =>
                  curve.role ===
                  'construction',
              )
              .map(
                (curve) =>
                  geometryKey(
                    'curve',
                    curve.id,
                  ),
              ),
          ]

        expect(
          constructionGeometry,
        ).toHaveLength(7)

        expect(
          constructionGeometry.filter(
            (key) =>
              assigned.has(
                key,
              ),
          ),
        ).toHaveLength(0)
      },
    )
  },
)