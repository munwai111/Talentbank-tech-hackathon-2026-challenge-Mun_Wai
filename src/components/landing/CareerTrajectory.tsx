'use client'

// Career Trajectory — the hero data-visualization.
// A hand-built SVG area/line chart (trend-over-time, the right chart for a
// career path per design guidance) showing a candidate's plotted route rising
// over time, with waypoint nodes, salary bands, and a tabular detail table.
// Animated with framer-motion (path draw + staggered spring waypoints),
// fully reduced-motion aware. Bespoke — not a generic charting component.

import { motion, useReducedMotion } from 'motion/react'

// ── Chart geometry ───────────────────────────────────────────────────────────
const W = 460, H = 260
const BASE = 232            // baseline y (RM 4k)
const TOP = 28              // top y (RM 24k)
const yFor = (k: number) => BASE - ((k - 4) / (24 - 4)) * (BASE - TOP)

// Waypoints: x along time axis, salary midpoint → y
// `dot` = saturated node colour; `text` = lighter tint that clears WCAG AA
// (4.5:1) for the small label on the dark card.
const NODES = [
  { x: 55,  k: 10, label: 'UX Research Lead',         salary: 'RM 8–12k',  dot: '#2EFF9A', glow: '#2EFF9A', text: '#6EE7B7' },
  { x: 230, k: 14, label: 'Talent Analytics Manager', salary: 'RM 9–14k',  dot: '#7B61FF', glow: '#7B61FF', text: '#B7A6FF' },
  { x: 410, k: 22, label: 'Head of People & Culture', salary: 'RM 14–22k', dot: '#E8FF47', glow: '#E8FF47', text: '#E8FF47' },
]

const LINE = `M55 ${yFor(10)} C 120 ${yFor(10.6)} 170 ${yFor(13)} 230 ${yFor(14)} C 300 ${yFor(15.2)} 365 ${yFor(19)} 410 ${yFor(22)}`
const AREA = `${LINE} L410 ${BASE} L55 ${BASE} Z`
const GRID = [20, 14, 8]   // salary marks

const DETAIL = [
  { badge: 'NOW',     cls: 'badge-now',     title: 'UX Research Lead',         salary: 'RM 8,000 – 12,000 / mo',  pct: 82, color: 'var(--cos-green)' },
  { badge: '6–18 MO', cls: 'badge-6mo',     title: 'Talent Analytics Manager', salary: 'RM 9,000 – 14,000 / mo',  pct: 60, color: 'var(--cos-violet)' },
  { badge: 'STRETCH', cls: 'badge-stretch', title: 'Head of People & Culture', salary: 'RM 14,000 – 22,000 / mo', pct: 35, color: 'var(--cos-chartreuse)' },
]

export function CareerTrajectory() {
  const reduced = useReducedMotion()

  // Reduced-motion: render the final state, no animation.
  const draw = reduced
    ? { line: { pathLength: 1 }, fade: { opacity: 1 }, node: { opacity: 1, scale: 1 } }
    : null

  return (
    <div className="cos-trajectory">
      {/* header */}
      <div className="cos-traj-head">
        <span className="cos-live-indicator" style={{ marginBottom: 0 }}>
          <span className="cos-live-dot" />
          PATH NAVIGATOR · LIVE OUTPUT
        </span>
        <span className="cos-traj-confidence">HIGH · 4 sources</span>
      </div>
      <div className="cos-route-header">Plotted from 26 skills · Kuala Lumpur · MYR/month</div>

      {/* chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="cos-traj-svg" role="img"
        aria-label="Career trajectory: UX Research Lead now (RM 8–12k), Talent Analytics Manager in 6–18 months (RM 9–14k), Head of People and Culture as a stretch goal (RM 14–22k)">
        <defs>
          <linearGradient id="traj-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8FF47" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#E8FF47" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="traj-line" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#2EFF9A" />
            <stop offset="55%" stopColor="#7B61FF" />
            <stop offset="100%" stopColor="#E8FF47" />
          </linearGradient>
        </defs>

        {/* gridlines + salary marks */}
        {GRID.map(k => (
          <g key={k}>
            <line x1="44" y1={yFor(k)} x2={W - 8} y2={yFor(k)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="2 5" />
            <text x="38" y={yFor(k) + 3} textAnchor="end" className="cos-traj-axis">{k}k</text>
          </g>
        ))}

        {/* area fill */}
        <motion.path d={AREA} fill="url(#traj-area)"
          initial={draw ? draw.fade : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }} />

        {/* trajectory line (draws in) */}
        <motion.path d={LINE} fill="none" stroke="url(#traj-line)" strokeWidth="2.5"
          strokeLinecap="round"
          initial={draw ? draw.line : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1] }} />

        {/* waypoints + direct labels */}
        {NODES.map((n, i) => {
          const y = yFor(n.k)
          const anchor = i === 0 ? 'start' : i === NODES.length - 1 ? 'end' : 'middle'
          const lx = i === 0 ? n.x + 12 : i === NODES.length - 1 ? n.x - 12 : n.x
          const ly = i === 0 ? y + 26 : y - 26
          return (
            <motion.g key={n.label}
              initial={draw ? draw.node : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduced ? 0 : 0.7 + i * 0.28, type: 'spring', stiffness: 320, damping: 18 }}
              style={{ transformOrigin: `${n.x}px ${y}px` }}>
              <circle cx={n.x} cy={y} r="11" fill={n.glow} fillOpacity="0.14" />
              <circle cx={n.x} cy={y} r="4.5" fill={n.dot} />
              <text x={lx} y={ly} textAnchor={anchor} className="cos-traj-node-title" fill={n.text}>{n.label}</text>
              <text x={lx} y={ly + 13} textAnchor={anchor} className="cos-traj-node-salary">{n.salary}</text>
            </motion.g>
          )
        })}

        {/* time axis */}
        <text x="55"  y="252" textAnchor="start"  className="cos-traj-axis">NOW</text>
        <text x="230" y="252" textAnchor="middle" className="cos-traj-axis">6–18 MO</text>
        <text x="410" y="252" textAnchor="end"    className="cos-traj-axis">18–36 MO</text>
      </svg>

      {/* detail table — tabular figures reinforce the chart */}
      <div className="cos-traj-detail">
        {DETAIL.map((d, i) => (
          <div className="cos-route-item" key={d.title}>
            <span className={`cos-route-badge ${d.cls}`}>{d.badge}</span>
            <div className="cos-route-info">
              <div className="cos-route-title">{d.title}</div>
              <div className="cos-route-salary">{d.salary}</div>
              <div className="cos-route-bar">
                <motion.div className="cos-route-fill" style={{ background: d.color }}
                  initial={reduced ? { width: `${d.pct}%` } : { width: 0 }}
                  whileInView={{ width: `${d.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 0.3 + i * 0.12, ease: [0.23, 1, 0.32, 1] }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
