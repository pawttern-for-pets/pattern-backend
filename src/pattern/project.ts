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
    1 as const

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
   *
   * We do not invent a version before
   * the real formulas exist.
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
   * The actual CAD geometry.
   *
   * This remains independent from the
   * measurements and future formula
   * engine.
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

  /*
   * Copy the values so outside code
   * cannot later mutate the project's
   * measurement source-of-truth by
   * changing the original object.
   */
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