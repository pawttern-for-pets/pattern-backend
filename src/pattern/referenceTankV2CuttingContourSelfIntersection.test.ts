import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  findClosedPolylineSelfIntersections,
} from '../cad/closedPolylineIntersection'

import {
  samplePatternPieceSewingContour,
} from '../cad/patternPieceContour'

import {
  createSampledPatternPieceCuttingContour,
} from '../cad/sampledPatternPieceCuttingContour'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  createReferenceTankV2Construction,
} from './referenceTankV2Construction'

import {
  createReferenceTankV2ProductionLayout,
} from './referenceTankV2ProductionLayout'

import {
  getPatternPieceEdgeSeamAllowanceMm,
} from './seamAllowancePolicy'

const CURVE_SEGMENTS =
  100

const cases = [
  {
    backLengthCm: 22,
    chestGirthCm: 36,
    neckGirthCm: 27,
    shoulderLengthMm: 30,
  },

  {
    backLengthCm: 38,
    chestGirthCm: 40,
    neckGirthCm: 28,
    shoulderLengthMm: 40,
  },

  {
    backLengthCm: 18,
    chestGirthCm: 52,
    neckGirthCm: 34,
    shoulderLengthMm: 35,
  },
] as const

const bellyVariants = [
  'female',
  'male',
] as const

describe(
  'PAWTTERN V2 cutting contour self-intersection regression',
  () => {
    it(
      'keeps every sewing and cutting contour free from self-intersections across the regression matrix',
      () => {
        for (
          const testCase
          of cases
        ) {
          const measurements =
            createBodyMeasurementsFromCm({
              backLengthCm:
                testCase.backLengthCm,

              chestGirthCm:
                testCase.chestGirthCm,

              neckGirthCm:
                testCase.neckGirthCm,
            })

          for (
            const bellyVariant
            of bellyVariants
          ) {
            const construction =
              createReferenceTankV2Construction(
                measurements,
                {
                  bellyVariant,

                  halfBodyAllowanceMm:
                    10,

                  shoulderLengthMm:
                    testCase
                      .shoulderLengthMm,

                  neckOpeningAllowanceMm:
                    0,
                },
              )

            const layout =
              createReferenceTankV2ProductionLayout(
                construction.document,
              )

            const pieces = [
              layout.back,
              layout.frontBelly,
            ]

            for (
              const piece
              of pieces
            ) {
              const sampled =
                samplePatternPieceSewingContour(
                  layout.document,
                  piece,
                  CURVE_SEGMENTS,
                )

              const cutting =
                createSampledPatternPieceCuttingContour(
                  sampled,
                  (edge) =>
                    getPatternPieceEdgeSeamAllowanceMm(
                      edge,
                    ),
                )

              const sewingIntersections =
                findClosedPolylineSelfIntersections(
                  cutting.sewingPoints,
                )

              const cuttingIntersections =
                findClosedPolylineSelfIntersections(
                  cutting.cuttingPoints,
                )

              expect(
                sewingIntersections,
              ).toEqual([])

              expect(
                cuttingIntersections,
              ).toEqual([])
            }
          }
        }
      },
    )
  },
)