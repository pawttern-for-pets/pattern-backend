import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addPoint,
} from '../cad/document'

import {
  commitHistory,
  redoHistory,
  undoHistory,
} from '../cad/history'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  setPatternProjectDocument,
  setPatternProjectHalfBodyAllowanceMm,
  setPatternProjectMeasurements,
} from './project'

import {
  createNewPatternProjectHistory,
  openPatternProjectHistoryFromJson,
  serializePatternProjectForSave,
} from './projectLifecycle'

describe(
  'PAWTTERN parametric project lifecycle',
  () => {
    it(
      'creates a blank project with no invented measurements',
      () => {
        const history =
          createNewPatternProjectHistory()

        expect(
          history.present.measurements,
        ).toBeNull()

        expect(
          history.present.halfBodyAllowanceMm,
        ).toBe(10)

        expect(
          history.present.document.points,
        ).toEqual({})
      },
    )

    it(
      'undo and redo restore measurements and geometry together',
      () => {
        let history =
          createNewPatternProjectHistory()

        const firstMeasurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 22,
            chestGirthCm: 36,
            neckGirthCm: 27,
          })

        let firstProject =
          setPatternProjectMeasurements(
            history.present,
            firstMeasurements,
          )

        firstProject =
          setPatternProjectHalfBodyAllowanceMm(
            firstProject,
            10,
          )

        firstProject =
          setPatternProjectDocument(
            firstProject,
            addPoint(
              firstProject.document,
              {
                id: 'FIRST',
                name: 'First',
                xMm: 22,
                yMm: 36,
              },
            ),
          )

        history =
          commitHistory(
            history,
            firstProject,
          )

        const secondMeasurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: 50,
            neckGirthCm: 30,
          })

        let secondProject =
          setPatternProjectMeasurements(
            history.present,
            secondMeasurements,
          )

        secondProject =
          setPatternProjectHalfBodyAllowanceMm(
            secondProject,
            20,
          )

        secondProject =
          setPatternProjectDocument(
            secondProject,
            addPoint(
              secondProject.document,
              {
                id: 'SECOND',
                name: 'Second',
                xMm: 30,
                yMm: 50,
              },
            ),
          )

        history =
          commitHistory(
            history,
            secondProject,
          )

        history =
          undoHistory(
            history,
          )

        expect(
          history.present
            .measurements
            ?.backLengthMm,
        ).toBe(220)

        expect(
          history.present
            .halfBodyAllowanceMm,
        ).toBe(10)

        expect(
          history.present
            .document
            .points.SECOND,
        ).toBeUndefined()

        history =
          redoHistory(
            history,
          )

        expect(
          history.present
            .measurements
            ?.backLengthMm,
        ).toBe(300)

        expect(
          history.present
            .halfBodyAllowanceMm,
        ).toBe(20)

        expect(
          history.present
            .document
            .points.SECOND,
        ).toBeDefined()
      },
    )

    it(
      'saves and opens a full parametric project',
      () => {
        let history =
          createNewPatternProjectHistory()

        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 22,
            chestGirthCm: 36,
            neckGirthCm: 27,
          })

        let project =
          setPatternProjectMeasurements(
            history.present,
            measurements,
          )

        project =
          setPatternProjectHalfBodyAllowanceMm(
            project,
            10,
          )

        project =
          setPatternProjectDocument(
            project,
            addPoint(
              project.document,
              {
                id: 'A',
                name: 'A',
                xMm: 1,
                yMm: 2,
              },
            ),
          )

        const json =
          serializePatternProjectForSave(
            project,
          )

        history =
          openPatternProjectHistoryFromJson(
            json,
          )

        expect(
          history.present.measurements,
        ).toEqual(
          measurements,
        )

        expect(
          history.present
            .halfBodyAllowanceMm,
        ).toBe(10)

        expect(
          history.present.document
            .points.A,
        ).toBeDefined()

        expect(
          history.past,
        ).toEqual([])

        expect(
          history.future,
        ).toEqual([])
      },
    )
  },
)
