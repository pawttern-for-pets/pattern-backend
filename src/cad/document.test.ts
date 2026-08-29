import { describe, expect, it } from 'vitest'
import type { Point } from './geometry'
import type { Line } from './lines'
import {
  addLine,
  addPoint,
  createEmptyDocument,
  removeLine,
  removePoint,
  updatePoint,
} from './document'

describe('PAWTTERN CAD pattern document', () => {
  const pointA: Point = {
    id: 'A',
    name: 'A',
    xMm: 0,
    yMm: 0,
  }

  const pointB: Point = {
    id: 'B',
    name: 'B',
    xMm: 100,
    yMm: 0,
  }

  const lineAB: Line = {
    id: 'AB',
    name: 'AB',
    startPointId: 'A',
    endPointId: 'B',
  }

  it('creates an empty pattern document', () => {
    const document = createEmptyDocument()

    expect(document.schemaVersion).toBe(1)
    expect(Object.keys(document.points)).toHaveLength(0)
    expect(Object.keys(document.lines)).toHaveLength(0)
  })

  it('adds points safely', () => {
    let document = createEmptyDocument()

    document = addPoint(document, pointA)
    document = addPoint(document, pointB)

    expect(document.points.A).toEqual(pointA)
    expect(document.points.B).toEqual(pointB)
  })

  it('rejects duplicate point IDs', () => {
    let document = createEmptyDocument()

    document = addPoint(document, pointA)

    expect(() =>
      addPoint(document, pointA),
    ).toThrow()
  })

  it('updates a point without changing its ID', () => {
    let document = createEmptyDocument()

    document = addPoint(document, pointA)

    document = updatePoint(document, 'A', {
      xMm: 50,
      yMm: 25,
    })

    expect(document.points.A.id).toBe('A')
    expect(document.points.A.xMm).toBe(50)
    expect(document.points.A.yMm).toBe(25)
  })

  it('adds a valid referenced line', () => {
    let document = createEmptyDocument()

    document = addPoint(document, pointA)
    document = addPoint(document, pointB)
    document = addLine(document, lineAB)

    expect(document.lines.AB).toEqual(lineAB)
  })

  it('rejects a line when its points do not exist', () => {
    const document = createEmptyDocument()

    expect(() =>
      addLine(document, lineAB),
    ).toThrow()
  })

  it('removes connected lines when a point is deleted', () => {
    let document = createEmptyDocument()

    document = addPoint(document, pointA)
    document = addPoint(document, pointB)
    document = addLine(document, lineAB)

    document = removePoint(document, 'B')

    expect(document.points.B).toBeUndefined()
    expect(document.lines.AB).toBeUndefined()
    expect(document.points.A).toEqual(pointA)
  })

  it('can remove a line without deleting its points', () => {
    let document = createEmptyDocument()

    document = addPoint(document, pointA)
    document = addPoint(document, pointB)
    document = addLine(document, lineAB)

    document = removeLine(document, 'AB')

    expect(document.lines.AB).toBeUndefined()
    expect(document.points.A).toEqual(pointA)
    expect(document.points.B).toEqual(pointB)
  })
})