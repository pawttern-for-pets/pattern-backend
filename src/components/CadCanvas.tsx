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
  getRulerTicks,
} from '../cad/ruler'

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

const RULER_SIZE_PX = 32

export function CadCanvas({
  document,
}: CadCanvasProps) {
  const svgRef =
    useRef<SVGSVGElement | null>(null)

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
      const rect =
        svg.getBoundingClientRect()

      setCanvasSize({
        widthPx: rect.width,
        heightPx: rect.height,
      })
    }

    updateCanvasSize()

    const observer =
      new ResizeObserver(
        updateCanvasSize,
      )

    observer.observe(svg)

    return () => {
      observer.disconnect()
    }
  }, [])

  let verticalGridMm: number[] = []
  let horizontalGridMm: number[] = []

  let horizontalRulerTicks =
    getRulerTicks(0, 0, 'cm')

  let verticalRulerTicks =
    getRulerTicks(0, 0, 'cm')

  if (
    canvasSize.widthPx > 0 &&
    canvasSize.heightPx > 0
  ) {
    const bounds =
      getVisibleWorldBounds(
        viewport,
        canvasSize.widthPx,
        canvasSize.heightPx,
      )

    verticalGridMm =
      getGridPositionsMm(
        bounds.minXMm,
        bounds.maxXMm,
        10,
      )

    horizontalGridMm =
      getGridPositionsMm(
        bounds.minYMm,
        bounds.maxYMm,
        10,
      )

    horizontalRulerTicks =
      getRulerTicks(
        bounds.minXMm,
        bounds.maxXMm,
        'cm',
      )

    verticalRulerTicks =
      getRulerTicks(
        bounds.minYMm,
        bounds.maxYMm,
        'cm',
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
          const screen =
            worldToScreen(
              {
                xMm,
                yMm: 0,
              },
              viewport,
            )

          const isOrigin =
            xMm === 0

          return (
            <line
              key={`grid-x-${xMm}`}
              x1={screen.xPx}
              y1={0}
              x2={screen.xPx}
              y2={
                canvasSize.heightPx
              }
              stroke={
                isOrigin
                  ? '#b0b0b0'
                  : '#e8e8e8'
              }
              strokeWidth={
                isOrigin
                  ? 1.5
                  : 1
              }
            />
          )
        })}

        {horizontalGridMm.map(
          (yMm) => {
            const screen =
              worldToScreen(
                {
                  xMm: 0,
                  yMm,
                },
                viewport,
              )

            const isOrigin =
              yMm === 0

            return (
              <line
                key={`grid-y-${yMm}`}
                x1={0}
                y1={screen.yPx}
                x2={
                  canvasSize.widthPx
                }
                y2={screen.yPx}
                stroke={
                  isOrigin
                    ? '#b0b0b0'
                    : '#e8e8e8'
                }
                strokeWidth={
                  isOrigin
                    ? 1.5
                    : 1
                }
              />
            )
          },
        )}
      </g>

      {/* PATTERN LINES */}
      {Object.values(
        document.lines,
      ).map((line) => {
        const startPoint =
          document.points[
            line.startPointId
          ]

        const endPoint =
          document.points[
            line.endPointId
          ]

        if (
          !startPoint ||
          !endPoint
        ) {
          return null
        }

        const start =
          worldToScreen(
            startPoint,
            viewport,
          )

        const end =
          worldToScreen(
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
      })}

      {/* PATTERN POINTS */}
      {Object.values(
        document.points,
      ).map((point) => {
        const screen =
          worldToScreen(
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
              x={
                screen.xPx + 10
              }
              y={
                screen.yPx - 10
              }
              fontSize="16"
            >
              {point.name}
            </text>
          </g>
        )
      })}

      {/* TOP RULER BACKGROUND */}
      <rect
        x={0}
        y={0}
        width={
          canvasSize.widthPx
        }
        height={RULER_SIZE_PX}
        fill="#f5f5f5"
        stroke="#cccccc"
      />

      {/* LEFT RULER BACKGROUND */}
      <rect
        x={0}
        y={0}
        width={RULER_SIZE_PX}
        height={
          canvasSize.heightPx
        }
        fill="#f5f5f5"
        stroke="#cccccc"
      />

      {/* HORIZONTAL RULER */}
      <g>
        {horizontalRulerTicks.map(
          (tick) => {
            const screen =
              worldToScreen(
                {
                  xMm:
                    tick.positionMm,
                  yMm: 0,
                },
                viewport,
              )

            const tickHeight =
              tick.kind === 'major'
                ? 12
                : tick.kind ===
                    'medium'
                  ? 8
                  : 5

            return (
              <g
                key={`ruler-x-${tick.positionMm}`}
              >
                <line
                  x1={screen.xPx}
                  y1={
                    RULER_SIZE_PX -
                    tickHeight
                  }
                  x2={screen.xPx}
                  y2={
                    RULER_SIZE_PX
                  }
                  stroke="#555555"
                  strokeWidth="1"
                />

                {tick.label !==
                  null && (
                  <text
                    x={
                      screen.xPx +
                      3
                    }
                    y={12}
                    fontSize="10"
                    fill="#333333"
                  >
                    {
                      tick.label
                    }
                  </text>
                )}
              </g>
            )
          },
        )}
      </g>

      {/* VERTICAL RULER */}
      <g>
        {verticalRulerTicks.map(
          (tick) => {
            const screen =
              worldToScreen(
                {
                  xMm: 0,
                  yMm:
                    tick.positionMm,
                },
                viewport,
              )

            const tickWidth =
              tick.kind === 'major'
                ? 12
                : tick.kind ===
                    'medium'
                  ? 8
                  : 5

            return (
              <g
                key={`ruler-y-${tick.positionMm}`}
              >
                <line
                  x1={
                    RULER_SIZE_PX -
                    tickWidth
                  }
                  y1={screen.yPx}
                  x2={
                    RULER_SIZE_PX
                  }
                  y2={screen.yPx}
                  stroke="#555555"
                  strokeWidth="1"
                />

                {tick.label !==
                  null && (
                  <text
                    x={3}
                    y={
                      screen.yPx -
                      3
                    }
                    fontSize="10"
                    fill="#333333"
                  >
                    {
                      tick.label
                    }
                  </text>
                )}
              </g>
            )
          },
        )}
      </g>

      {/* TOP-LEFT CORNER */}
      <rect
        x={0}
        y={0}
        width={RULER_SIZE_PX}
        height={RULER_SIZE_PX}
        fill="#e8e8e8"
        stroke="#cccccc"
      />

      <text
        x={6}
        y={20}
        fontSize="10"
        fontWeight="bold"
        fill="#333333"
      >
        cm
      </text>
    </svg>
  )
}