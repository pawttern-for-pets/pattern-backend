import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  calculateClosedContourSignedAreaMm2,
} from '../cad/closedContourGeometry'

import {
  DEFAULT_OFFSET_JOIN_MITER_LIMIT,
} from '../cad/offsetJoinGeometry'

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
  DEFAULT_SEAM_ALLOWANCE_MM,
  getPatternPieceEdgeSeamAllowanceMm,
} from './seamAllowancePolicy'

const CURVE_SEGMENTS =
  100

const POSITION_TOLERANCE_MM =
  0.000001

const cases = [
  {
    name:
      'reference',

    backLengthCm:
      22,

    chestGirthCm:
      36,

    neckGirthCm:
      27,

    shoulderLengthMm:
      30,
  },

  {
    name:
      'longer-narrower',

    backLengthCm:
      38,

    chestGirthCm:
      40,

    neckGirthCm:
      28,

    shoulderLengthMm:
      40,
  },

  {
    name:
      'shorter-broad-chest',

    backLengthCm:
      18,

    chestGirthCm:
      52,

    neckGirthCm:
      34,

    shoulderLengthMm:
      35,
  },
] as const

const bellyVariants = [
  'female',
  'male',
] as const

type RegressionCase =
  typeof cases[number]

type BellyVariant =
  typeof bellyVariants[number]

function createCase(
  testCase:
    RegressionCase,

  bellyVariant:
    BellyVariant,
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

  const backSampled =
    samplePatternPieceSewingContour(
      layout.document,
      layout.back,
      CURVE_SEGMENTS,
    )

  const frontSampled =
    samplePatternPieceSewingContour(
      layout.document,
      layout.frontBelly,
      CURVE_SEGMENTS,
    )

  const backCutting =
    createSampledPatternPieceCuttingContour(
      backSampled,
      (edge) =>
        getPatternPieceEdgeSeamAllowanceMm(
          edge,
        ),
    )

  const frontCutting =
    createSampledPatternPieceCuttingContour(
      frontSampled,
      (edge) =>
        getPatternPieceEdgeSeamAllowanceMm(
          edge,
        ),
    )

  return {
    construction,
    layout,
    backSampled,
    frontSampled,
    backCutting,
    frontCutting,
  }
}

function distanceMm(
  first: {
    xMm: number
    yMm: number
  },

  second: {
    xMm: number
    yMm: number
  },
): number {
  return Math.hypot(
    second.xMm -
      first.xMm,

    second.yMm -
      first.yMm,
  )
}

function expectClosedAndFinite(
  points: {
    xMm: number
    yMm: number
  }[],
): void {
  expect(
    points.length,
  ).toBeGreaterThan(3)

  expect(
    points[0],
  ).toEqual(
    points[
      points.length - 1
    ],
  )

  const beforeLast =
    points[
      points.length - 2
    ]

  expect(
    distanceMm(
      points[0],
      beforeLast,
    ),
  ).toBeGreaterThan(
    POSITION_TOLERANCE_MM,
  )

  for (
    const point of points
  ) {
    expect(
      Number.isFinite(
        point.xMm,
      ),
    ).toBe(true)

    expect(
      Number.isFinite(
        point.yMm,
      ),
    ).toBe(true)
  }
}

function expectExpandedOutward(
  sewingPoints: {
    xMm: number
    yMm: number
  }[],

  cuttingPoints: {
    xMm: number
    yMm: number
  }[],
): void {
  const sewingArea =
    calculateClosedContourSignedAreaMm2(
      sewingPoints,
    )

  const cuttingArea =
    calculateClosedContourSignedAreaMm2(
      cuttingPoints,
    )

  expect(
    Math.sign(
      cuttingArea,
    ),
  ).toBe(
    Math.sign(
      sewingArea,
    ),
  )

  expect(
    Math.abs(
      cuttingArea,
    ),
  ).toBeGreaterThan(
    Math.abs(
      sewingArea,
    ),
  )
}

