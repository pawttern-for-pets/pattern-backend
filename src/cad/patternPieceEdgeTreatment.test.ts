import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  isPatternPieceEdgeTreatment,
} from './patternPieceEdgeTreatment'

describe(
  'PAWTTERN CAD pattern piece edge treatments',
  () => {
    it(
      'accepts the supported sewing treatment types',
      () => {
        expect(
          isPatternPieceEdgeTreatment(
            'seam',
          ),
        ).toBe(true)

        expect(
          isPatternPieceEdgeTreatment(
            'fold',
          ),
        ).toBe(true)

        expect(
          isPatternPieceEdgeTreatment(
            'hem',
          ),
        ).toBe(true)

        expect(
          isPatternPieceEdgeTreatment(
            'finished-edge',
          ),
        ).toBe(true)
      },
    )

    it(
      'rejects topology roles as sewing treatments',
      () => {
        expect(
          isPatternPieceEdgeTreatment(
            'boundary',
          ),
        ).toBe(false)

        expect(
          isPatternPieceEdgeTreatment(
            'construction',
          ),
        ).toBe(false)
      },
    )

    it(
      'rejects unknown runtime values',
      () => {
        expect(
          isPatternPieceEdgeTreatment(
            'dart',
          ),
        ).toBe(false)

        expect(
          isPatternPieceEdgeTreatment(
            '',
          ),
        ).toBe(false)

        expect(
          isPatternPieceEdgeTreatment(
            undefined,
          ),
        ).toBe(false)
      },
    )
  },
)