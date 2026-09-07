import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'

import {
  PointLabel,
} from './PointLabel'

import type {
  ScreenPosition,
  WorldPosition,
} from '../cad/coordinates'

import type {
  PatternDocument,
} from '../cad/document'

import {
  displayCoordinatesToWorld,
  worldCoordinatesToDisplay,
} from '../cad/coordinateInput'

import {
  createCurveBetweenPoints,
} from '../cad/curveCreation'

import {
  moveCurveControlToWorldPosition,
  type CurveControlHandle,
} from '../cad/curveEditing'

import {
  getCurveProperties,
} from '../cad/curveProperties'

import {
  formatLength,
  getGridSpacingMm,
  getSnapSpacingMm,
  type DisplayUnit,
} from '../cad/display'

import {
  getGeometryAppearance,
} from '../cad/geometryAppearance'

import {
  deleteSelection,
} from '../cad/editing'

import {
  getGridPositionsMm,
  getVisibleWorldBounds,
} from '../cad/grid'

import {
  createLineBetweenPoints,
} from '../cad/lineCreation'

import {
  measureBetweenPoints,
} from '../cad/measurement'

import {
  movePointToWorldPosition,
} from '../cad/movement'

import {
  panViewportByScreenDelta,
} from '../cad/pan'

import {
  createPointAtWorldPosition,
} from '../cad/pointCreation'

import {
  getRulerTicks,
} from '../cad/ruler'

import {
  getRulerLabelEveryMajor,
  shouldShowRulerLabel,
} from '../cad/rulerDisplay'

