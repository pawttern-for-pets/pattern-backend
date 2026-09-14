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
  createPatternPieceFoldMarkings,
} from './patternPieceFoldMarking'

import {
  createFoldParallelPatternPieceGrainline,
} from './patternPieceGrainline'

import type {
  WorldPosition,
} from './coordinates'

const measurements =
  createBodyMeasurementsFromCm({
    backLengthCm: 22,
    chestGirthCm: 36,
    neckGirthCm: 27,
  })

function createLayout(
  bellyVariant:
    'female' |
    'male',
) {
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

function isPointInsideClosedContour(
  point:
    WorldPosition,

  contour:
    readonly WorldPosition[],
): boolean {
  let inside =
    false

  for (
    let index = 0;
    index <
      contour.length - 1;
    index += 1
  ) {
    const first =
      contour[index]

    const second =
      contour[
        index + 1
      ]

    const crosses =
      (
        first.yMm >
          point.yMm
      ) !==
      (
        second.yMm >
          point.yMm
      )

    if (!crosses) {
      continue
    }

    const xAtCrossing =
      first.xMm +
      (
        (
          point.yMm -
          first.yMm
        ) *
        (
          second.xMm -
          first.xMm
        )
      ) /
      (
        second.yMm -
        first.yMm
      )

    if (
      point.xMm <
      xAtCrossing
    ) {
      inside =
        !inside
    }
  }

  return inside
}

function expectGrainlineInsidePiece(
  document:
    ReturnType<
      typeof createLayout
    >['document'],

  piece:
    ReturnType<
      typeof createLayout
    >['back'],
) {
  const grainline =
    createFoldParallelPatternPieceGrainline(
      document,
      piece,
    )

  const contour =
    samplePatternPieceSewingContour(
      document,
      piece,
    )

  for (
    let index = 0;
    index <= 20;
    index += 1
  ) {
    const t =
      index /
      20

    const point = {
      xMm:
        grainline.start.xMm +
        (
          grainline.end.xMm -
          grainline.start.xMm
        ) *
          t,

      yMm:
        grainline.start.yMm +
        (
          grainline.end.yMm -
          grainline.start.yMm
        ) *
          t,
    }

    expect(
      isPointInsideClosedContour(
        point,
        contour.points,
      ),
    ).toBe(true)
  }
}

describe(
  'pattern piece grainline',
  () => {
    it(
      'creates one finite grainline for both V2 production pieces',
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
          const grainline =
            createFoldParallelPatternPieceGrainline(
              layout.document,
              piece,
            )

          expect(
            Number.isFinite(
              grainline.start.xMm,
            ),
          ).toBe(true)

          expect(
            Number.isFinite(
              grainline.start.yMm,
            ),
          ).toBe(true)

          expect(
            Number.isFinite(
              grainline.end.xMm,
            ),
          ).toBe(true)

          expect(
            Number.isFinite(
              grainline.end.yMm,
            ),
          ).toBe(true)

          expect(
            grainline.lengthMm,
          ).toBeGreaterThan(0)
        }
      },
    )

    it(
      'keeps each grainline parallel to its semantic fold',
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
          const [
            fold,
          ] =
            createPatternPieceFoldMarkings(
              layout.document,
              piece,
            )

          const grainline =
            createFoldParallelPatternPieceGrainline(
              layout.document,
              piece,
            )

          const cross =
            fold.direction.x *
              grainline.direction.y -
            fold.direction.y *
              grainline.direction.x

          expect(
            cross,
          ).toBeCloseTo(
            0,
            10,
          )
        }
      },
    )

    it(
      'keeps the Female grainlines fully inside their sewing contours',
      () => {
        const layout =
          createLayout(
            'female',
          )

        expectGrainlineInsidePiece(
          layout.document,
          layout.back,
        )

        expectGrainlineInsidePiece(
          layout.document,
          layout.frontBelly,
        )
      },
    )

    it(
      'keeps the Male grainlines fully inside their sewing contours',
      () => {
        const layout =
          createLayout(
            'male',
          )

        expectGrainlineInsidePiece(
          layout.document,
          layout.back,
        )

        expectGrainlineInsidePiece(
          layout.document,
          layout.frontBelly,
        )
      },
    )

    it(
      'adapts Front/Belly grainline length to Female and Male geometry',
      () => {
        const female =
          createLayout(
            'female',
          )

        const male =
          createLayout(
            'male',
          )

        const femaleGrainline =
          createFoldParallelPatternPieceGrainline(
            female.document,
            female.frontBelly,
          )

        const maleGrainline =
          createFoldParallelPatternPieceGrainline(
            male.document,
            male.frontBelly,
          )

        expect(
          femaleGrainline.lengthMm,
        ).not.toBeCloseTo(
          maleGrainline.lengthMm,
          6,
        )
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

        createFoldParallelPatternPieceGrainline(
          layout.document,
          layout.back,
        )

        createFoldParallelPatternPieceGrainline(
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