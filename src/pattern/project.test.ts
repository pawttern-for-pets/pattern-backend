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
  PATTERN_PROJECT_SCHEMA_VERSION,
  setDraftingRuleVersion,
  setPatternProjectDocument,
  setPatternProjectMeasurements,
} from './project'

describe(
  'PAWTTERN PatternProject',
  () => {
    it(
      'creates version 1 of the project container',
      () => {
        const project =
          createPatternProject()

        expect(
          project
            .projectSchemaVersion,
        ).toBe(
          PATTERN_PROJECT_SCHEMA_VERSION,
        )

        expect(
          project
            .projectSchemaVersion,
        ).toBe(1)
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
          project
            .draftingRuleVersion,
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
        const project =
          createPatternProject()

        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: 42,
            neckGirthCm: 25,
          })

        const updated =
          setPatternProjectMeasurements(
            project,
            measurements,
          )

        expect(
          updated.measurements,
        ).toEqual({
          backLengthMm: 300,
          chestGirthMm: 420,
          neckGirthMm: 250,
        })

        /*
         * No hidden ease or other
         * modification is permitted.
         */
        expect(
          updated.measurements
            ?.chestGirthMm,
        ).toBe(420)
      },
    )

    it(
      'copies assigned measurements so the source object cannot mutate the project',
      () => {
        const project =
          createPatternProject()

        const measurements =
          createBodyMeasurementsFromCm({
            backLengthCm: 30,
            chestGirthCm: 42,
            neckGirthCm: 25,
          })

        const updated =
          setPatternProjectMeasurements(
            project,
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
        const project =
          createPatternProject()

        expect(() =>
          setPatternProjectMeasurements(
            project,
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
      'updates CAD geometry without changing the measurement source-of-truth',
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
        const project =
          createPatternProject()

        const updated =
          setDraftingRuleVersion(
            project,
            'racerback-v1',
          )

        expect(
          updated
            .draftingRuleVersion,
        ).toBe(
          'racerback-v1',
        )
      },
    )

    it(
      'rejects an empty drafting rule version',
      () => {
        const project =
          createPatternProject()

        expect(() =>
          setDraftingRuleVersion(
            project,
            '   ',
          ),
        ).toThrow()
      },
    )
  },
)