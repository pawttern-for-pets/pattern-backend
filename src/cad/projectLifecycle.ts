import {
  createEmptyDocument,
  type PatternDocument,
} from './document'

import {
  createHistory,
  type HistoryState,
} from './history'

import {
  deserializePatternDocument,
  serializePatternDocument,
} from './serialization'

export type PatternHistory =
  HistoryState<PatternDocument>

export function createFreshPatternHistory(
  document: PatternDocument,
): PatternHistory {
  return createHistory(
    document,
  )
}

export function createNewPatternHistory():
PatternHistory {
  return createFreshPatternHistory(
    createEmptyDocument(),
  )
}

export function openPatternHistoryFromJson(
  json: string,
): PatternHistory {
  /*
   * Deserialize and validate first.
   *
   * If validation fails, this function
   * throws before any replacement
   * history is created.
   */
  const document =
    deserializePatternDocument(
      json,
    )

  /*
   * Opening a project is NOT an edit
   * inside the previous project.
   *
   * Therefore past and future history
   * must both start empty.
   */
  return createFreshPatternHistory(
    document,
  )
}

export function serializePatternForSave(
  document: PatternDocument,
): string {
  /*
   * Saving is read-only.
   * It must never modify document or
   * Undo/Redo history.
   */
  return serializePatternDocument(
    document,
  )
}