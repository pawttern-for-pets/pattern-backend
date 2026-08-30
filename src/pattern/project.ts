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
    2 as const

export const
  DEFAULT_HALF_BODY_ALLOWANCE_MM =
    10

export type PatternProjectSchemaVersion =
  typeof PATTERN_PROJECT_SCHEMA_VERSION

/*
 * For the MVP we deliberately support
 * only the Master Block we are actually
 * building.
 *
 * New pattern types should be added
 * only when they become real products.
 */
export type PatternType =
  'racerback-tank'

export interface PatternProject {
  /*
   * Version of the PAWTTERN project
   * container itself.
   *
   * This is NOT the same thing as the
   * PatternDocument schemaVersion.
   */
  projectSchemaVersion:
    PatternProjectSchemaVersion

  /*
   * Which parametric pattern system
   * this project belongs to.
   */
  patternType:
    PatternType

  /*
   * Version of the drafting rules that
   * generated the geometry.
   *
   * null means no validated drafting
   * rule version has been assigned yet.
   */
  draftingRuleVersion:
    string | null

  /*
   * Raw dog body measurements.
   *
   * null means measurements have not
   * been entered or were unavailable,
   * for example when importing an old
   * geometry-only PAWTTERN file.
   */
  measurements:
    BodyMeasurements | null

  /*
   * Explicit allowance added to the
   * combined HALF-BODY construction.
   *
   * The reference video uses +1 cm on
   * the half-body width, which equals
   * +2 cm on the completed body
   * circumference.
   *
   * Raw Chest Girth C is NEVER changed.
   */
  halfBodyAllowanceMm:
    number

  /*
   * The actual CAD geometry.
   */
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

    draftingRuleVersion:
      null,

    measurements:
      null,

    halfBodyAllowanceMm:
      DEFAULT_HALF_BODY_ALLOWANCE_MM,

    document:
      createEmptyDocument(),
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
    )
  ) {
    throw new Error(
      'Half-body allowance must be a finite number.',
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
