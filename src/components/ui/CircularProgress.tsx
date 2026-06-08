'use client'

type Props = {
  value: number   // 0–100
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
}

export function CircularProgress({
  value,
  size = 80,
  stroke = 6,
  color = 'url(#grad)',
  trackColor = 'rgba(255,255,255,0.06)',
}: Props) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * (value / 100)

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}
