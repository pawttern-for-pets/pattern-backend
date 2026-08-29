import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  PatternDocument,
} from './document'

import {
  addCurve,
  addLine,
  addPoint,
  createEmptyDocument,
} from './document'

import {
  deserializePatternDocument,
  isValidPatternDocument,
  serializePatternDocument,
} from './serialization'

function createFullDocument() {
  let document =
    createEmptyDocument()

  document = addPoint(
    document,
    {
      id: 'A',
      name: 'A',
      xMm: 12.345,
      yMm: -8.765,
    },
  )

  document = addPoint(
    document,
    {
      id: 'B',
      name: 'B',
      xMm: 112.345,
      yMm: 41.235,
    },
  )

  document = addLine(
    document,
    {
      id: 'L1',
      name: 'L1',
      startPointId: 'A',
      endPointId: 'B',
    },
  )

  document = addCurve(
    document,
    {
      id: 'C1',
      name: 'Neckline',

      startPointId: 'A',
      endPointId: 'B',

      control1: {
        xMm: 35.5,
        yMm: 72.25,
      },

      control2: {
        xMm: 88.75,
        yMm: 65.125,
      },
    },
  )

  return document
}

describe(
  'PAWTTERN CAD document serialization',
  () => {
    it(
      'round-trips an empty document',
      () => {
        const original =
          createEmptyDocument()

        const json =
          serializePatternDocument(
            original,
          )

        const restored =
          deserializePatternDocument(
            json,
          )

        expect(
          restored,
        ).toEqual(
          original,
        )
      },
    )

    it(
      'round-trips points, lines, and curves',
      () => {
        const original =
          createFullDocument()

        const restored =
          deserializePatternDocument(
            serializePatternDocument(
              original,
            ),
          )

        expect(
          restored,
        ).toEqual(
          original,
        )
      },
    )

    it(
      'preserves exact canonical millimeter coordinates',
      () => {
        const original =
          createFullDocument()

        const restored =
          deserializePatternDocument(
            serializePatternDocument(
              original,
            ),
          )

        expect(
          restored.points.A.xMm,
        ).toBe(12.345)

        expect(
          restored.points.A.yMm,
        ).toBe(-8.765)

        expect(
          restored.curves.C1
            .control2.yMm,
        ).toBe(65.125)
      },
    )

    it(
      'refuses to serialize an invalid in-memory document',
      () => {
        const document =
          createFullDocument()

        const corrupted = {
          ...document,

          points: {
            ...document.points,

            A: {
              ...document.points.A,

              xMm:
                Number.NaN,
            },
          },
        }

        expect(() =>
          serializePatternDocument(
            corrupted as
              PatternDocument,
          ),
        ).toThrow()
      },
    )

    it(
      'rejects malformed JSON',
      () => {
        expect(() =>
          deserializePatternDocument(
            '{not-json',
          ),
        ).toThrow()
      },
    )

    it(
      'rejects an unsupported schema version',
      () => {
        const document =
          createFullDocument()

        const corrupted = {
          ...document,

          schemaVersion: 999,
        }

        expect(
          isValidPatternDocument(
            corrupted,
          ),
        ).toBe(false)
      },
    )

    it(
      'rejects a document missing its curve collection',
      () => {
        const document =
          createFullDocument()

        const {
          curves: _curves,
          ...corrupted
        } = document

        expect(
          isValidPatternDocument(
            corrupted,
          ),
        ).toBe(false)
      },
    )

    it(
      'rejects invalid point coordinates',
      () => {
        const document =
          createFullDocument()

        const corrupted = {
          ...document,

          points: {
            ...document.points,

            A: {
              ...document.points.A,

              yMm:
                Number.POSITIVE_INFINITY,
            },
          },
        }

        expect(
          isValidPatternDocument(
            corrupted,
          ),
        ).toBe(false)
      },
    )

    it(
      'rejects a line whose endpoint does not exist',
      () => {
        const document =
          createFullDocument()

        const corrupted = {
          ...document,

          lines: {
            ...document.lines,

            L1: {
              ...document.lines.L1,

              endPointId:
                'missing',
            },
          },
        }

        expect(
          isValidPatternDocument(
            corrupted,
          ),
        ).toBe(false)
      },
    )

    it(
      'rejects a curve whose endpoint does not exist',
      () => {
        const document =
          createFullDocument()

        const corrupted = {
          ...document,

          curves: {
            ...document.curves,

            C1: {
              ...document.curves.C1,

              startPointId:
                'missing',
            },
          },
        }

        expect(
          isValidPatternDocument(
            corrupted,
          ),
        ).toBe(false)
      },
    )

    it(
      'rejects invalid curve control coordinates',
      () => {
        const document =
          createFullDocument()

        const corrupted = {
          ...document,

          curves: {
            ...document.curves,

            C1: {
              ...document.curves.C1,

              control1: {
                ...document
                  .curves.C1
                  .control1,

                xMm:
                  Number.NaN,
              },
            },
          },
        }

        expect(
          isValidPatternDocument(
            corrupted,
          ),
        ).toBe(false)
      },
    )

    it(
      'rejects a map key that does not match the object ID',
      () => {
        const document =
          createFullDocument()

        const corrupted = {
          ...document,

          points: {
            WRONG_KEY: {
              ...document.points.A,
            },

            B:
              document.points.B,
          },
        }

        expect(
          isValidPatternDocument(
            corrupted,
          ),
        ).toBe(false)
      },
    )
  },
)