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
  setDraftingRuleVersion,
  setPatternProjectDocument,
  setPatternProjectBellyVariant,
  setPatternProjectHalfBodyAllowanceMm,
  setPatternProjectHeadGirthMm,
  setPatternProjectMeasurements,
  setPatternProjectNeckOpeningAllowanceMm,
  setPatternProjectShoulderLengthMm,
} from './project'

import {
  deserializePatternProject,
  serializePatternProject,
} from './projectSerialization'

describe(
  'PAWTTERN PatternProject serialization',
  () => {
    it(
      'saves Schema-4 drafting parameters measurements belly variant and CAD geometry together',
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

        project =
          setPatternProjectShoulderLengthMm(
            project,
            30,
          )

        project =
          setPatternProjectNeckOpeningAllowanceMm(
            project,
            15,
          )

        project =
          setPatternProjectHeadGirthMm(
            project,
            320,
          )

        project =
          setPatternProjectBellyVariant(
            project,
            'male',
          )
        project =
          setDraftingRuleVersion(
            project,
            'PAWTTERN_MASTER_V2',
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
          opened.projectSchemaVersion,
        ).toBe(4)

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
          opened.shoulderLengthMm,
        ).toBe(30)

        expect(
          opened.neckOpeningAllowanceMm,
        ).toBe(15)

        expect(
          opened.headGirthMm,
        ).toBe(320)

        expect(
          opened.bellyVariant,
        ).toBe(
          'male',
        )
        expect(
          opened.draftingRuleVersion,
        ).toBe(
          'PAWTTERN_MASTER_V2',
        )

        expect(
          opened.document.points.A,
        ).toBeDefined()
      },
    )

    it(
      'migrates a version 3 project while defaulting the historical belly variant to female',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 22,
            chestGirthCm: 36,
            neckGirthCm: 27,
          })

        const legacyProject = {
          projectSchemaVersion: 3,
          patternType:
            'racerback-tank',
          draftingRuleVersion:
            'PAWTTERN_MASTER_V2',
          measurements,
          halfBodyAllowanceMm:
            10,
          shoulderLengthMm:
            30,
          neckOpeningAllowanceMm:
            15,
          headGirthMm:
            320,
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
        ).toBe(4)

        expect(
          opened.measurements,
        ).toEqual(
          measurements,
        )

        expect(
          opened.halfBodyAllowanceMm,
        ).toBe(10)

        expect(
          opened.shoulderLengthMm,
        ).toBe(30)

        expect(
          opened.neckOpeningAllowanceMm,
        ).toBe(15)

        expect(
          opened.headGirthMm,
        ).toBe(320)

        expect(
          opened.draftingRuleVersion,
        ).toBe(
          'PAWTTERN_MASTER_V2',
        )

        expect(
          opened.bellyVariant,
        ).toBe(
          'female',
        )
      },
    )
    it(
      'migrates a version 2 project while preserving historical data',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 22,
            chestGirthCm: 36,
            neckGirthCm: 27,
          })

        const legacyProject = {
          projectSchemaVersion: 2,
          patternType:
            'racerback-tank',
          draftingRuleVersion:
            'racerback-v1',
          measurements,
          halfBodyAllowanceMm:
            10,
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
        ).toBe(4)

        expect(
          opened.halfBodyAllowanceMm,
        ).toBe(10)

        expect(
          opened.measurements,
        ).toEqual(
          measurements,
        )

        expect(
          opened.draftingRuleVersion,
        ).toBe(
          'racerback-v1',
        )

        expect(
          opened.shoulderLengthMm,
        ).toBeNull()

        expect(
          opened.neckOpeningAllowanceMm,
        ).toBe(0)

        expect(
          opened.headGirthMm,
        ).toBeNull()
        expect(
          opened.bellyVariant,
        ).toBe(
          'female',
        )
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
        ).toBe(4)

        expect(
          opened.halfBodyAllowanceMm,
        ).toBe(0)

        expect(
          opened.measurements,
        ).toEqual(
          measurements,
        )

        expect(
          opened.shoulderLengthMm,
        ).toBeNull()

        expect(
          opened.neckOpeningAllowanceMm,
        ).toBe(0)

        expect(
          opened.headGirthMm,
        ).toBeNull()
        expect(
          opened.bellyVariant,
        ).toBe(
          'female',
        )
      },
    )

    it(
      'opens a geometry-only legacy document without inventing drafting parameters',
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
          opened.projectSchemaVersion,
        ).toBe(4)

        expect(
          opened.measurements,
        ).toBeNull()

        expect(
          opened.halfBodyAllowanceMm,
        ).toBe(0)

        expect(
          opened.shoulderLengthMm,
        ).toBeNull()

        expect(
          opened.neckOpeningAllowanceMm,
        ).toBe(0)

        expect(
          opened.headGirthMm,
        ).toBeNull()
        expect(
          opened.bellyVariant,
        ).toBe(
          'female',
        )

        expect(
          opened.document,
        ).toEqual(
          legacyDocument,
        )
      },
    )

    it(
      'rejects invalid Schema-4 negative allowances',
      () => {
        const invalidProject = {
          ...createPatternProject(),

          halfBodyAllowanceMm:
            -1,
        }

        expect(() =>
          serializePatternProject(
            invalidProject,
          ),
        ).toThrow()
      },
    )

    it(
      'rejects missing or invalid Schema-4 belly variants',
      () => {
        const missingBellyVariant = {
          ...createPatternProject(),
        } as Record<string, unknown>

        delete missingBellyVariant.bellyVariant

        expect(() =>
          deserializePatternProject(
            JSON.stringify(
              missingBellyVariant,
            ),
          ),
        ).toThrow()

        const invalidBellyVariant = {
          ...createPatternProject(),
          bellyVariant:
            'other',
        }

        expect(() =>
          deserializePatternProject(
            JSON.stringify(
              invalidBellyVariant,
            ),
          ),
        ).toThrow()
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