import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  WorldPosition,
} from '../cad/coordinates'

import type {
  PatternDocument,
} from '../cad/document'

import type {
  PatternPiece,
} from '../cad/patternPiece'

import {
  cubicBezierDerivative,
  evaluateCubicBezier,
  type CubicBezierGeometry,
} from '../cad/bezier'

import {
  getClosedContourWinding,
  getOutwardUnitNormalForSegment,
} from '../cad/closedContourGeometry'

import {
  resolveCubicBezierGeometry,
} from '../cad/curves'

import {
  offsetLineSegmentOutward,
} from '../cad/offsetGeometry'

import {
  samplePatternPieceSewingContour,
} from '../cad/patternPieceContour'

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
} from './seamAllowancePolicy'

interface AccuracyMeasurement {
  curveSegments: number
  sampleCount: number
  maximumErrorMm: number
  averageErrorMm: number
}

function reverseCubicBezierGeometry(
  geometry:
    CubicBezierGeometry,
): CubicBezierGeometry {
  return {
    start: {
      ...geometry.end,
    },

    control1: {
      ...geometry.control2,
    },

    control2: {
      ...geometry.control1,
    },

    end: {
      ...geometry.start,
    },
  }
}

function pointToSegmentDistanceMm(
  point: WorldPosition,
  start: WorldPosition,
  end: WorldPosition,
): number {
  const deltaX =
    end.xMm -
    start.xMm

  const deltaY =
    end.yMm -
    start.yMm

  const lengthSquared =
    deltaX *
      deltaX +
    deltaY *
      deltaY

  if (
    !Number.isFinite(
      lengthSquared,
    ) ||
    lengthSquared <= 0
  ) {
    throw new Error(
      'Accuracy measurement cannot use a zero-length cutting segment.',
    )
  }

  const projection =
    (
      (
        point.xMm -
        start.xMm
      ) *
        deltaX +
      (
        point.yMm -
        start.yMm
      ) *
        deltaY
    ) /
    lengthSquared

  const clampedProjection =
    Math.max(
      0,
      Math.min(
        1,
        projection,
      ),
    )

  const closest = {
    xMm:
      start.xMm +
      clampedProjection *
        deltaX,

    yMm:
      start.yMm +
      clampedProjection *
        deltaY,
  }

  return Math.hypot(
    point.xMm -
      closest.xMm,

    point.yMm -
      closest.yMm,
  )
}

