import type { GeometryRole } from './geometryRole'

export interface GeometryAppearance {
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
}

export function getGeometryAppearance(
  role: GeometryRole | undefined,
  isSelected: boolean,
): GeometryAppearance {
  if (isSelected) {
    return {
      stroke: '#2563eb',
      strokeWidth: 4,
    }
  }

  if (role === 'construction') {
    return {
      stroke: '#777777',
      strokeWidth: 1.25,
      strokeDasharray: '6 4',
    }
  }

  return {
    stroke: '#111111',
    strokeWidth: 2,
  }
}