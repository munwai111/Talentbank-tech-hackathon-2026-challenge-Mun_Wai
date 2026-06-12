'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { gsap, useGSAP } from '@/lib/gsap-config'
import { Compass, Radar } from 'lucide-react'

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const ROLES = [
  {
    id: 'candidate' as const,
    Icon: Compass,
    journey: 'The Navigator journey',
    title: "I'm building my career",
    description: 'Vault your skills with evidence, see three plotted routes forward, and get coached by an AI that knows your profile and the market.',
    gradient: 'from-indigo-500/20 to-violet-500/10',
    border: 'border-indigo-500/50',
    glow: 'rgba(99,102,241,0.25)',
    labelClass: '!text-indigo-400',
    radioClass: 'border-indigo-500 bg-indigo-500',
    iconWrap: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  },
  {
    id: 'employer' as const,
    Icon: Radar,
    journey: 'The Scout journey',
    title: "I'm hiring talent",
    description: 'Post skills-first roles and see candidates ranked by proven ability and goal alignment — not school names or keyword luck.',
    gradient: 'from-teal-500/20 to-cyan-500/10',
    border: 'border-teal-500/50',
    glow: 'rgba(45,212,191,0.25)',
    labelClass: '!text-teal-400',
    radioClass: 'border-teal-400 bg-teal-400',
    iconWrap: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
  },
]

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [selected, setSelected] = useState<'candidate' | 'employer' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo('.ob-logo', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
    tl.fromTo('.ob-heading', { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.2')
    tl.fromTo('.ob-sub', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.3')
    tl.fromTo('.ob-card', { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, stagger: 0.12, ease: 'back.out(1.4)' }, '-=0.1')
    tl.fromTo('.ob-footer', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.1')
  }, { scope: containerRef })

  async function handleContinue() {
    if (!selected || !user) return
    setLoading(true)
    setError(null)

    try {
      await user.update({ unsafeMetadata: { role: selected } })
      await wait(400)
      const res = await fetch('/api/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selected }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? `Server error ${res.status}`)
      }

      router.push(selected === 'candidate' ? '/onboarding/profile' : '/employer/dashboard')
    } catch (err) {
      console.error('[onboarding] handleContinue failed:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again')
      setLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[#070714] map-grid flex items-center justify-center px-4 overflow-hidden">

      {/* Aurora background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-25
          bg-[radial-gradient(circle,#7c3aed,transparent_70%)]"
          style={{ animation: 'aurora-1 18s ease-in-out infinite' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-20
          bg-[radial-gradient(circle,#4f46e5,transparent_70%)]"
          style={{ animation: 'aurora-2 22s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 max-w-xl w-full">

        {/* Logo */}
        <div className="ob-logo flex items-center justify-center gap-2 mb-10 opacity-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600
            flex items-center justify-center text-sm font-bold shadow-lg shadow-violet-500/30">
            C
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Career OS</span>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="ob-heading text-3xl font-bold mb-2 text-white opacity-0">
            Two journeys. Which is yours?
          </h1>
          <p className="ob-sub text-zinc-400 opacity-0">
            The entire platform reshapes itself around your answer.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid gap-4 mb-8">
          {ROLES.map((role) => {
            const isSelected = selected === role.id
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => { if (!loading) setSelected(role.id) }}
                className={`ob-card opacity-0 w-full p-6 rounded-2xl border-2 backdrop-blur-sm text-left
                  transition duration-300 cursor-pointer group
                  ${isSelected
                    ? `${role.border} bg-gradient-to-br ${role.gradient}`
                    : 'border-white/10 bg-white/4 hover:border-white/25 hover:bg-white/7'
                  }`}
                style={isSelected ? { boxShadow: `0 0 40px ${role.glow}` } : {}}
              >
                <div className="flex items-start gap-4">
                  <span className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0
                    transition-transform duration-300 group-hover:scale-110 ${role.iconWrap}`}>
                    <role.Icon size={19} strokeWidth={1.75} />
                  </span>
                  <div className="flex-1">
                    <p className={`section-label mb-1 ${isSelected ? role.labelClass : ''}`}>{role.journey}</p>
                    <h3 className="font-semibold text-lg text-white">{role.title}</h3>
                    <p className="text-zinc-400 text-sm mt-1">{role.description}</p>
                  </div>
                  <div className={`ml-auto mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    transition duration-200
                    ${isSelected ? role.radioClass : 'border-white/30'}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-xl text-sm text-red-400 text-center">
            {error}
            <button onClick={handleContinue} className="block mx-auto mt-1 text-xs text-red-500 underline hover:text-red-300">
              Try again →
            </button>
          </div>
        )}

        <Button
          onClick={handleContinue}
          disabled={!selected || loading}
          className={`ob-card opacity-0 w-full border-0 text-white disabled:opacity-40 disabled:cursor-not-allowed
            ${selected === 'employer'
              ? 'bg-teal-600 hover:bg-teal-500 shadow-xl shadow-teal-500/25'
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/25'}`}
          size="lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Setting up your account…
            </span>
          ) : 'Begin the journey'}
        </Button>

        <p className="ob-footer text-center text-xs text-zinc-600 mt-4 opacity-0">
          You can change your account type later in settings.
        </p>
      </div>
    </div>
  )
}
