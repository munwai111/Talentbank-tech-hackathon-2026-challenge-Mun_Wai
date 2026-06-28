'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, useInView, animate, type Variants } from 'motion/react'
import {
  Vault, Fingerprint, Waypoints, Crosshair, BrainCircuit, FolderOpen,
  ArrowRight, Check,
} from 'lucide-react'
import { CareerTrajectory } from './CareerTrajectory'
import { YouLogo } from '@/components/brand/YouLogo'

/* ── Motion primitives ─────────────────────────────────────────────────────── */
const EASE = [0.23, 1, 0.32, 1] as const

function Reveal({
  children, className, y = 24, delay = 0, as = 'div',
}: { children: React.ReactNode; className?: string; y?: number; delay?: number; as?: 'div' | 'section' }) {
  const reduced = useReducedMotion()
  const MotionTag = as === 'section' ? motion.section : motion.div
  return (
    <MotionTag
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  )
}

const STAGGER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const ITEM: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

/* Animated count-up for the stats bar — data feel, respects reduced-motion. */
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduced = useReducedMotion()
  const [val, setVal] = useState(reduced ? to : 0)

  useEffect(() => {
    if (!inView || reduced) { setVal(to); return }
    const controls = animate(0, to, {
      duration: 1.1, ease: EASE,
      onUpdate: v => setVal(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, to, reduced])

  return <span ref={ref}>{val}{suffix && <span>{suffix}</span>}</span>
}

/* ── Content ───────────────────────────────────────────────────────────────── */
const MODULES = [
  { Icon: Vault,        name: 'Skills Vault',     tag: 'Evidence-based',     desc: 'Add skills with evidence. Import from GitHub — AI reads your repos and extracts your real stack. Upload your CV and it structures itself in seconds.' },
  { Icon: Fingerprint,  name: 'Career Identity',  tag: 'AI-generated',       desc: 'Goals, values, work style, and life context — synthesised into a professional narrative that tells employers who you are, not just what you did.' },
  { Icon: Waypoints,    name: 'Path Navigator',   tag: 'Live routing',       desc: 'Three plotted routes from your current skills: a strong match today, an emerging path in 6–18 months, a stretch goal worth working toward. MYR salaries. Real trade-offs named.' },
  { Icon: Crosshair,    name: 'Job Matches',      tag: 'Transparent scoring',desc: 'Every open role ranked by skill overlap and goal alignment. Matched skills, gaps, and the why behind every score — nothing is a black box.' },
  { Icon: BrainCircuit, name: 'AI Coach',         tag: 'Persistent memory',  desc: 'Streaming career advice from an AI that knows your profile and the APAC market. Real MYR salary bands. Honest about what you are missing. Remembers you across sessions.' },
  { Icon: FolderOpen,   name: 'Living Portfolio', tag: 'Builder-first',      desc: 'Showcase what you have built, not just what you know. Projects with tech stack, impact, and AI summaries that make your work legible to any employer.' },
]

const HOW = [
  { step: '01', title: 'Vault your skills',  desc: 'Import from GitHub, upload your CV, or add manually. AI extracts and verifies what you actually know.' },
  { step: '02', title: 'Build your identity', desc: 'Answer guided questions about your goals and values. AI writes your professional narrative from your answers.' },
  { step: '03', title: 'See your routes',     desc: 'Three realistic career directions plotted from where you actually stand. MYR salaries. No vague "potential."' },
  { step: '04', title: 'Match and apply',     desc: 'Every open role ranked by how well your skills and goals actually fit — with the gaps named clearly so you know what to build next.' },
]

const TICKER = [
  ['Skills Vault', 'GitHub import live'], ['Career Identity', 'AI-generated narrative'],
  ['Path Navigator', '3 routes plotted'], ['Job Matches', 'Skill-ranked daily'],
  ['AI Coach', 'Remembers you'], ['Living Portfolio', 'Show what you built'],
  ['Fair Pay Engine', 'MYR salary bands'], ['Smart Matching', 'Goal + skill aligned'],
]

const CANDIDATE_FEATURES = [
  'GitHub + CV import in seconds', 'AI career narrative, written for you',
  'Three realistic routes with MYR salaries', 'Coach that remembers you across sessions',
  'Portfolio that shows what you actually built',
]
const EMPLOYER_FEATURES = [
  'Post roles by required vs. nice-to-have skills', 'Candidates ranked by genuine fit score',
  'Matched and missing skills visible instantly', 'AI-generated employer brand from your culture',
  'Full application pipeline in one view',
]

const TYPEWRITER_WORDS = ['YOU', 'SKILLS', 'STORY', 'FUTURE', 'POTENTIAL']

export function LandingPage({ openRoles = 0 }: { openRoles?: number }) {
  const typeRef = useRef<HTMLSpanElement>(null)

  // Typewriter (its own concern — kept lightweight)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let wordIdx = 0, charIdx = 0, deleting = false, timer: number
    const el = typeRef.current
    const tick = () => {
      if (!el) return
      const word = TYPEWRITER_WORDS[wordIdx]
      if (!deleting) {
        el.textContent = word.slice(0, charIdx + 1); charIdx++
        if (charIdx === word.length) { deleting = true; timer = window.setTimeout(tick, 2200); return }
      } else {
        el.textContent = word.slice(0, charIdx - 1); charIdx--
        if (charIdx === 0) { deleting = false; wordIdx = (wordIdx + 1) % TYPEWRITER_WORDS.length }
      }
      timer = window.setTimeout(tick, deleting ? 60 : 100)
    }
    timer = window.setTimeout(tick, 700)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="cos-landing">

      {/* ── NAV ── */}
      <nav className="cos-nav">
        <Link href="/" aria-label="Y.O.U home" style={{ lineHeight: 0 }}><YouLogo height={30} /></Link>
        <ul className="cos-nav-links">
          <li className="nav-hide-mobile"><a href="#modules">Modules</a></li>
          <li className="nav-hide-mobile"><a href="#how">How it works</a></li>
          <li className="nav-hide-mobile"><a href="#employers">For employers</a></li>
          <li className="nav-hide-mobile"><Link href="/sign-in">Sign in</Link></li>
          <li><Link href="/sign-up" className="cos-nav-cta">Get started free →</Link></li>
        </ul>
      </nav>

      {/* ── HERO ── */}
      <section className="cos-hero">
        <div className="cos-hero-glow" />
        <div className="cos-hero-glow-2" />
        <div className="cos-hero-inner">
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}>
            <div className="cos-eyebrow">Skills-first career navigation · Malaysia &amp; Singapore</div>
            <h1 className="cos-headline">
              <span className="line-1">the<span ref={typeRef}>YOU</span><span className="cos-typewriter-cursor" /></span>
              <span className="line-2">beyond</span>
              <span className="line-accent">resume.</span>
            </h1>
            <p className="cos-hero-sub">
              Y.O.U reads your <strong>real skills</strong> — from GitHub, your CV, your work history — and plots the routes only you could take. Salaries in MYR. <strong>No keyword games.</strong> No gatekeeping.
            </p>
            <div className="cos-hero-actions">
              <Link href="/sign-up" className="cos-btn-primary">Plot my route <ArrowRight size={16} strokeWidth={2.2} /></Link>
              <Link href="/sign-up" className="cos-btn-secondary">I&apos;m hiring talent</Link>
            </div>
            <div className="cos-hero-meta">
              <span>{openRoles > 0 ? `${openRoles} open roles live` : 'Open roles live'}</span>
              <span className="dot">/</span><span>Skill + goal matching</span>
              <span className="dot">/</span><span>MYR salary intelligence</span>
              <span className="dot">/</span><span>Free to start</span>
            </div>
          </motion.div>

          {/* DATA-VIZ */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}>
            <CareerTrajectory />
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <Reveal className="cos-stats-bar">
        <div className="cos-stat-item">
          <div className="cos-stat-number"><CountUp to={6} suffix="+" /></div>
          <div className="cos-stat-label">AI-powered modules</div>
        </div>
        <div className="cos-stat-item">
          <div className="cos-stat-number"><CountUp to={12} /></div>
          <div className="cos-stat-label">APAC languages supported</div>
        </div>
        <div className="cos-stat-item">
          <div className="cos-stat-number">MYR</div>
          <div className="cos-stat-label">Real salary intelligence</div>
        </div>
        <div className="cos-stat-item">
          <div className="cos-stat-number"><CountUp to={0} /></div>
          <div className="cos-stat-label">CV required to start</div>
        </div>
      </Reveal>

      {/* ── TICKER ── */}
      <div className="cos-ticker-wrap">
        <div className="cos-ticker">
          {[...TICKER, ...TICKER].map(([head, tail], i) => (
            <span className="cos-ticker-item" key={i}><b>{head}</b> <span className="cos-ticker-sep">·</span> {tail}</span>
          ))}
        </div>
      </div>

      {/* ── MODULES ── */}
      <section id="modules" className="cos-section cos-modules">
        <Reveal className="cos-modules-header">
          <div>
            <div className="cos-section-eyebrow">The system</div>
            <h2 className="cos-section-title">Six instruments.<br />One journey.</h2>
          </div>
          <p className="cos-section-sub">Each module feeds the next. Your skills shape your paths, your paths shape your coaching, your goals shape your matches.</p>
        </Reveal>

        <motion.div className="cos-modules-grid"
          variants={STAGGER} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          {MODULES.map((m, i) => (
            <motion.div className="cos-module-card" key={m.name} variants={ITEM}
              whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
              <div className="cos-module-num">{String(i + 1).padStart(2, '0')}</div>
              <span className="cos-module-icon"><m.Icon size={20} strokeWidth={1.6} /></span>
              <div className="cos-module-name">{m.name}</div>
              <div className="cos-module-desc">{m.desc}</div>
              <span className="cos-module-tag">{m.tag}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="cos-section">
        <Reveal>
          <div className="cos-section-eyebrow">How it works</div>
          <h2 className="cos-section-title">From blank profile<br />to plotted route.</h2>
          <p className="cos-section-sub">Your first three career routes are ready in under five minutes. No CV required to start.</p>
        </Reveal>
        <motion.div className="cos-how-grid"
          variants={STAGGER} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          {HOW.map((h, i) => (
            <motion.div className="cos-how-card" key={h.step} variants={ITEM}
              whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
              <div className="cos-how-step">{h.step}</div>
              <div className="cos-how-title">{h.title}</div>
              <div className="cos-how-desc">{h.desc}</div>
              {i < HOW.length - 1 && <div className="cos-how-connector" />}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── MANIFESTO ── */}
      <section className="cos-manifesto">
        <Reveal as="div">
          <p className="cos-manifesto-quote">
            Hiring in Asia is broken because it filters on <em>credentials</em> and keywords. Y.O.U filters on <em>demonstrated capability</em> and trajectory.
          </p>
          <p className="cos-manifesto-sub">Built for the next million graduates across Asia — the ones the system keeps overlooking.</p>
        </Reveal>
      </section>

      {/* ── DUAL SIDES ── */}
      <Reveal className="cos-dual">
        <div id="employers" className="cos-dual-card cos-dual-nav">
          <div className="cos-dual-label cos-dual-label-nav">// CANDIDATE JOURNEY</div>
          <div className="cos-dual-title">I&apos;m building<br />my career.</div>
          <div className="cos-dual-desc">Vault your skills with evidence, see three plotted routes forward, and get coached by an AI that knows your profile and the KL market — including whether you&apos;re paid what you&apos;re worth.</div>
          <ul className="cos-dual-features">
            {CANDIDATE_FEATURES.map(f => <li key={f}><Check size={14} strokeWidth={2.5} /> {f}</li>)}
          </ul>
          <Link href="/sign-up" className="cos-btn-primary">Start navigating <ArrowRight size={16} strokeWidth={2.2} /></Link>
        </div>
        <div className="cos-dual-card cos-dual-scout">
          <div className="cos-dual-label cos-dual-label-scout">// EMPLOYER JOURNEY</div>
          <div className="cos-dual-title">I&apos;m hiring<br />real talent.</div>
          <div className="cos-dual-desc">Post skills-first roles and watch candidates rank by proven ability and goal alignment — matched skills, gaps, and trajectory visible on every profile. No CV keyword roulette.</div>
          <ul className="cos-dual-features cos-dual-features-scout">
            {EMPLOYER_FEATURES.map(f => <li key={f}><Check size={14} strokeWidth={2.5} /> {f}</li>)}
          </ul>
          <Link href="/sign-up" className="cos-btn-secondary">Start scouting <ArrowRight size={16} strokeWidth={2.2} /></Link>
        </div>
      </Reveal>

      {/* ── CTA ── */}
      <section className="cos-section">
        <Reveal className="cos-cta">
          <h2 className="cos-cta-title">Stop guessing.<br /><span>Start navigating.</span></h2>
          <p className="cos-cta-sub">Free to use. No CV required to start. Your first three career routes are plotted in under five minutes.</p>
          <div className="cos-cta-actions">
            <Link href="/sign-up" className="cos-btn-primary">Get started free <ArrowRight size={16} strokeWidth={2.2} /></Link>
            <Link href="/sign-in" className="cos-btn-secondary">Sign in</Link>
          </div>
          <p className="cos-cta-note">Built for Malaysia &amp; Singapore · APAC market intelligence · 12 languages</p>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="cos-footer">
        <YouLogo height={26} interactive={false} />
        <p className="cos-footer-copy">Built solo for the Talentbank Tech Hackathon 2026 · Skills-first hiring for APAC</p>
        <ul className="cos-footer-links">
          <li><a href="https://github.com/munwai111/Talentbank-tech-hackathon-2026-challenge-Mun_Wai" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><Link href="/sign-up">Get started</Link></li>
        </ul>
      </footer>
    </div>
  )
}
