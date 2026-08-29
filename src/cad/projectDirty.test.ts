import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addPoint,
  createEmptyDocument,
} from './document'

import {
  createCleanPatternSnapshot,
  hasUnsavedPatternChanges,
} from './projectDirty'

describe(
  'PAWTTERN CAD dirty project detection',
  () => {
    it(
      'treats a newly snapshotted document as clean',
      () => {
        const document =
          createEmptyDocument()

        const snapshot =
          createCleanPatternSnapshot(
            document,
          )

        expect(
          hasUnsavedPatternChanges(
            document,
            snapshot,
          ),
        ).toBe(false)
      },
    )

    it(
      'detects a geometry edit',
      () => {
        const original =
          createEmptyDocument()

        const snapshot =
          createCleanPatternSnapshot(
            original,
          )

        const edited =
          addPoint(
            original,
            {
              id: 'A',
              name: 'A',
              xMm: 10,
              yMm: 20,
            },
          )

        expect(
          hasUnsavedPatternChanges(
            edited,
            snapshot,
          ),
        ).toBe(true)
      },
    )

    it(
      'becomes clean again when geometry returns exactly to the saved state',
      () => {
        const original =
          createEmptyDocument()

        const snapshot =
          createCleanPatternSnapshot(
            original,
          )

        const edited =
          addPoint(
            original,
            {
              id: 'A',
              name: 'A',
              xMm: 10,
              yMm: 20,
            },
          )

        expect(
          hasUnsavedPatternChanges(
            edited,
            snapshot,
          ),
        ).toBe(true)

        /*
         * This represents Undo returning
         * history.present to the exact
         * previously saved document.
         */
        expect(
          hasUnsavedPatternChanges(
            original,
            snapshot,
          ),
        ).toBe(false)
      },
    )

    it(
      'detects an exact coordinate change',
      () => {
        let original =
          createEmptyDocument()

        original =
          addPoint(
            original,
            {
              id: 'A',
              name: 'A',
              xMm: 10,
              yMm: 20,
            },
          )

        const snapshot =
          createCleanPatternSnapshot(
            original,
          )

        let edited =
          createEmptyDocument()

        edited =
          addPoint(
            edited,
            {
              id: 'A',
              name: 'A',
              xMm: 10.001,
              yMm: 20,
            },
          )

        expect(
          hasUnsavedPatternChanges(
            edited,
            snapshot,
          ),
        ).toBe(true)
      },
    )

    it(
      'treats structurally identical documents as clean even when they are different object instances',
      () => {
        let documentA =
          createEmptyDocument()

        documentA =
          addPoint(
            documentA,
            {
              id: 'A',
              name: 'A',
              xMm: 50,
              yMm: 75,
            },
          )

        let documentB =
          createEmptyDocument()

        documentB =
          addPoint(
            documentB,
            {
              id: 'A',
              name: 'A',
              xMm: 50,
              yMm: 75,
            },
          )

        expect(
          documentA,
        ).not.toBe(
          documentB,
        )

        const snapshot =
          createCleanPatternSnapshot(
            documentA,
          )

        expect(
          hasUnsavedPatternChanges(
            documentB,
            snapshot,
          ),
        ).toBe(false)
      },
    )

    it(
      'updates the clean baseline after saving a changed document',
      () => {
        const original =
          createEmptyDocument()

        const firstSnapshot =
          createCleanPatternSnapshot(
            original,
          )

        const edited =
          addPoint(
            original,
            {
              id: 'A',
              name: 'A',
              xMm: 30,
              yMm: 40,
            },
          )

        expect(
          hasUnsavedPatternChanges(
            edited,
            firstSnapshot,
          ),
        ).toBe(true)

        /*
         * Saving establishes a new
         * clean baseline.
         */
        const secondSnapshot =
          createCleanPatternSnapshot(
            edited,
          )

        expect(
          hasUnsavedPatternChanges(
            edited,
            secondSnapshot,
          ),
        ).toBe(false)
      },
    )
  },
)