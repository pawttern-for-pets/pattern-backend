import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type WheelEvent,
} from 'react'

import type { WorldPosition } from '../cad/coordinates'
import type { PatternDocument } from '../cad/document'

import {
  formatLength,
  getGridSpacingMm,
  type DisplayUnit,
} from '../cad/display'

import {
  getGridPositionsMm,
  getVisibleWorldBounds,
} from '../cad/grid'

import {
  getRulerTicks,
} from '../cad/ruler'

import {
  getRulerLabelEveryMajor,
  shouldShowRulerLabel,
} from '../cad/rulerDisplay'

import {
  createViewport,
  screenToWorld,
  worldToScreen,
} from '../cad/viewport'

import {
  zoomViewportAtScreenPoint,
} from '../cad/zoom'

interface CadCanvasProps {
  document: PatternDocument
  unit: DisplayUnit
}

interface CanvasSize {
  widthPx: number
  heightPx: number
}

const RULER_SIZE_PX = 32
const ZOOM_FACTOR = 1.15

export function CadCanvas({
  document,
  unit,
}: CadCanvasProps) {
  const svgRef =
    useRef<SVGSVGElement | null>(null)

  const [canvasSize, setCanvasSize] =
    useState<CanvasSize>({
      widthPx: 0,
      heightPx: 0,
    })

  const [
    cursorWorld,
    setCursorWorld,
  ] = useState<WorldPosition | null>(
    null,
  )

  const [viewport, setViewport] =
    useState(() =>
      createViewport(
        1,
        120,
        120,
      ),
    )

  const zoomPercent =
    Math.round(
      viewport.zoom * 100,
    )

  const [
    zoomInput,
    setZoomInput,
  ] = useState('100')

  useEffect(() => {
    setZoomInput(
      String(zoomPercent),
    )
  }, [zoomPercent])

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

  const gridSpacingMm =
    getGridSpacingMm(unit)

  const effectivePxPerMm =
    viewport.pxPerMm *
    viewport.zoom

  const rulerLabelEveryMajor =
    getRulerLabelEveryMajor(
      unit,
      effectivePxPerMm,
    )

  let verticalGridMm: number[] = []
  let horizontalGridMm: number[] = []

  let horizontalRulerTicks =
    getRulerTicks(
      0,
      0,
      unit,
    )

  let verticalRulerTicks =
    getRulerTicks(
      0,
      0,
      unit,
    )

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
        gridSpacingMm,
      )

    horizontalGridMm =
      getGridPositionsMm(
        bounds.minYMm,
        bounds.maxYMm,
        gridSpacingMm,
      )

    horizontalRulerTicks =
      getRulerTicks(
        bounds.minXMm,
        bounds.maxXMm,
        unit,
        20000,
      )

    verticalRulerTicks =
      getRulerTicks(
        bounds.minYMm,
        bounds.maxYMm,
        unit,
        20000,
      )
  }

  const handleMouseMove = (
    event: MouseEvent<SVGSVGElement>,
  ) => {
    const svg = svgRef.current

    if (!svg) {
      return
    }

    const rect =
      svg.getBoundingClientRect()

    const screenPosition = {
      xPx:
        event.clientX -
        rect.left,

      yPx:
        event.clientY -
        rect.top,
    }

    const worldPosition =
      screenToWorld(
        screenPosition,
        viewport,
      )

    setCursorWorld(
      worldPosition,
    )
  }

  const handleWheel = (
    event: WheelEvent<SVGSVGElement>,
  ) => {
    event.preventDefault()

    const svg = svgRef.current

    if (!svg) {
      return
    }

    const rect =
      svg.getBoundingClientRect()

    const anchor = {
      xPx:
        event.clientX -
        rect.left,

      yPx:
        event.clientY -
        rect.top,
    }

    setViewport(
      (currentViewport) => {
        const requestedZoom =
          event.deltaY < 0
            ? currentViewport.zoom *
              ZOOM_FACTOR
            : currentViewport.zoom /
              ZOOM_FACTOR

        return zoomViewportAtScreenPoint(
          currentViewport,
          anchor,
          requestedZoom,
        )
      },
    )
  }

  const setZoomPercent = (
    percent: number,
  ) => {
    if (
      !Number.isFinite(percent)
    ) {
      return
    }

    const requestedZoom =
      percent / 100

    const anchor = {
      xPx:
        canvasSize.widthPx / 2,

      yPx:
        canvasSize.heightPx / 2,
    }

    setViewport(
      (currentViewport) =>
        zoomViewportAtScreenPoint(
          currentViewport,
          anchor,
          requestedZoom,
        ),
    )
  }

  const applyZoomInput = () => {
    const value =
      Number(zoomInput)

    if (
      zoomInput.trim() === '' ||
      !Number.isFinite(value)
    ) {
      setZoomInput(
        String(zoomPercent),
      )

      return
    }

    setZoomPercent(value)
  }

  const handleZoomKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      applyZoomInput()

      event.currentTarget.blur()
    }

    if (event.key === 'Escape') {
      setZoomInput(
        String(zoomPercent),
      )

      event.currentTarget.blur()
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onMouseMove={
          handleMouseMove
        }
        onMouseLeave={() => {
          setCursorWorld(null)
        }}
        onWheel={handleWheel}
        style={{
          display: 'block',
          background: 'white',
          border:
            '1px solid #cccccc',
          touchAction: 'none',
        }}
      >
        {/* GRID */}

        <g>
          {verticalGridMm.map(
            (xMm) => {
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
            },
          )}

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
                  screen.xPx +
                  10
                }
                y={
                  screen.yPx -
                  10
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
          height={
            RULER_SIZE_PX
          }
          fill="#f5f5f5"
          stroke="#cccccc"
        />

        {/* LEFT RULER BACKGROUND */}

        <rect
          x={0}
          y={0}
          width={
            RULER_SIZE_PX
          }
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
                tick.kind ===
                'major'
                  ? 12
                  : tick.kind ===
                      'medium'
                    ? 8
                    : 5

              const showLabel =
                tick.label !== null &&
                shouldShowRulerLabel(
                  tick.positionMm,
                  unit,
                  rulerLabelEveryMajor,
                )

              return (
                <g
                  key={`ruler-x-${tick.positionMm}`}
                >
                  <line
                    x1={
                      screen.xPx
                    }
                    y1={
                      RULER_SIZE_PX -
                      tickHeight
                    }
                    x2={
                      screen.xPx
                    }
                    y2={
                      RULER_SIZE_PX
                    }
                    stroke="#555555"
                  />

                  {showLabel && (
                    <text
                      x={
                        screen.xPx +
                        3
                      }
                      y={12}
                      fontSize="10"
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
                tick.kind ===
                'major'
                  ? 12
                  : tick.kind ===
                      'medium'
                    ? 8
                    : 5

              const showLabel =
                tick.label !== null &&
                shouldShowRulerLabel(
                  tick.positionMm,
                  unit,
                  rulerLabelEveryMajor,
                )

              return (
                <g
                  key={`ruler-y-${tick.positionMm}`}
                >
                  <line
                    x1={
                      RULER_SIZE_PX -
                      tickWidth
                    }
                    y1={
                      screen.yPx
                    }
                    x2={
                      RULER_SIZE_PX
                    }
                    y2={
                      screen.yPx
                    }
                    stroke="#555555"
                  />

                  {showLabel && (
                    <text
                      x={3}
                      y={
                        screen.yPx -
                        3
                      }
                      fontSize="10"
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

        {/* TOP LEFT CORNER */}

        <rect
          x={0}
          y={0}
          width={
            RULER_SIZE_PX
          }
          height={
            RULER_SIZE_PX
          }
          fill="#e8e8e8"
          stroke="#cccccc"
        />

        <text
          x={6}
          y={20}
          fontSize="10"
          fontWeight="bold"
        >
          {unit}
        </text>
      </svg>

      {/* STATUS BAR */}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          padding: '3px 12px',
          background:
            'rgba(245,245,245,0.97)',
          borderTop:
            '1px solid #cccccc',
          fontSize: '12px',
        }}
      >
        <span>
          X:{' '}
          {cursorWorld
            ? formatLength(
                cursorWorld.xMm,
                unit,
              )
            : '—'}
        </span>

        <span>
          Y:{' '}
          {cursorWorld
            ? formatLength(
                cursorWorld.yMm,
                unit,
              )
            : '—'}
        </span>

        <span>
          Unit: {unit}
        </span>

        {/* ZOOM CONTROLS */}

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>
            Zoom:
          </span>

          <button
            type="button"
            onClick={() => {
              setZoomPercent(
                zoomPercent -
                10,
              )
            }}
            title="Zoom out"
          >
            −
          </button>

          <input
            type="number"
            min="10"
            max="1000"
            step="10"
            value={zoomInput}
            onChange={(
              event,
            ) => {
              setZoomInput(
                event.target.value,
              )
            }}
            onBlur={
              applyZoomInput
            }
            onKeyDown={
              handleZoomKeyDown
            }
            aria-label="Zoom percentage"
            style={{
              width: '65px',
              textAlign:
                'right',
              padding:
                '2px 4px',
            }}
          />

          <span>%</span>

          <button
            type="button"
            onClick={() => {
              setZoomPercent(
                zoomPercent +
                10,
              )
            }}
            title="Zoom in"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => {
              setZoomPercent(
                100,
              )
            }}
            title="Reset zoom to 100%"
          >
            100%
          </button>
        </div>
      </div>
    </div>
  )
}