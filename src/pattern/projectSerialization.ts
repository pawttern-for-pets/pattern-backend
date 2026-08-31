import {
  isValidPatternDocument,
} from '../cad/serialization'

import {
  isValidBodyMeasurements,
  type BodyMeasurements,
} from './measurements'

import {
  createPatternProject,
  PATTERN_PROJECT_SCHEMA_VERSION,
  setDraftingRuleVersion,
  setPatternProjectDocument,
  setPatternProjectHalfBodyAllowanceMm,
  setPatternProjectMeasurements,
  type PatternProject,
} from './project'

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

function isValidNonNegativeNumber(
  value: unknown,
): value is number {
  return (
    isFiniteNumber(value) &&
    value >= 0
  )
}

function isValidOptionalPositiveNumber(
  value: unknown,
): value is number | null {
  return (
    value === null ||
    (
      isFiniteNumber(value) &&
      value > 0
    )
  )
}

function isValidDraftingRuleVersion(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    (
      typeof value === 'string' &&
      value.trim().length > 0
    )
  )
}

/*
 * --------------------------------
 * CURRENT PROJECT — SCHEMA 3
 * --------------------------------
 */

export function isValidPatternProject(
  value: unknown,
): value is PatternProject {
  if (!isRecord(value)) {
    return false
  }

  if (
    value.projectSchemaVersion !==
      PATTERN_PROJECT_SCHEMA_VERSION ||
    value.patternType !==
      'racerback-tank' ||
    !isValidDraftingRuleVersion(
      value.draftingRuleVersion,
    ) ||
    !isValidNonNegativeNumber(
      value.halfBodyAllowanceMm,
    ) ||
    !isValidOptionalPositiveNumber(
      value.shoulderLengthMm,
    ) ||
    !isValidNonNegativeNumber(
      value.neckOpeningAllowanceMm,
    ) ||
    !isValidOptionalPositiveNumber(
      value.headGirthMm,
    )
  ) {
    return false
  }

  if (
    value.measurements !== null &&
    !isValidBodyMeasurements(
      value.measurements,
    )
  ) {
    return false
  }

  return isValidPatternDocument(
    value.document,
  )
}

/*
 * --------------------------------
 * LEGACY SCHEMA 2
 * --------------------------------
 *
 * Schema 2 already contained:
 *
 * measurements
 * halfBodyAllowanceMm
 * draftingRuleVersion
 * document
 *
 * It did NOT contain:
 *
 * shoulderLengthMm
 * neckOpeningAllowanceMm
 * headGirthMm
 */

interface LegacyPatternProjectV2 {
  projectSchemaVersion: 2
  patternType: 'racerback-tank'
  draftingRuleVersion: string | null
  measurements: BodyMeasurements | null
  halfBodyAllowanceMm: number
  document: PatternProject['document']
}

function isValidLegacyPatternProjectV2(
  value: unknown,
): value is LegacyPatternProjectV2 {
  if (!isRecord(value)) {
    return false
  }

  if (
    value.projectSchemaVersion !== 2 ||
    value.patternType !==
      'racerback-tank' ||
    !isValidDraftingRuleVersion(
      value.draftingRuleVersion,
    ) ||
    !isValidNonNegativeNumber(
      value.halfBodyAllowanceMm,
    )
  ) {
    return false
  }

  if (
    value.measurements !== null &&
    !isValidBodyMeasurements(
      value.measurements,
    )
  ) {
    return false
  }

  return isValidPatternDocument(
    value.document,
  )
}

