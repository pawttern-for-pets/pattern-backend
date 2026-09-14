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

function createRealFrontBellyResult() {
  const construction =
    createConstruction()

  const layout =
    createReferenceTankV2ProductionLayout(
      construction.document,
    )

  const sampled =
    samplePatternPieceSewingContour(
      layout.document,
      layout.frontBelly,
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
  'PAWTTERN Master Block V2 Front/Belly cutting contour',
  () => {
    it(
      'samples the real Front/Belly including all curved sewing boundaries',
      () => {
        const {
          layout,
          sampled,
        } =
          createRealFrontBellyResult()

        expect(
          layout.frontBelly.edges,
        ).toHaveLength(8)

        expect(
          sampled.edges,
        ).toHaveLength(8)

        const curveEdges =
          sampled.edges.filter(
            (sampledEdge) =>
              sampledEdge.edge.kind ===
              'curve',
          )

        expect(
          curveEdges,
        ).toHaveLength(4)

        for (
          const curveEdge
          of curveEdges
        ) {
          expect(
            curveEdge.points.length,
          ).toBeGreaterThan(2)
        }

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
      'applies 10 mm to six non-fold edges and 0 mm to both fold edges',
      () => {
        const {
          sampled,
          cutting,
        } =
          createRealFrontBellyResult()

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
        ).toHaveLength(2)

        expect(
          expectedOffsets.filter(
            (offsetMm) =>
              offsetMm ===
              DEFAULT_SEAM_ALLOWANCE_MM,
          ),
        ).toHaveLength(6)

        expect(
          cutting.edgeOffsetsMm,
        ).toEqual(
          expectedOffsets,
        )
      },
    )

    it(
      'preserves the two consecutive Front/Belly fold segments as one fold axis',
      () => {
        const {
          sampled,
        } =
          createRealFrontBellyResult()

        const foldEdges =
          sampled.edges.filter(
            (sampledEdge) =>
              sampledEdge.edge
                .treatment ===
              'fold',
          )

        expect(
          foldEdges,
        ).toHaveLength(2)

        const foldPoints =
          foldEdges.flatMap(
            (sampledEdge) =>
              sampledEdge.points,
          )

        const foldXMm =
          foldPoints[0].xMm

        for (
          const point of
          foldPoints
        ) {
          expect(
            point.xMm,
          ).toBeCloseTo(
            foldXMm,
            8,
          )
        }

        const firstFoldEnd =
          foldEdges[0].points[
            foldEdges[0].points.length -
              1
          ]

        const secondFoldStart =
          foldEdges[1].points[0]

        expect(
          distanceMm(
            firstFoldEnd,
            secondFoldStart,
          ),
        ).toBeLessThanOrEqual(
          POSITION_TOLERANCE_MM,
        )
      },
    )

    it(
      'keeps the derived cutting contour on the exact Front/Belly fold axis',
      () => {
        const {
          sampled,
          cutting,
        } =
          createRealFrontBellyResult()

        const foldPoints =
          sampled.edges
            .filter(
              (sampledEdge) =>
                sampledEdge.edge
                  .treatment ===
                'fold',
            )
            .flatMap(
              (sampledEdge) =>
                sampledEdge.points,
            )

        const foldXMm =
          foldPoints[0].xMm

        /*
         * The production Front/Belly
         * center fold is its right-hand
         * boundary.
         */
        for (
          const point of
          cutting.sewingPoints
        ) {
          expect(
            point.xMm,
          ).toBeLessThanOrEqual(
            foldXMm +
              POSITION_TOLERANCE_MM,
          )
        }

        for (
          const point of
          cutting.cuttingPoints
        ) {
          expect(
            point.xMm,
          ).toBeLessThanOrEqual(
            foldXMm +
              POSITION_TOLERANCE_MM,
          )
        }

        expect(
          Math.max(
            ...cutting.cuttingPoints.map(
              (point) =>
                point.xMm,
            ),
          ),
        ).toBeCloseTo(
          foldXMm,
          6,
        )
      },
    )

    it(
      'produces finite explicitly closed sewing and cutting contours',
      () => {
        const {
          cutting,
        } =
          createRealFrontBellyResult()

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
      },
    )

    it(
      'expands the real Front/Belly outward rather than shrinking it',
      () => {
        const {
          cutting,
        } =
          createRealFrontBellyResult()

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
      'does not allow dangerous Front/Belly miter spikes',
      () => {
        const {
          cutting,
        } =
          createRealFrontBellyResult()

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
      'does not mutate the Master Block, production document, or Front/Belly piece',
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

        const pieceBefore =
          JSON.stringify(
            layout.frontBelly,
          )

        const sampled =
          samplePatternPieceSewingContour(
            layout.document,
            layout.frontBelly,
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
            layout.frontBelly,
          ),
        ).toBe(
          pieceBefore,
        )
      },
    )
  },
)