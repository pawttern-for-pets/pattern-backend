import {
  createHistory,
  type HistoryState,
} from '../cad/history'

import {
  createPatternProject,
  type PatternProject,
} from './project'

import {
  deserializePatternProject,
  serializePatternProject,
} from './projectSerialization'

export type PatternProjectHistory =
  HistoryState<PatternProject>

export function createFreshPatternProjectHistory(
  project:
    PatternProject,
): PatternProjectHistory {
  return createHistory(
    project,
  )
}

export function createNewPatternProjectHistory():
PatternProjectHistory {
  return createFreshPatternProjectHistory(
    createPatternProject(),
  )
}

export function openPatternProjectHistoryFromJson(
  json: string,
): PatternProjectHistory {
  /*
   * Deserialize and validate BEFORE
   * replacing current application
   * state.
   */
  const project =
    deserializePatternProject(
      json,
    )

  /*
   * Opening a file starts a new
   * history timeline.
   */
  return createFreshPatternProjectHistory(
    project,
  )
}

export function serializePatternProjectForSave(
  project:
    PatternProject,
): string {
  /*
   * Saving is read-only.
   *
   * Measurements and geometry are
   * serialized together as one
   * parametric project.
   */
  return serializePatternProject(
    project,
  )
}