function expectSafeJoins(
  sewingPoints: {
    xMm: number
    yMm: number
  }[],

  cuttingPoints: {
    xMm: number
    yMm: number
  }[],
): void {
  const openSewing =
    sewingPoints.slice(
      0,
      -1,
    )

  const openCutting =
    cuttingPoints.slice(
      0,
      -1,
    )

  const maximumSafeDistanceMm =
    DEFAULT_OFFSET_JOIN_MITER_LIMIT *
    DEFAULT_SEAM_ALLOWANCE_MM +
    POSITION_TOLERANCE_MM

  for (
    const cuttingPoint
    of openCutting
  ) {
    const nearestSewingDistanceMm =
      Math.min(
        ...openSewing.map(
          (sewingPoint) =>
            distanceMm(
              sewingPoint,
              cuttingPoint,
            ),
        ),
      )

    expect(
      nearestSewingDistanceMm,
    ).toBeLessThanOrEqual(
      maximumSafeDistanceMm,
    )
  }
}

describe(
  'PAWTTERN Master Block V2 cutting contour regression matrix',
  () => {
    it(
      'creates closed finite Back and Front/Belly cutting contours for every body case and belly variant',
      () => {
        for (
          const testCase
          of cases
        ) {
          for (
            const bellyVariant
            of bellyVariants
          ) {
            const result =
              createCase(
                testCase,
                bellyVariant,
              )

            expectClosedAndFinite(
              result
                .backCutting
                .sewingPoints,
            )

            expectClosedAndFinite(
              result
                .backCutting
                .cuttingPoints,
            )

            expectClosedAndFinite(
              result
                .frontCutting
                .sewingPoints,
            )

            expectClosedAndFinite(
              result
                .frontCutting
                .cuttingPoints,
            )
          }
        }
      },
    )

    it(
      'applies 10 mm to every non-fold edge and 0 mm to every fold across the matrix',
      () => {
        for (
          const testCase
          of cases
        ) {
          for (
            const bellyVariant
            of bellyVariants
          ) {
            const result =
              createCase(
                testCase,
                bellyVariant,
              )

            expect(
              result
                .backCutting
                .edgeOffsetsMm
                .filter(
                  (offsetMm) =>
                    offsetMm === 0,
                ),
            ).toHaveLength(1)

            expect(
              result
                .backCutting
                .edgeOffsetsMm
                .filter(
                  (offsetMm) =>
                    offsetMm ===
                    DEFAULT_SEAM_ALLOWANCE_MM,
                ),
            ).toHaveLength(8)

            expect(
              result
                .frontCutting
                .edgeOffsetsMm
                .filter(
                  (offsetMm) =>
                    offsetMm === 0,
                ),
            ).toHaveLength(2)

            expect(
              result
                .frontCutting
                .edgeOffsetsMm
                .filter(
                  (offsetMm) =>
                    offsetMm ===
                    DEFAULT_SEAM_ALLOWANCE_MM,
                ),
            ).toHaveLength(6)
          }
        }
      },
    )

    it(
      'expands both production pieces outward while retaining contour winding',
      () => {
        for (
          const testCase
          of cases
        ) {
          for (
            const bellyVariant
            of bellyVariants
          ) {
            const result =
              createCase(
                testCase,
                bellyVariant,
              )

            expectExpandedOutward(
              result
                .backCutting
                .sewingPoints,

              result
                .backCutting
                .cuttingPoints,
            )

            expectExpandedOutward(
              result
                .frontCutting
                .sewingPoints,

              result
                .frontCutting
                .cuttingPoints,
            )
          }
        }
      },
    )

    it(
      'keeps Back and Front/Belly cutting contours on their exact fold axes',
      () => {
        for (
          const testCase
          of cases
        ) {
          for (
            const bellyVariant
            of bellyVariants
          ) {
            const result =
              createCase(
                testCase,
                bellyVariant,
              )

            const backFoldPoints =
              result
                .backSampled
                .edges
                .filter(
                  (
                    sampledEdge,
                  ) =>
                    sampledEdge
                      .edge
                      .treatment ===
                    'fold',
                )
                .flatMap(
                  (
                    sampledEdge,
                  ) =>
                    sampledEdge
                      .points,
                )

            const frontFoldPoints =
              result
                .frontSampled
                .edges
                .filter(
                  (
                    sampledEdge,
                  ) =>
                    sampledEdge
                      .edge
                      .treatment ===
                    'fold',
                )
                .flatMap(
                  (
                    sampledEdge,
                  ) =>
                    sampledEdge
                      .points,
                )

            expect(
              backFoldPoints.length,
            ).toBeGreaterThan(1)

            expect(
              frontFoldPoints.length,
            ).toBeGreaterThan(2)

            const backFoldXMm =
              backFoldPoints[0]
                .xMm

            const frontFoldXMm =
              frontFoldPoints[0]
                .xMm

            for (
              const point
              of backFoldPoints
            ) {
              expect(
                point.xMm,
              ).toBeCloseTo(
                backFoldXMm,
                8,
              )
            }

            for (
              const point
              of frontFoldPoints
            ) {
              expect(
                point.xMm,
              ).toBeCloseTo(
                frontFoldXMm,
                8,
              )
            }

            expect(
              Math.min(
                ...result
                  .backCutting
                  .cuttingPoints
                  .map(
                    (point) =>
                      point.xMm,
                  ),
              ),
            ).toBeCloseTo(
              backFoldXMm,
              6,
            )

            expect(
              Math.max(
                ...result
                  .frontCutting
                  .cuttingPoints
                  .map(
                    (point) =>
                      point.xMm,
                  ),
              ),
            ).toBeCloseTo(
              frontFoldXMm,
              6,
            )
          }
        }
      },
    )

    it(
      'prevents dangerous cutting-line join spikes across all matrix cases',
      () => {
        for (
          const testCase
          of cases
        ) {
          for (
            const bellyVariant
            of bellyVariants
          ) {
            const result =
              createCase(
                testCase,
                bellyVariant,
              )

            expectSafeJoins(
              result
                .backCutting
                .sewingPoints,

              result
                .backCutting
                .cuttingPoints,
            )

            expectSafeJoins(
              result
                .frontCutting
                .sewingPoints,

              result
                .frontCutting
                .cuttingPoints,
            )
          }
        }
      },
    )

    it(
      'does not mutate Master Block or production geometry across the regression matrix',
      () => {
        for (
          const testCase
          of cases
        ) {
          for (
            const bellyVariant
            of bellyVariants
          ) {
            const measurements =
              createBodyMeasurementsFromCm({
                backLengthCm:
                  testCase
                    .backLengthCm,

                chestGirthCm:
                  testCase
                    .chestGirthCm,

                neckGirthCm:
                  testCase
                    .neckGirthCm,
              })

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

            const masterBefore =
              JSON.stringify(
                construction.document,
              )

            const layout =
              createReferenceTankV2ProductionLayout(
                construction.document,
              )

            const productionBefore =
              JSON.stringify(
                layout.document,
              )

            const backBefore =
              JSON.stringify(
                layout.back,
              )

            const frontBefore =
              JSON.stringify(
                layout.frontBelly,
              )

            const backSampled =
              samplePatternPieceSewingContour(
                layout.document,
                layout.back,
                CURVE_SEGMENTS,
              )

            const frontSampled =
              samplePatternPieceSewingContour(
                layout.document,
                layout.frontBelly,
                CURVE_SEGMENTS,
              )

            createSampledPatternPieceCuttingContour(
              backSampled,
              (edge) =>
                getPatternPieceEdgeSeamAllowanceMm(
                  edge,
                ),
            )

            createSampledPatternPieceCuttingContour(
              frontSampled,
              (edge) =>
                getPatternPieceEdgeSeamAllowanceMm(
                  edge,
                ),
            )

            expect(
              JSON.stringify(
                construction.document,
              ),
            ).toBe(
              masterBefore,
            )

            expect(
              JSON.stringify(
                layout.document,
              ),
            ).toBe(
              productionBefore,
            )

            expect(
              JSON.stringify(
                layout.back,
              ),
            ).toBe(
              backBefore,
            )

            expect(
              JSON.stringify(
                layout.frontBelly,
              ),
            ).toBe(
              frontBefore,
            )
          }
        }
      },
    )
  },
)