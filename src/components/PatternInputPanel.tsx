import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import type {
  PatternDocument,
} from '../cad/document'

import {
  mmToCm,
} from '../cad/units'

import {
  bodyMeasurementsToCm,
  createBodyMeasurementsFromCm,
  type BodyMeasurements,
} from '../pattern/measurements'

import {
  createReferenceTankV2Construction,
} from '../pattern/referenceTankV2Construction'

interface PatternInputPanelProps {
  measurements:
    BodyMeasurements | null

  halfBodyAllowanceMm:
    number

  shoulderLengthMm:
    number | null

  neckOpeningAllowanceMm:
    number

  onGenerate: (
    measurements:
      BodyMeasurements,

    shoulderLengthMm:
      number,

    neckOpeningAllowanceMm:
      number,

    document:
      PatternDocument,
  ) => void
}

function parsePositiveMeasurement(
  value: string,
  label: string,
): number {
  const parsed =
    Number(value)

  if (
    value.trim() === '' ||
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      `${label} must be greater than 0 cm.`,
    )
  }

  return parsed
}

function parseNonNegativeMeasurement(
  value: string,
  label: string,
): number {
  const parsed =
    Number(value)

  if (
    value.trim() === '' ||
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      `${label} must be 0 cm or greater.`,
    )
  }

  return parsed
}

function formatInputNumber(
  value: number,
): string {
  return Number(
    value.toFixed(6),
  ).toString()
}

function formatAllowanceCm(
  allowanceMm:
    number,
): string {
  const cm =
    mmToCm(
      allowanceMm,
    )

  const sign =
    cm > 0
      ? '+'
      : ''

  return `${sign}${formatInputNumber(cm)} cm`
}

