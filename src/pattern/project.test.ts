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
  clearPatternProjectMeasurements,
  createPatternProject,
  DEFAULT_BELLY_VARIANT,
  DEFAULT_HALF_BODY_ALLOWANCE_MM,
  DEFAULT_NECK_OPENING_ALLOWANCE_MM,
  PATTERN_PROJECT_SCHEMA_VERSION,
  setDraftingRuleVersion,
  setPatternProjectBellyVariant,
  setPatternProjectDocument,
  setPatternProjectHalfBodyAllowanceMm,
  setPatternProjectHeadGirthMm,
  setPatternProjectMeasurements,
  setPatternProjectNeckOpeningAllowanceMm,
  setPatternProjectShoulderLengthMm,
} from './project'

describe(
  'PAWTTERN PatternProject',
  () => {
    it(
      'creates version 4 of the project container',
      () => {
        const project =
          createPatternProject()

        expect(
          project.projectSchemaVersion,
        ).toBe(
          PATTERN_PROJECT_SCHEMA_VERSION,
        )

        expect(
          project.projectSchemaVersion,
        ).toBe(4)
      },
    )

    it(
      'creates only the racerback tank MVP pattern type',
      () => {
        const project =
          createPatternProject()

        expect(
          project.patternType,
        ).toBe(
          'racerback-tank',
        )
      },
    )

    it(
      'uses the Video-2 plus one centimeter half-body allowance by default',
      () => {
        const project =
          createPatternProject()

        expect(
          project.halfBodyAllowanceMm,
        ).toBe(
          DEFAULT_HALF_BODY_ALLOWANCE_MM,
        )

        expect(
          project.halfBodyAllowanceMm,
        ).toBe(10)
      },
    )

    it(
      'defaults the belly variant to female',
      () => {
        const project =
          createPatternProject()

        expect(
          project.bellyVariant,
        ).toBe(
          DEFAULT_BELLY_VARIANT,
        )

        expect(
          project.bellyVariant,
        ).toBe(
          'female',
        )
      },
    )

    it(
      'stores an explicit male belly variant',
      () => {
        const project =
          setPatternProjectBellyVariant(
            createPatternProject(),
            'male',
          )

        expect(
          project.bellyVariant,
        ).toBe(
          'male',
        )
      },
    )
    it(
      'does not invent a shoulder length for a new project',
      () => {
        const project =
          createPatternProject()

        expect(
          project.shoulderLengthMm,
        ).toBeNull()
      },
    )

    it(
      'starts neck opening allowance at zero',
      () => {
        const project =
          createPatternProject()

        expect(
          project
            .neckOpeningAllowanceMm,
        ).toBe(
          DEFAULT_NECK_OPENING_ALLOWANCE_MM,
        )

        expect(
          project
            .neckOpeningAllowanceMm,
        ).toBe(0)
      },
    )

    it(
      'does not invent a head girth for a new project',
      () => {
        const project =
          createPatternProject()

        expect(
          project.headGirthMm,
        ).toBeNull()
      },
    )

    it(
      'updates half-body allowance without changing raw chest girth',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: 42,
            neckGirthCm: 25,
          })

        const project =
          setPatternProjectMeasurements(
            createPatternProject(),
            measurements,
          )

        const updated =
          setPatternProjectHalfBodyAllowanceMm(
            project,
            15,
          )

        expect(
          updated.halfBodyAllowanceMm,
        ).toBe(15)

        expect(
          updated.measurements
            ?.chestGirthMm,
        ).toBe(420)
      },
    )

    it(
      'rejects invalid half-body allowances',
      () => {
        expect(() =>
          setPatternProjectHalfBodyAllowanceMm(
            createPatternProject(),
            Number.NaN,
          ),
        ).toThrow()

        expect(() =>
          setPatternProjectHalfBodyAllowanceMm(
            createPatternProject(),
            -1,
          ),
        ).toThrow()
      },
    )

    it(
      'stores an explicit shoulder length without assigning a nominal size',
      () => {
        const project =
          setPatternProjectShoulderLengthMm(
            createPatternProject(),
            30,
          )

        expect(
          project.shoulderLengthMm,
        ).toBe(30)

        expect(
          'size' in project,
        ).toBe(false)
      },
    )

    it(
      'can clear shoulder length back to null',
      () => {
        const project =
          setPatternProjectShoulderLengthMm(
            createPatternProject(),
            30,
          )

        const cleared =
          setPatternProjectShoulderLengthMm(
            project,
            null,
          )

        expect(
          cleared.shoulderLengthMm,
        ).toBeNull()
      },
    )

    it(
      'rejects invalid shoulder lengths',
      () => {
        expect(() =>
          setPatternProjectShoulderLengthMm(
            createPatternProject(),
            0,
          ),
        ).toThrow()

        expect(() =>
          setPatternProjectShoulderLengthMm(
            createPatternProject(),
            -10,
          ),
        ).toThrow()

        expect(() =>
          setPatternProjectShoulderLengthMm(
            createPatternProject(),
            Number.NaN,
          ),
        ).toThrow()
      },
    )

    it(
      'stores optional neck opening allowance separately from raw neck girth',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: 42,
            neckGirthCm: 25,
          })

        let project =
          setPatternProjectMeasurements(
            createPatternProject(),
            measurements,
          )

        project =
          setPatternProjectNeckOpeningAllowanceMm(
            project,
            20,
          )

        expect(
          project
            .neckOpeningAllowanceMm,
        ).toBe(20)

        expect(
          project.measurements
            ?.neckGirthMm,
        ).toBe(250)
      },
    )

    it(
      'rejects negative neck opening allowance',
      () => {
        expect(() =>
          setPatternProjectNeckOpeningAllowanceMm(
            createPatternProject(),
            -1,
          ),
        ).toThrow()
      },
    )

    it(
      'stores optional head girth without changing neck girth',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: 42,
            neckGirthCm: 25,
          })

        let project =
          setPatternProjectMeasurements(
            createPatternProject(),
            measurements,
          )

        project =
          setPatternProjectHeadGirthMm(
            project,
            320,
          )

        expect(
          project.headGirthMm,
        ).toBe(320)

        expect(
          project.measurements
            ?.neckGirthMm,
        ).toBe(250)
      },
    )

    it(
      'can clear optional head girth',
      () => {
        const project =
          setPatternProjectHeadGirthMm(
            createPatternProject(),
            320,
          )

        const cleared =
          setPatternProjectHeadGirthMm(
            project,
            null,
          )

        expect(
          cleared.headGirthMm,
        ).toBeNull()
      },
    )

    it(
      'rejects invalid head girth',
      () => {
        expect(() =>
          setPatternProjectHeadGirthMm(
            createPatternProject(),
            0,
          ),
        ).toThrow()

        expect(() =>
          setPatternProjectHeadGirthMm(
            createPatternProject(),
            Number.NaN,
          ),
        ).toThrow()
      },
    )

    it(
      'does not invent body measurements for a new project',
      () => {
        const project =
          createPatternProject()

        expect(
          project.measurements,
        ).toBeNull()
      },
    )

    it(
      'does not invent a drafting rule version before formulas exist',
      () => {
        const project =
          createPatternProject()

        expect(
          project.draftingRuleVersion,
        ).toBeNull()
      },
    )

    it(
      'starts with genuinely blank CAD geometry',
      () => {
        const project =
          createPatternProject()

        expect(
          project.document.points,
        ).toEqual({})

        expect(
          project.document.lines,
        ).toEqual({})

        expect(
          project.document.curves,
        ).toEqual({})
      },
    )

    it(
      'stores validated raw body measurements without changing them',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: 42,
            neckGirthCm: 25,
          })

        const updated =
          setPatternProjectMeasurements(
            createPatternProject(),
            measurements,
          )

        expect(
          updated.measurements,
        ).toEqual({
          backLengthMm: 300,
          chestGirthMm: 420,
          neckGirthMm: 250,
        })
      },
    )

    it(
      'copies assigned measurements so source data cannot mutate the project',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: 42,
            neckGirthCm: 25,
          })

        const updated =
          setPatternProjectMeasurements(
            createPatternProject(),
            measurements,
          )

        expect(
          updated.measurements,
        ).not.toBe(
          measurements,
        )

        measurements.chestGirthMm =
          999

        expect(
          updated.measurements
            ?.chestGirthMm,
        ).toBe(420)
      },
    )

    it(
      'rejects invalid body measurements',
      () => {
        expect(() =>
          setPatternProjectMeasurements(
            createPatternProject(),
            {
              backLengthMm: 300,
              chestGirthMm: 0,
              neckGirthMm: 250,
            },
          ),
        ).toThrow()
      },
    )

    it(
      'can explicitly clear body measurements',
      () => {
        const project =
          setPatternProjectMeasurements(
            createPatternProject(),

            createBodyMeasurementsFromCm({
              backLengthCm: 30,
              chestGirthCm: 42,
              neckGirthCm: 25,
            }),
          )

        const cleared =
          clearPatternProjectMeasurements(
            project,
          )

        expect(
          cleared.measurements,
        ).toBeNull()
      },
    )

    it(
      'updates CAD geometry without changing measurements',
      () => {
        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: 42,
            neckGirthCm: 25,
          })

        const project =
          setPatternProjectMeasurements(
            createPatternProject(),
            measurements,
          )

        const nextDocument =
          addPoint(
            project.document,
            {
              id: 'A',
              name: 'A',
              xMm: 0,
              yMm: 0,
            },
          )

        const updated =
          setPatternProjectDocument(
            project,
            nextDocument,
          )

        expect(
          updated.document.points.A,
        ).toBeDefined()

        expect(
          updated.measurements,
        ).toEqual(
          project.measurements,
        )
      },
    )

    it(
      'returns the same project when the CAD document reference does not change',
      () => {
        const project =
          createPatternProject()

        const updated =
          setPatternProjectDocument(
            project,
            project.document,
          )

        expect(
          updated,
        ).toBe(project)
      },
    )

    it(
      'assigns a drafting rule version only when one actually exists',
      () => {
        const updated =
          setDraftingRuleVersion(
            createPatternProject(),
            'PAWTTERN_MASTER_V2',
          )

        expect(
          updated.draftingRuleVersion,
        ).toBe(
          'PAWTTERN_MASTER_V2',
        )
      },
    )

    it(
      'rejects an empty drafting rule version',
      () => {
        expect(() =>
          setDraftingRuleVersion(
            createPatternProject(),
            '   ',
          ),
        ).toThrow()
      },
    )
  },
)