function measureCurveOffsetAccuracy(
  document:
    PatternDocument,

  piece:
    PatternPiece,

  curveSegments:
    number,
): AccuracyMeasurement {
  const sampled =
    samplePatternPieceSewingContour(
      document,
      piece,
      curveSegments,
    )

  const winding =
    getClosedContourWinding(
      sampled.points,
    )

  const errorsMm:
    number[] = []

  for (
    const sampledEdge
    of sampled.edges
  ) {
    if (
      sampledEdge.edge.kind !==
      'curve'
    ) {
      continue
    }

    const curve =
      document.curves[
        sampledEdge.edge
          .geometryId
      ]

    if (!curve) {
      throw new Error(
        `Accuracy measurement curve "${sampledEdge.edge.geometryId}" does not exist.`,
      )
    }

    const originalGeometry =
      resolveCubicBezierGeometry(
        curve,
        document.points,
      )

    const traversalGeometry =
      sampledEdge.edge
        .direction ===
      'forward'
        ? originalGeometry
        : reverseCubicBezierGeometry(
            originalGeometry,
          )

    for (
      let segmentIndex = 0;
      segmentIndex <
        curveSegments;
      segmentIndex += 1
    ) {
      const sampledStart =
        sampledEdge.points[
          segmentIndex
        ]

      const sampledEnd =
        sampledEdge.points[
          segmentIndex + 1
        ]

      const offsetSegment =
        offsetLineSegmentOutward(
          sampledStart,
          sampledEnd,
          winding,
          DEFAULT_SEAM_ALLOWANCE_MM,
        )

      const midpointT =
        (
          segmentIndex +
          0.5
        ) /
        curveSegments

      const exactCurvePoint =
        evaluateCubicBezier(
          traversalGeometry,
          midpointT,
        )

      const derivative =
        cubicBezierDerivative(
          traversalGeometry,
          midpointT,
        )

      const tangentEnd = {
        xMm:
          exactCurvePoint.xMm +
          derivative.xMm,

        yMm:
          exactCurvePoint.yMm +
          derivative.yMm,
      }

      const outwardNormal =
        getOutwardUnitNormalForSegment(
          exactCurvePoint,
          tangentEnd,
          winding,
        )

      const expectedOffsetPoint = {
        xMm:
          exactCurvePoint.xMm +
          outwardNormal.xMm *
            DEFAULT_SEAM_ALLOWANCE_MM,

        yMm:
          exactCurvePoint.yMm +
          outwardNormal.yMm *
            DEFAULT_SEAM_ALLOWANCE_MM,
      }

      const errorMm =
        pointToSegmentDistanceMm(
          expectedOffsetPoint,
          offsetSegment.start,
          offsetSegment.end,
        )

      if (
        !Number.isFinite(
          errorMm,
        )
      ) {
        throw new Error(
          'Curve offset accuracy produced a non-finite error.',
        )
      }

      errorsMm.push(
        errorMm,
      )
    }
  }

  if (
    errorsMm.length === 0
  ) {
    throw new Error(
      'Curve offset accuracy did not measure any curved segments.',
    )
  }

  const maximumErrorMm =
    Math.max(
      ...errorsMm,
    )

  const averageErrorMm =
    errorsMm.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    ) /
    errorsMm.length

  return {
    curveSegments,
    sampleCount:
      errorsMm.length,

    maximumErrorMm,
    averageErrorMm,
  }
}

describe(
  'PAWTTERN V2 curved cutting contour accuracy',
  () => {
    it(
      'measures convergence of the sampled 10 mm curved offset',
      () => {
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

        const layout =
          createReferenceTankV2ProductionLayout(
            construction.document,
          )

        const resolutions = [
          25,
          50,
          100,
          200,
        ]

        const backResults =
          resolutions.map(
            (
              curveSegments,
            ) =>
              measureCurveOffsetAccuracy(
                layout.document,
                layout.back,
                curveSegments,
              ),
          )

        const frontResults =
          resolutions.map(
            (
              curveSegments,
            ) =>
              measureCurveOffsetAccuracy(
                layout.document,
                layout.frontBelly,
                curveSegments,
              ),
          )

        console.log(
          '\nD4F BACK CURVE OFFSET ACCURACY',
        )

        for (
          const result
          of backResults
        ) {
          console.log(
            `${result.curveSegments} segments: max=${result.maximumErrorMm.toFixed(6)} mm avg=${result.averageErrorMm.toFixed(6)} mm samples=${result.sampleCount}`,
          )
        }

        console.log(
          '\nD4F FRONT/BELLY CURVE OFFSET ACCURACY',
        )

        for (
          const result
          of frontResults
        ) {
          console.log(
            `${result.curveSegments} segments: max=${result.maximumErrorMm.toFixed(6)} mm avg=${result.averageErrorMm.toFixed(6)} mm samples=${result.sampleCount}`,
          )
        }

        for (
          const results
          of [
            backResults,
            frontResults,
          ]
        ) {
          for (
            const result
            of results
          ) {
            expect(
              Number.isFinite(
                result.maximumErrorMm,
              ),
            ).toBe(true)

            expect(
              Number.isFinite(
                result.averageErrorMm,
              ),
            ).toBe(true)

            expect(
              result.maximumErrorMm,
            ).toBeGreaterThanOrEqual(
              0,
            )
          }

          expect(
            results[2]
              .maximumErrorMm,
          ).toBeLessThan(
            results[0]
              .maximumErrorMm,
          )

          expect(
            results[3]
              .maximumErrorMm,
          ).toBeLessThanOrEqual(
            results[2]
              .maximumErrorMm,
          )
        }
      },
    )
  },
)