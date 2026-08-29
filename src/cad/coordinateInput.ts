import type { WorldPosition } from './coordinates'

import type {
  DisplayUnit,
} from './display'

import {
  fromMm,
  toMm,
} from './units'

export interface DisplayCoordinates {
  x: number
  y: number
}

function validateCoordinate(
  value: number,
): void {
  if (!Number.isFinite(value)) {
    throw new Error(
      'Coordinate must be a finite number.',
    )
  }
}

export function displayCoordinatesToWorld(
  coordinates: DisplayCoordinates,
  unit: DisplayUnit,
): WorldPosition {
  validateCoordinate(
    coordinates.x,
  )

  validateCoordinate(
    coordinates.y,
  )

  return {
    xMm: toMm(
      coordinates.x,
      unit,
    ),

    yMm: toMm(
      coordinates.y,
      unit,
    ),
  }
}

export function worldCoordinatesToDisplay(
  position: WorldPosition,
  unit: DisplayUnit,
): DisplayCoordinates {
  validateCoordinate(
    position.xMm,
  )

  validateCoordinate(
    position.yMm,
  )

  return {
    x: fromMm(
      position.xMm,
      unit,
    ),

    y: fromMm(
      position.yMm,
      unit,
    ),
  }
}