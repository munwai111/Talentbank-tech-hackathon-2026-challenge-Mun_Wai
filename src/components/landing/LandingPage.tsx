'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Vault, Fingerprint, Waypoints, Crosshair, BrainCircuit, FolderOpen,
  ArrowRight, Check,
} from 'lucide-react'

/* ── Modules (Lucide icons, not emoji — matches the app's de-slop standard) ── */
const MODULES = [
  { Icon: Vault,        name: 'Skills Vault',     tag: 'Evidence-based',     desc: 'Add skills with evidence. Import from GitHub — AI reads your repos and extracts your real stack. Upload your CV and it structures itself in seconds.' },
  { Icon: Fingerprint,  name: 'Career Identity',  tag: 'AI-generated',       desc: 'Goals, values, work style, and life context — synthesised into a professional narrative that tells employers who you are, not just what you did.' },
  { Icon: Waypoints,    name: 'Path Navigator',   tag: 'Live routing',       desc: 'Three plotted routes from your current skills: a strong match today, an emerging path in 6–18 months, a stretch goal worth working toward. MYR salaries. Real trade-offs named.' },
  { Icon: Crosshair,    name: 'Job Matches',      tag: 'Transparent scoring',desc: 'Every open role ranked by skill overlap and goal alignment. Matched skills, gaps, and the why behind every score — nothing is a black box.' },
  { Icon: BrainCircuit, name: 'AI Coach',         tag: 'Persistent memory',  desc: 'Streaming career advice from an AI that knows your profile and the APAC market. Real MYR salary bands. Honest about what you are missing. Remembers you across sessions.' },
  { Icon: FolderOpen,   name: 'Living Portfolio', tag: 'Builder-first',      desc: 'Showcase what you have built, not just what you know. Projects with tech stack, impact, and AI summaries that make your work legible to any employer.' },
]

const ROUTES = [
  { badge: 'NOW',     badgeClass: 'badge-now',     title: 'UX Research Lead',          salary: 'RM 8,000 – 12,000 / mo', width: 82, color: 'var(--cos-green)' },
  { badge: '6–18 MO', badgeClass: 'badge-6mo',     title: 'Talent Analytics Manager',  salary: 'RM 9,000 – 14,000 / mo', width: 60, color: 'var(--cos-violet)' },
  { badge: 'STRETCH', badgeClass: 'badge-stretch', title: 'Head of People & Culture',  salary: 'RM 14,000 – 22,000 / mo', width: 35, color: 'var(--cos-chartreuse)' },
]

const HOW = [
  { step: '01', title: 'Vault your skills',  desc: 'Import from GitHub, upload your CV, or add manually. AI extracts and verifies what you actually know.' },
  { step: '02', title: 'Build your identity', desc: 'Answer guided questions about your goals and values. AI writes your professional narrative from your answers.' },
  { step: '03', title: 'See your routes',     desc: 'Three realistic career directions plotted from where you actually stand. MYR salaries. No vague "potential."' },
  { step: '04', title: 'Match and apply',     desc: 'Every open role ranked by how well your skills and goals actually fit — with the gaps named clearly so you know what to build next.' },
]

const TICKER = [
  ['Skills Vault', 'GitHub import live'],
  ['Career Identity', 'AI-generated narrative'],
  ['Path Navigator', '3 routes plotted'],
  ['Job Matches', 'Skill-ranked daily'],
  ['AI Coach', 'Remembers you'],
  ['Living Portfolio', 'Show what you built'],
  ['Fair Pay Engine', 'MYR salary bands'],
  ['Smart Matching', 'Goal + skill aligned'],
]

const CANDIDATE_FEATURES = [
  'GitHub + CV import in seconds',
  'AI career narrative, written for you',
  'Three realistic routes with MYR salaries',
  'Coach that remembers you across sessions',
  'Portfolio that shows what you actually built',
]

const EMPLOYER_FEATURES = [
  'Post roles by required vs. nice-to-have skills',
  'Candidates ranked by genuine fit score',
  'Matched and missing skills visible instantly',
  'AI-generated employer brand from your culture',
  'Full application pipeline in one view',
]

const TYPEWRITER_WORDS = ['YOU', 'SKILLS', 'STORY', 'FUTURE', 'POTENTIAL']

