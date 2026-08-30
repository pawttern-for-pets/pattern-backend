import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  REFERENCE_TANK_POINT_IDS,
} from './referenceTankConstruction'

import {
  createReferenceTankNeckConstruction,
  REFERENCE_TANK_NECK_LINE_IDS,
  REFERENCE_TANK_NECK_POINT_IDS,
} from './referenceTankNeckConstruction'

describe(
  'PAWTTERN reference tank neck construction',
  () => {
    const measurements =
      createBodyMeasurementsFromCm({
        backLengthCm: 22,
        chestGirthCm: 36,
        neckGirthCm: 27,
      })

    it(
      'adds five deterministic neck construction points',
      () => {
        const result =
          createReferenceTankNeckConstruction(
            measurements,
          )

        /*
         * Base construction = 9
         * Neck construction = 5
         */
        expect(
          Object.keys(
            result.document.points,
          ),
        ).toHaveLength(14)
      },
    )

    it(
      'adds five neck guide lines without creating curves',
      () => {
        const result =
          createReferenceTankNeckConstruction(
            measurements,
          )

        /*
         * Base construction = 9
         * Neck guides = 5
         */
        expect(
          Object.keys(
            result.document.lines,
          ),
        ).toHaveLength(14)

        expect(
          Object.keys(
            result.document.curves,
          ),
        ).toHaveLength(0)
      },
    )

    it(
      'places the back neck width at N divided by four',
      () => {
        const result =
          createReferenceTankNeckConstruction(
            measurements,
          )

        const point =
          result.document.points[
            REFERENCE_TANK_NECK_POINT_IDS
              .backNeckWidthBase
          ]

        expect(
          point.xMm,
        ).toBe(67.5)

        expect(
          point.yMm,
        ).toBe(0)
      },
    )

    it(
      'places the back neck rise upward by N divided by eight',
      () => {
        const result =
          createReferenceTankNeckConstruction(
            measurements,
          )

        const point =
          result.document.points[
            REFERENCE_TANK_NECK_POINT_IDS
              .backNeckOuter
          ]

        expect(
          point.xMm,
        ).toBe(67.5)

        /*
         * 27 cm / 8
         * =
         * 3.375 cm
         * =
         * 33.75 mm upward.
         *
         * Y+ is down, so upward
         * is negative.
         */
        expect(
          point.yMm,
        ).toBe(-33.75)
      },
    )

    it(
      'places the front neck center relative to the B over five armhole line',
      () => {
        const result =
          createReferenceTankNeckConstruction(
            measurements,
          )

        const point =
          result.document.points[
            REFERENCE_TANK_NECK_POINT_IDS
              .frontNeckCenter
          ]

        /*
         * B/5 = 44 mm
         *
         * B/2 - 10 mm
         * = 100 mm
         *
         * 44 - 100
         * = -56 mm
         */
        expect(
          point.xMm,
        ).toBe(180)

        expect(
          point.yMm,
        ).toBe(-56)
      },
    )

    it(
      'measures the front neck width inward by N divided by five',
      () => {
        const result =
          createReferenceTankNeckConstruction(
            measurements,
          )

        const point =
          result.document.points[
            REFERENCE_TANK_NECK_POINT_IDS
              .frontNeckWidthBase
          ]

        /*
         * Front Center:
         * 180 mm
         *
         * N/5:
         * 54 mm
         *
         * 180 - 54
         * = 126 mm
         */
        expect(
          point.xMm,
        ).toBe(126)

        expect(
          point.yMm,
        ).toBe(-56)
      },
    )

    it(
      'uses the corrected N divided by ten front neck rise',
      () => {
        const result =
          createReferenceTankNeckConstruction(
            measurements,
          )

        const point =
          result.document.points[
            REFERENCE_TANK_NECK_POINT_IDS
              .frontNeckOuter
          ]

        /*
         * N/10:
         *
         * 270 / 10
         * = 27 mm
         *
         * -56 - 27
         * = -83 mm
         */
        expect(
          point.xMm,
        ).toBe(126)

        expect(
          point.yMm,
        ).toBe(-83)
      },
    )

    it(
      'keeps the raw body measurements unchanged',
      () => {
        const result =
          createReferenceTankNeckConstruction(
            measurements,
          )

        expect(
          result.formula.backLengthMm,
        ).toBe(220)

        expect(
          result.formula.chestGirthMm,
        ).toBe(360)

        expect(
          result.formula.neckGirthMm,
        ).toBe(270)
      },
    )

    it(
      'creates referenced back neck guide lines',
      () => {
        const result =
          createReferenceTankNeckConstruction(
            measurements,
          )

        const widthGuide =
          result.document.lines[
            REFERENCE_TANK_NECK_LINE_IDS
              .backNeckWidthGuide
          ]

        expect(
          widthGuide.startPointId,
        ).toBe(
          REFERENCE_TANK_POINT_IDS
            .backTop,
        )

        expect(
          widthGuide.endPointId,
        ).toBe(
          REFERENCE_TANK_NECK_POINT_IDS
            .backNeckWidthBase,
        )
      },
    )

    it(
      'creates only the missing upper front-center extension',
      () => {
        const result =
          createReferenceTankNeckConstruction(
            measurements,
          )

        const extension =
          result.document.lines[
            REFERENCE_TANK_NECK_LINE_IDS
              .frontCenterNeckExtension
          ]

        expect(
          extension.startPointId,
        ).toBe(
          REFERENCE_TANK_NECK_POINT_IDS
            .frontNeckCenter,
        )

        expect(
          extension.endPointId,
        ).toBe(
          REFERENCE_TANK_POINT_IDS
            .frontTop,
        )
      },
    )
  },
)