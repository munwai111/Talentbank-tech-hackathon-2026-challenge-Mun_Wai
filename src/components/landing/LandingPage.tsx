'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { gsap, useGSAP } from '@/lib/gsap-config'
import { AnimatedHeading } from '@/components/animations/AnimatedHeading'
import { StaggerContainer } from '@/components/animations/StaggerContainer'
import { MagneticButton } from '@/components/animations/MagneticButton'

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const subRef2 = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const trustRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // Nav slides down
    tl.fromTo(navRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })

    // Badge pops in with bounce
    tl.fromTo(badgeRef.current,
      { scale: 0.7, opacity: 0, y: 10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(2)' },
      '-=0.2'
    )

    // Subtext fades up
    tl.fromTo([subRef.current, subRef2.current],
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.65, stagger: 0.12 },
      '-=0.1'
    )

    // CTA buttons scale in
    tl.fromTo(ctaRef.current?.children ?? [],
      { opacity: 0, scale: 0.85, y: 15 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.6)' },
      '-=0.2'
    )

    // Trust strip slides up
    tl.fromTo(trustRef.current?.children ?? [],
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 },
      '-=0.15'
    )
  }, { scope: heroRef })

  return (
    <div className="flex flex-col min-h-screen bg-[#070714] text-white overflow-hidden">

      {/* Aurora background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30
          bg-[radial-gradient(circle,#7c3aed,transparent_70%)]"
          style={{ animation: 'aurora-1 18s ease-in-out infinite' }} />
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full opacity-25
          bg-[radial-gradient(circle,#4f46e5,transparent_70%)]"
          style={{ animation: 'aurora-2 22s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20
          bg-[radial-gradient(circle,#2563eb,transparent_70%)]"
          style={{ animation: 'aurora-3 26s ease-in-out infinite' }} />
        <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] rounded-full opacity-15
          bg-[radial-gradient(circle,#a855f7,transparent_70%)]"
          style={{ animation: 'aurora-4 20s ease-in-out infinite' }} />
        <div className="absolute bottom-1/3 -left-20 w-[350px] h-[350px] rounded-full opacity-15
          bg-[radial-gradient(circle,#0ea5e9,transparent_70%)]"
          style={{ animation: 'aurora-1 30s ease-in-out infinite reverse' }} />
      </div>

      {/* Nav */}
      <header ref={navRef} className="relative z-10 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full opacity-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600
            flex items-center justify-center text-sm font-bold shadow-lg shadow-violet-500/30">
            C
          </div>
          <span className="font-bold text-xl tracking-tight">Career OS</span>
          <Badge className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 ml-1">
            APAC
          </Badge>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-white/10">
              Sign in
            </Button>
          </Link>
          <MagneticButton>
            <Link href="/sign-up">
              <Button size="sm"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500
                  hover:to-indigo-500 border-0 shadow-lg shadow-indigo-500/30 text-white">
                Get started free
              </Button>
            </Link>
          </MagneticButton>
        </div>
      </header>

      {/* Hero */}
      <main ref={heroRef} className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 max-w-4xl mx-auto">
        <div ref={badgeRef} className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full
          border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm opacity-0">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Talentbank Tech Hackathon 2026
        </div>

        <AnimatedHeading
          as="h1"
          className="text-6xl font-bold tracking-tight leading-tight mb-5"
          delay={0.5}
          stagger={0.08}
          scrollTrigger={false}
        >
          Your career GPS — not a job board.
        </AnimatedHeading>

        <p ref={subRef} className="text-xl text-zinc-400 max-w-2xl mb-4 leading-relaxed opacity-0">
          Career OS shows you where your skills stand, where people like you
          typically go next, and exactly what to build to get there.
          No keyword games. No school-name filters.
        </p>

        <p ref={subRef2} className="text-sm text-zinc-500 mb-10 opacity-0">
          Designed for Malaysia &amp; Singapore — salary ranges in MYR, APAC market context.
        </p>

        <div ref={ctaRef} className="flex gap-4 flex-wrap justify-center">
          <MagneticButton>
            <Link href="/sign-up">
              <Button size="lg"
                className="px-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500
                  hover:to-indigo-500 border-0 shadow-xl shadow-indigo-500/30 text-white text-base">
                Start navigating your career →
              </Button>
            </Link>
          </MagneticButton>
          <MagneticButton>
            <Link href="/sign-up">
              <Button size="lg" variant="outline"
                className="px-8 border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm text-base">
                I&apos;m hiring talent
              </Button>
            </Link>
          </MagneticButton>
        </div>

        {/* Trust strip */}
        <div ref={trustRef} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
          {['Skills-first matching', 'MYR salary intelligence', 'AI career coaching', 'Free to start'].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-indigo-500" />
              {t}
            </span>
          ))}
        </div>
      </main>

      {/* Feature grid */}
      <section className="relative z-10 px-6 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <AnimatedHeading as="h2" className="text-3xl font-bold mb-3">
              Everything your career needs in one OS
            </AnimatedHeading>
            <p className="text-zinc-400 max-w-xl mx-auto animate-fade-up animate-delay-2">
              Six interconnected modules. Each one makes the next more powerful.
            </p>
          </div>

          <StaggerContainer className="grid md:grid-cols-3 gap-4" stagger={0.08} y={25}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`rounded-xl p-6 border backdrop-blur-sm transition-all duration-300
                  hover:-translate-y-1 hover:shadow-xl group cursor-default
                  ${f.highlight
                    ? 'border-indigo-500/40 bg-indigo-500/10 hover:border-indigo-400/60 hover:shadow-indigo-500/20'
                    : 'border-white/8 bg-white/4 hover:border-white/20 hover:bg-white/7'
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl
                    transition-transform duration-300 group-hover:scale-110
                    ${f.highlight ? 'bg-indigo-500/20' : 'bg-white/8'}`}>
                    {f.icon}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border
                    ${f.highlight
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-white/8 text-zinc-400 border-white/10'
                    }`}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Employer strip */}
      <section className="relative z-10 px-6 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <Badge className="mb-4 bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-xs animate-fade-up">
              For Employers
            </Badge>
            <AnimatedHeading as="h2" className="text-2xl font-bold mb-3">
              Hire on ability not labels
            </AnimatedHeading>
            <p className="text-zinc-400 leading-relaxed mb-6 animate-fade-up animate-delay-2">
              Post jobs with required and nice-to-have skills. Get a ranked shortlist where
              every candidate&apos;s skill fit is visible at a glance — matched skills, gaps, and
              the exact profiles worth interviewing. No more CV keyword roulette.
            </p>
            <MagneticButton>
              <Link href="/sign-up">
                <Button variant="outline"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                  Post a role →
                </Button>
              </Link>
            </MagneticButton>
          </div>
          <StaggerContainer className="flex-1 grid grid-cols-2 gap-3" stagger={0.1} y={20}>
            {EMPLOYER_FEATURES.map(item => (
              <div key={item.label}
                className="flex items-center gap-3 rounded-xl p-4 border border-white/8 bg-white/4
                  backdrop-blur-sm hover:border-white/15 hover:bg-white/7 transition-all duration-200">
                <span className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center text-lg shrink-0">
                  {item.icon}
                </span>
                <span className="text-sm font-medium text-zinc-300">{item.label}</span>
              </div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 px-6 py-20 border-t border-white/5">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <div className="w-96 h-48 bg-indigo-600/15 blur-3xl rounded-full" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <AnimatedHeading
            as="h2"
            className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent"
          >
            Stop guessing. Start navigating.
          </AnimatedHeading>
          <p className="text-zinc-400 mb-8 text-lg animate-fade-up animate-delay-2">
            Free to use. No CV required to start. Build your skills profile
            and see your career paths in under 5 minutes.
          </p>
          <MagneticButton strength={0.25}>
            <Link href="/sign-up">
              <Button size="lg"
                className="px-12 py-6 text-base bg-gradient-to-r from-violet-600 to-indigo-600
                  hover:from-violet-500 hover:to-indigo-500 border-0
                  shadow-2xl shadow-indigo-500/40 text-white">
                Get started free →
              </Button>
            </Link>
          </MagneticButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-6 text-center text-xs text-zinc-600">
        Career OS · Skills-first hiring for APAC · Talentbank Tech Hackathon 2026
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    icon: '🗂️',
    title: 'Skills Vault',
    desc: 'Add skills with evidence. Import from GitHub — AI reads your repos and extracts your real stack. Upload your resume and Claude structures it in seconds.',
    tag: 'Foundation',
    highlight: false,
  },
  {
    icon: '🧭',
    title: 'Career Identity',
    desc: "Answer 4 questions about goals, values, and work style. Claude writes a professional narrative that tells employers who you actually are — not just what you've done.",
    tag: 'AI-powered',
    highlight: false,
  },
  {
    icon: '🗺️',
    title: 'Path Navigator',
    desc: '3 career directions mapped from your current skills: a strong match today, an emerging path in 6–18 months, and a stretch goal. Salary ranges in MYR. Real trade-offs named.',
    tag: 'Navigation',
    highlight: true,
  },
  {
    icon: '🎯',
    title: 'Job Matches',
    desc: "Every open role ranked by skill overlap. Matched skills in green, gaps in red. No black-box scores — you see exactly why you match or don't.",
    tag: 'Transparent',
    highlight: false,
  },
  {
    icon: '🤖',
    title: 'AI Coach',
    desc: "Live streaming career advice from an AI that knows your skills, goals, and the APAC market. Real salary bands in MYR. Honest about what you're missing.",
    tag: 'Streaming AI',
    highlight: false,
  },
  {
    icon: '🗃️',
    title: 'Living Portfolio',
    desc: "Showcase what you've built, not just what you know. Projects with tech stack, impact metrics, and AI-generated summaries that make your work legible.",
    tag: 'Evidence',
    highlight: false,
  },
]

const EMPLOYER_FEATURES = [
  { icon: '📋', label: 'Skills-first job posting' },
  { icon: '📊', label: 'Ranked talent shortlists' },
  { icon: '🔍', label: 'Visible skill gap analysis' },
  { icon: '🏢', label: 'Culture identity synthesis' },
]
