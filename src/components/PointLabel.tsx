interface PointLabelProps {
  xPx: number
  yPx: number
  name: string
}

const LABEL_LINES: Record<
  string,
  readonly [string, string?]
> = {
  'Back Center Top': [
    'Back Center',
    'Top',
  ],

  'Side Top': [
    'Side',
    'Top',
  ],

  'Front Center Top': [
    'Front Center',
    'Top',
  ],

  'Back Armhole Level': [
    'Back Armhole',
    'Level',
  ],

  'Side Armhole Level': [
    'Side Armhole',
    'Level',
  ],

  'Front Armhole Level': [
    'Front Armhole',
    'Level',
  ],

  'Back Center Bottom': [
    'Back Center',
    'Bottom',
  ],

  'Side Bottom': [
    'Side',
    'Bottom',
  ],

  'Front Center Bottom': [
    'Front Center',
    'Bottom',
  ],

  'Back Neck Width Base': [
    'Back Neck',
    'Width Base',
  ],

  'Back Neck Outer': [
    'Back Neck',
    'Outer',
  ],

  'Front Neck Center': [
    'Front Neck',
    'Center',
  ],

  'Front Neck Width Base': [
    'Front Neck',
    'Width Base',
  ],

  'Front Neck Outer': [
    'Front Neck',
    'Outer',
  ],

  'Front Armhole Inset': [
    'Front Armhole',
    'Inset',
  ],
}

function splitFallbackLabel(
  name: string,
): readonly [string, string?] {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (
    words.length <= 2
  ) {
    return [
      words.join(' '),
    ]
  }

  const splitIndex =
    Math.ceil(
      words.length / 2,
    )

  return [
    words
      .slice(
        0,
        splitIndex,
      )
      .join(' '),

    words
      .slice(
        splitIndex,
      )
      .join(' '),
  ]
}

export function PointLabel({
  xPx,
  yPx,
  name,
}: PointLabelProps) {
  const lines =
    LABEL_LINES[name] ??
    splitFallbackLabel(
      name,
    )

  return (
    <text
      x={xPx + 8}
      y={yPx - 14}
      fontSize="10"
      pointerEvents="none"
    >
      <tspan
        x={xPx + 8}
        dy={0}
      >
        {lines[0]}
      </tspan>

      {lines[1] && (
        <tspan
          x={xPx + 8}
          dy={11}
        >
          {lines[1]}
        </tspan>
      )}
    </text>
  )
}
