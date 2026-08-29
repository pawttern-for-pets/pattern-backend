import type {
  PatternDocument,
} from './document'

import {
  serializePatternForSave,
} from './projectLifecycle'

export type CleanPatternSnapshot =
  string

export function createCleanPatternSnapshot(
  document: PatternDocument,
): CleanPatternSnapshot {
  /*
   * Store the normalized serialized
   * PatternDocument, not a mutable
   * object reference.
   */
  return serializePatternForSave(
    document,
  )
}

export function hasUnsavedPatternChanges(
  document: PatternDocument,
  cleanSnapshot:
    CleanPatternSnapshot,
): boolean {
  const currentSnapshot =
    serializePatternForSave(
      document,
    )

  return (
    currentSnapshot !==
    cleanSnapshot
  )
}