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
  createPatternPieceFoldMarkings,
} from './patternPieceFoldMarking'

const measurements =
  createBodyMeasurementsFromCm({
    backLengthCm: 22,
    chestGirthCm: 36,
    neckGirthCm: 27,
  })

function createLayout() {
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

  return createReferenceTankV2ProductionLayout(
    construction.document,
  )
}

describe(
  'pattern piece fold markings',
  () => {
    it(
      'creates one Back fold marking from semantic fold treatment',
      () => {
        const layout =
          createLayout()

        const markings =
          createPatternPieceFoldMarkings(
            layout.document,
            layout.back,
          )

        expect(
          markings,
        ).toHaveLength(1)

        expect(
          markings[0]
            .edgeIndexes,
        ).toHaveLength(1)

        expect(
          markings[0]
            .lengthMm,
        ).toBeGreaterThan(0)
      },
    )

    it(
      'groups the two consecutive Front/Belly fold edges into one marking',
      () => {
        const layout =
          createLayout()

        const markings =
          createPatternPieceFoldMarkings(
            layout.document,
            layout.frontBelly,
          )

        expect(
          markings,
        ).toHaveLength(1)

        expect(
          markings[0]
            .edgeIndexes,
        ).toHaveLength(2)
      },
    )

    it(
      'places the marking midpoint on the Back fold axis',
      () => {
        const layout =
          createLayout()

        const [
          marking,
        ] =
          createPatternPieceFoldMarkings(
            layout.document,
            layout.back,
          )

        expect(
          marking.midpoint.xMm,
        ).toBeCloseTo(
          marking.start.xMm,
          8,
        )

        expect(
          marking.midpoint.xMm,
        ).toBeCloseTo(
          marking.end.xMm,
          8,
        )
      },
    )

    it(
      'places the grouped Front/Belly marking on one continuous fold axis',
      () => {
        const layout =
          createLayout()

        const [
          marking,
        ] =
          createPatternPieceFoldMarkings(
            layout.document,
            layout.frontBelly,
          )

        expect(
          marking.midpoint.xMm,
        ).toBeCloseTo(
          marking.start.xMm,
          8,
        )

        expect(
          marking.midpoint.xMm,
        ).toBeCloseTo(
          marking.end.xMm,
          8,
        )
      },
    )

    it(
      'returns a unit direction vector',
      () => {
        const layout =
          createLayout()

        for (
          const piece of [
            layout.back,
            layout.frontBelly,
          ]
        ) {
          const [
            marking,
          ] =
            createPatternPieceFoldMarkings(
              layout.document,
              piece,
            )

          expect(
            Math.hypot(
              marking.direction.x,
              marking.direction.y,
            ),
          ).toBeCloseTo(
            1,
            10,
          )
        }
      },
    )

    it(
      'does not mutate the production layout',
      () => {
        const layout =
          createLayout()

        const before =
          JSON.stringify(
            layout,
          )

        createPatternPieceFoldMarkings(
          layout.document,
          layout.back,
        )

        createPatternPieceFoldMarkings(
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