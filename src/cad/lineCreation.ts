import {
  addLine,
  type PatternDocument,
} from './document'

export interface CreateLineOptions {
  id?: string
  name?: string
}

export interface CreateLineResult {
  document: PatternDocument
  lineId: string
}

export function getNextLineId(
  document: PatternDocument,
  prefix = 'L',
): string {
  if (
    prefix.trim().length === 0
  ) {
    throw new Error(
      'Line ID prefix cannot be empty.',
    )
  }

  let number = 1

  while (
    document.lines[
      `${prefix}${number}`
    ]
  ) {
    number += 1
  }

  return `${prefix}${number}`
}

export function createLineBetweenPoints(
  document: PatternDocument,
  startPointId: string,
  endPointId: string,
  options: CreateLineOptions = {},
): CreateLineResult {
  if (
    !document.points[
      startPointId
    ]
  ) {
    throw new Error(
      `Start point "${startPointId}" does not exist.`,
    )
  }

  if (
    !document.points[
      endPointId
    ]
  ) {
    throw new Error(
      `End point "${endPointId}" does not exist.`,
    )
  }

  if (
    startPointId ===
    endPointId
  ) {
    throw new Error(
      'A line cannot connect a point to itself.',
    )
  }

  const lineId =
    options.id ??
    getNextLineId(
      document,
    )

  const lineName =
    options.name ??
    lineId

  const nextDocument =
    addLine(
      document,
      {
        id: lineId,
        name: lineName,
        startPointId,
        endPointId,
      },
    )

  return {
    document:
      nextDocument,

    lineId,
  }
}