import { describe, expect, it } from 'vitest'
import type { WorldPosition } from './coordinates'
import {
  createViewport,
  screenToWorld,
  worldToScreen,
} from './viewport'

describe('PAWTTERN CAD viewport math', () => {
  const position: WorldPosition = {
    xMm: 100,
    yMm: 50,
  }

  it('converts world coordinates to screen coordinates', () => {
    const viewport = createViewport()

    const screen = worldToScreen(position, viewport)

    expect(screen.xPx).toBeCloseTo(377.9527559)
    expect(screen.yPx).toBeCloseTo(188.9763779)
  })

  it('converts screen coordinates back to the same world coordinates', () => {
    const viewport = createViewport()

    const screen = worldToScreen(position, viewport)
    const world = screenToWorld(screen, viewport)

    expect(world.xMm).toBeCloseTo(100)
    expect(world.yMm).toBeCloseTo(50)
  })

  it('zoom changes screen position but not world geometry', () => {
    const normalViewport = createViewport(1)
    const zoomedViewport = createViewport(2)

    const normal = worldToScreen(position, normalViewport)
    const zoomed = worldToScreen(position, zoomedViewport)

    expect(zoomed.xPx).toBeCloseTo(normal.xPx * 2)
    expect(zoomed.yPx).toBeCloseTo(normal.yPx * 2)

    expect(position.xMm).toBe(100)
    expect(position.yMm).toBe(50)
  })

  it('pan changes screen position but not world geometry', () => {
    const viewport = createViewport(1, 200, 100)

    const screen = worldToScreen(position, viewport)
    const world = screenToWorld(screen, viewport)

    expect(world.xMm).toBeCloseTo(100)
    expect(world.yMm).toBeCloseTo(50)

    expect(position.xMm).toBe(100)
    expect(position.yMm).toBe(50)
  })

  it('supports negative world coordinates', () => {
    const negativePosition: WorldPosition = {
      xMm: -100,
      yMm: -50,
    }

    const viewport = createViewport()

    const screen = worldToScreen(
      negativePosition,
      viewport,
    )

    const world = screenToWorld(screen, viewport)

    expect(world.xMm).toBeCloseTo(-100)
    expect(world.yMm).toBeCloseTo(-50)
  })

  it('rejects invalid zoom values', () => {
    expect(() => createViewport(0)).toThrow()
    expect(() => createViewport(-1)).toThrow()
    expect(() => createViewport(Number.NaN)).toThrow()
  })
})