import {
  describe,
  expect,
  it,
} from 'vitest'

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

function createLayout() {
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

  return createReferenceTankV2ProductionLayout(
    construction.document,
  )
}

describe(
  'PAWTTERN Master Block V2 production metadata',
  () => {
    it(
      'assigns the production display names',
      () => {
        const layout =
          createLayout()

        const metadata =
          createReferenceTankV2ProductionMetadata(
            layout,
          )

        expect(
          metadata.back.displayName,
        ).toBe(
          'BACK BODICE',
        )

        expect(
          metadata.frontBelly.displayName,
        ).toBe(
          'FRONT BODICE',
        )
      },
    )

    it(
      'requires one cut piece for Back and Front/Belly',
      () => {
        const layout =
          createLayout()

        const metadata =
          createReferenceTankV2ProductionMetadata(
            layout,
          )

        expect(
          metadata.back.cutQuantity,
        ).toBe(1)

        expect(
          metadata.frontBelly.cutQuantity,
        ).toBe(1)
      },
    )

    it(
      'binds production metadata to the actual production piece ids',
      () => {
        const layout =
          createLayout()

        const metadata =
          createReferenceTankV2ProductionMetadata(
            layout,
          )

        expect(
          metadata.back.pieceId,
        ).toBe(
          layout.back.id,
        )

        expect(
          metadata.frontBelly.pieceId,
        ).toBe(
          layout.frontBelly.id,
        )
      },
    )

    it(
      'keeps fold meaning in edge semantics rather than duplicating it in metadata',
      () => {
        const layout =
          createLayout()

        const metadata =
          createReferenceTankV2ProductionMetadata(
            layout,
          )

        expect(
          Object.keys(
            metadata.back,
          ),
        ).toEqual([
          'pieceId',
          'displayName',
          'cutQuantity',
        ])

        expect(
          Object.keys(
            metadata.frontBelly,
          ),
        ).toEqual([
          'pieceId',
          'displayName',
          'cutQuantity',
        ])

        expect(
          layout.back.edges.some(
            (edge) =>
              edge.treatment ===
              'fold',
          ),
        ).toBe(true)

        expect(
          layout.frontBelly.edges.some(
            (edge) =>
              edge.treatment ===
              'fold',
          ),
        ).toBe(true)
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

        createReferenceTankV2ProductionMetadata(
          layout,
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