import {
  findSelectionAtScreenPoint,
  screenDistancePx,
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

  /*
   * Pattern-specific code can mark
   * generated curves as read-only
   * without teaching the generic CAD
   * canvas anything about PAWTTERN V2.
   */
  readOnlyCurveIds?:
    readonly string[]
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

interface CurveHandleDragState {
  pointerId: number
  curveId: string
  handle: CurveControlHandle
}

type ActiveTool =
  | 'select'
  | 'point'
  | 'line'
  | 'curve'
  | 'measure'
  | 'pan'

const RULER_SIZE_PX = 32
const ZOOM_FACTOR = 1.15

const CURVE_HANDLE_HIT_TOLERANCE_PX =
  12

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
  readOnlyCurveIds = [],
}: CadCanvasProps) {
  const svgRef =
    useRef<SVGSVGElement | null>(
      null,
    )

  const panDragRef =
    useRef<PanDragState | null>(
      null,
    )

  const pointDragRef =
    useRef<PointDragState | null>(
      null,
    )

  const curveHandleDragRef =
    useRef<
      CurveHandleDragState | null
    >(null)

  const dragPreviewRef =
    useRef<PatternDocument | null>(
      null,
    )

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
    lineStartPointId,
    setLineStartPointId,
  ] = useState<string | null>(
    null,
  )

  const [
    lineToolMessage,
    setLineToolMessage,
  ] = useState<string | null>(
    null,
  )

  const [
    curveStartPointId,
    setCurveStartPointId,
  ] = useState<string | null>(
    null,
  )

  const [
    curveToolMessage,
    setCurveToolMessage,
  ] = useState<string | null>(
    null,
  )

  const [
    measureStartPointId,
    setMeasureStartPointId,
  ] = useState<string | null>(
    null,
  )

  const [
    measureEndPointId,
    setMeasureEndPointId,
  ] = useState<string | null>(
    null,
  )

  const [
    measureToolMessage,
    setMeasureToolMessage,
  ] = useState<string | null>(
    null,
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
    isDraggingCurveHandle,
    setIsDraggingCurveHandle,
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

  /*
   * Exact point editor
   */

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

  /*
   * Exact curve control editor
   */

  const [
    control1XInput,
    setControl1XInput,
  ] = useState('')

  const [
    control1YInput,
    setControl1YInput,
  ] = useState('')

  const [
    control2XInput,
    setControl2XInput,
  ] = useState('')

  const [
    control2YInput,
    setControl2YInput,
  ] = useState('')

  const [
    curveControlError,
    setCurveControlError,
  ] = useState<string | null>(
    null,
  )

  const displayDocument =
    dragPreviewDocument ??
    document

  const isDraggingGeometry =
    isDraggingPoint ||
    isDraggingCurveHandle

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

  const selectedCurve =
    selection?.kind === 'curve'
      ? displayDocument.curves[
          selection.id
        ] ?? null
      : null

  const isCurveReadOnly = (
    curveId:
      string,
  ): boolean => {
    return (
      readOnlyCurveIds.includes(
        curveId,
      )
    )
  }

  const selectedCurveIsReadOnly =
    selection?.kind ===
      'curve' &&
    isCurveReadOnly(
      selection.id,
    )

  const selectedCurveStartPoint =
    selectedCurve
      ? displayDocument.points[
          selectedCurve.startPointId
        ] ?? null
      : null

  const selectedCurveEndPoint =
    selectedCurve
      ? displayDocument.points[
          selectedCurve.endPointId
        ] ?? null
      : null

  const selectedCurveStartScreen =
    selectedCurveStartPoint
      ? worldToScreen(
          selectedCurveStartPoint,
          viewport,
        )
      : null

  const selectedCurveEndScreen =
    selectedCurveEndPoint
      ? worldToScreen(
          selectedCurveEndPoint,
          viewport,
        )
      : null

  const selectedControl1Screen =
    selectedCurve
      ? worldToScreen(
          selectedCurve.control1,
          viewport,
        )
      : null

  const selectedControl2Screen =
    selectedCurve
      ? worldToScreen(
          selectedCurve.control2,
          viewport,
        )
      : null

  let selectedCurveProperties:
    ReturnType<
      typeof getCurveProperties
    > | null = null

  if (
    selection?.kind === 'curve'
  ) {
    try {
      selectedCurveProperties =
        getCurveProperties(
          displayDocument,
          selection.id,
          200,
        )
    } catch {
      selectedCurveProperties =
        null
    }
  }

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

    const updateCanvasSize =
      () => {
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

    let stillExists = false

    if (
      selection.kind ===
      'point'
    ) {
      stillExists =
        Boolean(
          document.points[
            selection.id
          ],
        )
    }

    if (
      selection.kind ===
      'line'
    ) {
      stillExists =
        Boolean(
          document.lines[
            selection.id
          ],
        )
    }

    if (
      selection.kind ===
      'curve'
    ) {
      stillExists =
        Boolean(
          document.curves[
            selection.id
          ],
        )
    }

    if (!stillExists) {
      setSelection(null)
    }
  }, [
    document,
    selection,
  ])

  useEffect(() => {
    if (
      lineStartPointId !== null &&
      !document.points[
        lineStartPointId
      ]
    ) {
      setLineStartPointId(null)
      setLineToolMessage(null)
    }
  }, [
    document,
    lineStartPointId,
  ])

  useEffect(() => {
    if (
      curveStartPointId !== null &&
      !document.points[
        curveStartPointId
      ]
    ) {
      setCurveStartPointId(null)
      setCurveToolMessage(null)
    }
  }, [
    document,
    curveStartPointId,
  ])

  useEffect(() => {
    const startExists =
      measureStartPointId ===
        null ||
      Boolean(
        document.points[
          measureStartPointId
        ],
      )

    const endExists =
      measureEndPointId ===
        null ||
      Boolean(
        document.points[
          measureEndPointId
        ],
      )

    if (
      !startExists ||
      !endExists
    ) {
      setMeasureStartPointId(
        null,
      )

      setMeasureEndPointId(
        null,
      )

      setMeasureToolMessage(
        null,
      )
    }
  }, [
    document,
    measureStartPointId,
    measureEndPointId,
    readOnlyCurveIds,
  ])

  /*
   * Sync exact point inputs.
   */

  useEffect(() => {
    if (
      selection?.kind !==
      'point'
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

  /*
   * Sync exact curve control inputs.
   */

  useEffect(() => {
    if (
      selection?.kind !==
      'curve'
    ) {
      setControl1XInput('')
      setControl1YInput('')
      setControl2XInput('')
      setControl2YInput('')
      setCurveControlError(null)

      return
    }

    const curve =
      document.curves[
        selection.id
      ]

    if (!curve) {
      setControl1XInput('')
      setControl1YInput('')
      setControl2XInput('')
      setControl2YInput('')
      setCurveControlError(null)

      return
    }

    const control1Display =
      worldCoordinatesToDisplay(
        curve.control1,
        unit,
      )

    const control2Display =
      worldCoordinatesToDisplay(
        curve.control2,
        unit,
      )

    setControl1XInput(
      formatCoordinateInput(
        control1Display.x,
      ),
    )

    setControl1YInput(
      formatCoordinateInput(
        control1Display.y,
      ),
    )

    setControl2XInput(
      formatCoordinateInput(
        control2Display.x,
      ),
    )

    setControl2YInput(
      formatCoordinateInput(
        control2Display.y,
      ),
    )

    setCurveControlError(null)
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
  ): ScreenPosition | null => {
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

  const clearLineOperation =
    () => {
      setLineStartPointId(null)
      setLineToolMessage(null)
    }

  const clearCurveOperation =
    () => {
      setCurveStartPointId(null)
      setCurveToolMessage(null)
    }

  const clearMeasurement =
    () => {
      setMeasureStartPointId(null)
      setMeasureEndPointId(null)
      setMeasureToolMessage(null)
    }

  const clearTransientOperations =
    () => {
      clearLineOperation()
      clearCurveOperation()
      clearMeasurement()
    }

  const activateTool = (
    tool: ActiveTool,
  ) => {
    setActiveTool(tool)
    clearTransientOperations()
  }

  const findSelectedCurveHandle = (
    screenPosition:
      ScreenPosition,
  ): CurveControlHandle | null => {
    if (
      selection?.kind !==
        'curve' ||
      selectedCurveIsReadOnly ||
      !selectedCurve ||
      !selectedControl1Screen ||
      !selectedControl2Screen
    ) {
      return null
    }

    const distanceToControl1 =
      screenDistancePx(
        screenPosition,
        selectedControl1Screen,
      )

    const distanceToControl2 =
      screenDistancePx(
        screenPosition,
        selectedControl2Screen,
      )

    const control1Hit =
      distanceToControl1 <=
      CURVE_HANDLE_HIT_TOLERANCE_PX

    const control2Hit =
      distanceToControl2 <=
      CURVE_HANDLE_HIT_TOLERANCE_PX

    if (
      control1Hit &&
      (
        !control2Hit ||
        distanceToControl1 <=
          distanceToControl2
      )
    ) {
      return 'control1'
    }

    if (control2Hit) {
      return 'control2'
    }

    return null
  }

  const handleMouseMove = (
    event:
      MouseEvent<SVGSVGElement>,
  ) => {
    if (
      isPanning ||
      isDraggingGeometry
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

    /*
     * POINT TOOL
     */

    if (
      activeTool === 'point'
    ) {
      const worldPosition =
        screenToWorld(
          screenPosition,
          viewport,
        )

      const result =
        createPointAtWorldPosition(
          document,
          worldPosition,
          {
            snapSpacingMm,
          },
        )

      onDocumentChange(
        result.document,
      )

      setSelection({
        kind: 'point',
        id: result.pointId,
      })

      return
    }

    /*
     * LINE TOOL
     */

    if (
      activeTool === 'line'
    ) {
      const hit =
        findSelectionAtScreenPoint(
          document,
          viewport,
          screenPosition,
        )

      if (
        hit?.kind !== 'point'
      ) {
        setLineToolMessage(
          lineStartPointId ===
            null
            ? 'Click a point to start the line.'
            : 'Click a point to finish the line.',
        )

        return
      }

      if (
        lineStartPointId === null
      ) {
        setLineStartPointId(
          hit.id,
        )

        setSelection({
          kind: 'point',
          id: hit.id,
        })

        setLineToolMessage(
          `Start ${hit.id} selected. Click another point. Esc cancels.`,
        )

        return
      }

      if (
        hit.id ===
        lineStartPointId
      ) {
        setLineToolMessage(
          'A line needs two different points.',
        )

        return
      }

      try {
        const result =
          createLineBetweenPoints(
            document,
            lineStartPointId,
            hit.id,
          )

        onDocumentChange(
          result.document,
        )

        setSelection({
          kind: 'line',
          id: result.lineId,
        })

        clearLineOperation()
      } catch {
        setLineToolMessage(
          'Could not create that line.',
        )
      }

      return
    }

    /*
     * CURVE TOOL
     */

    if (
      activeTool === 'curve'
    ) {
      const hit =
        findSelectionAtScreenPoint(
          document,
          viewport,
          screenPosition,
        )

      if (
        hit?.kind !== 'point'
      ) {
        setCurveToolMessage(
          curveStartPointId ===
            null
            ? 'Click a point to start the curve.'
            : 'Click a point to finish the curve.',
        )

        return
      }

      if (
        curveStartPointId === null
      ) {
        setCurveStartPointId(
          hit.id,
        )

        setSelection({
          kind: 'point',
          id: hit.id,
        })

        setCurveToolMessage(
          `Curve start: ${hit.id}. Click another point. Esc cancels.`,
        )

        return
      }

      if (
        hit.id ===
        curveStartPointId
      ) {
        setCurveToolMessage(
          'A curve needs two different endpoint points.',
        )

        return
      }

      try {
        const result =
          createCurveBetweenPoints(
            document,
            curveStartPointId,
            hit.id,
          )

        onDocumentChange(
          result.document,
        )

        setSelection({
          kind: 'curve',
          id: result.curveId,
        })

        clearCurveOperation()
      } catch {
        setCurveToolMessage(
          'Could not create that curve.',
        )
      }

      return
    }

    /*
     * MEASURE TOOL
     */

    if (
      activeTool ===
      'measure'
    ) {
      const hit =
        findSelectionAtScreenPoint(
          document,
          viewport,
          screenPosition,
        )

      if (
        hit?.kind !== 'point'
      ) {
        setMeasureToolMessage(
          measureStartPointId ===
            null
            ? 'Click a point to start measuring.'
            : 'Click a point to finish measuring.',
        )

        return
      }

      if (
        measureStartPointId ===
          null ||
        measureEndPointId !==
          null
      ) {
        setMeasureStartPointId(
          hit.id,
        )

        setMeasureEndPointId(
          null,
        )

        setSelection({
          kind: 'point',
          id: hit.id,
        })

        setMeasureToolMessage(
          `Measure start: ${hit.id}. Click the second point. Esc cancels.`,
        )

        return
      }

      setMeasureEndPointId(
        hit.id,
      )

      setSelection({
        kind: 'point',
        id: hit.id,
      })

      setMeasureToolMessage(
        null,
      )

      return
    }

    /*
     * SELECT TOOL
     */

    if (
      activeTool !==
      'select'
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
      isDraggingGeometry ||
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
    screenPosition:
      ScreenPosition,
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

  const startCurveHandleDrag = (
    event:
      PointerEvent<SVGSVGElement>,
    curveId: string,
    handle:
      CurveControlHandle,
  ) => {
    if (
      isCurveReadOnly(
        curveId,
      )
    ) {
      return
    }

    event.preventDefault()

    curveHandleDragRef.current = {
      pointerId:
        event.pointerId,

      curveId,

      handle,
    }

    dragPreviewRef.current =
      document

    setDragPreviewDocument(
      document,
    )

    setSelection({
      kind: 'curve',
      id: curveId,
    })

    event.currentTarget
      .setPointerCapture(
        event.pointerId,
      )

    setIsDraggingCurveHandle(
      true,
    )
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

      const handle =
        findSelectedCurveHandle(
          screenPosition,
        )

      if (
        handle !== null &&
        selection?.kind ===
          'curve'
      ) {
        startCurveHandleDrag(
          event,
          selection.id,
          handle,
        )

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

  const handleCurvePointerMove = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    const drag =
      curveHandleDragRef.current

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
      moveCurveControlToWorldPosition(
        document,
        drag.curveId,
        drag.handle,
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

    const curve =
      preview.curves[
        drag.curveId
      ]

    if (curve) {
      const control =
        curve[
          drag.handle
        ]

      setCursorWorld({
        xMm:
          control.xMm,

        yMm:
          control.yMm,
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

    if (
      handlePointPointerMove(
        event,
      )
    ) {
      return
    }

    handleCurvePointerMove(
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

  const finishCurveHandleDrag = (
    event:
      PointerEvent<SVGSVGElement>,
  ) => {
    const drag =
      curveHandleDragRef.current

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

    curveHandleDragRef.current =
      null

    dragPreviewRef.current =
      null

    setDragPreviewDocument(
      null,
    )

    setIsDraggingCurveHandle(
      false,
    )

    suppressNextClickRef.current =
      true

    releasePointerCapture(
      event,
    )

    if (
      changed &&
      preview !== null
    ) {
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

    if (
      finishPointDrag(event)
    ) {
      return
    }

    finishCurveHandleDrag(
      event,
    )
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

      setIsDraggingPoint(
        false,
      )
    }

    const curveDrag =
      curveHandleDragRef.current

    if (
      curveDrag?.pointerId ===
      event.pointerId
    ) {
      curveHandleDragRef.current =
        null

      setIsDraggingCurveHandle(
        false,
      )
    }

    dragPreviewRef.current =
      null

    setDragPreviewDocument(
      null,
    )

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
      isDraggingGeometry ||
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
          String(
            zoomPercent,
          ),
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

      event.currentTarget.blur()
    }

    if (
      event.key ===
      'Escape'
    ) {
      setZoomInput(
        String(
          zoomPercent,
        ),
      )

      event.currentTarget.blur()
    }
  }

  /*
   * Exact point coordinate editing
   */

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
        isDraggingGeometry
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

        if (
          nextDocument !==
          document
        ) {
          onDocumentChange(
            nextDocument,
          )
        }

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
      event.key ===
      'Escape'
    ) {
      resetCoordinateInputs()

      event.currentTarget.blur()
    }
  }

  /*
   * Exact curve control editing
   */

  const resetCurveControlInputs =
    () => {
      if (
        selection?.kind !==
          'curve'
      ) {
        return
      }

      const curve =
        document.curves[
          selection.id
        ]

      if (!curve) {
        return
      }

      const control1Display =
        worldCoordinatesToDisplay(
          curve.control1,
          unit,
        )

      const control2Display =
        worldCoordinatesToDisplay(
          curve.control2,
          unit,
        )

      setControl1XInput(
        formatCoordinateInput(
          control1Display.x,
        ),
      )

      setControl1YInput(
        formatCoordinateInput(
          control1Display.y,
        ),
      )

      setControl2XInput(
        formatCoordinateInput(
          control2Display.x,
        ),
      )

      setControl2YInput(
        formatCoordinateInput(
          control2Display.y,
        ),
      )

      setCurveControlError(null)
    }

  const applyExactCurveControl = (
    handle:
      CurveControlHandle,
  ) => {
    if (
      selection?.kind !==
        'curve' ||
      isCurveReadOnly(
        selection.id,
      ) ||
      isDraggingGeometry
    ) {
      return
    }

    const xInput =
      handle === 'control1'
        ? control1XInput
        : control2XInput

    const yInput =
      handle === 'control1'
        ? control1YInput
        : control2YInput

    if (
      xInput.trim() === '' ||
      yInput.trim() === ''
    ) {
      setCurveControlError(
        'Enter both X and Y.',
      )

      return
    }

    const x =
      Number(xInput)

    const y =
      Number(yInput)

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    ) {
      setCurveControlError(
        'Control coordinates must be valid numbers.',
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

      const nextDocument =
        moveCurveControlToWorldPosition(
          document,
          selection.id,
          handle,
          worldPosition,
          {
            /*
             * Exact numeric input
             * deliberately bypasses
             * mouse snapping.
             */
            snapSpacingMm:
              null,
          },
        )

      if (
        nextDocument !==
        document
      ) {
        onDocumentChange(
          nextDocument,
        )
      }

      /*
       * IMPORTANT:
       *
       * Do not copy values from the
       * candidate nextDocument here.
       *
       * PAWTTERN may reject that document
       * at the pattern-validation boundary.
       *
       * Reset to the currently accepted
       * PatternDocument instead.
       *
       * If the edit was valid, the parent
       * will supply the newly accepted
       * document and the existing useEffect
       * will then synchronize these inputs
       * to the new valid coordinates.
       */
      resetCurveControlInputs()
    } catch {
      setCurveControlError(
        'Could not apply that control position.',
      )
    }
  }

  const handleCurveControlKeyDown = (
    event:
      ReactKeyboardEvent<HTMLInputElement>,
    handle:
      CurveControlHandle,
  ) => {
    if (
      event.key === 'Enter'
    ) {
      applyExactCurveControl(
        handle,
      )

      return
    }

    if (
      event.key ===
      'Escape'
    ) {
      resetCurveControlInputs()

      event.currentTarget.blur()
    }
  }

  const selectionIsReadOnlyCurve =
    selection?.kind ===
      'curve' &&
    isCurveReadOnly(
      selection.id,
    )

  const handleDeleteSelection =
    () => {
      if (
        selection === null ||
        selectionIsReadOnlyCurve ||
        isDraggingGeometry
      ) {
        return
      }

      const nextDocument =
        deleteSelection(
          document,
          selection,
        )

      if (
        nextDocument !==
        document
      ) {
        onDocumentChange(
          nextDocument,
        )
      }

      setSelection(null)
      clearTransientOperations()
    }

  const handleUndo = () => {
    if (
      !canUndo ||
      isDraggingGeometry ||
      isPanning
    ) {
      return
    }

    onUndo()

    setSelection(null)
    clearTransientOperations()
  }

  const handleRedo = () => {
    if (
      !canRedo ||
      isDraggingGeometry ||
      isPanning
    ) {
      return
    }

    onRedo()

    setSelection(null)
    clearTransientOperations()
  }

  useEffect(() => {
    const handleKeyDown = (
      event:
        globalThis.KeyboardEvent,
    ) => {
      if (
        isDraggingGeometry ||
        isPanning
      ) {
        return
      }

      const editable =
        isEditableElement(
          event.target,
        )

      if (
        !editable &&
        event.key === 'Escape'
      ) {
        if (
          activeTool ===
            'line' &&
          lineStartPointId !==
            null
        ) {
          event.preventDefault()

          clearLineOperation()
          setSelection(null)

          return
        }

        if (
          activeTool ===
            'curve' &&
          curveStartPointId !==
            null
        ) {
          event.preventDefault()

          clearCurveOperation()
          setSelection(null)

          return
        }

        if (
          activeTool ===
            'measure' &&
          (
            measureStartPointId !==
              null ||
            measureEndPointId !==
              null
          )
        ) {
          event.preventDefault()

          clearMeasurement()
          setSelection(null)

          return
        }
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
            editable,
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
        clearTransientOperations()

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
        clearTransientOperations()

        return
      }

      if (
        shortcut ===
        'delete'
      ) {
        if (
          selection === null ||
          (
            selection.kind ===
              'curve' &&
            isCurveReadOnly(
              selection.id,
            )
          )
        ) {
          return
        }

        event.preventDefault()

        const nextDocument =
          deleteSelection(
            document,
            selection,
          )

        if (
          nextDocument !==
          document
        ) {
          onDocumentChange(
            nextDocument,
          )
        }

        setSelection(null)
        clearTransientOperations()
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
    activeTool,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    document,
    selection,
    onDocumentChange,
    isDraggingGeometry,
    isPanning,
    lineStartPointId,
    curveStartPointId,
    measureStartPointId,
    measureEndPointId,
  ])

  const canvasCursor =
    isPanning ||
    isDraggingGeometry
      ? 'grabbing'
      : activeTool === 'pan'
        ? 'grab'
        : activeTool ===
              'point' ||
            activeTool ===
              'line' ||
            activeTool ===
              'curve' ||
            activeTool ===
              'measure'
          ? 'crosshair'
          : 'default'

  let selectedDescription =
    '—'

  if (
    selection?.kind ===
    'point'
  ) {
    selectedDescription =
      `Point ${selection.id}`
  }

  if (
    selection?.kind ===
    'line'
  ) {
    selectedDescription =
      `Line ${selection.id}`
  }

  if (
    selection?.kind ===
    'curve'
  ) {
    selectedDescription =
      `Curve ${selection.id}`
  }

  const dragDescription =
    isDraggingPoint &&
    pointDragRef.current
      ? `Moving Point ${pointDragRef.current.pointId}`
      : isDraggingCurveHandle &&
          curveHandleDragRef.current
        ? `Moving ${curveHandleDragRef.current.handle} of Curve ${curveHandleDragRef.current.curveId}`
        : null

  /*
   * LINE PREVIEW
   */

  const lineStartPoint =
    lineStartPointId === null
      ? null
      : displayDocument.points[
          lineStartPointId
        ] ?? null

  const linePreviewStart =
    lineStartPoint
      ? worldToScreen(
          lineStartPoint,
          viewport,
        )
      : null

  const linePreviewEnd =
    cursorWorld &&
    lineStartPoint
      ? worldToScreen(
          cursorWorld,
          viewport,
        )
      : null

  /*
   * CURVE CREATION PREVIEW
   */

  const curveStartPoint =
    curveStartPointId === null
      ? null
      : displayDocument.points[
          curveStartPointId
        ] ?? null

  const curvePreviewStart =
    curveStartPoint
      ? worldToScreen(
          curveStartPoint,
          viewport,
        )
      : null

  const curvePreviewEnd =
    cursorWorld &&
    curveStartPoint
      ? worldToScreen(
          cursorWorld,
          viewport,
        )
      : null

  /*
   * MEASUREMENT
   */

  const measureStartPoint =
    measureStartPointId === null
      ? null
      : displayDocument.points[
          measureStartPointId
        ] ?? null

  const measureEndPoint =
    measureEndPointId === null
      ? null
      : displayDocument.points[
          measureEndPointId
        ] ?? null

  const measureStartScreen =
    measureStartPoint
      ? worldToScreen(
          measureStartPoint,
          viewport,
        )
      : null

  const measureEndScreen =
    measureEndPoint
      ? worldToScreen(
          measureEndPoint,
          viewport,
        )
      : null

  const measureCursorScreen =
    measureStartPoint &&
    !measureEndPoint &&
    cursorWorld
      ? worldToScreen(
          cursorWorld,
          viewport,
        )
      : null

  let completedMeasurement:
    ReturnType<
      typeof measureBetweenPoints
    > | null = null

  if (
    measureStartPointId !==
      null &&
    measureEndPointId !==
      null
  ) {
    try {
      completedMeasurement =
        measureBetweenPoints(
          document,
          measureStartPointId,
          measureEndPointId,
        )
    } catch {
      completedMeasurement =
        null
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
        onClick={
          handleCanvasClick
        }
        onMouseMove={
          handleMouseMove
        }
        onMouseLeave={() => {
          if (
            !isPanning &&
            !isDraggingGeometry
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

          curveHandleDragRef.current =
            null

          dragPreviewRef.current =
            null

          setDragPreviewDocument(
            null,
          )

          setIsPanning(false)
          setIsDraggingPoint(false)

          setIsDraggingCurveHandle(
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

        {/* STRAIGHT PATTERN LINES */}

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

          const appearance =
            getGeometryAppearance(
              line.role,
              isSelected,
            )

          return (
            <line
              key={line.id}
              x1={start.xPx}
              y1={start.yPx}
              x2={end.xPx}
              y2={end.yPx}
              stroke={appearance.stroke}
              strokeWidth={appearance.strokeWidth}
              strokeDasharray={
                appearance.strokeDasharray
              }
            />
          )
        })}

        {/* CUBIC BEZIER CURVES */}

        {Object.values(
          displayDocument.curves,
        ).map((curve) => {
          const startPoint =
            displayDocument.points[
              curve.startPointId
            ]

          const endPoint =
            displayDocument.points[
              curve.endPointId
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

          const control1 =
            worldToScreen(
              curve.control1,
              viewport,
            )

          const control2 =
            worldToScreen(
              curve.control2,
              viewport,
            )

          const end =
            worldToScreen(
              endPoint,
              viewport,
            )

          const isSelected =
            selection?.kind ===
              'curve' &&
            selection.id ===
              curve.id

          const appearance =
            getGeometryAppearance(
              curve.role,
              isSelected,
            )

          const path =
            `M ${start.xPx} ${start.yPx} ` +
            `C ${control1.xPx} ${control1.yPx}, ` +
            `${control2.xPx} ${control2.yPx}, ` +
            `${end.xPx} ${end.yPx}`

          return (
            <path
              key={curve.id}
              d={path}
              fill="none"
              stroke={appearance.stroke}
              strokeWidth={appearance.strokeWidth}
              strokeDasharray={
                appearance.strokeDasharray
              }
            />
          )
        })}

        {/* LINE CREATION PREVIEW */}

        {activeTool ===
          'line' &&
          linePreviewStart &&
          linePreviewEnd && (
            <line
              x1={
                linePreviewStart.xPx
              }
              y1={
                linePreviewStart.yPx
              }
              x2={
                linePreviewEnd.xPx
              }
              y2={
                linePreviewEnd.yPx
              }
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="7 5"
              pointerEvents="none"
            />
          )}

        {/* CURVE CREATION PREVIEW */}

        {activeTool ===
          'curve' &&
          curvePreviewStart &&
          curvePreviewEnd && (
            <line
              x1={
                curvePreviewStart.xPx
              }
              y1={
                curvePreviewStart.yPx
              }
              x2={
                curvePreviewEnd.xPx
              }
              y2={
                curvePreviewEnd.yPx
              }
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="4 5"
              pointerEvents="none"
            />
          )}

        {/* COMPLETED MEASUREMENT */}

        {activeTool ===
          'measure' &&
          measureStartScreen &&
          measureEndScreen && (
            <line
              x1={
                measureStartScreen.xPx
              }
              y1={
                measureStartScreen.yPx
              }
              x2={
                measureEndScreen.xPx
              }
              y2={
                measureEndScreen.yPx
              }
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="4 4"
              pointerEvents="none"
            />
          )}

        {/* LIVE MEASUREMENT PREVIEW */}

        {activeTool ===
          'measure' &&
          measureStartScreen &&
          measureCursorScreen &&
          !measureEndScreen && (
            <line
              x1={
                measureStartScreen.xPx
              }
              y1={
                measureStartScreen.yPx
              }
              x2={
                measureCursorScreen.xPx
              }
              y2={
                measureCursorScreen.yPx
              }
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="4 4"
              pointerEvents="none"
            />
          )}

        {/* SELECTED CURVE CONTROL HANDLES */}

        {selectedCurve &&
          !selectedCurveIsReadOnly &&
          selectedCurveStartScreen &&
          selectedCurveEndScreen &&
          selectedControl1Screen &&
          selectedControl2Screen && (
            <g
              pointerEvents="none"
            >
              <line
                x1={
                  selectedCurveStartScreen.xPx
                }
                y1={
                  selectedCurveStartScreen.yPx
                }
                x2={
                  selectedControl1Screen.xPx
                }
                y2={
                  selectedControl1Screen.yPx
                }
                stroke="#2563eb"
                strokeWidth={1}
                strokeDasharray="4 3"
              />

              <line
                x1={
                  selectedCurveEndScreen.xPx
                }
                y1={
                  selectedCurveEndScreen.yPx
                }
                x2={
                  selectedControl2Screen.xPx
                }
                y2={
                  selectedControl2Screen.yPx
                }
                stroke="#2563eb"
                strokeWidth={1}
                strokeDasharray="4 3"
              />

              <circle
                cx={
                  selectedControl1Screen.xPx
                }
                cy={
                  selectedControl1Screen.yPx
                }
                r={7}
                fill="white"
                stroke="#2563eb"
                strokeWidth={2}
              />

              <circle
                cx={
                  selectedControl2Screen.xPx
                }
                cy={
                  selectedControl2Screen.yPx
                }
                r={7}
                fill="white"
                stroke="#2563eb"
                strokeWidth={2}
              />

              <text
                x={
                  selectedControl1Screen.xPx +
                  10
                }
                y={
                  selectedControl1Screen.yPx -
                  8
                }
                fontSize="11"
                fill="#2563eb"
              >
                Ctrl 1
              </text>

              <text
                x={
                  selectedControl2Screen.xPx +
                  10
                }
                y={
                  selectedControl2Screen.yPx -
                  8
                }
                fontSize="11"
                fill="#2563eb"
              >
                Ctrl 2
              </text>
            </g>
          )}

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

          const isLineStart =
            activeTool ===
              'line' &&
            lineStartPointId ===
              point.id

          const isCurveStart =
            activeTool ===
              'curve' &&
            curveStartPointId ===
              point.id

          const isMeasureStart =
            activeTool ===
              'measure' &&
            measureStartPointId ===
              point.id

          const isMeasureEnd =
            activeTool ===
              'measure' &&
            measureEndPointId ===
              point.id

          return (
            <g key={point.id}>
              {isLineStart && (
                <circle
                  cx={screen.xPx}
                  cy={screen.yPx}
                  r={12}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="3 2"
                />
              )}

              {isCurveStart && (
                <circle
                  cx={screen.xPx}
                  cy={screen.yPx}
                  r={12}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                />
              )}

              {isMeasureStart && (
                <circle
                  cx={screen.xPx}
                  cy={screen.yPx}
                  r={12}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  strokeDasharray="3 2"
                />
              )}

              {isMeasureEnd && (
                <circle
                  cx={screen.xPx}
                  cy={screen.yPx}
                  r={12}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth={2}
                />
              )}

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
                  isSelected ||
                  isLineStart ||
                  isCurveStart
                    ? '#2563eb'
                    : 'black'
                }
              />

              <PointLabel
                xPx={
                  screen.xPx
                }
                yPx={
                  screen.yPx
                }
                name={
                  point.name
                }
              />
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

      {/* CURVE PROPERTIES PANEL */}

      {selection?.kind ===
        'curve' &&
        selectedCurveProperties && (
          <div
            style={{
              position:
                'absolute',
              top: '44px',
              right: '14px',
              width: '300px',
              padding: '12px',
              background:
                'rgba(255,255,255,0.97)',
              border:
                '1px solid #bdbdbd',
              borderRadius:
                '4px',
              boxShadow:
                '0 2px 8px rgba(0,0,0,0.12)',
              fontSize: '12px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                marginBottom:
                  '8px',
              }}
            >
              <strong
                style={{
                  fontSize:
                    '14px',
                }}
              >
                Curve{' '}
                {
                  selectedCurveProperties
                    .name
                }
              </strong>

              <span>
                {unit}
              </span>
            </div>

            <div
              style={{
                marginBottom:
                  '5px',
              }}
            >
              From:{' '}
              <strong>
                {
                  selectedCurveProperties
                    .startPointId
                }
              </strong>
              {' → '}
              <strong>
                {
                  selectedCurveProperties
                    .endPointId
                }
              </strong>
            </div>

            <div
              style={{
                marginBottom:
                  '10px',
                paddingBottom:
                  '8px',
                borderBottom:
                  '1px solid #dddddd',
              }}
            >
              Length:{' '}
              <strong>
                {formatLength(
                  selectedCurveProperties
                    .lengthMm,
                  unit,
                )}
              </strong>
            </div>

            {selectedCurveIsReadOnly ? (
              <div
                style={{
                  padding:
                    '9px 10px',
                  background:
                    '#f5f5f5',
                  border:
                    '1px solid #dddddd',
                  borderRadius:
                    '3px',
                  color:
                    '#555555',
                  lineHeight:
                    1.4,
                }}
              >
                Generated curve —
                editing locked.
              </div>
            ) : (
              <>
            <div
              style={{
                marginBottom:
                  '10px',
              }}
            >
              <strong>
                Ctrl 1
              </strong>

              <div
                style={{
                  display:
                    'flex',
                  gap: '5px',
                  alignItems:
                    'center',
                  marginTop:
                    '4px',
                }}
              >
                <label>
                  X{' '}
                  <input
                    type="number"
                    step="any"
                    value={
                      control1XInput
                    }
                    onChange={(
                      event,
                    ) => {
                      setControl1XInput(
                        event
                          .target
                          .value,
                      )

                      setCurveControlError(
                        null,
                      )
                    }}
                    onKeyDown={(
                      event,
                    ) => {
                      handleCurveControlKeyDown(
                        event,
                        'control1',
                      )
                    }}
                    style={{
                      width:
                        '70px',
                    }}
                  />
                </label>

                <label>
                  Y{' '}
                  <input
                    type="number"
                    step="any"
                    value={
                      control1YInput
                    }
                    onChange={(
                      event,
                    ) => {
                      setControl1YInput(
                        event
                          .target
                          .value,
                      )

                      setCurveControlError(
                        null,
                      )
                    }}
                    onKeyDown={(
                      event,
                    ) => {
                      handleCurveControlKeyDown(
                        event,
                        'control1',
                      )
                    }}
                    style={{
                      width:
                        '70px',
                    }}
                  />
                </label>

                <button
                  type="button"
                  disabled={
                    isDraggingGeometry
                  }
                  onClick={() => {
                    applyExactCurveControl(
                      'control1',
                    )
                  }}
                >
                  Apply
                </button>
              </div>
            </div>

            <div>
              <strong>
                Ctrl 2
              </strong>

              <div
                style={{
                  display:
                    'flex',
                  gap: '5px',
                  alignItems:
                    'center',
                  marginTop:
                    '4px',
                }}
              >
                <label>
                  X{' '}
                  <input
                    type="number"
                    step="any"
                    value={
                      control2XInput
                    }
                    onChange={(
                      event,
                    ) => {
                      setControl2XInput(
                        event
                          .target
                          .value,
                      )

                      setCurveControlError(
                        null,
                      )
                    }}
                    onKeyDown={(
                      event,
                    ) => {
                      handleCurveControlKeyDown(
                        event,
                        'control2',
                      )
                    }}
                    style={{
                      width:
                        '70px',
                    }}
                  />
                </label>

                <label>
                  Y{' '}
                  <input
                    type="number"
                    step="any"
                    value={
                      control2YInput
                    }
                    onChange={(
                      event,
                    ) => {
                      setControl2YInput(
                        event
                          .target
                          .value,
                      )

                      setCurveControlError(
                        null,
                      )
                    }}
                    onKeyDown={(
                      event,
                    ) => {
                      handleCurveControlKeyDown(
                        event,
                        'control2',
                      )
                    }}
                    style={{
                      width:
                        '70px',
                    }}
                  />
                </label>

                <button
                  type="button"
                  disabled={
                    isDraggingGeometry
                  }
                  onClick={() => {
                    applyExactCurveControl(
                      'control2',
                    )
                  }}
                >
                  Apply
                </button>
              </div>
            </div>

              </>
            )}

            {!selectedCurveIsReadOnly &&
              curveControlError && (
              <div
                style={{
                  marginTop:
                    '8px',
                  color:
                    '#b00020',
                }}
              >
                {
                  curveControlError
                }
              </div>
            )}

            {!selectedCurveIsReadOnly && (
              <div
                style={{
                  marginTop:
                    '9px',
                  color:
                    '#666666',
                  lineHeight: 1.4,
                }}
              >
                Mouse dragging uses
                snap. Exact numeric
                input does not snap.
              </div>
            )}
          </div>
        )}

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
          Snap:{' '}
          {formatLength(
            snapSpacingMm,
            unit,
          )}
        </span>

        {activeTool ===
          'line' && (
            <strong>
              {lineToolMessage ??
                (
                  lineStartPointId
                    ? `Line start: ${lineStartPointId} — choose endpoint`
                    : 'Line: click a start point'
                )}
            </strong>
          )}

        {activeTool ===
          'curve' && (
            <strong>
              {curveToolMessage ??
                (
                  curveStartPointId
                    ? `Curve start: ${curveStartPointId} — choose endpoint`
                    : 'Curve: click a start point'
                )}
            </strong>
          )}

        {activeTool ===
          'measure' && (
            <strong>
              {measureToolMessage ??
                (
                  measureStartPointId ===
                    null
                    ? 'Measure: click the first point'
                    : measureEndPointId ===
                        null
                      ? `Measure start: ${measureStartPointId} — choose second point`
                      : `Measured ${measureStartPointId} → ${measureEndPointId}`
                )}
            </strong>
          )}

        {completedMeasurement && (
          <>
            <span>
              Distance:{' '}
              <strong>
                {formatLength(
                  completedMeasurement
                    .distanceMm,
                  unit,
                )}
              </strong>
            </span>

            <span>
              ΔX:{' '}
              {formatLength(
                completedMeasurement
                  .deltaXMm,
                unit,
              )}
            </span>

            <span>
              ΔY:{' '}
              {formatLength(
                completedMeasurement
                  .deltaYMm,
                unit,
              )}
            </span>
          </>
        )}

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
              Point{' '}
              {selectedPoint.name}
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
                isDraggingGeometry
              }
              onClick={
                applyExactPointPosition
              }
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
                {coordinateError}
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
              isDraggingGeometry
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
              isDraggingGeometry
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
              activateTool(
                'select',
              )
            }}
            title="Select and edit geometry"
            style={{
              fontWeight:
                activeTool ===
                'select'
                  ? 'bold'
                  : 'normal',
            }}
          >
            Select
          </button>

          <button
            type="button"
            aria-pressed={
              activeTool ===
              'point'
            }
            onClick={() => {
              activateTool(
                'point',
              )
            }}
            title="Create points"
            style={{
              fontWeight:
                activeTool ===
                'point'
                  ? 'bold'
                  : 'normal',
            }}
          >
            Point
          </button>

          <button
            type="button"
            aria-pressed={
              activeTool ===
              'line'
            }
            onClick={() => {
              activateTool(
                'line',
              )
            }}
            title="Create a straight line between two points"
            style={{
              fontWeight:
                activeTool ===
                'line'
                  ? 'bold'
                  : 'normal',
            }}
          >
            Line
          </button>

          <button
            type="button"
            aria-pressed={
              activeTool ===
              'curve'
            }
            onClick={() => {
              activateTool(
                'curve',
              )
            }}
            title="Create a cubic Bezier curve between two points"
            style={{
              fontWeight:
                activeTool ===
                'curve'
                  ? 'bold'
                  : 'normal',
            }}
          >
            Curve
          </button>

          <button
            type="button"
            aria-pressed={
              activeTool ===
              'measure'
            }
            onClick={() => {
              activateTool(
                'measure',
              )
            }}
            title="Measure between two points"
            style={{
              fontWeight:
                activeTool ===
                'measure'
                  ? 'bold'
                  : 'normal',
            }}
          >
            Measure
          </button>

          <button
            type="button"
            aria-pressed={
              activeTool ===
              'pan'
            }
            onClick={() => {
              activateTool(
                'pan',
              )
            }}
            title="Pan workspace"
            style={{
              fontWeight:
                activeTool ===
                'pan'
                  ? 'bold'
                  : 'normal',
            }}
          >
            Pan
          </button>

          <button
            type="button"
            disabled={
              selection === null ||
              selectionIsReadOnlyCurve ||
              isDraggingGeometry
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