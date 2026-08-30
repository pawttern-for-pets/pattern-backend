import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addPoint,
} from '../cad/document'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  createPatternProject,
  setPatternProjectDocument,
  setPatternProjectHalfBodyAllowanceMm,
  setPatternProjectMeasurements,
} from './project'

import {
  createCleanPatternProjectSnapshot,
  hasUnsavedPatternProjectChanges,
} from './projectDirty'

describe(
  'PAWTTERN parametric project dirty detection',
  () => {
    it(
      'treats a freshly snapshotted project as clean',
      () => {
        const project =
          createPatternProject()

        const snapshot =
          createCleanPatternProjectSnapshot(
            project,
          )

        expect(
          hasUnsavedPatternProjectChanges(
            project,
            snapshot,
          ),
        ).toBe(false)
      },
    )

    it(
      'detects a measurement change even before geometry differs',
      () => {
        const original =
          createPatternProject()

        const snapshot =
          createCleanPatternProjectSnapshot(
            original,
          )

        const changed =
          setPatternProjectMeasurements(
            original,
            createBodyMeasurementsFromCm({
              backLengthCm: 22,
              chestGirthCm: 36,
              neckGirthCm: 27,
            }),
          )

        expect(
          hasUnsavedPatternProjectChanges(
            changed,
            snapshot,
          ),
        ).toBe(true)
      },
    )



    it(
      'detects a half-body allowance change',
      () => {
        const original =
          createPatternProject()

        const snapshot =
          createCleanPatternProjectSnapshot(
            original,
          )

        const changed =
          setPatternProjectHalfBodyAllowanceMm(
            original,
            20,
          )

        expect(
          hasUnsavedPatternProjectChanges(
            changed,
            snapshot,
          ),
        ).toBe(true)
      },
    )

    it(
      'detects a geometry edit while preserving measurements',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 22,
            chestGirthCm: 36,
            neckGirthCm: 27,
          })

        const original =
          setPatternProjectMeasurements(
            createPatternProject(),
            measurements,
          )

        const snapshot =
          createCleanPatternProjectSnapshot(
            original,
          )

        const changed =
          setPatternProjectDocument(
            original,
            addPoint(
              original.document,
              {
                id: 'A',
                name: 'A',
                xMm: 10,
                yMm: 20,
              },
            ),
          )

        expect(
          hasUnsavedPatternProjectChanges(
            changed,
            snapshot,
          ),
        ).toBe(true)
      },
    )
  },
)
