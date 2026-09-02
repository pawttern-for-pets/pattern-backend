import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createBodyMeasurementsFromCm,
} from './measurements'

import {
  createPatternProject,
  setPatternProjectGeneratedBlock,
} from './project'

import {
  createReferenceTankV2Construction,
  REFERENCE_TANK_V2_CURVE_IDS,
  REFERENCE_TANK_V2_POINT_IDS,
} from './referenceTankV2Construction'

import {
  PAWTTERN_MASTER_V2_RULE_VERSION,
} from './referenceTankV2Formula'

import {
  validateReferenceTankV2DocumentEdit,
} from './referenceTankV2EditValidation'

function createGeneratedProject(
  neckOpeningAllowanceMm:
    number,
) {
  const measurements =
    createBodyMeasurementsFromCm({
      backLengthCm:
        22,

      chestGirthCm:
        36,

      neckGirthCm:
        27,
    })

  const construction =
    createReferenceTankV2Construction(
      measurements,
      {
        halfBodyAllowanceMm:
          10,

        shoulderLengthMm:
          30,

        neckOpeningAllowanceMm,
      },
    )

  return (
    setPatternProjectGeneratedBlock(
      createPatternProject(),
      {
        measurements,

        halfBodyAllowanceMm:
          10,

        shoulderLengthMm:
          30,

        neckOpeningAllowanceMm,

        draftingRuleVersion:
          PAWTTERN_MASTER_V2_RULE_VERSION,

        document:
          construction.document,
      },
    )
  )
}

