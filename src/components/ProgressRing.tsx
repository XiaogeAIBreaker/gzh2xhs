interface ProgressRingProps {
  value: number
  max: number
  size?: number
  stroke?: number
}

export function ProgressRing({ value, max, size = 28, stroke = 3 }: ProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = Math.min(1, Math.max(0, value / max))
  const dash = circumference * ratio
  const rest = circumference - dash
  const nearLimit = ratio > 0.85
  const color = nearLimit ? '#f97316' : '#60a5fa'

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#ffffff22" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${rest}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
