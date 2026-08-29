import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
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
  deleteSelection,
} from '../cad/editing'

import {
  getGridPositionsMm,
  getVisibleWorldBounds,
} from '../cad/grid'

import {
  panViewportByScreenDelta,
} from '../cad/pan'

import {
  getRulerTicks,
} from '../cad/ruler'

import {
  getRulerLabelEveryMajor,
  shouldShowRulerLabel,
} from '../cad/rulerDisplay'

import {
  findSelectionAtScreenPoint,
  type Selection,
} from '../cad/selection'

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

  onDocumentChange: (
    document: PatternDocument,
  ) => void

  canUndo: boolean
  canRedo: boolean

  onUndo: () => void
  onRedo: () => void
}

interface CanvasSize {
  widthPx: number
  heightPx: number
}

interface PanDragState {
  pointerId: number
  xPx: number
  yPx: number
}

type ActiveTool =
  | 'select'
  | 'pan'

const RULER_SIZE_PX = 32
const ZOOM_FACTOR = 1.15

export function CadCanvas({
  document,
  unit,
  onDocumentChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: CadCanvasProps) {
  const svgRef =
    useRef<SVGSVGElement | null>(null)

  const panDragRef =
    useRef<PanDragState | null>(null)

  const [
    canvasSize,
    setCanvasSize,
  ] = useState<CanvasSize>({
    widthPx: 0,
    heightPx: 0,
  })

  const [
    cursorWorld,
    setCursorWorld,
  ] = useState<WorldPosition | null>(
    null,
  )

  const [
    selection,
    setSelection,
  ] = useState<Selection | null>(
    null,
  )

  const [
    activeTool,
    setActiveTool,
  ] = useState<ActiveTool>(
    'select',
  )

  const [
    isPanning,
    setIsPanning,
  ] = useState(false)

  const [
    viewport,
    setViewport,
  ] = useState(() =>
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
    const svg =
      svgRef.current

    if (!svg) {
      return
    }

    const updateCanvasSize = () => {
      const rect =
        svg.getBoundingClientRect()

      setCanvasSize({
        widthPx:
          rect.width,

        heightPx:
          rect.height,
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

  useEffect(() => {
    if (
      selection === null
    ) {
      return
    }

    const stillExists =
      selection.kind ===
      'point'
        ? Boolean(
            document.points[
              selection.id
            ],
          )
        : Boolean(
            document.lines[
              selection.id
            ],
          )

    if (!stillExists) {
      setSelection(null)
    }
  }, [
    document,
    selection,
  ])

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

  let verticalGridMm:
    number[] = []

  let horizontalGridMm:
    number[] = []

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

  const getLocalScreenPosition = (
    clientX: number,
    clientY: number,
  ) => {
    const svg =
      svgRef.current

    if (!svg) {
      return null
    }

    const rect =
      svg.getBoundingClientRect()

    return {
      xPx:
        clientX -
        rect.left,

      yPx:
        clientY -
        rect.top,
    }
  }

  const handleMouseMove = (
    event:
      MouseEvent<SVGSVGElement>,
  ) => {
    if (isPanning) {
      return
    }

    const screenPosition =
      getLocalScreenPosition(
        event.clientX,
        event.clientY,
      )

    if (!screenPosition) {
      return
    }

    setCursorWorld(
      screenToWorld(
        screenPosition,
        viewport,
      ),
    )
  }

  const handleCanvasClick = (
    event:
      MouseEvent<SVGSVGElement>,
  ) => {
    if (
      activeTool !==
      'select'
    ) {
      return
    }

    if (
      event.button !== 0
    ) {
      return
    }

    const screenPosition =
      getLocalScreenPosition(
        event.clientX,
        event.clientY,
      )

    if (!screenPosition) {
      return
    }

    const isInsideRuler =
      screenPosition.xPx <
        RULER_SIZE_PX ||
      screenPosition.yPx <
        RULER_SIZE_PX

    if (isInsideRuler) {
      return
    }

    setSelection(
      findSelectionAtScreenPoint(
        document,
        viewport,
        screenPosition,
      ),
    )
  }

  const handleWheel = (
    event:
      WheelEvent<SVGSVGElement>,
  ) => {
    event.preventDefault()

    const anchor =
      getLocalScreenPosition(
        event.clientX,
        event.clientY,
      )

    if (!anchor) {
      return
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

  const handlePointerDown = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    const useMiddleMouse =
      event.button === 1

    const usePanTool =
      activeTool ===
        'pan' &&
      event.button === 0

    if (
      !useMiddleMouse &&
      !usePanTool
    ) {
      return
    }

    event.preventDefault()

    const screenPosition =
      getLocalScreenPosition(
        event.clientX,
        event.clientY,
      )

    if (!screenPosition) {
      return
    }

    panDragRef.current = {
      pointerId:
        event.pointerId,

      xPx:
        screenPosition.xPx,

      yPx:
        screenPosition.yPx,
    }

    event.currentTarget
      .setPointerCapture(
        event.pointerId,
      )

    setIsPanning(true)
  }

  const handlePointerMove = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    const drag =
      panDragRef.current

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return
    }

    event.preventDefault()

    const screenPosition =
      getLocalScreenPosition(
        event.clientX,
        event.clientY,
      )

    if (!screenPosition) {
      return
    }

    const deltaXPx =
      screenPosition.xPx -
      drag.xPx

    const deltaYPx =
      screenPosition.yPx -
      drag.yPx

    panDragRef.current = {
      pointerId:
        event.pointerId,

      xPx:
        screenPosition.xPx,

      yPx:
        screenPosition.yPx,
    }

    setViewport(
      (currentViewport) =>
        panViewportByScreenDelta(
          currentViewport,
          deltaXPx,
          deltaYPx,
        ),
    )
  }

  const finishPan = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    const drag =
      panDragRef.current

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return
    }

    panDragRef.current =
      null

    setIsPanning(false)

    if (
      event.currentTarget
        .hasPointerCapture(
          event.pointerId,
        )
    ) {
      event.currentTarget
        .releasePointerCapture(
          event.pointerId,
        )
    }
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
        canvasSize.widthPx /
        2,

      yPx:
        canvasSize.heightPx /
        2,
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

  const applyZoomInput =
    () => {
      const value =
        Number(zoomInput)

      if (
        zoomInput.trim() ===
          '' ||
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
    event:
      KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      event.key ===
      'Enter'
    ) {
      applyZoomInput()

      event.currentTarget
        .blur()
    }

    if (
      event.key ===
      'Escape'
    ) {
      setZoomInput(
        String(zoomPercent),
      )

      event.currentTarget
        .blur()
    }
  }

  const handleDeleteSelection =
    () => {
      if (
        selection === null
      ) {
        return
      }

      const nextDocument =
        deleteSelection(
          document,
          selection,
        )

      onDocumentChange(
        nextDocument,
      )

      setSelection(null)
    }

  const handleUndo = () => {
    onUndo()
    setSelection(null)
  }

  const handleRedo = () => {
    onRedo()
    setSelection(null)
  }

  const canvasCursor =
    isPanning
      ? 'grabbing'
      : activeTool ===
          'pan'
        ? 'grab'
        : 'default'

  const selectedDescription =
    selection === null
      ? '—'
      : selection.kind ===
          'point'
        ? `Point ${selection.id}`
        : `Line ${selection.id}`

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
        onClick={
          handleCanvasClick
        }
        onMouseMove={
          handleMouseMove
        }
        onMouseLeave={() => {
          if (!isPanning) {
            setCursorWorld(null)
          }
        }}
        onWheel={
          handleWheel
        }
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          finishPan
        }
        onPointerCancel={
          finishPan
        }
        onLostPointerCapture={() => {
          panDragRef.current =
            null

          setIsPanning(false)
        }}
        style={{
          display: 'block',
          background: 'white',
          border:
            '1px solid #cccccc',
          touchAction: 'none',
          userSelect: 'none',
          cursor:
            canvasCursor,
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

          const isSelected =
            selection?.kind ===
              'line' &&
            selection.id ===
              line.id

          return (
            <line
              key={line.id}
              x1={start.xPx}
              y1={start.yPx}
              x2={end.xPx}
              y2={end.yPx}
              stroke={
                isSelected
                  ? '#2563eb'
                  : 'black'
              }
              strokeWidth={
                isSelected
                  ? 4
                  : 2
              }
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

          const isSelected =
            selection?.kind ===
              'point' &&
            selection.id ===
              point.id

          return (
            <g key={point.id}>
              {isSelected && (
                <circle
                  cx={screen.xPx}
                  cy={screen.yPx}
                  r={9}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              )}

              <circle
                cx={screen.xPx}
                cy={screen.yPx}
                r={5}
                fill={
                  isSelected
                    ? '#2563eb'
                    : 'black'
                }
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

        {/* TOP RULER */}

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

        {/* LEFT RULER */}

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

        {/* HORIZONTAL RULER TICKS */}

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
                tick.label !==
                  null &&
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
                      {tick.label}
                    </text>
                  )}
                </g>
              )
            },
          )}
        </g>

        {/* VERTICAL RULER TICKS */}

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
                tick.label !==
                  null &&
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
                    y1={screen.yPx}
                    x2={
                      RULER_SIZE_PX
                    }
                    y2={screen.yPx}
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
                      {tick.label}
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
          gap: '10px',
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

        <span>
          Selected:{' '}
          {selectedDescription}
        </span>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <button
            type="button"
            disabled={!canUndo}
            onClick={
              handleUndo
            }
            title={
              canUndo
                ? 'Undo last edit'
                : 'Nothing to undo'
            }
          >
            Undo
          </button>

          <button
            type="button"
            disabled={!canRedo}
            onClick={
              handleRedo
            }
            title={
              canRedo
                ? 'Redo last edit'
                : 'Nothing to redo'
            }
          >
            Redo
          </button>

          <button
            type="button"
            aria-pressed={
              activeTool ===
              'select'
            }
            onClick={() => {
              setActiveTool(
                'select',
              )
            }}
            title="Select points and lines"
            style={{
              padding:
                '2px 8px',

              fontWeight:
                activeTool ===
                'select'
                  ? 'bold'
                  : 'normal',

              background:
                activeTool ===
                'select'
                  ? '#dddddd'
                  : undefined,
            }}
          >
            Select
          </button>

          <button
            type="button"
            aria-pressed={
              activeTool ===
              'pan'
            }
            onClick={() => {
              setActiveTool(
                'pan',
              )
            }}
            title="Pan the workspace"
            style={{
              padding:
                '2px 8px',

              fontWeight:
                activeTool ===
                'pan'
                  ? 'bold'
                  : 'normal',

              background:
                activeTool ===
                'pan'
                  ? '#dddddd'
                  : undefined,
            }}
          >
            Pan
          </button>

          <button
            type="button"
            disabled={
              selection === null
            }
            onClick={
              handleDeleteSelection
            }
            title={
              selection === null
                ? 'Select an object first'
                : `Delete ${selectedDescription}`
            }
          >
            Delete
          </button>

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
              textAlign: 'right',
              padding: '2px 4px',
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
          >
            100%
          </button>
        </div>
      </div>
    </div>
  )
}