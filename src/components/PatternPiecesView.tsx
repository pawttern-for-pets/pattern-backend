import type {
  WorldPosition,
} from '../cad/coordinates'

import type {
  PatternDocument,
} from '../cad/document'

import {
  createPatternPieceFoldMarkings,
  type PatternPieceFoldMarking,
} from '../cad/patternPieceFoldMarking'

import {
  createFoldParallelPatternPieceGrainline,
  type PatternPieceGrainline,
} from '../cad/patternPieceGrainline'

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

const FOLD_LABEL_OFFSET_MM =
  12

const FOLD_LEADER_LENGTH_MM =
  5

const GRAINLINE_ARROW_LENGTH_MM =
  4

const GRAINLINE_ARROW_HALF_WIDTH_MM =
  2

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

function getReadableAngleDegrees(
  direction: {
    x: number
    y: number
  },
): number {
  let angle =
    Math.atan2(
      direction.y,
      direction.x,
    ) *
    180 /
    Math.PI

  if (
    angle > 90
  ) {
    angle -= 180
  } else if (
    angle < -90
  ) {
    angle += 180
  }

  return angle
}

function getFoldAnnotationGeometry(
  marking:
    PatternPieceFoldMarking,

  bounds:
    PatternPieceControlBounds,
) {
  const pieceCenter = {
    xMm:
      (
        bounds.minXMm +
        bounds.maxXMm
      ) / 2,

    yMm:
      (
        bounds.minYMm +
        bounds.maxYMm
      ) / 2,
  }

  const perpendicular = {
    x:
      -marking.direction.y,

    y:
      marking.direction.x,
  }

  const towardCenter = {
    x:
      pieceCenter.xMm -
      marking.midpoint.xMm,

    y:
      pieceCenter.yMm -
      marking.midpoint.yMm,
  }

  const dot =
    perpendicular.x *
      towardCenter.x +
    perpendicular.y *
      towardCenter.y

  const inward =
    dot >= 0
      ? perpendicular
      : {
          x:
            -perpendicular.x,

          y:
            -perpendicular.y,
        }

  return {
    label: {
      xMm:
        marking.midpoint.xMm +
        inward.x *
          FOLD_LABEL_OFFSET_MM,

      yMm:
        marking.midpoint.yMm +
        inward.y *
          FOLD_LABEL_OFFSET_MM,
    },

    leaderEnd: {
      xMm:
        marking.midpoint.xMm +
        inward.x *
          FOLD_LEADER_LENGTH_MM,

      yMm:
        marking.midpoint.yMm +
        inward.y *
          FOLD_LEADER_LENGTH_MM,
    },

    angleDegrees:
      getReadableAngleDegrees(
        marking.direction,
      ),
  }
}

function renderFoldMarkings(
  markings:
    readonly PatternPieceFoldMarking[],

  bounds:
    PatternPieceControlBounds,

  keyPrefix:
    string,
) {
  return markings.map(
    (
      marking,
      index,
    ) => {
      const annotation =
        getFoldAnnotationGeometry(
          marking,
          bounds,
        )

      return (
        <g
          key={
            `${keyPrefix}:fold:${index}`
          }
          data-marking-type="cut-on-fold"
        >
          <line
            x1={
              marking.midpoint.xMm
            }
            y1={
              marking.midpoint.yMm
            }
            x2={
              annotation
                .leaderEnd.xMm
            }
            y2={
              annotation
                .leaderEnd.yMm
            }
            stroke="#111111"
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />

          <text
            x={
              annotation
                .label.xMm
            }
            y={
              annotation
                .label.yMm
            }
            transform={
              `rotate(${annotation.angleDegrees} ${annotation.label.xMm} ${annotation.label.yMm})`
            }
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={7}
            fontWeight={600}
            letterSpacing={0.5}
            fill="#111111"
            stroke="#ffffff"
            strokeWidth={2.5}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            CUT ON FOLD
          </text>
        </g>
      )
    },
  )
}

