import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type { PatternDocument } from '../cad/document'

import {
  getGridPositionsMm,
  getVisibleWorldBounds,
} from '../cad/grid'

import {
  createViewport,
  worldToScreen,
} from '../cad/viewport'

interface CadCanvasProps {
  document: PatternDocument
}

interface CanvasSize {
  widthPx: number
  heightPx: number
}

export function CadCanvas({
  document,
}: CadCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [canvasSize, setCanvasSize] =
    useState<CanvasSize>({
      widthPx: 0,
      heightPx: 0,
    })

  const viewport = createViewport(
    1,
    120,
    120,
  )

  useEffect(() => {
    const svg = svgRef.current

    if (!svg) {
      return
    }

    const updateCanvasSize = () => {
      const rect = svg.getBoundingClientRect()

      setCanvasSize({
        widthPx: rect.width,
        heightPx: rect.height,
      })
    }

    updateCanvasSize()

    const observer = new ResizeObserver(
      updateCanvasSize,
    )

    observer.observe(svg)

    return () => {
      observer.disconnect()
    }
  }, [])

  let verticalGridMm: number[] = []
  let horizontalGridMm: number[] = []

  if (
    canvasSize.widthPx > 0 &&
    canvasSize.heightPx > 0
  ) {
    const bounds = getVisibleWorldBounds(
      viewport,
      canvasSize.widthPx,
      canvasSize.heightPx,
    )

    verticalGridMm = getGridPositionsMm(
      bounds.minXMm,
      bounds.maxXMm,
      10,
    )

    horizontalGridMm = getGridPositionsMm(
      bounds.minYMm,
      bounds.maxYMm,
      10,
    )
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      style={{
        display: 'block',
        background: 'white',
        border: '1px solid #cccccc',
      }}
    >
      {/* GRID */}
      <g>
        {verticalGridMm.map((xMm) => {
          const screen = worldToScreen(
            {
              xMm,
              yMm: 0,
            },
            viewport,
          )

          const isOrigin = xMm === 0

          return (
            <line
              key={`grid-x-${xMm}`}
              x1={screen.xPx}
              y1={0}
              x2={screen.xPx}
              y2={canvasSize.heightPx}
              stroke={
                isOrigin
                  ? '#b0b0b0'
                  : '#e8e8e8'
              }
              strokeWidth={
                isOrigin ? 1.5 : 1
              }
            />
          )
        })}

        {horizontalGridMm.map((yMm) => {
          const screen = worldToScreen(
            {
              xMm: 0,
              yMm,
            },
            viewport,
          )

          const isOrigin = yMm === 0

          return (
            <line
              key={`grid-y-${yMm}`}
              x1={0}
              y1={screen.yPx}
              x2={canvasSize.widthPx}
              y2={screen.yPx}
              stroke={
                isOrigin
                  ? '#b0b0b0'
                  : '#e8e8e8'
              }
              strokeWidth={
                isOrigin ? 1.5 : 1
              }
            />
          )
        })}
      </g>

      {/* PATTERN LINES */}
      {Object.values(document.lines).map(
        (line) => {
          const startPoint =
            document.points[line.startPointId]

          const endPoint =
            document.points[line.endPointId]

          if (!startPoint || !endPoint) {
            return null
          }

          const start = worldToScreen(
            startPoint,
            viewport,
          )

          const end = worldToScreen(
            endPoint,
            viewport,
          )

          return (
            <line
              key={line.id}
              x1={start.xPx}
              y1={start.yPx}
              x2={end.xPx}
              y2={end.yPx}
              stroke="black"
              strokeWidth="2"
            />
          )
        },
      )}

      {/* PATTERN POINTS */}
      {Object.values(document.points).map(
        (point) => {
          const screen = worldToScreen(
            point,
            viewport,
          )

          return (
            <g key={point.id}>
              <circle
                cx={screen.xPx}
                cy={screen.yPx}
                r="5"
                fill="black"
              />

              <text
                x={screen.xPx + 10}
                y={screen.yPx - 10}
                fontSize="16"
              >
                {point.name}
              </text>
            </g>
          )
        },
      )}
    </svg>
  )
}