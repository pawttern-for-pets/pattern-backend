import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  createReferenceTankConstruction,
  REFERENCE_TANK_LINE_IDS,
  REFERENCE_TANK_POINT_IDS,
} from './referenceTankConstruction'

describe(
  'PAWTTERN reference tank construction',
  () => {
    const measurements =
      createBodyMeasurementsFromCm({
        backLengthCm: 22,
        chestGirthCm: 36,
        neckGirthCm: 27,
      })

    it(
      'creates the first nine construction points',
      () => {
        const result =
          createReferenceTankConstruction(
            measurements,
          )

        expect(
          Object.keys(
            result.document.points,
          ),
        ).toHaveLength(9)
      },
    )

    it(
      'creates nine construction lines',
      () => {
        const result =
          createReferenceTankConstruction(
            measurements,
          )

        expect(
          Object.keys(
            result.document.lines,
          ),
        ).toHaveLength(9)

        expect(
          Object.keys(
            result.document.curves,
          ),
        ).toHaveLength(0)
      },
    )

    it(
      'uses zero hidden allowance by default',
      () => {
        const result =
          createReferenceTankConstruction(
            measurements,
          )

        const frontTop =
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .frontTop
          ]

        expect(
          frontTop.xMm,
        ).toBe(180)
      },
    )

    it(
      'uses the full back length as the construction height',
      () => {
        const result =
          createReferenceTankConstruction(
            measurements,
          )

        expect(
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .backBottom
          ].yMm,
        ).toBe(220)

        expect(
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .frontBottom
          ].yMm,
        ).toBe(220)
      },
    )

    it(
      'places the armhole construction row at B divided by five',
      () => {
        const result =
          createReferenceTankConstruction(
            measurements,
          )

        expect(
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .backArmhole
          ].yMm,
        ).toBe(44)

        expect(
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .sideArmhole
          ].yMm,
        ).toBe(44)

        expect(
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .frontArmhole
          ].yMm,
        ).toBe(44)
      },
    )

    it(
      'places the side line at three fifths of the half-body width',
      () => {
        const result =
          createReferenceTankConstruction(
            measurements,
          )

        expect(
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .sideTop
          ].xMm,
        ).toBe(108)

        expect(
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .sideBottom
          ].xMm,
        ).toBe(108)
      },
    )

    it(
      'creates the correct 3 to 2 half-back and half-front widths',
      () => {
        const result =
          createReferenceTankConstruction(
            measurements,
          )

        const backX =
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .backTop
          ].xMm

        const sideX =
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .sideTop
          ].xMm

        const frontX =
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .frontTop
          ].xMm

        expect(
          sideX - backX,
        ).toBe(108)

        expect(
          frontX - sideX,
        ).toBe(72)
      },
    )

    it(
      'can explicitly reproduce the video one-centimeter half-body allowance',
      () => {
        const result =
          createReferenceTankConstruction(
            measurements,
            {
              halfBodyAllowanceMm:
                10,
            },
          )

        expect(
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .frontTop
          ].xMm,
        ).toBe(190)

        expect(
          result.document.points[
            REFERENCE_TANK_POINT_IDS
              .sideTop
          ].xMm,
        ).toBe(114)
      },
    )

    it(
      'creates a real referenced side construction line',
      () => {
        const result =
          createReferenceTankConstruction(
            measurements,
          )

        const sideLine =
          result.document.lines[
            REFERENCE_TANK_LINE_IDS
              .sideLine
          ]

        expect(
          sideLine.startPointId,
        ).toBe(
          REFERENCE_TANK_POINT_IDS
            .sideTop,
        )

        expect(
          sideLine.endPointId,
        ).toBe(
          REFERENCE_TANK_POINT_IDS
            .sideBottom,
        )
      },
    )

    it(
      'preserves the formula used to create the geometry',
      () => {
        const result =
          createReferenceTankConstruction(
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

        expect(
          result.formula
            .halfBodyWidthMm,
        ).toBe(180)
      },
    )
  },
)