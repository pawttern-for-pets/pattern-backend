import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addPoint,
  createEmptyDocument,
} from '../cad/document'

import {
  serializePatternDocument,
} from '../cad/serialization'

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
  deserializePatternProject,
  serializePatternProject,
} from './projectSerialization'

describe(
  'PAWTTERN PatternProject serialization',
  () => {
    it(
      'saves measurements allowance and CAD geometry together',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 22,
            chestGirthCm: 36,
            neckGirthCm: 27,
          })

        let project =
          setPatternProjectMeasurements(
            createPatternProject(),
            measurements,
          )

        project =
          setPatternProjectHalfBodyAllowanceMm(
            project,
            10,
          )

        const document =
          addPoint(
            project.document,
            {
              id: 'A',
              name: 'A',
              xMm: 10,
              yMm: 20,
            },
          )

        project =
          setPatternProjectDocument(
            project,
            document,
          )

        const json =
          serializePatternProject(
            project,
          )

        const opened =
          deserializePatternProject(
            json,
          )

        expect(
          opened.measurements,
        ).toEqual({
          backLengthMm: 220,
          chestGirthMm: 360,
          neckGirthMm: 270,
        })

        expect(
          opened.halfBodyAllowanceMm,
        ).toBe(10)

        expect(
          opened.document.points.A,
        ).toBeDefined()
      },
    )

    it(
      'migrates a version 1 project with zero historical half-body allowance',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 22,
            chestGirthCm: 36,
            neckGirthCm: 27,
          })

        const legacyProject = {
          projectSchemaVersion: 1,
          patternType:
            'racerback-tank',
          draftingRuleVersion:
            null,
          measurements,
          document:
            createEmptyDocument(),
        }

        const opened =
          deserializePatternProject(
            JSON.stringify(
              legacyProject,
            ),
          )

        expect(
          opened.projectSchemaVersion,
        ).toBe(2)

        expect(
          opened.halfBodyAllowanceMm,
        ).toBe(0)

        expect(
          opened.measurements,
        ).toEqual(
          measurements,
        )
      },
    )

    it(
      'opens a legacy geometry-only PAWTTERN document without inventing measurements or allowance',
      () => {
        const legacyDocument =
          addPoint(
            createEmptyDocument(),
            {
              id: 'A',
              name: 'A',
              xMm: 5,
              yMm: 6,
            },
          )

        const legacyJson =
          serializePatternDocument(
            legacyDocument,
          )

        const opened =
          deserializePatternProject(
            legacyJson,
          )

        expect(
          opened.measurements,
        ).toBeNull()

        expect(
          opened.halfBodyAllowanceMm,
        ).toBe(0)

        expect(
          opened.document,
        ).toEqual(
          legacyDocument,
        )
      },
    )

    it(
      'rejects invalid project JSON',
      () => {
        expect(() =>
          deserializePatternProject(
            '{"projectSchemaVersion":999}',
          ),
        ).toThrow()
      },
    )
  },
)
