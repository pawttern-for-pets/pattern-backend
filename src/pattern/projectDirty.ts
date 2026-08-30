import type {
  PatternProject,
} from './project'

import {
  serializePatternProjectForSave,
} from './projectLifecycle'

export type CleanPatternProjectSnapshot =
  string

export function createCleanPatternProjectSnapshot(
  project:
    PatternProject,
): CleanPatternProjectSnapshot {
  /*
   * Store a normalized serialized
   * project snapshot instead of a
   * mutable object reference.
   */
  return serializePatternProjectForSave(
    project,
  )
}

export function hasUnsavedPatternProjectChanges(
  project:
    PatternProject,

  cleanSnapshot:
    CleanPatternProjectSnapshot,
): boolean {
  const currentSnapshot =
    serializePatternProjectForSave(
      project,
    )

  return (
    currentSnapshot !==
    cleanSnapshot
  )
}
