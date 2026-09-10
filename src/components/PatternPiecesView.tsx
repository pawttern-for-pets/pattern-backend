import type {
  PatternDocument,
} from '../cad/document'

import type {
  PatternPiece,
  PatternPieceEdge,
} from '../cad/patternPiece'

import type {
  PatternPieceControlBounds,
  ReferenceTankV2ProductionLayout,
} from '../pattern/referenceTankV2ProductionLayout'

interface PatternPiecesViewProps {
  layout:
    ReferenceTankV2ProductionLayout
}

const VIEW_PADDING_MM = 20

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

function renderEdge(
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
        x1={start.xMm}
        y1={start.yMm}
        x2={end.xMm}
        y2={end.yMm}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
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
      d={path}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      vectorEffect="non-scaling-stroke"
    />
  )
}

function renderPiece(
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
      renderEdge(
        document,
        edge,
        `${piece.id}:${index}`,
      ),
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
}: PatternPiecesViewProps) {
  const combinedBounds =
    getCombinedBounds(
      layout.backBounds,
      layout.frontBellyBounds,
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
      layout.backBounds,
    )

  const frontLabel =
    getLabelPosition(
      layout.frontBellyBounds,
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
          {renderPiece(
            layout.document,
            layout.back,
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
          {renderPiece(
            layout.document,
            layout.frontBelly,
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