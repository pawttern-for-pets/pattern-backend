import { distanceMm, isValidPoint, type Point } from './geometry'
import { isGeometryRole, type GeometryRole } from './geometryRole'

export interface Line {
  id: string
  name: string
  startPointId: string
  endPointId: string
  role?: GeometryRole
}

export type PointMap = Record<string, Point>

export function isValidLine(line: Line, points: PointMap): boolean {
  if (line.id.trim().length === 0) return false

  if (line.role !== undefined && !isGeometryRole(line.role)) return false

  if (line.startPointId === line.endPointId) return false

  const startPoint = points[line.startPointId]
  const endPoint = points[line.endPointId]

  if (!startPoint || !endPoint) return false

  return isValidPoint(startPoint) && isValidPoint(endPoint)
}

export function lineLengthMm(line: Line, points: PointMap): number {
  if (!isValidLine(line, points)) {
    throw new Error('Cannot measure an invalid line.')
  }

  const startPoint = points[line.startPointId]
  const endPoint = points[line.endPointId]

  return distanceMm(startPoint, endPoint)
}