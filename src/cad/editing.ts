import {
  removeLine,
  removePoint,
  type PatternDocument,
} from './document'

import type { Selection } from './selection'

export function deleteSelection(
  document: PatternDocument,
  selection: Selection | null,
): PatternDocument {
  if (selection === null) {
    return document
  }

  if (selection.kind === 'point') {
    if (!document.points[selection.id]) {
      return document
    }

    return removePoint(
      document,
      selection.id,
    )
  }

  if (selection.kind === 'line') {
    if (!document.lines[selection.id]) {
      return document
    }

    return removeLine(
      document,
      selection.id,
    )
  }

  return document
}