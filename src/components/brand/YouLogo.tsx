'use client'

// Y.O.U — Your Odyssey Vector
// ─────────────────────────────────────────────────────────────────────────────
// "Orbital Brutalism", now alive and mouse-reactive:
//   • Y  — a cheering human figure: a head dot hovering above two raised arms.
//   • O  — an EYE. Iris + pupil that track the cursor (pupil tracks hardest),
//          enlarging and blooming a glow on hover. A satellite orbits it.
//   • U  — fuses into a bullish breakout: a tight bowl that launches a
//          stock-uptrend vector (pullback → higher high → arrow).
// The whole wordmark tilts in 3D to "face" the cursor (parallax depth: tilt <
// iris < pupil), the eye reading as the strongest tracker. Performant CSS-3D +
// framer-motion pointer springs — no WebGL. Fully reduced-motion aware.

import { useId, useRef, useState } from 'react'
import {
  motion, useReducedMotion, useMotionValue, useSpring, useTransform,
  type Transition,
} from 'motion/react'

type Variant = 'void' | 'chartreuse' | 'light' | 'adaptive'

const PALETTE: Record<Variant, { letter: string; hub: string; accent: string; orbit: string }> = {
  void:       { letter: '#F0F0F0',       hub: '#E8FF47', accent: '#E8FF47', orbit: 'rgba(240,240,240,0.16)' },
  chartreuse: { letter: '#0A0A0F',       hub: '#0A0A0F', accent: '#7B61FF', orbit: 'rgba(10,10,15,0.28)' },
  light:      { letter: '#7B61FF',       hub: '#7B61FF', accent: '#7B61FF', orbit: 'rgba(123,97,255,0.22)' },
  adaptive:   { letter: 'currentColor',  hub: '#7B61FF', accent: '#7B61FF', orbit: 'rgba(123,97,255,0.30)' },
}

const VB_W = 300, VB_H = 96
const CX = 150, CY = 46, ORBIT_R = 33, IRIS_R = 15

