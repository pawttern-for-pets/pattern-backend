import { describe, expect, it } from 'vitest'
import { getGeometryAppearance } from './geometryAppearance'

describe('PAWTTERN CAD geometry appearance', () => {
  it('keeps boundary geometry solid', () => {
    expect(
      getGeometryAppearance('boundary', false),
    ).toEqual({
      stroke: '#111111',
      strokeWidth: 2,
    })
  })

  it('keeps legacy unclassified geometry solid', () => {
    expect(
      getGeometryAppearance(undefined, false),
    ).toEqual({
      stroke: '#111111',
      strokeWidth: 2,
    })
  })

  it('renders construction geometry lighter and dashed', () => {
    expect(
      getGeometryAppearance('construction', false),
    ).toEqual({
      stroke: '#777777',
      strokeWidth: 1.25,
      strokeDasharray: '6 4',
    })
  })

  it('lets selection override construction appearance', () => {
    expect(
      getGeometryAppearance('construction', true),
    ).toEqual({
      stroke: '#2563eb',
      strokeWidth: 4,
    })
  })
})