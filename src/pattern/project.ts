import {
  createEmptyDocument,
  type PatternDocument,
} from '../cad/document'

import {
  isValidBodyMeasurements,
  type BodyMeasurements,
} from './measurements'

export const
  PATTERN_PROJECT_SCHEMA_VERSION =
    4 as const

export const
  DEFAULT_HALF_BODY_ALLOWANCE_MM =
    10

export const
  DEFAULT_NECK_OPENING_ALLOWANCE_MM =
    0

export type PatternProjectSchemaVersion =
  typeof PATTERN_PROJECT_SCHEMA_VERSION

/*
 * For the MVP we deliberately support
 * only the Master Block we are actually
 * building.
 */
export type PatternType =
  'racerback-tank'
export type BellyVariant =
  'female' |
  'male'

export const DEFAULT_BELLY_VARIANT:
  BellyVariant =
    'female'

export interface PatternProject {
  projectSchemaVersion:
    PatternProjectSchemaVersion

  patternType:
    PatternType

  bellyVariant:
    BellyVariant
  draftingRuleVersion:
    string | null

  measurements:
    BodyMeasurements | null

  halfBodyAllowanceMm:
    number

  shoulderLengthMm:
    number | null

  neckOpeningAllowanceMm:
    number

  headGirthMm:
    number | null

  document:
    PatternDocument
}

/*
 * All data required to describe one
 * generated parametric master block.
 *
 * Keeping these values together prevents
 * the stored PatternProject from drifting
 * away from the geometry that was actually
 * generated.
 */
export interface GeneratedPatternBlock {
  measurements:
    BodyMeasurements

  halfBodyAllowanceMm:
    number

  shoulderLengthMm:
    number

  neckOpeningAllowanceMm:
    number

  draftingRuleVersion:
    string

  document:
    PatternDocument
}