export function YouLogo({
  variant = 'void',
  height = 34,
  interactive = true,
  className,
  'aria-label': ariaLabel = 'Y.O.U — Your Odyssey Vector',
}: {
  variant?: Variant
  height?: number
  interactive?: boolean
  className?: string
  'aria-label'?: string
}) {
  const reduced = useReducedMotion()
  const uid = useId().replace(/:/g, '')
  const c = PALETTE[variant]
  const ref = useRef<HTMLSpanElement>(null)
  const [pressed, setPressed] = useState(0)
  const [hovered, setHovered] = useState(false)

  // Pointer position, normalised to [-1, 1] within the mark, spring-smoothed.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const springCfg = { stiffness: 170, damping: 18, mass: 0.4 }
  const sx = useSpring(px, springCfg)
  const sy = useSpring(py, springCfg)

  // Three depth layers — the eye tracks hardest, the wordmark tilt least.
  const rotateY = useTransform(sx, [-1, 1], [-14, 14])
  const rotateX = useTransform(sy, [-1, 1], [10, -10])
  const irisX = useTransform(sx, [-1, 1], [-4.5, 4.5])
  const irisY = useTransform(sy, [-1, 1], [-3.8, 3.8])
  const pupilX = useTransform(sx, [-1, 1], [-8, 8])
  const pupilY = useTransform(sy, [-1, 1], [-6.5, 6.5])

  const track = interactive && !reduced
  function onMove(e: React.PointerEvent) {
    if (!track || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width - 0.5) * 2)
    py.set(((e.clientY - r.top) / r.height - 0.5) * 2)
  }
  function reset() { px.set(0); py.set(0); setHovered(false) }

  const spin: Transition = { duration: 16, repeat: Infinity, ease: 'linear' }
  const eyeSpring: Transition = { type: 'spring', stiffness: 300, damping: 20 }
  const w = (height * VB_W) / VB_H

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ display: 'inline-flex', lineHeight: 0, perspective: 620, cursor: interactive ? 'pointer' : 'default' }}
      onPointerMove={onMove}
      onPointerEnter={() => interactive && setHovered(true)}
      onPointerLeave={reset}
      onPointerDown={() => interactive && setPressed(p => p + 1)}
      whileTap={interactive ? { scale: 0.97 } : undefined}
      aria-label={ariaLabel}
      role="img"
    >
      <motion.span
        style={{ display: 'inline-flex', lineHeight: 0, rotateX: track ? rotateX : 0, rotateY: track ? rotateY : 0, transformStyle: 'preserve-3d' }}
      >
        <svg width={w} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`} fill="none"
          xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
          <defs>
            <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id={`bloom-${uid}`} x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* ── O = orbit + eye ── */}
          <circle cx={CX} cy={CY} r={ORBIT_R} stroke={c.orbit} strokeWidth="1.25" />
          <motion.g
            style={{ originX: `${CX}px`, originY: `${CY}px` }}
            animate={reduced ? undefined : { rotate: 360 }}
            transition={reduced ? undefined : spin}
          >
            <circle cx={CX} cy={CY - ORBIT_R} r="3.6" fill={c.accent} filter={variant === 'void' ? `url(#glow-${uid})` : undefined} />
          </motion.g>

          {/* hover glow bloom behind the iris — a soft filled halo */}
          <motion.circle cx={CX} cy={CY} r={IRIS_R + 4} fill={c.hub}
            filter={`url(#bloom-${uid})`} initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 0.5 : 0 }} transition={{ duration: 0.3 }}
            style={{ originX: `${CX}px`, originY: `${CY}px` }} />

          {/* iris (tracks softly, enlarges on hover) */}
          <motion.circle cx={CX} cy={CY} r={IRIS_R} stroke={c.hub} strokeWidth="6" fill="none"
            style={{ x: track ? irisX : 0, y: track ? irisY : 0, originX: `${CX}px`, originY: `${CY}px` }}
            animate={{ scale: hovered ? 1.16 : 1 }} transition={eyeSpring} />

          {/* pupil (tracks hardest — the gaze) */}
          <motion.circle cx={CX} cy={CY} r="4.4" fill={c.hub}
            style={{ x: track ? pupilX : 0, y: track ? pupilY : 0 }}
            animate={{ scale: hovered ? 0.82 : 1 }} transition={eyeSpring} />

          {/* ── Y = cheering figure (head dot + raised arms + body) ── */}
          <g stroke={c.letter} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M58 28 L70 46" />
            <path d="M82 28 L70 46" />
            <path d="M70 46 L70 66" />
          </g>
          <motion.circle cx="70" cy="17" r="4.4" fill={c.accent}
            animate={reduced ? undefined : { y: hovered ? [-3, -5, -3] : [-1.5, 1.5, -1.5] }}
            transition={reduced ? undefined : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />

          {/* mid dots */}
          <circle cx="106" cy={CY} r="3" fill={c.accent} />
          <circle cx="192" cy={CY} r="3" fill={c.accent} />

          {/* ── U → bullish breakout ── */}
          <g strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* tight U bowl */}
            <path d="M210 28 L210 52 C210 59 215 62 221 62 C227 62 232 59 232 52"
              stroke={c.letter} strokeWidth="8" />
            {/* one clean accelerating curve out of the bowl — bullish growth, no tangle */}
            <motion.path d="M232 52 Q250 34 264 20"
              stroke={c.accent} strokeWidth="7"
              filter={variant === 'void' ? `url(#glow-${uid})` : undefined}
              animate={{ opacity: hovered ? 1 : 0.92 }} />
            {/* arrowhead, lifts on hover */}
            <motion.path d="M255 21 L264 20 L263 30" stroke={c.accent} strokeWidth="6"
              animate={hovered ? { x: 3, y: -3, opacity: 1 } : { x: 0, y: 0, opacity: 0.92 }}
              transition={eyeSpring} />
          </g>

          {/* press ripple */}
          {!reduced && pressed > 0 && (
            <motion.circle key={pressed} cx={CX} cy={CY} stroke={c.accent} strokeWidth="1.5" fill="none"
              initial={{ r: 16, opacity: 0.7 }} animate={{ r: 70, opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }} />
          )}
        </svg>
      </motion.span>
    </motion.span>
  )
}

/* Full lockup — mark + the odyssey-vector tagline. For hero / brand moments. */
export function YouLockup({ variant = 'void', height = 64, className }:
  { variant?: Variant; height?: number; className?: string }) {
  const c = PALETTE[variant]
  return (
    <div className={className} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <YouLogo variant={variant} height={height} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, letterSpacing: '0.42em', textTransform: 'uppercase', color: c.letter, paddingLeft: '0.42em' }}>
          Your Odyssey Vector
        </span>
        <span style={{ fontFamily: 'var(--font-grotesk), sans-serif', fontStyle: 'italic', fontSize: 13, color: c.accent }}>
          the YOU beyond resume
        </span>
      </div>
    </div>
  )
}
