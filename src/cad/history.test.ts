import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  canRedo,
  canUndo,
  commitHistory,
  createHistory,
  redoHistory,
  undoHistory,
} from './history'

describe(
  'PAWTTERN CAD history engine',
  () => {
    it(
      'creates history with no undo or redo available',
      () => {
        const history =
          createHistory('A')

        expect(
          history.present,
        ).toBe('A')

        expect(
          canUndo(history),
        ).toBe(false)

        expect(
          canRedo(history),
        ).toBe(false)
      },
    )

    it(
      'commits a new state and enables undo',
      () => {
        const history =
          createHistory('A')

        const changed =
          commitHistory(
            history,
            'B',
          )

        expect(
          changed.present,
        ).toBe('B')

        expect(
          changed.past,
        ).toEqual(['A'])

        expect(
          canUndo(changed),
        ).toBe(true)

        expect(
          canRedo(changed),
        ).toBe(false)
      },
    )

    it(
      'undoes to the previous state',
      () => {
        const history =
          commitHistory(
            createHistory('A'),
            'B',
          )

        const undone =
          undoHistory(history)

        expect(
          undone.present,
        ).toBe('A')

        expect(
          canUndo(undone),
        ).toBe(false)

        expect(
          canRedo(undone),
        ).toBe(true)
      },
    )

    it(
      'redoes an undone state',
      () => {
        const history =
          commitHistory(
            createHistory('A'),
            'B',
          )

        const undone =
          undoHistory(history)

        const redone =
          redoHistory(undone)

        expect(
          redone.present,
        ).toBe('B')

        expect(
          canUndo(redone),
        ).toBe(true)

        expect(
          canRedo(redone),
        ).toBe(false)
      },
    )

    it(
      'clears redo history after a new edit',
      () => {
        let history =
          createHistory('A')

        history =
          commitHistory(
            history,
            'B',
          )

        history =
          commitHistory(
            history,
            'C',
          )

        history =
          undoHistory(
            history,
          )

        expect(
          history.present,
        ).toBe('B')

        expect(
          canRedo(history),
        ).toBe(true)

        history =
          commitHistory(
            history,
            'D',
          )

        expect(
          history.present,
        ).toBe('D')

        expect(
          canRedo(history),
        ).toBe(false)
      },
    )

    it(
      'does nothing when undo is unavailable',
      () => {
        const history =
          createHistory('A')

        expect(
          undoHistory(history),
        ).toBe(history)
      },
    )

    it(
      'does nothing when redo is unavailable',
      () => {
        const history =
          createHistory('A')

        expect(
          redoHistory(history),
        ).toBe(history)
      },
    )

    it(
      'keeps only the configured number of past states',
      () => {
        let history =
          createHistory(0)

        history =
          commitHistory(
            history,
            1,
            2,
          )

        history =
          commitHistory(
            history,
            2,
            2,
          )

        history =
          commitHistory(
            history,
            3,
            2,
          )

        expect(
          history.past,
        ).toEqual([
          1,
          2,
        ])

        expect(
          history.present,
        ).toBe(3)
      },
    )

    it(
      'does not create duplicate history when state is unchanged',
      () => {
        const object = {
          value: 1,
        }

        const history =
          createHistory(object)

        const result =
          commitHistory(
            history,
            object,
          )

        expect(result).toBe(
          history,
        )
      },
    )

    it(
      'rejects an invalid history limit',
      () => {
        const history =
          createHistory('A')

        expect(() =>
          commitHistory(
            history,
            'B',
            0,
          ),
        ).toThrow()

        expect(() =>
          commitHistory(
            history,
            'B',
            -1,
          ),
        ).toThrow()
      },
    )
  },
)