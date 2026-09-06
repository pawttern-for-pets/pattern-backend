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

import type {
  BellyVariant,
} from '../pattern/referenceTankV2BellyVariant'

interface PatternInputPanelProps {
  measurements:
    BodyMeasurements | null

  halfBodyAllowanceMm:
    number

  shoulderLengthMm:
    number | null

  neckOpeningAllowanceMm:
    number

  bellyVariant:
    BellyVariant

  onGenerate: (
    measurements:
      BodyMeasurements,

    halfBodyAllowanceMm:
      number,

    shoulderLengthMm:
      number,

    neckOpeningAllowanceMm:
      number,

    bellyVariant:
      BellyVariant,

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
  bellyVariant,
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

            bellyVariant,

            shoulderLengthMm,

            neckOpeningAllowanceMm:
              nextNeckOpeningAllowanceMm,
          },
        )

      onGenerate(
        nextMeasurements,
        halfBodyAllowanceMm,
        shoulderLengthMm,
        nextNeckOpeningAllowanceMm,
        bellyVariant,
        construction.document,
      )

      setMessage(
        `V2 block generated ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· neckline ${formatInputNumber(
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
    <section className="patternInputPanel">
      <form
        onSubmit={
          handleSubmit
        }
        className="patternInputForm"
      >
        <div className="patternInputIntro">
          <strong>
            Sleeveless Master Block
          </strong>

          <div className="patternInputSubtle">
            Video Reference 2 ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· measurements in cm
          </div>
        </div>

        <div className="patternInputGroup">
          <div className="patternInputGroupTitle">
            Body Measurements
          </div>

          <label className="patternInputField">
            <span>
              Back Length (B)
            </span>

            <div className="patternInputWithUnit">
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
              />

              <span>
                cm
              </span>
            </div>
          </label>

          <label className="patternInputField">
            <span>
              Chest Girth (C)
            </span>

            <div className="patternInputWithUnit">
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
              />

              <span>
                cm
              </span>
            </div>
          </label>

          <label className="patternInputField">
            <span>
              Neck Girth (N)
            </span>

            <div className="patternInputWithUnit">
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
              />

              <span>
                cm
              </span>
            </div>
          </label>
        </div>

        <div className="patternInputGroup">
          <div className="patternInputGroupTitle">
            Drafting
          </div>

          <label className="patternInputField">
            <span>
              Shoulder Length
            </span>

            <div className="patternInputWithUnit">
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
              />

              <span>
                cm
              </span>
            </div>

            <small>
              Explicit ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â no automatic size assignment
            </small>
          </label>

          <label className="patternInputField">
            <span>
              Neck Opening +
            </span>

            <div className="patternInputWithUnit">
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
              />

              <span>
                cm
              </span>
            </div>

            <small>
              Optional amount added to the minimum opening
            </small>
          </label>
        </div>

        <div className="patternInfoCard">
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

        <div className="patternInfoCard">
          <strong>
            Shoulder reference
          </strong>

          <div>
            S 2.5 ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· M 3.0 ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· L 4.0 ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· XL 4.5 cm
          </div>

          <div>
            Construction angle: 45ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°
          </div>

          <small>
            Checkpoints only ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â not automatic sizing
          </small>
        </div>

        <button
          type="submit"
          className="patternGenerateButton"
        >
          Generate V2 Base Block
        </button>

        {message && (
          <div className="patternInputMessage">
            {message}
          </div>
        )}
      </form>
    </section>
  )
}
