import type { PatternDocument } from '../cad/document'
import {
  createViewport,
  worldToScreen,
} from '../cad/viewport'

interface CadCanvasProps {
  document: PatternDocument
}

export function CadCanvas({
  document,
}: CadCanvasProps) {
  const viewport = createViewport(1, 120, 120)

  return (
    <svg
      viewBox="0 0 900 600"
      width="100%"
      height="100%"
      style={{
        background: 'white',
        border: '1px solid #cccccc',
      }}
    >
      {Object.values(document.lines).map((line) => {
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
      })}

      {Object.values(document.points).map((point) => {
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
      })}
    </svg>
  )
}