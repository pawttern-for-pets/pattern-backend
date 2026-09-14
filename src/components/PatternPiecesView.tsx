import type {
  WorldPosition,
} from '../cad/coordinates'

import type {
  PatternDocument,
} from '../cad/document'

import type {
  PatternPiece,
  PatternPieceEdge,
} from '../cad/patternPiece'

import type {
  ReferenceTankV2ProductionCuttingContours,
} from '../pattern/referenceTankV2ProductionCuttingContours'

import type {
  PatternPieceControlBounds,
  ReferenceTankV2ProductionLayout,
} from '../pattern/referenceTankV2ProductionLayout'

interface PatternPiecesViewProps {
  layout:
    ReferenceTankV2ProductionLayout

  cuttingContours?:
    ReferenceTankV2ProductionCuttingContours |
    null
}

const VIEW_PADDING_MM =
  20

function copyBounds(
  bounds:
    PatternPieceControlBounds,
): PatternPieceControlBounds {
  return {
    minXMm:
      bounds.minXMm,

    maxXMm:
      bounds.maxXMm,

    minYMm:
      bounds.minYMm,

    maxYMm:
      bounds.maxYMm,
  }
}

function includePoint(
  bounds:
    PatternPieceControlBounds,

  point:
    WorldPosition,
): void {
  bounds.minXMm =
    Math.min(
      bounds.minXMm,
      point.xMm,
    )

  bounds.maxXMm =
    Math.max(
      bounds.maxXMm,
      point.xMm,
    )

  bounds.minYMm =
    Math.min(
      bounds.minYMm,
      point.yMm,
    )

  bounds.maxYMm =
    Math.max(
      bounds.maxYMm,
      point.yMm,
    )
}

function includePoints(
  bounds:
    PatternPieceControlBounds,

  points:
    readonly WorldPosition[],
): void {
  for (
    const point of points
  ) {
    includePoint(
      bounds,
      point,
    )
  }
}

function getPieceViewBounds(
  sewingBounds:
    PatternPieceControlBounds,

  cuttingPoints?:
    readonly WorldPosition[],
): PatternPieceControlBounds {
  const bounds =
    copyBounds(
      sewingBounds,
    )

  if (
    cuttingPoints
  ) {
    includePoints(
      bounds,
      cuttingPoints,
    )
  }

  return bounds
}

function getCombinedBounds(
  back:
    PatternPieceControlBounds,

  frontBelly:
    PatternPieceControlBounds,
): PatternPieceControlBounds {
  return {
    minXMm:
      Math.min(
        back.minXMm,
        frontBelly.minXMm,
      ),

    maxXMm:
      Math.max(
        back.maxXMm,
        frontBelly.maxXMm,
      ),

    minYMm:
      Math.min(
        back.minYMm,
        frontBelly.minYMm,
      ),

    maxYMm:
      Math.max(
        back.maxYMm,
        frontBelly.maxYMm,
      ),
  }
}

function renderSewingEdge(
  document:
    PatternDocument,

  edge:
    PatternPieceEdge,

  key:
    string,
) {
  if (
    edge.kind ===
    'line'
  ) {
    const line =
      document.lines[
        edge.geometryId
      ]

    if (!line) {
      return null
    }

    const start =
      document.points[
        line.startPointId
      ]

    const end =
      document.points[
        line.endPointId
      ]

    if (
      !start ||
      !end
    ) {
      return null
    }

    return (
      <line
        key={key}
        data-line-type="sewing"
        x1={start.xMm}
        y1={start.yMm}
        x2={end.xMm}
        y2={end.yMm}
        fill="none"
        stroke="#666666"
        strokeWidth={1.5}
        strokeDasharray="5 4"
        vectorEffect="non-scaling-stroke"
      />
    )
  }

  const curve =
    document.curves[
      edge.geometryId
    ]

  if (!curve) {
    return null
  }

  const start =
    document.points[
      curve.startPointId
    ]

  const end =
    document.points[
      curve.endPointId
    ]

  if (
    !start ||
    !end
  ) {
    return null
  }

  const path =
    [
      `M ${start.xMm} ${start.yMm}`,
      `C ${curve.control1.xMm} ${curve.control1.yMm}`,
      `${curve.control2.xMm} ${curve.control2.yMm}`,
      `${end.xMm} ${end.yMm}`,
    ].join(' ')

  return (
    <path
      key={key}
      data-line-type="sewing"
      d={path}
      fill="none"
      stroke="#666666"
      strokeWidth={1.5}
      strokeDasharray="5 4"
      vectorEffect="non-scaling-stroke"
    />
  )
}

