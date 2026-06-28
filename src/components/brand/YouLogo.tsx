'use client'

// Y.O.U — Your Odyssey Vector
// ─────────────────────────────────────────────────────────────────────────────
// Aesthetic: "Orbital Brutalism". The O is the still centre (YOU); a satellite
// orbits it (your odyssey); the U launches a vector (your trajectory).
// Hand-built geometric letterforms — resolution- and font-independent, the way
// a real logomark is drawn. Interactive: orbit + hub pulse idle, glow + vector
// extension on hover, ripple on press. Fully reduced-motion aware.

import { useId, useState } from 'react'
import { motion, useReducedMotion, type Transition } from 'motion/react'

type Variant = 'void' | 'chartreuse' | 'light' | 'adaptive'

const PALETTE: Record<Variant, { letter: string; hub: string; accent: string; orbit: string }> = {
  void:       { letter: '#F0F0F0',       hub: '#E8FF47', accent: '#E8FF47', orbit: 'rgba(240,240,240,0.16)' },
  chartreuse: { letter: '#0A0A0F',       hub: '#0A0A0F', accent: '#7B61FF', orbit: 'rgba(10,10,15,0.28)' },
  light:      { letter: '#7B61FF',       hub: '#7B61FF', accent: '#7B61FF', orbit: 'rgba(123,97,255,0.22)' },
  // For themeable app surfaces: letters follow text colour; violet accent
  // (the brand's "Variant 3" tone) stays legible on both light and dark.
  adaptive:   { letter: 'currentColor',  hub: '#7B61FF', accent: '#7B61FF', orbit: 'rgba(123,97,255,0.30)' },
}

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
  const [pressed, setPressed] = useState(0)

  const VB_W = 300, VB_H = 96
  const cx = 150, cy = 46
  const orbitR = 33

  const spin: Transition = { duration: 16, repeat: Infinity, ease: 'linear' }
  const pulse: Transition = { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }

  return (
    <motion.span
      className={className}
      style={{ display: 'inline-flex', lineHeight: 0, cursor: interactive ? 'pointer' : 'default' }}
      whileHover={interactive ? 'hover' : undefined}
      initial="idle"
      animate="idle"
      whileTap={interactive ? { scale: 0.97 } : undefined}
      onTapStart={() => interactive && setPressed(p => p + 1)}
      aria-label={ariaLabel}
      role="img"
    >
      <svg width={(height * VB_W) / VB_H} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}
        fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
        <defs>
          <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* static faint orbit ring */}
        <circle cx={cx} cy={cy} r={orbitR} stroke={c.orbit} strokeWidth="1.25" />

        {/* orbiting satellite (revolves around the hub) */}
        <motion.g
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
          animate={reduced ? undefined : { rotate: 360 }}
          transition={reduced ? undefined : spin}
          variants={{ hover: { transition: { duration: 7, repeat: Infinity, ease: 'linear' } } }}
        >
          <circle cx={cx} cy={cy - orbitR} r="3.6" fill={c.accent} filter={`url(#glow-${uid})`} />
        </motion.g>

        {/* O hub — the still centre; soft pulse */}
        <motion.circle cx={cx} cy={cy} r="15" stroke={c.hub} strokeWidth="6"
          filter={variant === 'void' ? `url(#glow-${uid})` : undefined}
          animate={reduced ? undefined : { scale: [1, 1.06, 1], opacity: [0.92, 1, 0.92] }}
          transition={reduced ? undefined : pulse}
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
          variants={{ hover: { scale: 1.12, opacity: 1 } }} />

        {/* Y */}
        <g stroke={c.letter} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M58 28 L70 46" />
          <path d="M82 28 L70 46" />
          <path d="M70 46 L70 66" />
        </g>

        {/* mid dots */}
        <circle cx="103" cy={cy} r="3" fill={c.accent} />
        <circle cx="197" cy={cy} r="3" fill={c.accent} />

        {/* U + vector (the hybrid V / trajectory) */}
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M214 28 L214 56 C214 64 220 68 228 68 C236 68 242 64 242 56"
            stroke={c.letter} strokeWidth="8" fill="none" />
          {/* the vector launches up-right out of the U */}
          <motion.path d="M242 56 L262 24"
            stroke={c.accent} strokeWidth="8" fill="none"
            filter={variant === 'void' ? `url(#glow-${uid})` : undefined}
            variants={{ idle: { pathLength: 1, opacity: 0.92 }, hover: { pathLength: 1, opacity: 1 } }} />
          <motion.path d="M254 25 L262 24 L261 33"
            stroke={c.accent} strokeWidth="6" fill="none"
            variants={{ idle: { opacity: 0.92, x: 0, y: 0 }, hover: { opacity: 1, x: 3, y: -3 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 16 }} />
        </g>

        {/* press ripple */}
        {!reduced && pressed > 0 && (
          <motion.circle key={pressed} cx={cx} cy={cy} stroke={c.accent} strokeWidth="1.5" fill="none"
            initial={{ r: 16, opacity: 0.7 }} animate={{ r: 64, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }} />
        )}
      </svg>
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
