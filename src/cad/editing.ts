import {
  removeCurve,
  removeLine,
  removePoint,
  type PatternDocument,
} from './document'

import type {
  Selection,
} from './selection'

export function deleteSelection(
  document: PatternDocument,
  selection: Selection | null,
): PatternDocument {
  /*
   * No selection means there is
   * nothing to delete.
   *
   * Return the exact same document
   * so no unnecessary history entry
   * can be created.
   */
  if (selection === null) {
    return document
  }

  if (
    selection.kind ===
    'point'
  ) {
    return removePoint(
      document,
      selection.id,
    )
  }

  if (
    selection.kind ===
    'line'
  ) {
    return removeLine(
      document,
      selection.id,
    )
  }

  if (
    selection.kind ===
    'curve'
  ) {
    return removeCurve(
      document,
      selection.id,
    )
  }

  return document
}