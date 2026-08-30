import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  calculateReferenceTankFormula,
} from './referenceTankFormula'

describe(
  'PAWTTERN reference tank formula',
  () => {
    const videoMeasurements =
      createBodyMeasurementsFromCm({
        backLengthCm: 22,
        chestGirthCm: 36,
        neckGirthCm: 27,
      })

    it(
      'keeps raw B C N measurements unchanged',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
          )

        expect(
          result.backLengthMm,
        ).toBe(220)

        expect(
          result.chestGirthMm,
        ).toBe(360)

        expect(
          result.neckGirthMm,
        ).toBe(270)
      },
    )

    it(
      'adds no hidden half-body allowance by default',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
          )

        expect(
          result
            .halfBodyAllowanceMm,
        ).toBe(0)

        expect(
          result.halfBodyWidthMm,
        ).toBe(180)
      },
    )

    it(
      'can explicitly reproduce the video 1 cm half-body allowance',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
            {
              halfBodyAllowanceMm:
                10,
            },
          )

        expect(
          result.halfBodyWidthMm,
        ).toBe(190)

        expect(
          result.widthFifthMm,
        ).toBe(38)
      },
    )

    it(
      'divides the half-body width into a 3 to 2 back/front ratio',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
          )

        expect(
          result.halfBackWidthMm,
        ).toBe(108)

        expect(
          result.halfFrontWidthMm,
        ).toBe(72)

        expect(
          result.halfBackWidthMm +
            result.halfFrontWidthMm,
        ).toBe(
          result.halfBodyWidthMm,
        )
      },
    )

    it(
      'places the side line at three fifths of the half-body width',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
          )

        expect(
          result.sideLineXMm,
        ).toBe(108)
      },
    )

    it(
      'calculates the B fifth correctly',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
          )

        expect(
          result.backFifthMm,
        ).toBe(44)

        expect(
          result.armholeDepthYMm,
        ).toBe(44)
      },
    )

    it(
      'calculates the back neckline reference values',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
          )

        expect(
          result.backNeckWidthMm,
        ).toBe(67.5)

        expect(
          result.backNeckRiseMm,
        ).toBe(33.75)
      },
    )

    it(
      'calculates the corrected front neckline values',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
          )

        expect(
          result.frontNeckWidthMm,
        ).toBe(54)

        /*
         * 27 cm / 10
         * = 2.7 cm
         * = 27 mm.
         */
        expect(
          result.frontNeckRiseMm,
        ).toBe(27)
      },
    )

    it(
      'calculates the front-center reference',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
          )

        expect(
          result.frontCenterRiseMm,
        ).toBe(100)
      },
    )

    it(
      'calculates the front armhole inset',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
          )

        expect(
          result.frontArmholeInsetMm,
        ).toBe(26)
      },
    )

    it(
      'calculates the two B-based hem guides',
      () => {
        const result =
          calculateReferenceTankFormula(
            videoMeasurements,
          )

        expect(
          result.frontHemGuideMm,
        ).toBe(88)

        expect(
          result.sideHemGuideMm,
        ).toBe(132)
      },
    )

    it(
      'rejects a non-finite allowance',
      () => {
        expect(() =>
          calculateReferenceTankFormula(
            videoMeasurements,
            {
              halfBodyAllowanceMm:
                Number.NaN,
            },
          ),
        ).toThrow()
      },
    )

    it(
      'rejects an allowance that collapses the construction width',
      () => {
        expect(() =>
          calculateReferenceTankFormula(
            videoMeasurements,
            {
              halfBodyAllowanceMm:
                -180,
            },
          ),
        ).toThrow()
      },
    )
  },
)