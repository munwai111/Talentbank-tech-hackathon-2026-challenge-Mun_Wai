'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimatedHeading } from '@/components/animations/AnimatedHeading'
import { StaggerContainer } from '@/components/animations/StaggerContainer'
import { FadeUp } from '@/components/animations/FadeUp'
import { MagneticButton } from '@/components/animations/MagneticButton'
import {
  Vault, Fingerprint, Waypoints, Crosshair, BrainCircuit, FolderOpen,
  ArrowRight, Compass, Radar,
} from 'lucide-react'

/* ── Brand mark — a waypoint, not a letter in a box ─────────────────────── */
function Brandmark({ size = 30 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full border border-indigo-400/40"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="absolute inset-[26%] rounded-full bg-indigo-400" />
      <span className="absolute inset-0 rounded-full border border-indigo-400/15 scale-[1.45]" />
    </span>
  )
}

/* ── Hero route — the product's core output, drawn as the hero graphic ──── */
function HeroRoute() {
  return (
    <svg
      viewBox="0 0 460 380"
      className="w-full h-auto select-none"
      role="img"
      aria-label="A career route from where you are today through a strong match and an emerging path to a stretch goal"
    >
      {/* soft glow under the route */}
      <defs>
        <radialGradient id="route-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="460" height="380" fill="url(#route-glow)" />

      {/* the plotted route */}
      <path
        d="M52 330 C 130 300 112 232 188 204 C 262 177 246 124 322 96 C 362 81 396 64 420 44"
        fill="none"
        stroke="#818cf8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="1 7"
        className="animate-route-draw"
        style={{ ['--route-len' as string]: '620' }}
      />

      {/* waypoint: you are here */}
      <g className="animate-waypoint" style={{ animationDelay: '0.4s' }}>
        <circle cx="52" cy="330" r="10" fill="#818cf8" fillOpacity="0.15" />
        <circle cx="52" cy="330" r="4.5" fill="#818cf8" />
      </g>
      <g className="animate-route-label" style={{ animationDelay: '0.55s' }}>
        <text x="72" y="326" fill="#a5b4fc" fontSize="12" fontWeight="600">You are here</text>
        <text x="72" y="342" fill="#64748b" fontSize="10.5">26 skills · Kuala Lumpur</text>
      </g>

      {/* waypoint: strong match */}
      <g className="animate-waypoint" style={{ animationDelay: '0.9s' }}>
        <circle cx="188" cy="204" r="9" fill="#34d399" fillOpacity="0.15" />
        <circle cx="188" cy="204" r="4" fill="#34d399" />
      </g>
      <g className="animate-route-label" style={{ animationDelay: '1.05s' }}>
        <text x="206" y="198" fill="#6ee7b7" fontSize="12" fontWeight="600">Strong match · today</text>
        <text x="206" y="214" fill="#64748b" fontSize="10.5">UX Research Lead · RM 8–12k/mo</text>
      </g>

      {/* waypoint: emerging path */}
      <g className="animate-waypoint" style={{ animationDelay: '1.4s' }}>
        <circle cx="322" cy="96" r="9" fill="#fbbf24" fillOpacity="0.15" />
        <circle cx="322" cy="96" r="4" fill="#fbbf24" />
      </g>
      <g className="animate-route-label" style={{ animationDelay: '1.55s' }}>
        <text x="206" y="76" fill="#fcd34d" fontSize="12" fontWeight="600">Emerging · 6–18 months</text>
        <text x="206" y="92" fill="#64748b" fontSize="10.5">Talent Analytics Manager · RM 9–14k/mo</text>
      </g>

      {/* waypoint: stretch goal */}
      <g className="animate-waypoint" style={{ animationDelay: '1.9s' }}>
        <circle cx="420" cy="44" r="8" fill="#a78bfa" fillOpacity="0.15" />
        <circle cx="420" cy="44" r="3.5" fill="#a78bfa" />
      </g>
      <g className="animate-route-label" style={{ animationDelay: '2.05s' }}>
        <text x="300" y="30" fill="#c4b5fd" fontSize="12" fontWeight="600">Stretch · 18–36 months</text>
      </g>
    </svg>
  )
}

export function LandingPage({ openRoles = 0 }: { openRoles?: number }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#070714] text-white overflow-hidden map-grid">

      {/* Single static glow anchored top-right — no drifting blobs */}
      <div
        className="fixed top-[-180px] right-[-120px] w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10), transparent 65%)' }}
        aria-hidden
      />

      {/* Nav */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full animate-fade-up">
        <div className="flex items-center gap-3">
          <Brandmark />
          <span className="font-bold text-lg tracking-tight">Career OS</span>
          <span className="section-label !text-indigo-400/70 ml-1 hidden sm:inline">APAC</span>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-white/10">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 border-0 text-white">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero: editorial left, plotted route right ─────────────────────── */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-6 pt-14 pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
        <div>
          <p className="section-label !text-indigo-400 mb-5 animate-fade-up">
            Skills-first career navigation · Malaysia &amp; Singapore
          </p>

          <AnimatedHeading
            as="h1"
            className="text-5xl md:text-[64px] font-bold tracking-tight leading-[1.04] mb-6"
            delay={0.15}
            stagger={0.06}
            scrollTrigger={false}
          >
            No one tells you what&apos;s next. This does.
          </AnimatedHeading>

          <p className="text-lg text-zinc-400 max-w-lg mb-9 leading-relaxed animate-fade-up animate-delay-3">
            Career OS reads your real skills — from GitHub, your CV, your work history —
            and plots the realistic routes forward: what you can reach today, in 18 months,
            and the stretch worth working toward. Salaries in MYR. No keyword games.
          </p>

          <div className="flex gap-4 flex-wrap items-center animate-fade-up animate-delay-4">
            <MagneticButton>
              <Link href="/sign-up">
                <Button size="lg" className="px-7 bg-indigo-600 hover:bg-indigo-500 border-0 text-white text-[15px] shadow-lg shadow-indigo-500/25">
                  Plot my route
                  <ArrowRight size={16} strokeWidth={2} />
                </Button>
              </Link>
            </MagneticButton>
            <Link href="/sign-up" className="text-sm text-zinc-400 hover:text-white transition-colors underline-offset-4 hover:underline">
              I&apos;m hiring talent
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-zinc-500 animate-fade-up animate-delay-5">
            <span>{openRoles > 0 ? `${openRoles} open roles live` : 'Open roles live'}</span>
            <span className="text-zinc-700">/</span>
            <span>Skill + goal matching</span>
            <span className="text-zinc-700">/</span>
            <span>MYR salary intelligence</span>
            <span className="text-zinc-700">/</span>
            <span>Free</span>
          </div>
        </div>

        <FadeUp className="hidden lg:block surface p-6 topo-corner" scrollTrigger={false} delay={0.3}>
          <p className="section-label mb-1">Path Navigator · live output</p>
          <HeroRoute />
        </FadeUp>
      </main>

      {/* ── The journey: six numbered waypoints ───────────────────────────── */}
      <section className="relative z-10 px-6 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-xl">
            <p className="section-label !text-indigo-400 mb-3 animate-fade-up">The system</p>
            <AnimatedHeading as="h2" className="text-3xl md:text-4xl font-bold mb-3">
              Six instruments. One journey.
            </AnimatedHeading>
            <p className="text-zinc-400 animate-fade-up animate-delay-2">
              Each module feeds the next — your skills shape your paths, your paths shape
              your coaching, your goals shape your matches.
            </p>
          </div>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/6 rounded-2xl overflow-hidden border border-white/6" stagger={0.07} y={20}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative bg-[#0a0a1a] p-7 hover:bg-[#0d0d20] transition-colors duration-200"
              >
                <div className="flex items-start justify-between mb-9">
                  <span className="font-display text-[13px] font-semibold text-zinc-600 group-hover:text-indigo-400 transition-colors duration-200 tracking-wider">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <f.Icon size={17} className="text-zinc-600 group-hover:text-zinc-300 transition-colors duration-200" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-white mb-2 text-[15px]">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                <span className="absolute left-0 top-0 h-px w-0 bg-indigo-400/60 group-hover:w-full transition-[width] duration-300 ease-snap" />
              </div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── The fork: two journeys, two identities ────────────────────────── */}
      <section className="relative z-10 px-6 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label !text-indigo-400 mb-3 animate-fade-up">Two sides, one marketplace</p>
            <AnimatedHeading as="h2" className="text-3xl md:text-4xl font-bold">
              The platform reshapes itself around you.
            </AnimatedHeading>
          </div>

          <StaggerContainer className="grid md:grid-cols-2 gap-5" stagger={0.12} y={24}>
            {/* Navigator door */}
            <Link href="/sign-up" className="group block surface p-8 hover:border-indigo-500/40 transition-colors duration-250 topo-corner">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-10 rounded-full border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center">
                  <Compass size={18} className="text-indigo-400" strokeWidth={1.75} />
                </span>
                <p className="section-label !text-indigo-400">The Navigator journey</p>
              </div>
              <h3 className="font-display text-2xl font-bold mb-3 text-white">I&apos;m building my career</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-7">
                Vault your skills with evidence, see three plotted routes forward,
                and get coached by an AI that knows your profile and the KL market —
                including whether you&apos;re paid what you&apos;re worth.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400">
                Start navigating
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200 ease-snap" />
              </span>
            </Link>

            {/* Scout door */}
            <Link href="/sign-up" className="group block surface p-8 hover:border-teal-500/40 transition-colors duration-250">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-10 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center">
                  <Radar size={18} className="text-teal-400" strokeWidth={1.75} />
                </span>
                <p className="section-label !text-teal-400">The Scout journey</p>
              </div>
              <h3 className="font-display text-2xl font-bold mb-3 text-white">I&apos;m hiring talent</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-7">
                Post skills-first roles and watch candidates rank by proven ability and
                goal alignment — matched skills, gaps, and trajectory visible on every
                profile. No CV keyword roulette.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-teal-400">
                Start scouting
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200 ease-snap" />
              </span>
            </Link>
          </StaggerContainer>
        </div>
      </section>

      {/* ── Footer CTA ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24 border-t border-white/5">
        <div className="relative max-w-2xl mx-auto text-center">
          <AnimatedHeading as="h2" className="text-4xl md:text-5xl font-bold mb-5">
            Stop guessing. Start navigating.
          </AnimatedHeading>
          <p className="text-zinc-400 mb-9 text-lg animate-fade-up animate-delay-2">
            Free to use. No CV required to start. Your first three career routes
            are plotted in under five minutes.
          </p>
          <MagneticButton strength={0.25}>
            <Link href="/sign-up">
              <Button size="lg" className="px-10 text-base bg-indigo-600 hover:bg-indigo-500 border-0 shadow-xl shadow-indigo-500/30 text-white">
                Get started free
                <ArrowRight size={16} strokeWidth={2} />
              </Button>
            </Link>
          </MagneticButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-6 flex items-center justify-center gap-3 text-xs text-zinc-600">
        <Brandmark size={16} />
        Career OS · Skills-first hiring for APAC · Talentbank Tech Hackathon 2026
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    Icon: Vault,
    title: 'Skills Vault',
    desc: 'Add skills with evidence. Import from GitHub — AI reads your repos and extracts your real stack. Upload your CV and it structures itself in seconds.',
  },
  {
    Icon: Fingerprint,
    title: 'Career Identity',
    desc: 'Goals, values, work style, and life context — synthesized into a professional narrative that tells employers who you are, not just what you did.',
  },
  {
    Icon: Waypoints,
    title: 'Path Navigator',
    desc: 'Three plotted routes from your current skills: a strong match today, an emerging path in 6–18 months, a stretch goal beyond. MYR salaries. Real trade-offs named.',
  },
  {
    Icon: Crosshair,
    title: 'Job Matches',
    desc: 'Every open role ranked by skill overlap and goal alignment. Matched skills, gaps, and the why behind every score — nothing is a black box.',
  },
  {
    Icon: BrainCircuit,
    title: 'AI Coach',
    desc: 'Streaming career advice from an AI that knows your profile and the APAC market. Real MYR salary bands. Honest about what you are missing.',
  },
  {
    Icon: FolderOpen,
    title: 'Living Portfolio',
    desc: 'Showcase what you have built, not just what you know — projects with tech stack, impact, and AI summaries that make your work legible.',
  },
]
