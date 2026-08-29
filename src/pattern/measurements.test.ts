import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  bodyMeasurementsToCm,
  createBodyMeasurementsFromCm,
  isValidBodyMeasurements,
  updateBodyMeasurementMm,
} from './measurements'

describe(
  'PAWTTERN body measurements',
  () => {
    it(
      'converts centimeter input to canonical millimeters',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: 42,
            neckGirthCm: 25,
          })

        expect(
          measurements,
        ).toEqual({
          backLengthMm: 300,
          chestGirthMm: 420,
          neckGirthMm: 250,
        })
      },
    )

    it(
      'preserves decimal centimeter measurements',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 31.5,
            chestGirthCm: 44.25,
            neckGirthCm: 26.75,
          })

        expect(
          measurements.backLengthMm,
        ).toBe(315)

        expect(
          measurements.chestGirthMm,
        ).toBe(442.5)

        expect(
          measurements.neckGirthMm,
        ).toBe(267.5)
      },
    )

    it(
      'converts canonical millimeters back to centimeters',
      () => {
        const displayed =
          bodyMeasurementsToCm({
            backLengthMm: 315,
            chestGirthMm: 442.5,
            neckGirthMm: 267.5,
          })

        expect(
          displayed,
        ).toEqual({
          backLengthCm: 31.5,
          chestGirthCm: 44.25,
          neckGirthCm: 26.75,
        })
      },
    )

    it(
      'rejects zero measurements',
      () => {
        expect(() =>
          createBodyMeasurementsFromCm({
            backLengthCm: 0,
            chestGirthCm: 42,
            neckGirthCm: 25,
          }),
        ).toThrow()
      },
    )

    it(
      'rejects negative measurements',
      () => {
        expect(() =>
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: -42,
            neckGirthCm: 25,
          }),
        ).toThrow()
      },
    )

    it(
      'rejects non-finite measurements',
      () => {
        expect(() =>
          createBodyMeasurementsFromCm({
            backLengthCm:
              Number.NaN,

            chestGirthCm: 42,

            neckGirthCm: 25,
          }),
        ).toThrow()

        expect(() =>
          createBodyMeasurementsFromCm({
            backLengthCm: 30,

            chestGirthCm:
              Number.POSITIVE_INFINITY,

            neckGirthCm: 25,
          }),
        ).toThrow()
      },
    )

    it(
      'validates a complete canonical measurement set',
      () => {
        expect(
          isValidBodyMeasurements({
            backLengthMm: 300,
            chestGirthMm: 420,
            neckGirthMm: 250,
          }),
        ).toBe(true)

        expect(
          isValidBodyMeasurements({
            backLengthMm: 300,
            chestGirthMm: 420,
          }),
        ).toBe(false)
      },
    )

    it(
      'updates one measurement immutably',
      () => {
        const original = {
          backLengthMm: 300,
          chestGirthMm: 420,
          neckGirthMm: 250,
        }

        const updated =
          updateBodyMeasurementMm(
            original,
            'chestGirthMm',
            460,
          )

        expect(
          updated,
        ).not.toBe(original)

        expect(
          updated,
        ).toEqual({
          backLengthMm: 300,
          chestGirthMm: 460,
          neckGirthMm: 250,
        })

        expect(
          original.chestGirthMm,
        ).toBe(420)
      },
    )

    it(
      'returns the same object when a measurement does not change',
      () => {
        const original = {
          backLengthMm: 300,
          chestGirthMm: 420,
          neckGirthMm: 250,
        }

        const updated =
          updateBodyMeasurementMm(
            original,
            'chestGirthMm',
            420,
          )

        expect(
          updated,
        ).toBe(original)
      },
    )
  },
)