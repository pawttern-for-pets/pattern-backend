import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createPatternPieceIdentification,
} from '../cad/patternPieceIdentification'

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
  createReferenceTankV2ProductionMetadata,
} from './referenceTankV2ProductionMetadata'

function createProduction() {
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

  const metadata =
    createReferenceTankV2ProductionMetadata(
      layout,
    )

  return {
    layout,
    metadata,
  }
}

describe(
  'PAWTTERN Master Block V2 production identification',
  () => {
    it(
      'creates the Back production label',
      () => {
        const {
          layout,
          metadata,
        } =
          createProduction()

        const identification =
          createPatternPieceIdentification(
            layout.back,
            metadata.back,
          )

        expect(
          identification.primaryText,
        ).toBe(
          'BACK BODICE',
        )

        expect(
          identification.secondaryText,
        ).toBe(
          'CUT 1 ON FOLD',
        )
      },
    )

    it(
      'creates the Front/Belly production label',
      () => {
        const {
          layout,
          metadata,
        } =
          createProduction()

        const identification =
          createPatternPieceIdentification(
            layout.frontBelly,
            metadata.frontBelly,
          )

        expect(
          identification.primaryText,
        ).toBe(
          'FRONT BODICE',
        )

        expect(
          identification.secondaryText,
        ).toBe(
          'CUT 1 ON FOLD',
        )
      },
    )

    it(
      'derives cut-on-fold status from semantic fold edges',
      () => {
        const {
          layout,
          metadata,
        } =
          createProduction()

        const back =
          createPatternPieceIdentification(
            layout.back,
            metadata.back,
          )

        const frontBelly =
          createPatternPieceIdentification(
            layout.frontBelly,
            metadata.frontBelly,
          )

        expect(
          back.isCutOnFold,
        ).toBe(true)

        expect(
          frontBelly.isCutOnFold,
        ).toBe(true)
      },
    )

    it(
      'preserves explicit cut quantity separately from fold semantics',
      () => {
        const {
          layout,
          metadata,
        } =
          createProduction()

        const back =
          createPatternPieceIdentification(
            layout.back,
            metadata.back,
          )

        expect(
          back.cutQuantity,
        ).toBe(1)

        expect(
          back.isCutOnFold,
        ).toBe(true)
      },
    )

    it(
      'rejects metadata belonging to another pattern piece',
      () => {
        const {
          layout,
          metadata,
        } =
          createProduction()

        expect(
          () =>
            createPatternPieceIdentification(
              layout.back,
              metadata.frontBelly,
            ),
        ).toThrow(
          'metadata does not match',
        )
      },
    )
  },
)