function migrateLegacyProjectV2(
  legacy:
    LegacyPatternProjectV2,
): PatternProject {
  let project =
    createPatternProject()

  /*
   * Preserve Schema-2 allowance
   * exactly as stored.
   */
  project =
    setPatternProjectHalfBodyAllowanceMm(
      project,
      legacy.halfBodyAllowanceMm,
    )

  if (
    legacy.measurements !== null
  ) {
    project =
      setPatternProjectMeasurements(
        project,
        legacy.measurements,
      )
  }

  project =
    setDraftingRuleVersion(
      project,
      legacy.draftingRuleVersion,
    )

  project =
    setPatternProjectDocument(
      project,
      legacy.document,
    )

  /*
   * New Schema-3 fields deliberately
   * remain at safe defaults:
   *
   * shoulderLengthMm       = null
   * neckOpeningAllowanceMm = 0
   * headGirthMm             = null
   *
   * We do NOT invent historical data.
   */

  return project
}

/*
 * --------------------------------
 * LEGACY SCHEMA 1
 * --------------------------------
 */

interface LegacyPatternProjectV1 {
  projectSchemaVersion: 1
  patternType: 'racerback-tank'
  draftingRuleVersion: string | null
  measurements: BodyMeasurements | null
  document: PatternProject['document']
}

function isValidLegacyPatternProjectV1(
  value: unknown,
): value is LegacyPatternProjectV1 {
  if (!isRecord(value)) {
    return false
  }

  if (
    value.projectSchemaVersion !== 1 ||
    value.patternType !==
      'racerback-tank' ||
    !isValidDraftingRuleVersion(
      value.draftingRuleVersion,
    )
  ) {
    return false
  }

  if (
    value.measurements !== null &&
    !isValidBodyMeasurements(
      value.measurements,
    )
  ) {
    return false
  }

  return isValidPatternDocument(
    value.document,
  )
}

function migrateLegacyProjectV1(
  legacy:
    LegacyPatternProjectV1,
): PatternProject {
  let project =
    createPatternProject()

  /*
   * V1 projects were created before
   * PAWTTERN adopted the explicit
   * +1 cm half-body allowance.
   *
   * Preserve historical meaning by
   * migrating with 0 mm.
   */
  project =
    setPatternProjectHalfBodyAllowanceMm(
      project,
      0,
    )

  if (
    legacy.measurements !== null
  ) {
    project =
      setPatternProjectMeasurements(
        project,
        legacy.measurements,
      )
  }

  project =
    setDraftingRuleVersion(
      project,
      legacy.draftingRuleVersion,
    )

  project =
    setPatternProjectDocument(
      project,
      legacy.document,
    )

  return project
}

export function serializePatternProject(
  project:
    PatternProject,
): string {
  if (
    !isValidPatternProject(
      project,
    )
  ) {
    throw new Error(
      'Cannot serialize an invalid PAWTTERN pattern project.',
    )
  }

  return JSON.stringify(
    project,
    null,
    2,
  )
}

export function deserializePatternProject(
  json: string,
): PatternProject {
  let parsed: unknown

  try {
    parsed =
      JSON.parse(json)
  } catch {
    throw new Error(
      'Pattern file is not valid JSON.',
    )
  }

  /*
   * Current Schema 3.
   */
  if (
    isValidPatternProject(
      parsed,
    )
  ) {
    return parsed
  }

  /*
   * Schema 2 → Schema 3.
   */
  if (
    isValidLegacyPatternProjectV2(
      parsed,
    )
  ) {
    return migrateLegacyProjectV2(
      parsed,
    )
  }

  /*
   * Schema 1 → Schema 3.
   */
  if (
    isValidLegacyPatternProjectV1(
      parsed,
    )
  ) {
    return migrateLegacyProjectV1(
      parsed,
    )
  }

  /*
   * Very old PAWTTERN files stored
   * only PatternDocument geometry.
   *
   * Preserve them without inventing
   * measurements or historical
   * allowances.
   */
  if (
    isValidPatternDocument(
      parsed,
    )
  ) {
    let project =
      createPatternProject()

    project =
      setPatternProjectHalfBodyAllowanceMm(
        project,
        0,
      )

    return setPatternProjectDocument(
      project,
      parsed,
    )
  }

  throw new Error(
    'Pattern file is not a valid PAWTTERN pattern project or legacy CAD document.',
  )
}