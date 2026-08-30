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
    !isFiniteNumber(
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
   * PAWTTERN adopted the reference
   * video's explicit +1 cm half-body
   * allowance.
   *
   * Preserve their historical meaning
   * by migrating them with 0 mm rather
   * than silently changing geometry.
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

  if (
    isValidPatternProject(
      parsed,
    )
  ) {
    return parsed
  }

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
   * Older PAWTTERN files stored only
   * PatternDocument geometry.
   *
   * Preserve those files without
   * inventing measurements or changing
   * their historical allowance basis.
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
