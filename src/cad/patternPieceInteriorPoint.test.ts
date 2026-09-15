import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createBodyMeasurementsFromCm,
} from '../pattern/measurements'

import {
  createReferenceTankV2Construction,
} from '../pattern/referenceTankV2Construction'

import {
  createReferenceTankV2ProductionLayout,
} from '../pattern/referenceTankV2ProductionLayout'

import {
  samplePatternPieceSewingContour,
} from './patternPieceContour'

import {
  findPatternPieceInteriorPoint,
  isPointInsideClosedContour,
} from './patternPieceInteriorPoint'

function createLayout(
  bellyVariant:
    'female' |
    'male',
) {
  const measurements =
    createBodyMeasurementsFromCm({
      backLengthCm: 22,
      chestGirthCm: 36,
      neckGirthCm: 27,
    })

  const construction =
    createReferenceTankV2Construction(
      measurements,
      {
        bellyVariant,

        halfBodyAllowanceMm:
          10,

        shoulderLengthMm:
          30,

        neckOpeningAllowanceMm:
          0,
      },
    )

  return createReferenceTankV2ProductionLayout(
    construction.document,
  )
}

describe(
  'pattern piece interior point',
  () => {
    it(
      'finds an interior Back position',
      () => {
        const layout =
          createLayout(
            'female',
          )

        const result =
          findPatternPieceInteriorPoint(
            layout.document,
            layout.back,
          )

        const contour =
          samplePatternPieceSewingContour(
            layout.document,
            layout.back,
          )

        expect(
          isPointInsideClosedContour(
            result.point,
            contour.points,
          ),
        ).toBe(true)

        expect(
          result.boundaryClearanceMm,
        ).toBeGreaterThan(0)
      },
    )

    it(
      'finds an interior Female Front/Belly position',
      () => {
        const layout =
          createLayout(
            'female',
          )

        const result =
          findPatternPieceInteriorPoint(
            layout.document,
            layout.frontBelly,
          )

        const contour =
          samplePatternPieceSewingContour(
            layout.document,
            layout.frontBelly,
          )

        expect(
          isPointInsideClosedContour(
            result.point,
            contour.points,
          ),
        ).toBe(true)
      },
    )

    it(
      'finds an interior Male Front/Belly position',
      () => {
        const layout =
          createLayout(
            'male',
          )

        const result =
          findPatternPieceInteriorPoint(
            layout.document,
            layout.frontBelly,
          )

        const contour =
          samplePatternPieceSewingContour(
            layout.document,
            layout.frontBelly,
          )

        expect(
          isPointInsideClosedContour(
            result.point,
            contour.points,
          ),
        ).toBe(true)
      },
    )

    it(
      'returns finite coordinates and clearance',
      () => {
        const layout =
          createLayout(
            'female',
          )

        for (
          const piece of [
            layout.back,
            layout.frontBelly,
          ]
        ) {
          const result =
            findPatternPieceInteriorPoint(
              layout.document,
              piece,
            )

          expect(
            Number.isFinite(
              result.point.xMm,
            ),
          ).toBe(true)

          expect(
            Number.isFinite(
              result.point.yMm,
            ),
          ).toBe(true)

          expect(
            Number.isFinite(
              result.boundaryClearanceMm,
            ),
          ).toBe(true)
        }
      },
    )

    it(
      'does not mutate the production layout',
      () => {
        const layout =
          createLayout(
            'female',
          )

        const before =
          JSON.stringify(
            layout,
          )

        findPatternPieceInteriorPoint(
          layout.document,
          layout.back,
        )

        findPatternPieceInteriorPoint(
          layout.document,
          layout.frontBelly,
        )

        expect(
          JSON.stringify(
            layout,
          ),
        ).toBe(
          before,
        )
      },
    )
  },
)