describe(
  'PAWTTERN V2 document edit validation',
  () => {
    it(
      'allows generic CAD editing before a V2 block has been generated',
      () => {
        const project =
          createPatternProject()

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            project.document,
          )

        expect(
          result.isValid,
        ).toBe(true)

        expect(
          result.minimumNeckOpeningMm,
        ).toBeNull()
      },
    )

    it(
      'accepts the currently generated valid V2 document',
      () => {
        const project =
          createGeneratedProject(
            30,
          )

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            project.document,
          )

        expect(
          result.isValid,
        ).toBe(true)

        expect(
          result.finishedNeckOpeningMm,
        ).toBeGreaterThanOrEqual(
          299.999,
        )

        expect(
          result.minimumNeckOpeningMm,
        ).toBe(300)
      },
    )

    it(
      'allows a valid horizontal Center Neck handle adjustment',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .backNeckline

        const curve =
          project.document.curves[
            curveId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              control1: {
                xMm:
                  curve.control1.xMm +
                  1,

                /*
                 * Keep the Center Neck
                 * tangent horizontal.
                 */
                yMm:
                  curve.control1.yMm,
              },
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(true)

        expect(
          result.finishedNeckOpeningMm,
        ).toBeGreaterThanOrEqual(
          270,
        )
      },
    )

    it(
      'rejects manually moving a generated Side Neck point',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const pointId =
          REFERENCE_TANK_V2_POINT_IDS
            .backSideNeck

        const point =
          project.document.points[
            pointId
          ]

        const candidateDocument = {
          ...project.document,

          points: {
            ...project.document
              .points,

            [pointId]: {
              ...point,

              xMm:
                point.xMm +
                5,
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /cannot be moved manually/i,
        )
      },
    )

    it(
      'rejects deleting a generated neck anchor point',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const pointId =
          REFERENCE_TANK_V2_POINT_IDS
            .frontSideNeck

        const remainingPoints = {
          ...project.document.points,
        }

        delete remainingPoints[
          pointId
        ]

        const candidateDocument = {
          ...project.document,

          points:
            remainingPoints,
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /cannot be deleted/i,
        )
      },
    )

    it(
      'rejects deleting either generated neckline curve',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .backNeckline

        const remainingCurves = {
          ...project.document.curves,
        }

        delete remainingCurves[
          curveId
        ]

        const candidateDocument = {
          ...project.document,

          curves:
            remainingCurves,
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /cannot be deleted/i,
        )
      },
    )

    it(
      'rejects reassigning generated neckline endpoints',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .backNeckline

        const curve =
          project.document.curves[
            curveId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              /*
               * Use an existing distant
               * generated point so curve
               * measurement still succeeds.
               */
              endPointId:
                REFERENCE_TANK_V2_POINT_IDS
                  .backBottom,
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /endpoints cannot be reassigned/i,
        )
      },
    )

    it(
      'rejects a neckline control handle outside its construction rectangle',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .frontNeckline

        const curve =
          project.document.curves[
            curveId
          ]

        const start =
          project.document.points[
            curve.startPointId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              control1: {
                /*
                 * Front Center is the
                 * right boundary.
                 *
                 * Moving farther right
                 * leaves the neck rectangle.
                 */
                xMm:
                  start.xMm +
                  5,

                yMm:
                  start.yMm,
              },
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /construction area/i,
        )
      },
    )

    it(
      'rejects losing the horizontal Center Neck tangent',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .frontNeckline

        const curve =
          project.document.curves[
            curveId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              control1: {
                xMm:
                  curve.control1.xMm,

                /*
                 * Still inside the
                 * construction rectangle,
                 * but no longer horizontal.
                 */
                yMm:
                  curve.control1.yMm -
                  1,
              },
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /leave Center Neck horizontally/i,
        )
      },
    )

    it(
      'rejects a backward horizontal curl before Side Neck',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .backNeckline

        const curve =
          project.document.curves[
            curveId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              control1: {
                /*
                 * Keep this control
                 * inside the rectangle
                 * and horizontal, but
                 * move it beyond Ctrl 2.
                 *
                 * The control polygon
                 * now reverses X direction.
                 */
                xMm:
                  curve.control2.xMm +
                  1,

                yMm:
                  curve.control1.yMm,
              },
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /reverse direction|curl/i,
        )
      },
    )

    it(
      'rejects vertical reversal inside the neck construction area',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .backNeckline

        const curve =
          project.document.curves[
            curveId
          ]

        const start =
          project.document.points[
            curve.startPointId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              control1: {
                xMm:
                  curve.control1.xMm,

                yMm:
                  start.yMm -
                  20,
              },

              control2: {
                xMm:
                  curve.control2.xMm,

                /*
                 * Ctrl 2 moves back
                 * downward relative
                 * to Ctrl 1.
                 */
                yMm:
                  start.yMm -
                  5,
              },
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /reverse vertically|curl/i,
        )
      },
    )

    it(
      'rejects losing the 45 degree Side Neck approach',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .backNeckline

        const curve =
          project.document.curves[
            curveId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              control2: {
                /*
                 * Small horizontal
                 * change keeps Ctrl 2
                 * inside the rectangle
                 * but breaks |dx| = |dy|.
                 */
                xMm:
                  curve.control2.xMm +
                  1,

                yMm:
                  curve.control2.yMm,
              },
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /45 degrees/i,
        )
      },
    )

    it(
      'rejects a long but physically invalid curled neckline',
      () => {
        /*
         * This reproduces the important
         * failure discovered manually:
         *
         * A badly distorted curve can
         * become LONGER than the required
         * neckline and therefore pass a
         * circumference-only validator.
         */
        const project =
          createGeneratedProject(
            30,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .backNeckline

        const curve =
          project.document.curves[
            curveId
          ]

        const start =
          project.document.points[
            curve.startPointId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              control1: {
                xMm:
                  start.xMm +
                  20,

                /*
                 * Huge downward excursion.
                 *
                 * This deliberately makes
                 * the curve very long while
                 * also making it unusable.
                 */
                yMm:
                  start.yMm +
                  120,
              },
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        /*
         * Critical regression check:
         *
         * The curve is NOT rejected for
         * being too short.
         *
         * It is longer than the minimum
         * but is still rejected because
         * its SHAPE is invalid.
         */
        expect(
          result.finishedNeckOpeningMm,
        ).not.toBeNull()

        expect(
          result.finishedNeckOpeningMm!,
        ).toBeGreaterThan(
          300,
        )

        expect(
          result.message,
        ).toMatch(
          /construction area/i,
        )
      },
    )

    it(
      'rejects Bézier control edits that make the finished neckline smaller than the active minimum',
      () => {
        const project =
          createGeneratedProject(
            30,
          )

        const backCurveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .backNeckline

        const frontCurveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .frontNeckline

        const backCurve =
          project.document.curves[
            backCurveId
          ]

        const frontCurve =
          project.document.curves[
            frontCurveId
          ]

        const backStart =
          project.document.points[
            backCurve.startPointId
          ]

        const backEnd =
          project.document.points[
            backCurve.endPointId
          ]

        const frontStart =
          project.document.points[
            frontCurve.startPointId
          ]

        const frontEnd =
          project.document.points[
            frontCurve.endPointId
          ]

        /*
         * Pull both curves toward
         * their endpoint chords.
         *
         * This reduces total opening
         * below the required 30 cm.
         */
        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [backCurveId]: {
              ...backCurve,

              control1: {
                xMm:
                  backStart.xMm,

                yMm:
                  backStart.yMm,
              },

              control2: {
                xMm:
                  backEnd.xMm,

                yMm:
                  backEnd.yMm,
              },
            },

            [frontCurveId]: {
              ...frontCurve,

              control1: {
                xMm:
                  frontStart.xMm,

                yMm:
                  frontStart.yMm,
              },

              control2: {
                xMm:
                  frontEnd.xMm,

                yMm:
                  frontEnd.yMm,
              },
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.finishedNeckOpeningMm,
        ).not.toBeNull()

        expect(
          result.finishedNeckOpeningMm!,
        ).toBeLessThan(
          300,
        )

        expect(
          result.message,
        ).toMatch(
          /minimum/i,
        )
      },
    )

    it(
      'rejects manually moving the generated Back Armhole Pivot',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const pointId =
          REFERENCE_TANK_V2_POINT_IDS
            .backArmholePivot

        const point =
          project.document.points[
            pointId
          ]

        const candidateDocument = {
          ...project.document,

          points: {
            ...project.document
              .points,

            [pointId]: {
              ...point,

              xMm:
                point.xMm +
                5,
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /cannot be moved manually/i,
        )
      },
    )

    it(
      'rejects manually moving the generated Front Armhole Pivot',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const pointId =
          REFERENCE_TANK_V2_POINT_IDS
            .frontArmholePivot

        const point =
          project.document.points[
            pointId
          ]

        const candidateDocument = {
          ...project.document,

          points: {
            ...project.document
              .points,

            [pointId]: {
              ...point,

              yMm:
                point.yMm +
                5,
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /cannot be moved manually/i,
        )
      },
    )

    it(
      'rejects manually moving the generated Common Armpit',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const pointId =
          REFERENCE_TANK_V2_POINT_IDS
            .commonArmpit

        const point =
          project.document.points[
            pointId
          ]

        const candidateDocument = {
          ...project.document,

          points: {
            ...project.document
              .points,

            [pointId]: {
              ...point,

              xMm:
                point.xMm +
                5,
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /cannot be moved manually/i,
        )
      },
    )

    it(
      'rejects manually moving either generated Arm Guide construction point',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        for (
          const pointId
          of [
            REFERENCE_TANK_V2_POINT_IDS
              .backArmGuide,

            REFERENCE_TANK_V2_POINT_IDS
              .frontArmGuide,
          ]
        ) {
          const point =
            project.document.points[
              pointId
            ]

          const candidateDocument = {
            ...project.document,

            points: {
              ...project.document
                .points,

              [pointId]: {
                ...point,

                yMm:
                  point.yMm +
                  5,
              },
            },
          }

          const result =
            validateReferenceTankV2DocumentEdit(
              project,
              candidateDocument,
            )

          expect(
            result.isValid,
          ).toBe(false)

          expect(
            result.message,
          ).toMatch(
            /cannot be moved manually/i,
          )
        }
      },
    )

    it(
      'rejects deleting either generated Arm Guide construction point',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        for (
          const pointId
          of [
            REFERENCE_TANK_V2_POINT_IDS
              .backArmGuide,

            REFERENCE_TANK_V2_POINT_IDS
              .frontArmGuide,
          ]
        ) {
          const remainingPoints = {
            ...project.document.points,
          }

          delete remainingPoints[
            pointId
          ]

          const candidateDocument = {
            ...project.document,

            points:
              remainingPoints,
          }

          const result =
            validateReferenceTankV2DocumentEdit(
              project,
              candidateDocument,
            )

          expect(
            result.isValid,
          ).toBe(false)

          expect(
            result.message,
          ).toMatch(
            /cannot be deleted/i,
          )
        }
      },
    )

    it(
      'rejects deleting a generated armhole spline segment',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .backArmholePivotToCommon

        const remainingCurves = {
          ...project.document.curves,
        }

        delete remainingCurves[
          curveId
        ]

        const candidateDocument = {
          ...project.document,

          curves:
            remainingCurves,
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /armhole curve.*cannot be deleted/i,
        )
      },
    )

    it(
      'rejects moving Ctrl 1 on a generated armhole spline segment',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .backArmholePivotToCommon

        const curve =
          project.document.curves[
            curveId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              control1: {
                ...curve.control1,

                xMm:
                  curve.control1.xMm +
                  1,
              },
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /armhole curve.*cannot be edited manually/i,
        )
      },
    )

    it(
      'rejects moving Ctrl 2 on a generated armhole spline segment',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .frontArmholeCommonToPivot

        const curve =
          project.document.curves[
            curveId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              control2: {
                ...curve.control2,

                yMm:
                  curve.control2.yMm +
                  1,
              },
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /armhole curve.*cannot be edited manually/i,
        )
      },
    )

    it(
      'rejects reassigning a generated armhole spline endpoint',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const curveId =
          REFERENCE_TANK_V2_CURVE_IDS
            .frontArmholePivotToShoulder

        const curve =
          project.document.curves[
            curveId
          ]

        const candidateDocument = {
          ...project.document,

          curves: {
            ...project.document
              .curves,

            [curveId]: {
              ...curve,

              endPointId:
                REFERENCE_TANK_V2_POINT_IDS
                  .backBottom,
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(false)

        expect(
          result.message,
        ).toMatch(
          /armhole curve.*cannot be edited manually/i,
        )
      },
    )

    it(
      'allows editing unrelated non-protected geometry',
      () => {
        const project =
          createGeneratedProject(
            0,
          )

        const pointId =
          REFERENCE_TANK_V2_POINT_IDS
            .backBottom

        const point =
          project.document.points[
            pointId
          ]

        const candidateDocument = {
          ...project.document,

          points: {
            ...project.document
              .points,

            [pointId]: {
              ...point,

              yMm:
                point.yMm +
                10,
            },
          },
        }

        const result =
          validateReferenceTankV2DocumentEdit(
            project,
            candidateDocument,
          )

        expect(
          result.isValid,
        ).toBe(true)
      },
    )
  },
)