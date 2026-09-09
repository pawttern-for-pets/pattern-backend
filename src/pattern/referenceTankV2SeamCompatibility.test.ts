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
  evaluateReferenceTankV2SeamCompatibility,
} from './referenceTankV2SeamCompatibility'

const measurements =
  createBodyMeasurementsFromCm({
    backLengthCm: 22,
    chestGirthCm: 36,
    neckGirthCm: 27,
  })

const NUMERIC_TOLERANCE_MM =
  0.000001

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
  'PAWTTERN Master Block V2 seam compatibility',
  () => {
    it(
      'matches female shoulder and side seam pairs exactly',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const result =
          evaluateReferenceTankV2SeamCompatibility(
            construction.document,
            NUMERIC_TOLERANCE_MM,
          )

        expect(
          result.shoulder.differenceMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          result.sideSeam.differenceMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          result.shoulder.withinTolerance,
        ).toBe(true)

        expect(
          result.sideSeam.withinTolerance,
        ).toBe(true)

        expect(
          result.compatible,
        ).toBe(true)
      },
    )

    it(
      'matches male shoulder and side seam pairs exactly',
      () => {
        const construction =
          createConstruction(
            'male',
          )

        const result =
          evaluateReferenceTankV2SeamCompatibility(
            construction.document,
            NUMERIC_TOLERANCE_MM,
          )

        expect(
          result.shoulder.differenceMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          result.sideSeam.differenceMm,
        ).toBeCloseTo(
          0,
          8,
        )

        expect(
          result.shoulder.withinTolerance,
        ).toBe(true)

        expect(
          result.sideSeam.withinTolerance,
        ).toBe(true)

        expect(
          result.compatible,
        ).toBe(true)
      },
    )

    it(
      'reports the expected shoulder lengths',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const result =
          evaluateReferenceTankV2SeamCompatibility(
            construction.document,
            NUMERIC_TOLERANCE_MM,
          )

        expect(
          result.shoulder.firstLengthMm,
        ).toBeCloseTo(
          30,
          8,
        )

        expect(
          result.shoulder.secondLengthMm,
        ).toBeCloseTo(
          30,
          8,
        )
      },
    )

    it(
      'allows an explicit tolerance for a small introduced side-seam mismatch',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const frontSideSeam =
          construction.document.lines[
            REFERENCE_TANK_V2_LINE_IDS
              .frontBellySideSeam
          ]

        const endPoint =
          construction.document.points[
            frontSideSeam.endPointId
          ]

        const modifiedDocument = {
          ...construction.document,

          points: {
            ...construction.document.points,

            [endPoint.id]: {
              ...endPoint,

              xMm:
                endPoint.xMm +
                0.5,
            },
          },
        }

        const strict =
          evaluateReferenceTankV2SeamCompatibility(
            modifiedDocument,
            0,
          )

        const tolerant =
          evaluateReferenceTankV2SeamCompatibility(
            modifiedDocument,
            1,
          )

        expect(
          strict.sideSeam.withinTolerance,
        ).toBe(false)

        expect(
          strict.compatible,
        ).toBe(false)

        expect(
          tolerant.sideSeam.withinTolerance,
        ).toBe(true)

        expect(
          tolerant.compatible,
        ).toBe(true)
      },
    )

    it(
      'fails when a sewn edge is changed beyond tolerance',
      () => {
        const construction =
          createConstruction(
            'female',
          )

        const frontShoulder =
          construction.document.lines[
            REFERENCE_TANK_V2_LINE_IDS
              .frontShoulder
          ]

        const endPoint =
          construction.document.points[
            frontShoulder.endPointId
          ]

        const modifiedDocument = {
          ...construction.document,

          points: {
            ...construction.document.points,

            [endPoint.id]: {
              ...endPoint,

              xMm:
                endPoint.xMm +
                5,
            },
          },
        }

        const result =
          evaluateReferenceTankV2SeamCompatibility(
            modifiedDocument,
            1,
          )

        expect(
          result.shoulder.withinTolerance,
        ).toBe(false)

        expect(
          result.compatible,
        ).toBe(false)
      },
    )

    it(
      'keeps shoulder and side seam pairs compatible across varied body proportions',
      () => {
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
        ]

        const bellyVariants = [
          'female',
          'male',
        ] as const

        for (
          const testCase
          of cases
        ) {
          const caseMeasurements =
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
                caseMeasurements,
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

            const result =
              evaluateReferenceTankV2SeamCompatibility(
                construction.document,
                NUMERIC_TOLERANCE_MM,
              )

            expect(
              result.shoulder.differenceMm,
            ).toBeCloseTo(
              0,
              8,
            )

            expect(
              result.sideSeam.differenceMm,
            ).toBeCloseTo(
              0,
              8,
            )

            expect(
              result.shoulder.withinTolerance,
            ).toBe(true)

            expect(
              result.sideSeam.withinTolerance,
            ).toBe(true)

            expect(
              result.compatible,
            ).toBe(true)
          }
        }
      },
    )
  },
)