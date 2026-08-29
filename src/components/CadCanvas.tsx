import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'

import type { WorldPosition } from '../cad/coordinates'
import type { PatternDocument } from '../cad/document'

import {
  displayCoordinatesToWorld,
  worldCoordinatesToDisplay,
} from '../cad/coordinateInput'

import {
  formatLength,
  getGridSpacingMm,
  getSnapSpacingMm,
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
  movePointToWorldPosition,
} from '../cad/movement'

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
  getCadShortcut,
} from '../cad/shortcuts'

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

interface PointDragState {
  pointerId: number
  pointId: string
}

type ActiveTool =
  | 'select'
  | 'pan'

const RULER_SIZE_PX = 32
const ZOOM_FACTOR = 1.15

function isEditableElement(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName =
    target.tagName.toLowerCase()

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  )
}

function formatCoordinateInput(
  value: number,
): string {
  return Number(
    value.toFixed(6),
  ).toString()
}

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

  const pointDragRef =
    useRef<PointDragState | null>(null)

  const dragPreviewRef =
    useRef<PatternDocument | null>(null)

  const suppressNextClickRef =
    useRef(false)

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
    isDraggingPoint,
    setIsDraggingPoint,
  ] = useState(false)

  const [
    dragPreviewDocument,
    setDragPreviewDocument,
  ] = useState<PatternDocument | null>(
    null,
  )

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

  const [
    zoomInput,
    setZoomInput,
  ] = useState('100')

  const [
    coordinateXInput,
    setCoordinateXInput,
  ] = useState('')

  const [
    coordinateYInput,
    setCoordinateYInput,
  ] = useState('')

  const [
    coordinateError,
    setCoordinateError,
  ] = useState<string | null>(
    null,
  )

  const displayDocument =
    dragPreviewDocument ??
    document

  const zoomPercent =
    Math.round(
      viewport.zoom * 100,
    )

  const selectedPoint =
    selection?.kind === 'point'
      ? document.points[
          selection.id
        ] ?? null
      : null

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
    if (selection === null) {
      return
    }

    const stillExists =
      selection.kind === 'point'
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

  /*
   * Keep the exact-coordinate editor
   * synchronized with the selected
   * committed point.
   *
   * Switching cm/in automatically
   * converts the displayed values
   * without changing geometry.
   */
  useEffect(() => {
    if (
      selection?.kind !== 'point'
    ) {
      setCoordinateXInput('')
      setCoordinateYInput('')
      setCoordinateError(null)

      return
    }

    const point =
      document.points[
        selection.id
      ]

    if (!point) {
      setCoordinateXInput('')
      setCoordinateYInput('')
      setCoordinateError(null)

      return
    }

    const displayed =
      worldCoordinatesToDisplay(
        point,
        unit,
      )

    setCoordinateXInput(
      formatCoordinateInput(
        displayed.x,
      ),
    )

    setCoordinateYInput(
      formatCoordinateInput(
        displayed.y,
      ),
    )

    setCoordinateError(null)
  }, [
    selection,
    document,
    unit,
  ])

  const gridSpacingMm =
    getGridSpacingMm(unit)

  const snapSpacingMm =
    getSnapSpacingMm(unit)

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

  const isInsideRulerArea = (
    xPx: number,
    yPx: number,
  ) => {
    return (
      xPx <
        RULER_SIZE_PX ||
      yPx <
        RULER_SIZE_PX
    )
  }

  const handleMouseMove = (
    event:
      MouseEvent<SVGSVGElement>,
  ) => {
    if (
      isPanning ||
      isDraggingPoint
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
      suppressNextClickRef.current
    ) {
      suppressNextClickRef.current =
        false

      return
    }

    if (
      activeTool !== 'select'
    ) {
      return
    }

    if (event.button !== 0) {
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

    if (
      isInsideRulerArea(
        screenPosition.xPx,
        screenPosition.yPx,
      )
    ) {
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

    if (
      isDraggingPoint ||
      isPanning
    ) {
      return
    }

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

  const startPan = (
    event:
      PointerEvent<SVGSVGElement>,
    screenPosition: {
      xPx: number
      yPx: number
    },
  ) => {
    event.preventDefault()

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

  const startPointDrag = (
    event:
      PointerEvent<SVGSVGElement>,
    pointId: string,
  ) => {
    event.preventDefault()

    pointDragRef.current = {
      pointerId:
        event.pointerId,

      pointId,
    }

    dragPreviewRef.current =
      document

    setDragPreviewDocument(
      document,
    )

    setSelection({
      kind: 'point',
      id: pointId,
    })

    event.currentTarget
      .setPointerCapture(
        event.pointerId,
      )

    setIsDraggingPoint(true)
  }

  const handlePointerDown = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    const screenPosition =
      getLocalScreenPosition(
        event.clientX,
        event.clientY,
      )

    if (!screenPosition) {
      return
    }

    if (event.button === 1) {
      startPan(
        event,
        screenPosition,
      )

      return
    }

    if (
      activeTool === 'pan' &&
      event.button === 0
    ) {
      startPan(
        event,
        screenPosition,
      )

      return
    }

    if (
      activeTool === 'select' &&
      event.button === 0
    ) {
      if (
        isInsideRulerArea(
          screenPosition.xPx,
          screenPosition.yPx,
        )
      ) {
        return
      }

      const hit =
        findSelectionAtScreenPoint(
          document,
          viewport,
          screenPosition,
        )

      if (
        hit?.kind === 'point'
      ) {
        startPointDrag(
          event,
          hit.id,
        )
      }
    }
  }

  const handlePanPointerMove = (
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
      return false
    }

    event.preventDefault()

    const screenPosition =
      getLocalScreenPosition(
        event.clientX,
        event.clientY,
      )

    if (!screenPosition) {
      return true
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

    return true
  }

  const handlePointPointerMove = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    const drag =
      pointDragRef.current

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return false
    }

    event.preventDefault()

    const screenPosition =
      getLocalScreenPosition(
        event.clientX,
        event.clientY,
      )

    if (!screenPosition) {
      return true
    }

    const worldPosition =
      screenToWorld(
        screenPosition,
        viewport,
      )

    const preview =
      movePointToWorldPosition(
        document,
        drag.pointId,
        worldPosition,
        {
          snapSpacingMm,
        },
      )

    dragPreviewRef.current =
      preview

    setDragPreviewDocument(
      preview,
    )

    const movedPoint =
      preview.points[
        drag.pointId
      ]

    if (movedPoint) {
      setCursorWorld({
        xMm:
          movedPoint.xMm,

        yMm:
          movedPoint.yMm,
      })
    }

    return true
  }

  const handlePointerMove = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    if (
      handlePanPointerMove(
        event,
      )
    ) {
      return
    }

    handlePointPointerMove(
      event,
    )
  }

  const releasePointerCapture = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
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
      return false
    }

    panDragRef.current =
      null

    setIsPanning(false)

    releasePointerCapture(
      event,
    )

    return true
  }

  const finishPointDrag = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    const drag =
      pointDragRef.current

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return false
    }

    const preview =
      dragPreviewRef.current

    const changed =
      preview !== null &&
      preview !== document

    pointDragRef.current =
      null

    dragPreviewRef.current =
      null

    setDragPreviewDocument(
      null,
    )

    setIsDraggingPoint(
      false,
    )

    releasePointerCapture(
      event,
    )

    if (
      changed &&
      preview !== null
    ) {
      suppressNextClickRef.current =
        true

      onDocumentChange(
        preview,
      )
    }

    return true
  }

  const handlePointerUp = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    if (
      finishPan(event)
    ) {
      return
    }

    finishPointDrag(event)
  }

  const handlePointerCancel = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    const panDrag =
      panDragRef.current

    if (
      panDrag?.pointerId ===
      event.pointerId
    ) {
      panDragRef.current =
        null

      setIsPanning(false)
    }

    const pointDrag =
      pointDragRef.current

    if (
      pointDrag?.pointerId ===
      event.pointerId
    ) {
      pointDragRef.current =
        null

      dragPreviewRef.current =
        null

      setDragPreviewDocument(
        null,
      )

      setIsDraggingPoint(
        false,
      )
    }

    releasePointerCapture(
      event,
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

    if (
      isDraggingPoint ||
      isPanning
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
    event:
      ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      event.key === 'Enter'
    ) {
      applyZoomInput()

      event.currentTarget
        .blur()
    }

    if (
      event.key === 'Escape'
    ) {
      setZoomInput(
        String(zoomPercent),
      )

      event.currentTarget
        .blur()
    }
  }

  const resetCoordinateInputs =
    () => {
      if (!selectedPoint) {
        return
      }

      const displayed =
        worldCoordinatesToDisplay(
          selectedPoint,
          unit,
        )

      setCoordinateXInput(
        formatCoordinateInput(
          displayed.x,
        ),
      )

      setCoordinateYInput(
        formatCoordinateInput(
          displayed.y,
        ),
      )

      setCoordinateError(null)
    }

  const applyExactPointPosition =
    () => {
      if (
        selection?.kind !==
          'point' ||
        !selectedPoint ||
        isDraggingPoint
      ) {
        return
      }

      if (
        coordinateXInput.trim() ===
          '' ||
        coordinateYInput.trim() ===
          ''
      ) {
        setCoordinateError(
          'Enter both X and Y.',
        )

        return
      }

      const x =
        Number(
          coordinateXInput,
        )

      const y =
        Number(
          coordinateYInput,
        )

      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      ) {
        setCoordinateError(
          'X and Y must be valid numbers.',
        )

        return
      }

      try {
        const worldPosition =
          displayCoordinatesToWorld(
            {
              x,
              y,
            },
            unit,
          )

        /*
         * IMPORTANT:
         * Exact coordinate entry does
         * NOT use grid snapping.
         */
        const nextDocument =
          movePointToWorldPosition(
            document,
            selection.id,
            worldPosition,
            {
              snapSpacingMm:
                null,
            },
          )

        onDocumentChange(
          nextDocument,
        )

        const nextPoint =
          nextDocument.points[
            selection.id
          ]

        if (nextPoint) {
          const displayed =
            worldCoordinatesToDisplay(
              nextPoint,
              unit,
            )

          setCoordinateXInput(
            formatCoordinateInput(
              displayed.x,
            ),
          )

          setCoordinateYInput(
            formatCoordinateInput(
              displayed.y,
            ),
          )
        }

        setCoordinateError(null)
      } catch {
        setCoordinateError(
          'Could not apply that position.',
        )
      }
    }

  const handleCoordinateKeyDown = (
    event:
      ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      event.key === 'Enter'
    ) {
      applyExactPointPosition()

      return
    }

    if (
      event.key === 'Escape'
    ) {
      resetCoordinateInputs()

      event.currentTarget
        .blur()
    }
  }

  const handleDeleteSelection =
    () => {
      if (
        selection === null ||
        isDraggingPoint
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
    if (
      !canUndo ||
      isDraggingPoint ||
      isPanning
    ) {
      return
    }

    onUndo()
    setSelection(null)
  }

  const handleRedo = () => {
    if (
      !canRedo ||
      isDraggingPoint ||
      isPanning
    ) {
      return
    }

    onRedo()
    setSelection(null)
  }

  useEffect(() => {
    const handleKeyDown = (
      event:
        globalThis.KeyboardEvent,
    ) => {
      if (
        isDraggingPoint ||
        isPanning
      ) {
        return
      }

      const shortcut =
        getCadShortcut({
          key:
            event.key,

          ctrlKey:
            event.ctrlKey,

          metaKey:
            event.metaKey,

          shiftKey:
            event.shiftKey,

          altKey:
            event.altKey,

          isEditableTarget:
            isEditableElement(
              event.target,
            ),
        })

      if (
        shortcut === null
      ) {
        return
      }

      if (
        shortcut === 'undo'
      ) {
        if (!canUndo) {
          return
        }

        event.preventDefault()

        onUndo()
        setSelection(null)

        return
      }

      if (
        shortcut === 'redo'
      ) {
        if (!canRedo) {
          return
        }

        event.preventDefault()

        onRedo()
        setSelection(null)

        return
      }

      if (
        shortcut ===
        'delete'
      ) {
        if (
          selection === null
        ) {
          return
        }

        event.preventDefault()

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
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    document,
    selection,
    onDocumentChange,
    isDraggingPoint,
    isPanning,
  ])

  const canvasCursor =
    isPanning ||
    isDraggingPoint
      ? 'grabbing'
      : activeTool === 'pan'
        ? 'grab'
        : 'default'

  const selectedDescription =
    selection === null
      ? '—'
      : selection.kind ===
          'point'
        ? `Point ${selection.id}`
        : `Line ${selection.id}`

  const dragDescription =
    isDraggingPoint &&
    pointDragRef.current
      ? `Moving Point ${pointDragRef.current.pointId}`
      : null

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
          if (
            !isPanning &&
            !isDraggingPoint
          ) {
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
          handlePointerUp
        }
        onPointerCancel={
          handlePointerCancel
        }
        onLostPointerCapture={() => {
          panDragRef.current =
            null

          pointDragRef.current =
            null

          dragPreviewRef.current =
            null

          setDragPreviewDocument(
            null,
          )

          setIsPanning(false)

          setIsDraggingPoint(
            false,
          )
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
          displayDocument.lines,
        ).map((line) => {
          const startPoint =
            displayDocument.points[
              line.startPointId
            ]

          const endPoint =
            displayDocument.points[
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
          displayDocument.points,
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

      {/* STATUS / TOOL BAR */}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: '34px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '4px 12px',
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

        <span>
          Drag snap:{' '}
          {formatLength(
            snapSpacingMm,
            unit,
          )}
        </span>

        {selectedPoint && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding:
                '2px 6px',
              border:
                '1px solid #cccccc',
              background:
                '#ffffff',
            }}
          >
            <strong>
              Point {selectedPoint.name}
            </strong>

            <label>
              X{' '}
              <input
                type="number"
                step="any"
                value={
                  coordinateXInput
                }
                onChange={(
                  event,
                ) => {
                  setCoordinateXInput(
                    event.target
                      .value,
                  )

                  setCoordinateError(
                    null,
                  )
                }}
                onKeyDown={
                  handleCoordinateKeyDown
                }
                aria-label="Exact point X coordinate"
                style={{
                  width:
                    '78px',
                }}
              />
            </label>

            <label>
              Y{' '}
              <input
                type="number"
                step="any"
                value={
                  coordinateYInput
                }
                onChange={(
                  event,
                ) => {
                  setCoordinateYInput(
                    event.target
                      .value,
                  )

                  setCoordinateError(
                    null,
                  )
                }}
                onKeyDown={
                  handleCoordinateKeyDown
                }
                aria-label="Exact point Y coordinate"
                style={{
                  width:
                    '78px',
                }}
              />
            </label>

            <span>
              {unit}
            </span>

            <button
              type="button"
              disabled={
                isDraggingPoint
              }
              onClick={
                applyExactPointPosition
              }
              title="Apply exact point position"
            >
              Apply
            </button>

            {coordinateError && (
              <span
                style={{
                  color:
                    '#b00020',
                }}
              >
                {
                  coordinateError
                }
              </span>
            )}
          </div>
        )}

        {dragDescription && (
          <strong>
            {dragDescription}
          </strong>
        )}

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
            disabled={
              !canUndo ||
              isDraggingPoint
            }
            onClick={
              handleUndo
            }
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>

          <button
            type="button"
            disabled={
              !canRedo ||
              isDraggingPoint
            }
            onClick={
              handleRedo
            }
            title="Redo (Ctrl+Y)"
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
            title="Select and move points"
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
            title="Pan workspace"
          >
            Pan
          </button>

          <button
            type="button"
            disabled={
              selection === null ||
              isDraggingPoint
            }
            onClick={
              handleDeleteSelection
            }
            title="Delete selected object"
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