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
  createReferenceTankArmholeConstruction,
} from '../pattern/referenceTankArmholeConstruction'

interface PatternInputPanelProps {
  measurements:
    BodyMeasurements | null

  halfBodyAllowanceMm:
    number

  onGenerate: (
    measurements:
      BodyMeasurements,

    document:
      PatternDocument,
  ) => void
}

function parseMeasurement(
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

function formatInputNumber(
  value: number,
): string {
  return Number(
    value.toFixed(6),
  ).toString()
}

function formatAllowanceCm(
  halfBodyAllowanceMm:
    number,
): string {
  const cm =
    mmToCm(
      halfBodyAllowanceMm,
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
    message,
    setMessage,
  ] = useState<string | null>(
    null,
  )

  /*
   * PatternProject is the source of
   * truth.
   *
   * Undo, Redo, New, and Open may all
   * replace measurements outside this
   * component, so the visible inputs
   * must follow the current project.
   */
  useEffect(() => {
    if (
      measurements === null
    ) {
      setBackLengthInput('')
      setChestGirthInput('')
      setNeckGirthInput('')
      setMessage(null)

      return
    }

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

    setMessage(null)
  }, [
    measurements,
  ])

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    try {
      const backLengthCm =
        parseMeasurement(
          backLengthInput,
          'Back Length',
        )

      const chestGirthCm =
        parseMeasurement(
          chestGirthInput,
          'Chest Girth',
        )

      const neckGirthCm =
        parseMeasurement(
          neckGirthInput,
          'Neck Girth',
        )

      const nextMeasurements =
        createBodyMeasurementsFromCm({
          backLengthCm,
          chestGirthCm,
          neckGirthCm,
        })

      /*
       * PAWTTERN keeps raw C unchanged.
       *
       * The project's explicit
       * half-body allowance is passed
       * to the formula engine separately.
       */
      const construction =
        createReferenceTankArmholeConstruction(
          nextMeasurements,
          {
            halfBodyAllowanceMm,
          },
        )

      onGenerate(
        nextMeasurements,
        construction.document,
      )

      setMessage(
        'Base block generated.',
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to generate the base block.'

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
              Dog measurements in cm
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
            title="Explicit reference-video body allowance. Raw Chest Girth C is unchanged."
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

          <button
            type="submit"
          >
            Generate Base Block
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
