export interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export const DEFAULT_HISTORY_LIMIT =
  100

function validateHistoryLimit(
  limit: number,
): void {
  if (
    !Number.isInteger(limit) ||
    limit <= 0
  ) {
    throw new Error(
      'History limit must be a positive integer.',
    )
  }
}

export function createHistory<T>(
  initialState: T,
): HistoryState<T> {
  return {
    past: [],
    present: initialState,
    future: [],
  }
}

export function canUndo<T>(
  history: HistoryState<T>,
): boolean {
  return history.past.length > 0
}

export function canRedo<T>(
  history: HistoryState<T>,
): boolean {
  return history.future.length > 0
}

export function commitHistory<T>(
  history: HistoryState<T>,
  nextState: T,
  limit =
    DEFAULT_HISTORY_LIMIT,
): HistoryState<T> {
  validateHistoryLimit(limit)

  if (
    Object.is(
      history.present,
      nextState,
    )
  ) {
    return history
  }

  const nextPast = [
    ...history.past,
    history.present,
  ]

  const trimmedPast =
    nextPast.length > limit
      ? nextPast.slice(
          nextPast.length -
            limit,
        )
      : nextPast

  return {
    past: trimmedPast,
    present: nextState,
    future: [],
  }
}

export function undoHistory<T>(
  history: HistoryState<T>,
): HistoryState<T> {
  if (!canUndo(history)) {
    return history
  }

  const previousState =
    history.past[
      history.past.length - 1
    ]

  return {
    past:
      history.past.slice(
        0,
        -1,
      ),

    present:
      previousState,

    future: [
      history.present,
      ...history.future,
    ],
  }
}

export function redoHistory<T>(
  history: HistoryState<T>,
): HistoryState<T> {
  if (!canRedo(history)) {
    return history
  }

  const nextState =
    history.future[0]

  return {
    past: [
      ...history.past,
      history.present,
    ],

    present:
      nextState,

    future:
      history.future.slice(1),
  }
}