function renderGrainline(
  grainline:
    PatternPieceGrainline,

  key:
    string,
) {
  const perpendicular = {
    x:
      -grainline.direction.y,

    y:
      grainline.direction.x,
  }

  const startBase = {
    xMm:
      grainline.start.xMm +
      grainline.direction.x *
        GRAINLINE_ARROW_LENGTH_MM,

    yMm:
      grainline.start.yMm +
      grainline.direction.y *
        GRAINLINE_ARROW_LENGTH_MM,
  }

  const endBase = {
    xMm:
      grainline.end.xMm -
      grainline.direction.x *
        GRAINLINE_ARROW_LENGTH_MM,

    yMm:
      grainline.end.yMm -
      grainline.direction.y *
        GRAINLINE_ARROW_LENGTH_MM,
  }

  const startWingA = {
    xMm:
      startBase.xMm +
      perpendicular.x *
        GRAINLINE_ARROW_HALF_WIDTH_MM,

    yMm:
      startBase.yMm +
      perpendicular.y *
        GRAINLINE_ARROW_HALF_WIDTH_MM,
  }

  const startWingB = {
    xMm:
      startBase.xMm -
      perpendicular.x *
        GRAINLINE_ARROW_HALF_WIDTH_MM,

    yMm:
      startBase.yMm -
      perpendicular.y *
        GRAINLINE_ARROW_HALF_WIDTH_MM,
  }

  const endWingA = {
    xMm:
      endBase.xMm +
      perpendicular.x *
        GRAINLINE_ARROW_HALF_WIDTH_MM,

    yMm:
      endBase.yMm +
      perpendicular.y *
        GRAINLINE_ARROW_HALF_WIDTH_MM,
  }

  const endWingB = {
    xMm:
      endBase.xMm -
      perpendicular.x *
        GRAINLINE_ARROW_HALF_WIDTH_MM,

    yMm:
      endBase.yMm -
      perpendicular.y *
        GRAINLINE_ARROW_HALF_WIDTH_MM,
  }

  return (
    <g
      key={key}
      data-marking-type="grainline"
    >
      <line
        x1={grainline.start.xMm}
        y1={grainline.start.yMm}
        x2={grainline.end.xMm}
        y2={grainline.end.yMm}
        stroke="#111111"
        strokeWidth={1.25}
        vectorEffect="non-scaling-stroke"
      />

      <line
        x1={grainline.start.xMm}
        y1={grainline.start.yMm}
        x2={startWingA.xMm}
        y2={startWingA.yMm}
        stroke="#111111"
        strokeWidth={1.25}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      <line
        x1={grainline.start.xMm}
        y1={grainline.start.yMm}
        x2={startWingB.xMm}
        y2={startWingB.yMm}
        stroke="#111111"
        strokeWidth={1.25}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      <line
        x1={grainline.end.xMm}
        y1={grainline.end.yMm}
        x2={endWingA.xMm}
        y2={endWingA.yMm}
        stroke="#111111"
        strokeWidth={1.25}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      <line
        x1={grainline.end.xMm}
        y1={grainline.end.yMm}
        x2={endWingB.xMm}
        y2={endWingB.yMm}
        stroke="#111111"
        strokeWidth={1.25}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  )
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

  const backFoldMarkings =
    createPatternPieceFoldMarkings(
      layout.document,
      layout.back,
    )

  const frontFoldMarkings =
    createPatternPieceFoldMarkings(
      layout.document,
      layout.frontBelly,
    )

  const backGrainline =
    createFoldParallelPatternPieceGrainline(
      layout.document,
      layout.back,
    )

  const frontGrainline =
    createFoldParallelPatternPieceGrainline(
      layout.document,
      layout.frontBelly,
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

          {renderFoldMarkings(
            backFoldMarkings,
            layout.backBounds,
            'back',
          )}

          {renderGrainline(
            backGrainline,
            'back:grainline',
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

          {renderFoldMarkings(
            frontFoldMarkings,
            layout.frontBellyBounds,
            'front-belly',
          )}

          {renderGrainline(
            frontGrainline,
            'front-belly:grainline',
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