function copyBodyMeasurements(
  measurements:
    BodyMeasurements,
): BodyMeasurements {
  return {
    backLengthMm:
      measurements.backLengthMm,

    chestGirthMm:
      measurements.chestGirthMm,

    neckGirthMm:
      measurements.neckGirthMm,
  }
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

export function createPatternProject():
PatternProject {
  return {
    projectSchemaVersion:
      PATTERN_PROJECT_SCHEMA_VERSION,

    patternType:
      'racerback-tank',

    bellyVariant:
      DEFAULT_BELLY_VARIANT,
    draftingRuleVersion:
      null,

    measurements:
      null,

    halfBodyAllowanceMm:
      DEFAULT_HALF_BODY_ALLOWANCE_MM,

    shoulderLengthMm:
      null,

    neckOpeningAllowanceMm:
      DEFAULT_NECK_OPENING_ALLOWANCE_MM,

    headGirthMm:
      null,

    document:
      createEmptyDocument(),
  }
}

export function setPatternProjectBellyVariant(
  project:
    PatternProject,

  bellyVariant:
    BellyVariant,
): PatternProject {
  if (
    bellyVariant !==
      'female' &&
    bellyVariant !==
      'male'
  ) {
    throw new Error(
      'Belly variant must be female or male.',
    )
  }

  if (
    project.bellyVariant ===
    bellyVariant
  ) {
    return project
  }

  return {
    ...project,

    bellyVariant,
  }
}
export function setPatternProjectMeasurements(
  project:
    PatternProject,

  measurements:
    BodyMeasurements,
): PatternProject {
  if (
    !isValidBodyMeasurements(
      measurements,
    )
  ) {
    throw new Error(
      'Cannot assign invalid body measurements to a PAWTTERN project.',
    )
  }

  return {
    ...project,

    measurements:
      copyBodyMeasurements(
        measurements,
      ),
  }
}

export function clearPatternProjectMeasurements(
  project:
    PatternProject,
): PatternProject {
  if (
    project.measurements ===
    null
  ) {
    return project
  }

  return {
    ...project,

    measurements:
      null,
  }
}

export function setPatternProjectHalfBodyAllowanceMm(
  project:
    PatternProject,

  halfBodyAllowanceMm:
    number,
): PatternProject {
  if (
    !isFiniteNumber(
      halfBodyAllowanceMm,
    ) ||
    halfBodyAllowanceMm < 0
  ) {
    throw new Error(
      'Half-body allowance must be a finite number greater than or equal to 0 mm.',
    )
  }

  if (
    project.halfBodyAllowanceMm ===
    halfBodyAllowanceMm
  ) {
    return project
  }

  return {
    ...project,

    halfBodyAllowanceMm,
  }
}

export function setPatternProjectShoulderLengthMm(
  project:
    PatternProject,

  shoulderLengthMm:
    number | null,
): PatternProject {
  if (
    shoulderLengthMm !== null &&
    (
      !isFiniteNumber(
        shoulderLengthMm,
      ) ||
      shoulderLengthMm <= 0
    )
  ) {
    throw new Error(
      'Shoulder length must be a finite number greater than 0 mm or null.',
    )
  }

  if (
    project.shoulderLengthMm ===
    shoulderLengthMm
  ) {
    return project
  }

  return {
    ...project,

    shoulderLengthMm,
  }
}

export function setPatternProjectNeckOpeningAllowanceMm(
  project:
    PatternProject,

  neckOpeningAllowanceMm:
    number,
): PatternProject {
  if (
    !isFiniteNumber(
      neckOpeningAllowanceMm,
    ) ||
    neckOpeningAllowanceMm < 0
  ) {
    throw new Error(
      'Neck opening allowance must be a finite number greater than or equal to 0 mm.',
    )
  }

  if (
    project.neckOpeningAllowanceMm ===
    neckOpeningAllowanceMm
  ) {
    return project
  }

  return {
    ...project,

    neckOpeningAllowanceMm,
  }
}

export function setPatternProjectHeadGirthMm(
  project:
    PatternProject,

  headGirthMm:
    number | null,
): PatternProject {
  if (
    headGirthMm !== null &&
    (
      !isFiniteNumber(
        headGirthMm,
      ) ||
      headGirthMm <= 0
    )
  ) {
    throw new Error(
      'Head girth must be a finite number greater than 0 mm or null.',
    )
  }

  if (
    project.headGirthMm ===
    headGirthMm
  ) {
    return project
  }

  return {
    ...project,

    headGirthMm,
  }
}

export function setPatternProjectDocument(
  project:
    PatternProject,

  document:
    PatternDocument,
): PatternProject {
  if (
    project.document ===
    document
  ) {
    return project
  }

  return {
    ...project,

    document,
  }
}

export function setDraftingRuleVersion(
  project:
    PatternProject,

  version:
    string | null,
): PatternProject {
  if (
    version !== null &&
    version.trim().length ===
      0
  ) {
    throw new Error(
      'Drafting rule version must be a non-empty string or null.',
    )
  }

  if (
    project.draftingRuleVersion ===
    version
  ) {
    return project
  }

  return {
    ...project,

    draftingRuleVersion:
      version,
  }
}

/*
 * Store one generated parametric block
 * as one coherent PatternProject value.
 *
 * IMPORTANT:
 *
 * This function does NOT commit history.
 * App.tsx remains responsible for making
 * the whole Generate action one Undo step.
 *
 * Existing project fields that are not
 * regenerated here, such as headGirthMm,
 * are preserved.
 */
export function setPatternProjectGeneratedBlock(
  project:
    PatternProject,

  generated:
    GeneratedPatternBlock,
): PatternProject {
  let nextProject =
    setPatternProjectMeasurements(
      project,
      generated.measurements,
    )

  nextProject =
    setPatternProjectHalfBodyAllowanceMm(
      nextProject,
      generated.halfBodyAllowanceMm,
    )

  nextProject =
    setPatternProjectShoulderLengthMm(
      nextProject,
      generated.shoulderLengthMm,
    )

  nextProject =
    setPatternProjectNeckOpeningAllowanceMm(
      nextProject,
      generated.neckOpeningAllowanceMm,
    )

  nextProject =
    setDraftingRuleVersion(
      nextProject,
      generated.draftingRuleVersion,
    )

  nextProject =
    setPatternProjectDocument(
      nextProject,
      generated.document,
    )

  return nextProject
} 