import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addLine,
  addPoint,
  createEmptyDocument,
} from './document'

import {
  commitHistory,
  createHistory,
} from './history'

import {
  createFreshPatternHistory,
  createNewPatternHistory,
  openPatternHistoryFromJson,
  serializePatternForSave,
} from './projectLifecycle'

import {
  serializePatternDocument,
} from './serialization'

function createPatternDocument() {
  let document =
    createEmptyDocument()

  document = addPoint(
    document,
    {
      id: 'A',
      name: 'A',
      xMm: 0,
      yMm: 0,
    },
  )

  document = addPoint(
    document,
    {
      id: 'B',
      name: 'B',
      xMm: 100,
      yMm: 50,
    },
  )

  document = addLine(
    document,
    {
      id: 'L1',
      name: 'L1',
      startPointId: 'A',
      endPointId: 'B',
    },
  )

  return document
}

describe(
  'PAWTTERN CAD project lifecycle',
  () => {
    it(
      'creates a genuinely blank new pattern',
      () => {
        const history =
          createNewPatternHistory()

        expect(
          history.present.points,
        ).toEqual({})

        expect(
          history.present.lines,
        ).toEqual({})

        expect(
          history.present.curves,
        ).toEqual({})
      },
    )

    it(
      'starts a new pattern with empty Undo and Redo history',
      () => {
        const history =
          createNewPatternHistory()

        expect(
          history.past,
        ).toEqual([])

        expect(
          history.future,
        ).toEqual([])
      },
    )

    it(
      'creates fresh history around an existing document',
      () => {
        const document =
          createPatternDocument()

        const history =
          createFreshPatternHistory(
            document,
          )

        expect(
          history.present,
        ).toBe(document)

        expect(
          history.past,
        ).toEqual([])

        expect(
          history.future,
        ).toEqual([])
      },
    )

    it(
      'opens a valid saved pattern',
      () => {
        const document =
          createPatternDocument()

        const json =
          serializePatternDocument(
            document,
          )

        const history =
          openPatternHistoryFromJson(
            json,
          )

        expect(
          history.present,
        ).toEqual(document)

        expect(
          history.present
            .lines.L1,
        ).toBeDefined()
      },
    )

    it(
      'opening a pattern starts fresh history instead of becoming an Undo step',
      () => {
        const document =
          createPatternDocument()

        const json =
          serializePatternDocument(
            document,
          )

        const history =
          openPatternHistoryFromJson(
            json,
          )

        expect(
          history.past,
        ).toHaveLength(0)

        expect(
          history.future,
        ).toHaveLength(0)
      },
    )

    it(
      'rejects an invalid pattern file',
      () => {
        expect(() =>
          openPatternHistoryFromJson(
            '{"schemaVersion":999}',
          ),
        ).toThrow()
      },
    )

    it(
      'does not mutate an existing history when opening invalid JSON fails',
      () => {
        let current =
          createHistory(
            createEmptyDocument(),
          )

        current =
          commitHistory(
            current,
            createPatternDocument(),
          )

        const before =
          current

        expect(() =>
          openPatternHistoryFromJson(
            '{bad-json',
          ),
        ).toThrow()

        expect(
          current,
        ).toBe(before)

        expect(
          current.past,
        ).toHaveLength(1)
      },
    )

    it(
      'serializes a pattern for saving without changing its geometry',
      () => {
        const document =
          createPatternDocument()

        const json =
          serializePatternForSave(
            document,
          )

        const parsed =
          JSON.parse(json)

        expect(
          parsed.points.A.xMm,
        ).toBe(0)

        expect(
          parsed.points.B.yMm,
        ).toBe(50)

        expect(
          parsed.lines.L1
            .startPointId,
        ).toBe('A')

        expect(
          document.lines.L1,
        ).toBeDefined()
      },
    )
  },
)