export function PatternInputPanel({
  measurements,
  halfBodyAllowanceMm,
  shoulderLengthMm,
  neckOpeningAllowanceMm,
  onGenerate,
}: PatternInputPanelProps) {
  const [
    backLengthInput,
    setBackLengthInput,
  ] = useState('')

  const [
    chestGirthInput,
    setChestGirthInput,
  ] = useState('')

  const [
    neckGirthInput,
    setNeckGirthInput,
  ] = useState('')

  const [
    shoulderLengthInput,
    setShoulderLengthInput,
  ] = useState('')

  const [
    neckOpeningAllowanceInput,
    setNeckOpeningAllowanceInput,
  ] = useState('0')

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null,
  )

  /*
   * PatternProject is the source
   * of truth.
   *
   * Undo / Redo / New / Open can
   * replace these values outside this
   * component, so all inputs follow
   * the current project.
   */
  useEffect(() => {
    if (
      measurements === null
    ) {
      setBackLengthInput('')
      setChestGirthInput('')
      setNeckGirthInput('')
    } else {
      const values =
        bodyMeasurementsToCm(
          measurements,
        )

      setBackLengthInput(
        formatInputNumber(
          values.backLengthCm,
        ),
      )

      setChestGirthInput(
        formatInputNumber(
          values.chestGirthCm,
        ),
      )

      setNeckGirthInput(
        formatInputNumber(
          values.neckGirthCm,
        ),
      )
    }

    if (
      shoulderLengthMm ===
      null
    ) {
      setShoulderLengthInput('')
    } else {
      setShoulderLengthInput(
        formatInputNumber(
          mmToCm(
            shoulderLengthMm,
          ),
        ),
      )
    }

    setNeckOpeningAllowanceInput(
      formatInputNumber(
        mmToCm(
          neckOpeningAllowanceMm,
        ),
      ),
    )

    setMessage(null)
  }, [
    measurements,
    shoulderLengthMm,
    neckOpeningAllowanceMm,
  ])

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    try {
      const backLengthCm =
        parsePositiveMeasurement(
          backLengthInput,
          'Back Length',
        )

      const chestGirthCm =
        parsePositiveMeasurement(
          chestGirthInput,
          'Chest Girth',
        )

      const neckGirthCm =
        parsePositiveMeasurement(
          neckGirthInput,
          'Neck Girth',
        )

      const shoulderLengthCm =
        parsePositiveMeasurement(
          shoulderLengthInput,
          'Shoulder Length',
        )

      const neckOpeningAllowanceCm =
        parseNonNegativeMeasurement(
          neckOpeningAllowanceInput,
          'Neck Opening Allowance',
        )

      const shoulderLengthMm =
        shoulderLengthCm * 10

      const nextNeckOpeningAllowanceMm =
        neckOpeningAllowanceCm * 10

      const nextMeasurements =
        createBodyMeasurementsFromCm({
          backLengthCm,
          chestGirthCm,
          neckGirthCm,
        })

      const construction =
        createReferenceTankV2Construction(
          nextMeasurements,
          {
            halfBodyAllowanceMm,

            shoulderLengthMm,

            neckOpeningAllowanceMm:
              nextNeckOpeningAllowanceMm,
          },
        )

      onGenerate(
        nextMeasurements,
        shoulderLengthMm,
        nextNeckOpeningAllowanceMm,
        construction.document,
      )

      setMessage(
        `V2 block generated · neckline ${formatInputNumber(
          mmToCm(
            construction
              .neckline
              .finishedNeckOpeningMm,
          ),
        )} cm`,
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to generate the Video-2 master block.'

      setMessage(
        errorMessage,
      )
    }
  }

  const completedAllowanceMm =
    halfBodyAllowanceMm * 2

  return (
    <section
      style={{
        padding: '12px 16px',
        borderBottom:
          '1px solid #d7d7d7',
        background: '#ffffff',
      }}
    >
      <form
        onSubmit={
          handleSubmit
        }
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'end',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong>
              Sleeveless Master Block
            </strong>

            <div
              style={{
                fontSize: '12px',
                marginTop: '2px',
              }}
            >
              Video Reference 2 · measurements in cm
            </div>
          </div>

          <label>
            <div>
              Back Length (B)
            </div>

            <input
              type="number"
              min="0.1"
              step="0.1"
              inputMode="decimal"
              placeholder="e.g. 22"
              value={
                backLengthInput
              }
              onChange={(
                event,
              ) =>
                setBackLengthInput(
                  event.target.value,
                )
              }
              style={{
                width: '90px',
              }}
            />
          </label>

          <label>
            <div>
              Chest Girth (C)
            </div>

            <input
              type="number"
              min="0.1"
              step="0.1"
              inputMode="decimal"
              placeholder="e.g. 36"
              value={
                chestGirthInput
              }
              onChange={(
                event,
              ) =>
                setChestGirthInput(
                  event.target.value,
                )
              }
              style={{
                width: '90px',
              }}
            />
          </label>

          <label>
            <div>
              Neck Girth (N)
            </div>

            <input
              type="number"
              min="0.1"
              step="0.1"
              inputMode="decimal"
              placeholder="e.g. 27"
              value={
                neckGirthInput
              }
              onChange={(
                event,
              ) =>
                setNeckGirthInput(
                  event.target.value,
                )
              }
              style={{
                width: '90px',
              }}
            />
          </label>

          <label>
            <div>
              Shoulder Length
            </div>

            <input
              type="number"
              min="0.1"
              step="0.1"
              inputMode="decimal"
              placeholder="e.g. 3.0"
              value={
                shoulderLengthInput
              }
              onChange={(
                event,
              ) =>
                setShoulderLengthInput(
                  event.target.value,
                )
              }
              style={{
                width: '90px',
              }}
            />

            <div
              style={{
                fontSize: '10px',
                marginTop: '2px',
                maxWidth: '130px',
              }}
            >
              Explicit — no automatic size assignment
            </div>
          </label>

          <label>
            <div>
              Neck Opening +
            </div>

            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              placeholder="0"
              value={
                neckOpeningAllowanceInput
              }
              onChange={(
                event,
              ) =>
                setNeckOpeningAllowanceInput(
                  event.target.value,
                )
              }
              style={{
                width: '90px',
              }}
            />

            <div
              style={{
                fontSize: '10px',
                marginTop: '2px',
                maxWidth: '130px',
              }}
            >
              optional cm added to minimum opening
            </div>
          </label>

          <div
            style={{
              padding: '5px 8px',
              border:
                '1px solid #d7d7d7',
              borderRadius: '4px',
              fontSize: '12px',
              lineHeight: 1.35,
              background: '#fafafa',
            }}
            title="Explicit body allowance. Raw Chest Girth C is unchanged."
          >
            <strong>
              Body allowance
            </strong>

            <div>
              Half-body:{' '}
              {formatAllowanceCm(
                halfBodyAllowanceMm,
              )}
            </div>

            <div>
              Finished circumference:{' '}
              {formatAllowanceCm(
                completedAllowanceMm,
              )}
            </div>
          </div>

          <div
            style={{
              padding: '5px 8px',
              border:
                '1px solid #d7d7d7',
              borderRadius: '4px',
              fontSize: '12px',
              lineHeight: 1.35,
              background: '#fafafa',
              maxWidth: '210px',
            }}
            title="Reference checkpoints only. These do not automatically classify the dog."
          >
            <strong>
              Shoulder reference
            </strong>

            <div>
              S 2.5 · M 3.0 · L 4.0 · XL 4.5 cm
            </div>

            <div>
              Construction angle: 45°
            </div>

            <div
              style={{
                fontSize: '10px',
                marginTop: '2px',
              }}
            >
              checkpoints only — not automatic sizing
            </div>
          </div>

          <button
            type="submit"
          >
            Generate V2 Base Block
          </button>

          {message && (
            <span
              style={{
                fontSize:
                  '13px',
              }}
            >
              {message}
            </span>
          )}
        </div>
      </form>
    </section>
  )
}