export function LandingPage({ openRoles = 0 }: { openRoles?: number }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const typeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── Scroll reveal ──
    const revealEls = root.querySelectorAll<HTMLElement>('.cos-reveal')
    if (prefersReduced) {
      revealEls.forEach(el => el.classList.add('is-visible'))
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            observer.unobserve(e.target)
          }
        })
      }, { threshold: 0.12 })
      revealEls.forEach(el => observer.observe(el))

      // ── Route bars fill ──
      const barTimer = window.setTimeout(() => {
        root.querySelectorAll<HTMLElement>('.cos-route-fill').forEach(bar => {
          bar.style.width = bar.dataset.width || '0%'
        })
      }, 500)

      // ── Typewriter ──
      let wordIdx = 0, charIdx = 0, deleting = false
      let typeTimer: number
      const el = typeRef.current
      const tick = () => {
        if (!el) return
        const word = TYPEWRITER_WORDS[wordIdx]
        if (!deleting) {
          el.textContent = word.slice(0, charIdx + 1)
          charIdx++
          if (charIdx === word.length) {
            deleting = true
            typeTimer = window.setTimeout(tick, 2200)
            return
          }
        } else {
          el.textContent = word.slice(0, charIdx - 1)
          charIdx--
          if (charIdx === 0) {
            deleting = false
            wordIdx = (wordIdx + 1) % TYPEWRITER_WORDS.length
          }
        }
        typeTimer = window.setTimeout(tick, deleting ? 60 : 100)
      }
      typeTimer = window.setTimeout(tick, 700)

      return () => {
        observer.disconnect()
        window.clearTimeout(barTimer)
        window.clearTimeout(typeTimer)
      }
    }
  }, [])

  return (
    <div className="cos-landing" ref={rootRef}>

      {/* ── NAV ── */}
      <nav className="cos-nav">
        <div className="cos-nav-logo">
          <span className="cos-logo-dot" />
          Career OS
        </div>
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
          <div>
            <div className="cos-eyebrow">Skills-first career navigation · Malaysia &amp; Singapore</div>

            <h1 className="cos-headline">
              <span className="line-1">the<span ref={typeRef}>YOU</span><span className="cos-typewriter-cursor" /></span>
              <span className="line-2">beyond</span>
              <span className="line-accent">resume.</span>
            </h1>

            <p className="cos-hero-sub">
              Career OS reads your <strong>real skills</strong> — from GitHub, your CV, your work history — and plots realistic routes forward. Salaries in MYR. <strong>No keyword games.</strong> No gatekeeping.
            </p>

            <div className="cos-hero-actions">
              <Link href="/sign-up" className="cos-btn-primary">Plot my route <ArrowRight size={16} strokeWidth={2.2} /></Link>
              <Link href="/sign-up" className="cos-btn-secondary">I&apos;m hiring talent</Link>
            </div>

            <div className="cos-hero-meta">
              <span>{openRoles > 0 ? `${openRoles} open roles live` : 'Open roles live'}</span>
              <span className="dot">/</span>
              <span>Skill + goal matching</span>
              <span className="dot">/</span>
              <span>MYR salary intelligence</span>
              <span className="dot">/</span>
              <span>Free to start</span>
            </div>
          </div>

          {/* LIVE ROUTE CARD */}
          <div className="cos-live-card cos-reveal">
            <div className="cos-live-indicator">
              <span className="cos-live-dot" />
              PATH NAVIGATOR · LIVE OUTPUT
            </div>
            <div className="cos-route-header">Your routes from 26 skills · Kuala Lumpur</div>
            {ROUTES.map(r => (
              <div className="cos-route-item" key={r.title}>
                <span className={`cos-route-badge ${r.badgeClass}`}>{r.badge}</span>
                <div className="cos-route-info">
                  <div className="cos-route-title">{r.title}</div>
                  <div className="cos-route-salary">{r.salary}</div>
                  <div className="cos-route-bar">
                    <div className="cos-route-fill" data-width={`${r.width}%`} style={{ background: r.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="cos-stats-bar cos-reveal">
        <div className="cos-stat-item">
          <div className="cos-stat-number">6<span>+</span></div>
          <div className="cos-stat-label">AI-powered modules</div>
        </div>
        <div className="cos-stat-item">
          <div className="cos-stat-number">12</div>
          <div className="cos-stat-label">APAC languages supported</div>
        </div>
        <div className="cos-stat-item">
          <div className="cos-stat-number">MYR</div>
          <div className="cos-stat-label">Real salary intelligence</div>
        </div>
        <div className="cos-stat-item">
          <div className="cos-stat-number">0</div>
          <div className="cos-stat-label">CV required to start</div>
        </div>
      </div>

      {/* ── SKILLS TICKER ── */}
      <div className="cos-ticker-wrap">
        <div className="cos-ticker">
          {[...TICKER, ...TICKER].map(([head, tail], i) => (
            <span className="cos-ticker-item" key={i}>
              <b>{head}</b> <span className="cos-ticker-sep">·</span> {tail}
            </span>
          ))}
        </div>
      </div>

      {/* ── MODULES ── */}
      <section id="modules" className="cos-section cos-modules">
        <div className="cos-modules-header">
          <div>
            <div className="cos-section-eyebrow">The system</div>
            <h2 className="cos-section-title">Six instruments.<br />One journey.</h2>
          </div>
          <p className="cos-section-sub">Each module feeds the next. Your skills shape your paths, your paths shape your coaching, your goals shape your matches.</p>
        </div>

        <div className="cos-modules-grid cos-reveal">
          {MODULES.map((m, i) => (
            <div className="cos-module-card" key={m.name}>
              <div className="cos-module-num">{String(i + 1).padStart(2, '0')}</div>
              <span className="cos-module-icon"><m.Icon size={20} strokeWidth={1.6} /></span>
              <div className="cos-module-name">{m.name}</div>
              <div className="cos-module-desc">{m.desc}</div>
              <span className="cos-module-tag">{m.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="cos-section">
        <div className="cos-section-eyebrow">How it works</div>
        <h2 className="cos-section-title">From blank profile<br />to plotted route.</h2>
        <p className="cos-section-sub">Your first three career routes are ready in under five minutes. No CV required to start.</p>

        <div className="cos-how-grid">
          {HOW.map((h, i) => (
            <div className={`cos-how-card cos-reveal d${i + 1}`} key={h.step}>
              <div className="cos-how-step">{h.step}</div>
              <div className="cos-how-title">{h.title}</div>
              <div className="cos-how-desc">{h.desc}</div>
              {i < HOW.length - 1 && <div className="cos-how-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <section className="cos-manifesto">
        <p className="cos-manifesto-quote cos-reveal">
          Hiring in Asia is broken because it filters on <em>credentials</em> and keywords. Career OS filters on <em>demonstrated capability</em> and trajectory.
        </p>
        <p className="cos-manifesto-sub cos-reveal">Built for the next million graduates across Asia — the ones the system keeps overlooking.</p>
      </section>

      {/* ── DUAL SIDES ── */}
      <div id="employers" className="cos-dual cos-reveal">
        <div className="cos-dual-card cos-dual-nav">
          <div className="cos-dual-label cos-dual-label-nav">// CANDIDATE JOURNEY</div>
          <div className="cos-dual-title">I&apos;m building<br />my career.</div>
          <div className="cos-dual-desc">Vault your skills with evidence, see three plotted routes forward, and get coached by an AI that knows your profile and the KL market — including whether you&apos;re paid what you&apos;re worth.</div>
          <ul className="cos-dual-features">
            {CANDIDATE_FEATURES.map(f => (
              <li key={f}><Check size={14} strokeWidth={2.5} /> {f}</li>
            ))}
          </ul>
          <Link href="/sign-up" className="cos-btn-primary">Start navigating <ArrowRight size={16} strokeWidth={2.2} /></Link>
        </div>

        <div className="cos-dual-card cos-dual-scout">
          <div className="cos-dual-label cos-dual-label-scout">// EMPLOYER JOURNEY</div>
          <div className="cos-dual-title">I&apos;m hiring<br />real talent.</div>
          <div className="cos-dual-desc">Post skills-first roles and watch candidates rank by proven ability and goal alignment — matched skills, gaps, and trajectory visible on every profile. No CV keyword roulette.</div>
          <ul className="cos-dual-features cos-dual-features-scout">
            {EMPLOYER_FEATURES.map(f => (
              <li key={f}><Check size={14} strokeWidth={2.5} /> {f}</li>
            ))}
          </ul>
          <Link href="/sign-up" className="cos-btn-secondary">Start scouting <ArrowRight size={16} strokeWidth={2.2} /></Link>
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="cos-section">
        <div className="cos-cta cos-reveal">
          <h2 className="cos-cta-title">Stop guessing.<br /><span>Start navigating.</span></h2>
          <p className="cos-cta-sub">Free to use. No CV required to start. Your first three career routes are plotted in under five minutes.</p>
          <div className="cos-cta-actions">
            <Link href="/sign-up" className="cos-btn-primary">Get started free <ArrowRight size={16} strokeWidth={2.2} /></Link>
            <Link href="/sign-in" className="cos-btn-secondary">Sign in</Link>
          </div>
          <p className="cos-cta-note">Built for Malaysia &amp; Singapore · APAC market intelligence · 12 languages</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="cos-footer">
        <div className="cos-footer-logo">
          <span className="cos-logo-dot" />
          Career OS
        </div>
        <p className="cos-footer-copy">Built solo for the Talentbank Tech Hackathon 2026 · Skills-first hiring for APAC</p>
        <ul className="cos-footer-links">
          <li><a href="https://github.com/munwai111/Talentbank-tech-hackathon-2026-challenge-Mun_Wai" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><Link href="/sign-up">Get started</Link></li>
        </ul>
      </footer>
    </div>
  )
}