function renderSewingPiece(
  document:
    PatternDocument,

  piece:
    PatternPiece,
) {
  return piece.edges.map(
    (
      edge,
      index,
    ) =>
      renderSewingEdge(
        document,
        edge,
        `${piece.id}:sewing:${index}`,
      ),
  )
}

function cuttingPolylinePoints(
  points:
    readonly WorldPosition[],
): string {
  return points
    .map(
      (point) =>
        `${point.xMm},${point.yMm}`,
    )
    .join(' ')
}

function renderCuttingContour(
  points:
    readonly WorldPosition[] |
    undefined,

  key:
    string,
) {
  if (
    !points ||
    points.length < 4
  ) {
    return null
  }

  return (
    <polyline
      key={key}
      data-line-type="cutting"
      points={
        cuttingPolylinePoints(
          points,
        )
      }
      fill="none"
      stroke="#111111"
      strokeWidth={2.5}
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  )
}

function getLabelPosition(
  bounds:
    PatternPieceControlBounds,
) {
  return {
    xMm:
      (
        bounds.minXMm +
        bounds.maxXMm
      ) / 2,

    yMm:
      bounds.minYMm - 8,
  }
}

export function PatternPiecesView({
  layout,
  cuttingContours = null,
}: PatternPiecesViewProps) {
  const backViewBounds =
    getPieceViewBounds(
      layout.backBounds,
      cuttingContours?.back
        .cuttingPoints,
    )

  const frontViewBounds =
    getPieceViewBounds(
      layout.frontBellyBounds,
      cuttingContours
        ?.frontBelly
        .cuttingPoints,
    )

  const combinedBounds =
    getCombinedBounds(
      backViewBounds,
      frontViewBounds,
    )

  const minXMm =
    combinedBounds.minXMm -
    VIEW_PADDING_MM

  const minYMm =
    combinedBounds.minYMm -
    VIEW_PADDING_MM

  const widthMm =
    (
      combinedBounds.maxXMm -
      combinedBounds.minXMm
    ) +
    VIEW_PADDING_MM * 2

  const heightMm =
    (
      combinedBounds.maxYMm -
      combinedBounds.minYMm
    ) +
    VIEW_PADDING_MM * 2

  const backLabel =
    getLabelPosition(
      backViewBounds,
    )

  const frontLabel =
    getLabelPosition(
      frontViewBounds,
    )

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      <svg
        aria-label="Separated pattern pieces"
        role="img"
        width="100%"
        height="100%"
        viewBox={
          `${minXMm} ${minYMm} ${widthMm} ${heightMm}`
        }
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          color: '#111111',
        }}
      >
        <g
          data-pattern-piece="back"
        >
          {renderSewingPiece(
            layout.document,
            layout.back,
          )}

          {renderCuttingContour(
            cuttingContours?.back
              .cuttingPoints,
            'back:cutting',
          )}

          <text
            x={backLabel.xMm}
            y={backLabel.yMm}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill="currentColor"
          >
            BACK
          </text>
        </g>

        <g
          data-pattern-piece="front-belly"
        >
          {renderSewingPiece(
            layout.document,
            layout.frontBelly,
          )}

          {renderCuttingContour(
            cuttingContours
              ?.frontBelly
              .cuttingPoints,
            'front-belly:cutting',
          )}

          <text
            x={frontLabel.xMm}
            y={frontLabel.yMm}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill="currentColor"
          >
            FRONT / BELLY
          </text>
        </g>
      </svg>
    </div>
  )
}