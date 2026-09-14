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

const measurements =
  createBodyMeasurementsFromCm({
    backLengthCm: 22,
    chestGirthCm: 36,
    neckGirthCm: 27,
  })

function createConstruction() {
  return createReferenceTankV2Construction(
    measurements,
    {
      bellyVariant:
        'female',

      halfBodyAllowanceMm:
        10,

      shoulderLengthMm:
        30,

      neckOpeningAllowanceMm:
        0,
    },
  )
}

function createRealBackResult() {
  const construction =
    createConstruction()

  const layout =
    createReferenceTankV2ProductionLayout(
      construction.document,
    )

  const sampled =
    samplePatternPieceSewingContour(
      layout.document,
      layout.back,
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

  return {
    construction,
    layout,
    sampled,
    cutting,
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

describe(
  'PAWTTERN Master Block V2 Back cutting contour',
  () => {
    it(
      'samples the real Back including its curved sewing boundaries',
      () => {
        const {
          layout,
          sampled,
        } =
          createRealBackResult()

        expect(
          layout.back.edges,
        ).toHaveLength(9)

        expect(
          sampled.edges,
        ).toHaveLength(9)

        expect(
          sampled.edges.some(
            (sampledEdge) =>
              sampledEdge.edge
                .kind ===
              'curve',
          ),
        ).toBe(true)

        expect(
          sampled.edges.some(
            (sampledEdge) =>
              sampledEdge.points
                .length > 2,
          ),
        ).toBe(true)

        expect(
          sampled.points[0],
        ).toEqual(
          sampled.points[
            sampled.points.length -
              1
          ],
        )
      },
    )

    it(
      'applies 10 mm to every non-fold Back edge and 0 mm to the fold',
      () => {
        const {
          sampled,
          cutting,
        } =
          createRealBackResult()

        const expectedOffsets =
          sampled.edges.map(
            (sampledEdge) =>
              sampledEdge.edge
                .treatment ===
              'fold'
                ? 0
                : DEFAULT_SEAM_ALLOWANCE_MM,
          )

        expect(
          expectedOffsets.filter(
            (offsetMm) =>
              offsetMm === 0,
          ),
        ).toHaveLength(1)

        expect(
          cutting.edgeOffsetsMm,
        ).toEqual(
          expectedOffsets,
        )

        expect(
          cutting.edgeOffsetsMm.filter(
            (offsetMm) =>
              offsetMm ===
              DEFAULT_SEAM_ALLOWANCE_MM,
          ),
        ).toHaveLength(8)
      },
    )

    it(
      'produces finite explicitly closed sewing and cutting contours',
      () => {
        const {
          cutting,
        } =
          createRealBackResult()

        expect(
          cutting.sewingPoints[0],
        ).toEqual(
          cutting.sewingPoints[
            cutting.sewingPoints.length -
              1
          ],
        )

        expect(
          cutting.cuttingPoints[0],
        ).toEqual(
          cutting.cuttingPoints[
            cutting.cuttingPoints.length -
              1
          ],
        )

        for (
          const point of [
            ...cutting.sewingPoints,
            ...cutting.cuttingPoints,
          ]
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

        const first =
          cutting.cuttingPoints[0]

        const beforeLast =
          cutting.cuttingPoints[
            cutting.cuttingPoints.length -
              2
          ]

        expect(
          distanceMm(
            first,
            beforeLast,
          ),
        ).toBeGreaterThan(
          POSITION_TOLERANCE_MM,
        )
      },
    )

    it(
      'expands the real Back outward rather than shrinking it',
      () => {
        const {
          cutting,
        } =
          createRealBackResult()

        const sewingArea =
          calculateClosedContourSignedAreaMm2(
            cutting.sewingPoints,
          )

        const cuttingArea =
          calculateClosedContourSignedAreaMm2(
            cutting.cuttingPoints,
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
      },
    )

    it(
      'keeps the real Back CUT ON FOLD boundary on its original fold axis',
      () => {
        const {
          sampled,
          cutting,
        } =
          createRealBackResult()

        const foldEdge =
          sampled.edges.find(
            (sampledEdge) =>
              sampledEdge.edge
                .treatment ===
              'fold',
          )

        expect(
          foldEdge,
        ).toBeDefined()

        const foldXs =
          foldEdge!.points.map(
            (point) =>
              point.xMm,
          )

        const foldXMm =
          foldXs[0]

        for (
          const xMm of
          foldXs
        ) {
          expect(
            xMm,
          ).toBeCloseTo(
            foldXMm,
            8,
          )
        }

        /*
         * The V2 Back fold is its
         * left-hand production boundary.
         *
         * No seam allowance may extend
         * across that fabric-fold axis.
         */
        for (
          const point of
          cutting.sewingPoints
        ) {
          expect(
            point.xMm,
          ).toBeGreaterThanOrEqual(
            foldXMm -
              POSITION_TOLERANCE_MM,
          )
        }

        const cuttingXs =
          cutting.cuttingPoints.map(
            (point) =>
              point.xMm,
          )

        expect(
          Math.min(
            ...cuttingXs,
          ),
        ).toBeCloseTo(
          foldXMm,
          6,
        )
      },
    )

    it(
      'does not allow a cutting-line join to exceed the configured miter safety distance',
      () => {
        const {
          cutting,
        } =
          createRealBackResult()

        const sewingPoints =
          cutting.sewingPoints.slice(
            0,
            -1,
          )

        const cuttingPoints =
          cutting.cuttingPoints.slice(
            0,
            -1,
          )

        const maximumSafeDistanceMm =
          DEFAULT_OFFSET_JOIN_MITER_LIMIT *
          DEFAULT_SEAM_ALLOWANCE_MM +
          POSITION_TOLERANCE_MM

        for (
          const cuttingPoint of
          cuttingPoints
        ) {
          const nearestSewingDistanceMm =
            Math.min(
              ...sewingPoints.map(
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
      },
    )

    it(
      'does not mutate the Master Block, production document, or Back piece',
      () => {
        const construction =
          createConstruction()

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

        const sampled =
          samplePatternPieceSewingContour(
            layout.document,
            layout.back,
            CURVE_SEGMENTS,
          )

        createSampledPatternPieceCuttingContour(
          sampled,
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
      },
    )
  },
)