'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Guided Candidate Registration — Visual Design System v2
//
// Design language: "The night before your first big day."
// Deep space navy + aurora light. Gradient typography per phase.
// Interactive background responds to mouse. Custom glowing cursor.
// Each phase has its own emotional colour — amber warmth, sky knowledge,
// teal growth, violet vision, rose humanity.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ── Constants ─────────────────────────────────────────────────────────────────

const MQF_LEVELS = [
  { value: 'high_school',   label: 'High School / SPM / STPM' },
  { value: 'mqf_1_3',      label: 'Certificate (MQF Levels 1–3)' },
  { value: 'mqf_4',        label: 'Diploma (MQF Level 4)' },
  { value: 'mqf_5',        label: 'Advanced Diploma (MQF Level 5)' },
  { value: 'mqf_6',        label: "Bachelor's Degree (MQF Level 6)" },
  { value: 'mqf_7',        label: "Master's Degree (MQF Level 7)" },
  { value: 'mqf_8',        label: 'Doctoral Degree / PhD (MQF Level 8)' },
  { value: 'professional', label: 'Professional Certification / Qualification' },
  { value: 'self_taught',  label: 'Self-taught / Bootcamp / Online Courses' },
]

const EMPLOYMENT_TYPES = [
  { value: 'full_time',  label: 'Full-time',  icon: '💼' },
  { value: 'part_time',  label: 'Part-time',  icon: '⏱' },
  { value: 'freelance',  label: 'Freelance',  icon: '🧑‍💻' },
  { value: 'contract',   label: 'Contract',   icon: '📄' },
  { value: 'internship', label: 'Internship', icon: '🎓' },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const SAQ_QUESTIONS = [
  {
    id: 'learning_agility', dimension: 'Learning & Growth',
    scenario: "You're assigned to lead a project in an area you've never worked in before. Your instinct is to:",
    options: [
      { key: 'a', label: 'Research independently until I feel ready, then start' },
      { key: 'b', label: "Find someone who's done it before and learn from them first" },
      { key: 'c', label: 'Jump in with what I know and adapt as I go' },
      { key: 'd', label: 'Propose a small pilot before committing to the full scope' },
    ],
  },
  {
    id: 'drive', dimension: 'Drive & Ambition',
    scenario: 'When you set a major career goal, which best describes your approach?',
    options: [
      { key: 'a', label: 'I map milestones, track progress, and push hard on timelines' },
      { key: 'b', label: "I stay directionally clear but stay flexible on how I get there" },
      { key: 'c', label: "I focus on doing excellent work today — recognition will follow" },
      { key: 'd', label: "I prefer to set goals in collaboration with those around me" },
    ],
  },
  {
    id: 'interpersonal', dimension: 'Working With Others',
    scenario: "A colleague you respect is taking an approach that's clearly slowing your team down. You:",
    options: [
      { key: 'a', label: 'Speak to them privately and directly — specific, not vague' },
      { key: 'b', label: 'Raise it as a team in the next retrospective' },
      { key: 'c', label: 'Absorb the slack myself to protect team output' },
      { key: 'd', label: 'Involve a manager after one direct attempt goes nowhere' },
    ],
  },
  {
    id: 'change_agility', dimension: 'Navigating Change',
    scenario: 'Your company announces a major pivot — your role will change significantly in 90 days. You feel:',
    options: [
      { key: 'a', label: 'Curious — this is a chance to grow in a new direction' },
      { key: 'b', label: 'Careful — I want to understand the full picture first' },
      { key: 'c', label: 'Concerned — I value stability and need time to assess' },
      { key: 'd', label: "Energised — I was already feeling ready for something new" },
    ],
  },
  {
    id: 'resilience', dimension: 'Resilience',
    scenario: 'After a significant professional setback — a project that failed publicly — you typically:',
    options: [
      { key: 'a', label: 'Take time to decompress before re-engaging with full energy' },
      { key: 'b', label: 'Debrief immediately with a mentor or someone I trust' },
      { key: 'c', label: 'Analyse exactly what went wrong and build a corrective plan' },
      { key: 'd', label: "Reset quickly and move forward — dwelling doesn't serve me" },
    ],
  },
]

const STRENGTH_SCENARIO = {
  id: 'strength',
  scenario: 'In a high-pressure situation with a tight deadline and an imperfect brief, you are most likely to be the person who:',
  options: [
    { key: 'a', label: 'Takes charge of coordinating the team and keeping everyone aligned' },
    { key: 'b', label: 'Dives into the problem and produces a working output fast' },
    { key: 'c', label: "Spots the gaps in the brief and asks the clarifying questions no-one else asked" },
    { key: 'd', label: 'Keeps the group calm, focused, and moving without drama' },
  ],
}

const WEAKNESS_SCENARIO = {
  id: 'weakness',
  scenario: 'When you look back at your professional life honestly, the pattern you most want to change is:',
  options: [
    { key: 'a', label: "I take on too much and don't delegate enough" },
    { key: 'b', label: "I sometimes over-think before acting — I could move faster" },
    { key: 'c', label: "I avoid difficult conversations longer than I should" },
    { key: 'd', label: "I lose energy on routine tasks — I need variety to stay engaged" },
  ],
}

const PERSONAL_HOBBIES = [
  'Reading','Gaming','Sports','Cooking','Travel','Music','Art & Design',
  'Film & TV','Photography','Fitness','Volunteering','Languages','Hiking',
  'Writing','Meditation','Podcasts',
]

const PROFESSIONAL_INTERESTS = [
  'Open Source','Hackathons','Side Projects','Blogging / Content','Community Building',
  'Mentoring Others','Research','Industry Events','Investing / Finance',
  'Startups','AI & Emerging Tech','Sustainability',
]

const PLATFORM_INTENTIONS = [
  "Actively job hunting — I want a new role now",
  "Passively open — not unhappy, but the right opportunity matters",
  "Building my profile for future opportunities",
  "Exploring — understanding what's out there for me",
  "Upskilling — growing before my next move",
]

const CURRENT_SITUATIONS = [
  'Currently employed full-time',
  'Currently employed part-time or freelancing',
  'Between roles — available now',
  'Studying or in training',
  'Recently graduated',
  'Taking a career break',
]

// ── Phase metadata ─────────────────────────────────────────────────────────────

const PHASES = [
  { num: 1, short: 'You',        label: 'Identity',   gradient: 'from-amber-300 to-orange-400',   glow: 'rgba(251,191,36,0.4)'   },
  { num: 2, short: 'Background', label: 'Education',  gradient: 'from-sky-300 to-indigo-400',     glow: 'rgba(99,102,241,0.4)'   },
  { num: 3, short: 'Work',       label: 'Experience', gradient: 'from-teal-300 to-emerald-400',   glow: 'rgba(52,211,153,0.4)'   },
  { num: 4, short: 'Resume',     label: 'Portfolio',  gradient: 'from-violet-300 to-purple-400',  glow: 'rgba(167,139,250,0.4)'  },
  { num: 5, short: 'Goals',      label: 'About You',  gradient: 'from-rose-300 to-pink-400',      glow: 'rgba(251,113,133,0.4)'  },
]

const PHASE_HEADINGS = [
  { line1: 'Nice to meet you.', sub: 'Enter your name exactly as it appears on your government-issued ID.' },
  { line1: 'Your academic journey.', sub: 'Add your qualifications, from most recent to earliest.' },
  { line1: "Where you've left your mark.", sub: 'Every role counts — full-time, part-time, freelance, internship.' },
  { line1: 'Tell us your story.', sub: 'Import your CV or write a short bio. Our AI will do the rest.' },
  { line1: 'The real you.', sub: 'Goals, character, interests. Be honest — not impressive.' },
]

// ── Local types ────────────────────────────────────────────────────────────────

type EducationEntry = {
  id: string; institution: string; mqfLevel: string; fieldOfStudy: string
  startYear: string; endYear: string; currentlyEnrolled: boolean; documentName: string | null
}
type WorkEntry = {
  id: string; jobTitle: string; company: string; employmentType: string
  startMonth: string; startYear: string; endMonth: string; endYear: string
  currentlyWorking: boolean; description: string
  verificationStatus: 'unverified' | 'email_sent' | 'doc_uploaded'
  verificationEmail: string; documentName: string | null
}
type SaqState = {
  goal1Year: string; goal5Year: string; dreamRole: string
  characterResponses: Record<string, string>
  strengthResponse: string; weaknessResponse: string
  personalHobbies: string[]; professionalInterests: string[]
  platformIntention: string; currentSituation: string; intentionWhy: string
}

// ── Shared style tokens ───────────────────────────────────────────────────────

const INP = [
  'w-full bg-white/[0.06] border border-white/[0.1] rounded-2xl px-4 py-3.5',
  'text-slate-100 placeholder:text-slate-600 text-sm backdrop-blur-sm',
  'focus:outline-none focus:border-indigo-400/60 focus:ring-[3px] focus:ring-indigo-500/[0.12]',
  'transition-all duration-300',
].join(' ')

const SEL = `${INP} appearance-none cursor-pointer`
const LBL = 'block text-[11px] font-semibold text-slate-500 mb-2 tracking-widest uppercase'

// ── SVG Phase Icons ────────────────────────────────────────────────────────────

function PhaseIcon({ num, size = 20 }: { num: number; size?: number }) {
  const s = { width: size, height: size, strokeWidth: 1.5 }
  if (num === 1) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}>
      <circle cx="12" cy="8" r="3.5" /><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
  if (num === 2) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}>
      <path d="M22 10L12 5 2 10l10 5 10-5z" /><path strokeLinecap="round" d="M6 12.5V17c2 1.5 8 1.5 12 0v-4.5" /><path strokeLinecap="round" d="M22 10v5" />
    </svg>
  )
  if (num === 3) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}>
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /><line x1="2" y1="13" x2="22" y2="13" />
    </svg>
  )
  if (num === 4) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /><path d="M14 2v6h6" /><path strokeLinecap="round" d="M8 13h8M8 17h5" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}>
      <path strokeLinejoin="round" d="M12 2l2.09 6.43H21l-5.47 3.97 2.09 6.43L12 14.87l-5.62 3.96 2.09-6.43L2.99 8.43H9.91L12 2z" />
    </svg>
  )
}

// ── Aurora Background ─────────────────────────────────────────────────────────

function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[#04071a]" />

      {/* Noise grain overlay */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }} />

      {/* Aurora blob 1 — indigo, top-left */}
      <div className="absolute w-[700px] h-[700px] rounded-full blur-[140px] opacity-[0.18]"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', top: '-15%', left: '-10%', animation: 'aurora-1 28s ease-in-out infinite', transform: `translate(calc(var(--mx,0.5)*40px - 20px), calc(var(--my,0.5)*40px - 20px))`, transition: 'transform 3s cubic-bezier(0.25,0.1,0.25,1)' }} />

      {/* Aurora blob 2 — violet, bottom-right */}
      <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.15]"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)', bottom: '-10%', right: '-8%', animation: 'aurora-2 22s ease-in-out infinite', transform: `translate(calc(var(--mx,0.5)*-30px + 15px), calc(var(--my,0.5)*-30px + 15px))`, transition: 'transform 4s cubic-bezier(0.25,0.1,0.25,1)' }} />

      {/* Aurora blob 3 — teal, center */}
      <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.12]"
        style={{ background: 'radial-gradient(circle, #14b8a6, transparent 70%)', top: '30%', left: '40%', animation: 'aurora-3 18s ease-in-out infinite', transform: `translate(calc(var(--mx,0.5)*20px - 10px), calc(var(--my,0.5)*-20px + 10px))`, transition: 'transform 2.5s cubic-bezier(0.25,0.1,0.25,1)' }} />

      {/* Aurora blob 4 — amber, top-right (subtle warmth) */}
      <div className="absolute w-[400px] h-[400px] rounded-full blur-[90px] opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', top: '5%', right: '15%', animation: 'aurora-4 35s ease-in-out infinite', transition: 'transform 5s cubic-bezier(0.25,0.1,0.25,1)' }} />

      {/* Decorative sparkles */}
      {[
        { top:'12%', left:'18%', delay:'0s', size:2 }, { top:'75%', left:'8%', delay:'1.5s', size:1.5 },
        { top:'30%', left:'85%', delay:'2.2s', size:2 }, { top:'60%', left:'72%', delay:'0.8s', size:1 },
        { top:'88%', left:'55%', delay:'3s',   size:1.5 }, { top:'20%', left:'50%', delay:'1s',  size:1 },
      ].map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{ top: s.top, left: s.left, width: `${s.size}px`, height: `${s.size}px`, animation: `sparkle-float ${3+i*0.7}s ease-in-out ${s.delay} infinite` }} />
      ))}
    </div>
  )
}

// ── Custom Cursor ─────────────────────────────────────────────────────────────

function CustomCursor() {
  const dotRef   = useRef<HTMLDivElement>(null)
  const ringRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`
        dotRef.current.style.top  = `${e.clientY}px`
      }
      if (ringRef.current) {
        ringRef.current.style.left = `${e.clientX}px`
        ringRef.current.style.top  = `${e.clientY}px`
      }
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <>
      {/* Outer ring — slow follow */}
      <div ref={ringRef} className="pointer-events-none fixed z-[9999] rounded-full border border-indigo-400/40"
        style={{ width: 36, height: 36, transform: 'translate(-50%,-50%)', transition: 'left 0.18s ease-out, top 0.18s ease-out', mixBlendMode: 'normal' }} />
      {/* Inner dot — instant */}
      <div ref={dotRef} className="pointer-events-none fixed z-[9999] rounded-full bg-indigo-300"
        style={{ width: 5, height: 5, transform: 'translate(-50%,-50%)', boxShadow: '0 0 8px 2px rgba(129,140,248,0.7)' }} />
    </>
  )
}

// ── Phase Progress ─────────────────────────────────────────────────────────────

function PhaseProgress({ currentPhase, completedPhases }: { currentPhase: number; completedPhases: Set<number> }) {
  const phaseData = PHASES.find(p => p.num === currentPhase)
  return (
    <div className="flex flex-col items-center mb-10">
      <div className="flex items-center">
        {PHASES.map((p, idx) => {
          const done    = completedPhases.has(p.num)
          const active  = currentPhase === p.num
          const locked  = !done && !active

          return (
            <div key={p.num} className="flex items-center">
              {/* Connector */}
              {idx > 0 && (
                <div className="relative mx-1" style={{ width: 48, height: 2 }}>
                  <div className="absolute inset-0 rounded-full bg-white/[0.06]" />
                  {completedPhases.has(p.num - 1) && (
                    <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-400/70"
                      style={{ animation: 'line-grow 0.6s ease-out forwards' }} />
                  )}
                </div>
              )}

              {/* Node */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={[
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative',
                  done   ? 'bg-emerald-500' : '',
                  active ? 'bg-indigo-500 animate-ring-pulse' : '',
                  locked ? 'bg-white/[0.05] border border-white/[0.08]' : '',
                ].join(' ')}
                  style={done ? { boxShadow: `0 0 16px rgba(52,211,153,0.5)` } : active ? { boxShadow: `0 0 20px rgba(129,140,248,0.6)` } : {}}>

                  {done ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width={16}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : locked ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,0.6)" strokeWidth="1.5" width={14}>
                      <rect x="5" y="11" width="14" height="10" rx="2" /><path strokeLinecap="round" d="M8 11V7a4 4 0 018 0v4" />
                    </svg>
                  ) : (
                    <span className={done ? 'text-white' : active ? 'text-white' : 'text-slate-600'}>
                      <PhaseIcon num={p.num} size={17} />
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-medium tracking-wide transition-colors ${
                  active ? 'text-indigo-300' : done ? 'text-emerald-400' : 'text-slate-600'
                }`}>
                  {p.short}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current phase label */}
      {phaseData && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-slate-500">Phase {currentPhase} of 5</span>
          <span className="text-slate-700">·</span>
          <span className={`text-xs font-semibold bg-gradient-to-r ${phaseData.gradient} bg-clip-text text-transparent`}>
            {phaseData.label}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Unlock Achievement Toast ───────────────────────────────────────────────────

function UnlockToast({ phase, onDone }: { phase: number; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t) }, [onDone])
  const p = PHASES.find(ph => ph.num === phase)
  if (!p) return null

  const particles = [
    { anim:'p1', color:'#818cf8', size:10 }, { anim:'p2', color:'#34d399', size:8  },
    { anim:'p3', color:'#f59e0b', size:12 }, { anim:'p4', color:'#f472b6', size:7  },
    { anim:'p5', color:'#818cf8', size:9  }, { anim:'p6', color:'#34d399', size:11 },
    { anim:'p7', color:'#f59e0b', size:7  }, { anim:'p8', color:'#f472b6', size:10 },
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-slate-950/50 absolute inset-0" />
      <div className="relative animate-bounce-in">
        {/* Particles */}
        {particles.map((pt, i) => (
          <div key={i} className="absolute top-1/2 left-1/2 rounded-full"
            style={{ width: pt.size, height: pt.size, marginLeft: -pt.size/2, marginTop: -pt.size/2,
              background: pt.color, animation: `${pt.anim} 0.7s cubic-bezier(0,.9,.57,1) ${0.05*i}s forwards`,
              boxShadow: `0 0 6px ${pt.color}` }} />
        ))}

        {/* Card */}
        <div className="relative bg-slate-900/90 backdrop-blur-2xl border border-white/[0.12] rounded-3xl px-10 py-8 text-center"
          style={{ boxShadow: `0 0 60px ${p.glow}, 0 25px 50px rgba(0,0,0,0.5)` }}>
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-lg`}>
            <PhaseIcon num={p.num} size={28} />
          </div>
          <p className={`text-lg font-bold bg-gradient-to-r ${p.gradient} bg-clip-text text-transparent animate-shimmer`}>
            Phase {p.num} unlocked
          </p>
          <p className="text-slate-400 text-sm mt-1">{p.label}</p>
        </div>
      </div>
    </div>
  )
}

// ── Verify Nudge Modal ─────────────────────────────────────────────────────────

function VerifyNudgeModal({ onVerify, onSkip }: { onVerify: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-900/95 border border-white/[0.1] rounded-3xl p-7 max-w-sm w-full"
        style={{ boxShadow: '0 0 60px rgba(99,102,241,0.2), 0 25px 50px rgba(0,0,0,0.6)' }}>
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 border border-indigo-400/20">🏆</div>
          <h3 className="text-white font-bold text-lg">Verified candidates get hired 3× faster</h3>
          <p className="text-slate-400 text-sm mt-2">Add a document or work email to unlock your <span className="text-indigo-400">Verified Candidate</span> badge.</p>
        </div>
        {['Blue verified badge on your profile','Prioritised in employer talent searches','Higher weighting in our match algorithm'].map(b => (
          <div key={b} className="flex items-center gap-2.5 text-sm text-slate-300 mb-2">
            <span className="text-emerald-400 text-xs">✓</span>{b}
          </div>
        ))}
        <button onClick={onVerify} className="w-full mt-5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-semibold rounded-xl py-3 text-sm transition-all"
          style={{ boxShadow: '0 4px 20px rgba(129,140,248,0.35)' }}>
          Add verification now
        </button>
        <button onClick={onSkip} className="w-full text-slate-600 hover:text-slate-400 text-sm py-2.5 transition-colors mt-1">
          Skip this time — I&apos;ll verify later
        </button>
      </div>
    </div>
  )
}

// ── Scenario Card ─────────────────────────────────────────────────────────────

function ScenarioCard({ qId, option, selected, onSelect }: { qId: string; option: { key: string; label: string }; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border text-sm transition-all duration-200 ${
        selected
          ? 'bg-indigo-500/[0.12] border-indigo-400/50 text-slate-100'
          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05] hover:border-white/[0.12] hover:text-slate-200'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 transition-all ${
          selected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-600 text-slate-600'
        }`}>
          {option.key.toUpperCase()}
        </div>
        <span>{option.label}</span>
      </div>
    </button>
  )
}

// ── Pill ──────────────────────────────────────────────────────────────────────

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-xs border transition-all duration-200 ${
        selected
          ? 'bg-indigo-500/[0.15] border-indigo-400/60 text-indigo-300'
          : 'bg-white/[0.04] border-white/[0.08] text-slate-500 hover:border-white/20 hover:text-slate-300'
      }`}>
      {label}
    </button>
  )
}

// ── Checkbox ──────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div onClick={onChange}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
          checked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 bg-transparent group-hover:border-slate-400'
        }`}>
        {checked && <svg viewBox="0 0 12 12" width={10}><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
      </div>
      <span className="text-slate-300 text-sm">{label}</span>
    </label>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — Personal Identity
// ─────────────────────────────────────────────────────────────────────────────

function Phase1({ data, onChange }: { data: { firstName: string; middleName: string; lastName: string; dateOfBirth: string }; onChange: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5 animate-slide-up">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LBL}>First name <span className="text-indigo-400 normal-case">*</span></label>
          <input className={INP} placeholder="e.g. Ahmad" value={data.firstName} onChange={e => onChange('firstName', e.target.value)} />
        </div>
        <div>
          <label className={LBL}>Last name <span className="text-indigo-400 normal-case">*</span></label>
          <input className={INP} placeholder="e.g. Razali" value={data.lastName} onChange={e => onChange('lastName', e.target.value)} />
        </div>
      </div>
      <div>
        <label className={LBL}>Middle name <span className="text-slate-700 normal-case">(optional)</span></label>
        <input className={INP} placeholder="e.g. bin / binti / —" value={data.middleName} onChange={e => onChange('middleName', e.target.value)} />
      </div>
      <div>
        <label className={LBL}>Date of birth <span className="text-indigo-400 normal-case">*</span></label>
        <input type="date" className={INP} value={data.dateOfBirth} onChange={e => onChange('dateOfBirth', e.target.value)}
          max={new Date(Date.now() - 16 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]} />
        <p className="text-xs text-slate-600 mt-2">Kept private — only used to verify you are 16 or older.</p>
      </div>
      <div className="bg-indigo-500/[0.06] border border-indigo-400/[0.12] rounded-2xl p-4 text-xs text-slate-500">
        <span className="text-indigo-400 font-semibold">🔒 Privacy — </span>
        Your legal name and date of birth are never shown to employers.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Academic Background
// ─────────────────────────────────────────────────────────────────────────────

function Phase2({ entries, onChange, onAdd, onRemove }: {
  entries: EducationEntry[]
  onChange: (id: string, field: string, value: string | boolean | null) => void
  onAdd: () => void; onRemove: (id: string) => void
}) {
  const yr = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i))
  return (
    <div className="space-y-4 animate-slide-up">
      {entries.map((e, idx) => (
        <div key={e.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm font-medium">{idx === 0 ? 'Most recent' : `Qualification ${idx + 1}`}</span>
            {entries.length > 1 && <button onClick={() => onRemove(e.id)} className="text-xs text-slate-700 hover:text-red-400 transition-colors">Remove</button>}
          </div>
          <div>
            <label className={LBL}>Institution <span className="text-indigo-400 normal-case">*</span></label>
            <input className={INP} placeholder="e.g. Universiti Malaya, INTI, UniKL" value={e.institution} onChange={ev => onChange(e.id, 'institution', ev.target.value)} />
          </div>
          <div>
            <label className={LBL}>Qualification level <span className="text-indigo-400 normal-case">*</span></label>
            <select className={SEL} value={e.mqfLevel} onChange={ev => onChange(e.id, 'mqfLevel', ev.target.value)}>
              <option value="">Select level</option>
              {MQF_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className={LBL}>Field of study</label>
            <input className={INP} placeholder="e.g. Computer Science, Business Administration" value={e.fieldOfStudy} onChange={ev => onChange(e.id, 'fieldOfStudy', ev.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Start year</label>
              <select className={SEL} value={e.startYear} onChange={ev => onChange(e.id, 'startYear', ev.target.value)}>
                <option value="">Year</option>
                {yr.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Graduation year</label>
              <select className={SEL} value={e.endYear} onChange={ev => onChange(e.id, 'endYear', ev.target.value)}>
                <option value="">Year</option>
                {yr.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <Checkbox checked={e.currentlyEnrolled} onChange={() => onChange(e.id, 'currentlyEnrolled', !e.currentlyEnrolled)} label="I am currently enrolled here" />
          <div className="border border-dashed border-white/[0.1] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">📎</span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm font-medium">Upload proof <span className="text-slate-600">(optional)</span></p>
                <p className="text-slate-600 text-xs mt-0.5">Transcript, certificate, or admission letter</p>
                {e.documentName ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-emerald-400 text-xs">✓ {e.documentName}</span>
                    <button onClick={() => onChange(e.id, 'documentName', null)} className="text-xs text-slate-600 hover:text-red-400">Remove</button>
                  </div>
                ) : (
                  <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={ev => { const f = ev.target.files?.[0]; if (f) onChange(e.id, 'documentName', f.name) }} />
                    Choose file →
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      <button onClick={onAdd} className="w-full border border-dashed border-white/[0.1] rounded-2xl py-3 text-sm text-slate-600 hover:text-slate-400 hover:border-white/20 transition-all">
        + Add another qualification
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — Work Experience
// ─────────────────────────────────────────────────────────────────────────────

function Phase3({ entries, onChange, onAdd, onRemove, expandedVerify, setExpandedVerify }: {
  entries: WorkEntry[]
  onChange: (id: string, field: string, value: string | boolean | null) => void
  onAdd: () => void; onRemove: (id: string) => void
  expandedVerify: string | null; setExpandedVerify: (id: string | null) => void
}) {
  const yr = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i))
  return (
    <div className="space-y-4 animate-slide-up">
      {entries.map((e, idx) => (
        <div key={e.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm font-medium">{idx === 0 ? 'Most recent role' : `Role ${idx + 1}`}</span>
            <div className="flex items-center gap-3">
              {e.verificationStatus !== 'unverified' && (
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  e.verificationStatus === 'doc_uploaded'
                    ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-400'
                    : 'bg-indigo-500/10 border-indigo-400/30 text-indigo-400'
                }`}>
                  {e.verificationStatus === 'doc_uploaded' ? '✓ Document added' : '📧 Email sent'}
                </span>
              )}
              <button onClick={() => onRemove(e.id)} className="text-xs text-slate-700 hover:text-red-400 transition-colors">Remove</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={LBL}>Job title <span className="text-indigo-400 normal-case">*</span></label>
              <input className={INP} placeholder="e.g. Software Engineer, Marketing Executive" value={e.jobTitle} onChange={ev => onChange(e.id, 'jobTitle', ev.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LBL}>Company <span className="text-indigo-400 normal-case">*</span></label>
              <input className={INP} placeholder="e.g. Grab, Maybank, Self-employed" value={e.company} onChange={ev => onChange(e.id, 'company', ev.target.value)} />
            </div>
          </div>

          <div>
            <label className={LBL}>Employment type <span className="text-indigo-400 normal-case">*</span></label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map(et => (
                <button key={et.value} type="button" onClick={() => onChange(e.id, 'employmentType', et.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-all ${
                    e.employmentType === et.value
                      ? 'bg-indigo-500/[0.15] border-indigo-400/50 text-indigo-300'
                      : 'bg-white/[0.04] border-white/[0.08] text-slate-500 hover:border-white/20 hover:text-slate-300'
                  }`}>
                  {et.icon} {et.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Start</label>
              <div className="grid grid-cols-2 gap-1.5">
                <select className={SEL} value={e.startMonth} onChange={ev => onChange(e.id, 'startMonth', ev.target.value)}>
                  <option value="">Mon</option>
                  {MONTHS.map((m,i) => <option key={m} value={String(i+1)}>{m}</option>)}
                </select>
                <select className={SEL} value={e.startYear} onChange={ev => onChange(e.id, 'startYear', ev.target.value)}>
                  <option value="">Year</option>
                  {yr.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LBL}>{e.currentlyWorking ? 'Present' : 'End'}</label>
              {e.currentlyWorking ? (
                <div className={`${INP} text-slate-600`}>Now</div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <select className={SEL} value={e.endMonth} onChange={ev => onChange(e.id, 'endMonth', ev.target.value)}>
                    <option value="">Mon</option>
                    {MONTHS.map((m,i) => <option key={m} value={String(i+1)}>{m}</option>)}
                  </select>
                  <select className={SEL} value={e.endYear} onChange={ev => onChange(e.id, 'endYear', ev.target.value)}>
                    <option value="">Year</option>
                    {yr.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <Checkbox checked={e.currentlyWorking} onChange={() => onChange(e.id, 'currentlyWorking', !e.currentlyWorking)} label="I currently work here" />

          <div>
            <label className={LBL}>What did you do? <span className="text-slate-700 normal-case">(optional)</span></label>
            <textarea className={`${INP} resize-none`} rows={2}
              placeholder="Key responsibilities or achievements — one to two sentences is enough"
              value={e.description} onChange={ev => onChange(e.id, 'description', ev.target.value)} />
          </div>

          {e.verificationStatus === 'unverified' && (
            <button onClick={() => setExpandedVerify(expandedVerify === e.id ? null : e.id)}
              className="w-full border border-dashed border-indigo-400/20 rounded-xl py-3 text-xs text-indigo-400 hover:bg-indigo-500/[0.08] transition-all flex items-center justify-center gap-2">
              🏆 Verify this experience for a profile boost →
            </button>
          )}

          {expandedVerify === e.id && (
            <div className="bg-indigo-500/[0.06] border border-indigo-400/[0.15] rounded-2xl p-4 space-y-4">
              <p className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">Choose your verification method</p>
              <div className="space-y-2">
                <p className="text-slate-300 text-xs">📧 <strong>Work email</strong> — we&apos;ll send a one-click verification link</p>
                <div className="flex gap-2">
                  <input className={`${INP} flex-1`} type="email" placeholder="yourname@company.com"
                    value={e.verificationEmail} onChange={ev => onChange(e.id, 'verificationEmail', ev.target.value)} />
                  <button onClick={() => { if (e.verificationEmail.includes('@')) { onChange(e.id, 'verificationStatus', 'email_sent'); setExpandedVerify(null) } }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-medium hover:bg-indigo-400 transition-all whitespace-nowrap">
                    Send link
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700"><div className="flex-1 h-px bg-white/5" /><span className="text-xs">or</span><div className="flex-1 h-px bg-white/5" /></div>
              <div>
                <p className="text-slate-300 text-xs mb-2">📄 <strong>Upload a document</strong> — salary slip, EPF, LHDN, or offer letter</p>
                <label className="flex items-center gap-2 border border-dashed border-white/[0.1] rounded-xl p-3 cursor-pointer hover:border-white/20 transition-colors">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={ev => { const f = ev.target.files?.[0]; if (f) { onChange(e.id, 'documentName', f.name); onChange(e.id, 'verificationStatus', 'doc_uploaded'); setExpandedVerify(null) } }} />
                  <span className="text-slate-600 text-xs">Choose file (PDF, JPG, PNG — max 10MB)</span>
                </label>
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={onAdd} className="w-full border border-dashed border-white/[0.1] rounded-2xl py-3 text-sm text-slate-600 hover:text-slate-400 hover:border-white/20 transition-all">
        + Add a role
      </button>
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-xs text-slate-600">
        <span className="font-medium text-slate-500">This section is optional.</span> Fresh graduates and students — skip it. Your skills and goals matter more for your initial matching score.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4 — Resume & Portfolio
// ─────────────────────────────────────────────────────────────────────────────

function Phase4({ bio, onBioChange, importUrl, onImportUrlChange, onImport, importLoading, importDone }: {
  bio: string; onBioChange: (v: string) => void
  importUrl: string; onImportUrlChange: (v: string) => void
  onImport: () => void; importLoading: boolean; importDone: boolean
}) {
  return (
    <div className="space-y-5 animate-slide-up">
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🔗</span>
          <span className="text-slate-200 font-medium text-sm">Import from LinkedIn or portfolio</span>
          <span className="ml-auto text-xs bg-indigo-500/[0.15] text-indigo-300 border border-indigo-400/20 px-2.5 py-1 rounded-full">AI-powered</span>
        </div>
        <p className="text-slate-600 text-xs">Paste your LinkedIn URL or personal site — Claude extracts your experience and skills automatically.</p>
        <div className="flex gap-2">
          <input className={`${INP} flex-1`} type="url" placeholder="https://linkedin.com/in/yourname"
            value={importUrl} onChange={e => onImportUrlChange(e.target.value)} />
          <button onClick={onImport} disabled={importLoading || !importUrl.trim()}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 disabled:opacity-40 text-white rounded-xl text-xs font-medium hover:from-indigo-400 hover:to-violet-400 transition-all whitespace-nowrap min-w-[80px]">
            {importLoading ? '...' : importDone ? '✓' : 'Import'}
          </button>
        </div>
        {importDone && <p className="text-emerald-400 text-xs">✓ Skills and experience extracted successfully.</p>}
      </div>

      <div className="flex items-center gap-3 text-slate-700">
        <div className="flex-1 h-px bg-white/[0.06]" /><span className="text-xs">or write your own</span><div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <div>
        <label className={LBL}>Professional bio <span className="text-indigo-400 normal-case">*</span></label>
        <textarea className={`${INP} resize-none`} rows={5}
          placeholder={"Describe your background, skills, and what you're looking for next. Two to four sentences.\n\ne.g. I'm a data analyst with 3 years of experience in e-commerce. I'm strong in SQL and Python, and looking to move into data engineering..."}
          value={bio} onChange={e => onBioChange(e.target.value)} />
        <p className="text-xs text-slate-700 mt-1.5">{bio.length} characters</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — About You (SAQ)
// ─────────────────────────────────────────────────────────────────────────────

function Phase5({ data, onChange, onToggleHobby, onToggleInterest }: {
  data: SaqState; onChange: (field: string, value: string) => void
  onToggleHobby: (h: string) => void; onToggleInterest: (i: string) => void
}) {
  const [section, setSection] = useState(0)
  const tabs = [
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'character', label: 'Character', icon: '🧠' },
    { id: 'hobbies', label: 'Interests', icon: '✨' },
    { id: 'scenarios', label: 'Strengths', icon: '💪' },
    { id: 'intention', label: 'Intention', icon: '🔮' },
  ]

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((t, i) => (
          <button key={t.id} onClick={() => setSection(i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all flex-shrink-0 ${
              section === i ? 'bg-indigo-500/[0.15] border border-indigo-400/30 text-indigo-300 font-semibold' : 'bg-white/[0.04] border border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {section === 0 && (
        <div className="space-y-4">
          <div><label className={LBL}>Where do you want to be in 1 year? <span className="text-indigo-400 normal-case">*</span></label>
            <textarea className={`${INP} resize-none`} rows={2} placeholder="e.g. Leading a small data team and owning our analytics infrastructure" value={data.goal1Year} onChange={e => onChange('goal1Year', e.target.value)} /></div>
          <div><label className={LBL}>And in 5 years? <span className="text-indigo-400 normal-case">*</span></label>
            <textarea className={`${INP} resize-none`} rows={2} placeholder="e.g. Head of Data or CTO at a Series B startup" value={data.goal5Year} onChange={e => onChange('goal5Year', e.target.value)} /></div>
          <div><label className={LBL}>Dream role — if you could design it yourself</label>
            <input className={INP} placeholder="e.g. Principal AI Researcher at a healthcare company" value={data.dreamRole} onChange={e => onChange('dreamRole', e.target.value)} /></div>
          <button onClick={() => setSection(1)} className="w-full bg-indigo-500/[0.12] border border-indigo-400/20 text-indigo-300 rounded-xl py-2.5 text-sm hover:bg-indigo-500/[0.18] transition-all">
            Next: Character assessment →
          </button>
        </div>
      )}

      {section === 1 && (
        <div className="space-y-6">
          <p className="text-slate-600 text-xs">5 scenarios. Pick the response that describes how you actually behave — not how you wish you did.</p>
          {SAQ_QUESTIONS.map(q => (
            <div key={q.id} className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-600 tracking-widest uppercase">{q.dimension}</p>
              <p className="text-slate-200 text-sm font-medium leading-snug">{q.scenario}</p>
              <div className="space-y-2">
                {q.options.map(opt => (
                  <ScenarioCard key={opt.key} qId={q.id} option={opt}
                    selected={data.characterResponses[q.id] === opt.key}
                    onSelect={() => onChange(`character_${q.id}`, opt.key)} />
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setSection(2)} className="w-full bg-indigo-500/[0.12] border border-indigo-400/20 text-indigo-300 rounded-xl py-2.5 text-sm hover:bg-indigo-500/[0.18] transition-all">Next: Interests →</button>
        </div>
      )}

      {section === 2 && (
        <div className="space-y-5">
          <div>
            <label className={LBL}>Personal hobbies & interests</label>
            <div className="flex flex-wrap gap-2">{PERSONAL_HOBBIES.map(h => <Pill key={h} label={h} selected={data.personalHobbies.includes(h)} onClick={() => onToggleHobby(h)} />)}</div>
          </div>
          <div>
            <label className={LBL}>Professional interests</label>
            <div className="flex flex-wrap gap-2">{PROFESSIONAL_INTERESTS.map(i => <Pill key={i} label={i} selected={data.professionalInterests.includes(i)} onClick={() => onToggleInterest(i)} />)}</div>
          </div>
          <button onClick={() => setSection(3)} className="w-full bg-indigo-500/[0.12] border border-indigo-400/20 text-indigo-300 rounded-xl py-2.5 text-sm hover:bg-indigo-500/[0.18] transition-all">Next: Strengths & weaknesses →</button>
        </div>
      )}

      {section === 3 && (
        <div className="space-y-6">
          <p className="text-slate-600 text-xs">Two honest scenarios. No right answers — just real ones.</p>
          <div className="space-y-2">
            <p className="text-slate-200 text-sm font-medium leading-snug">{STRENGTH_SCENARIO.scenario}</p>
            <div className="space-y-2">
              {STRENGTH_SCENARIO.options.map(opt => (
                <ScenarioCard key={opt.key} qId="strength" option={opt} selected={data.strengthResponse === opt.key} onSelect={() => onChange('strengthResponse', opt.key)} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-200 text-sm font-medium leading-snug">{WEAKNESS_SCENARIO.scenario}</p>
            <div className="space-y-2">
              {WEAKNESS_SCENARIO.options.map(opt => (
                <ScenarioCard key={opt.key} qId="weakness" option={opt} selected={data.weaknessResponse === opt.key} onSelect={() => onChange('weaknessResponse', opt.key)} />
              ))}
            </div>
          </div>
          <button onClick={() => setSection(4)} className="w-full bg-indigo-500/[0.12] border border-indigo-400/20 text-indigo-300 rounded-xl py-2.5 text-sm hover:bg-indigo-500/[0.18] transition-all">Last section: Intention →</button>
        </div>
      )}

      {section === 4 && (
        <div className="space-y-5">
          <div>
            <label className={LBL}>Why are you here? <span className="text-indigo-400 normal-case">*</span></label>
            <div className="space-y-2">
              {PLATFORM_INTENTIONS.map(intent => (
                <button key={intent} type="button" onClick={() => onChange('platformIntention', intent)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    data.platformIntention === intent ? 'bg-indigo-500/[0.12] border-indigo-400/40 text-slate-100' : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05] hover:border-white/[0.12]'
                  }`}>
                  <span className={data.platformIntention === intent ? 'text-indigo-400 mr-2' : 'text-slate-700 mr-2'}>●</span>{intent}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LBL}>Current situation <span className="text-indigo-400 normal-case">*</span></label>
            <div className="space-y-2">
              {CURRENT_SITUATIONS.map(s => (
                <button key={s} type="button" onClick={() => onChange('currentSituation', s)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    data.currentSituation === s ? 'bg-indigo-500/[0.12] border-indigo-400/40 text-slate-100' : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05] hover:border-white/[0.12]'
                  }`}>
                  <span className={data.currentSituation === s ? 'text-indigo-400 mr-2' : 'text-slate-700 mr-2'}>●</span>{s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LBL}>Anything else we should know? <span className="text-slate-700 normal-case">(optional)</span></label>
            <textarea className={`${INP} resize-none`} rows={3}
              placeholder="Context helps our AI give you better matches. e.g. I'm returning after a career break and want to pivot into product management..."
              value={data.intentionWhy} onChange={e => onChange('intentionWhy', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

function newEduEntry(): EducationEntry {
  return { id: crypto.randomUUID(), institution: '', mqfLevel: '', fieldOfStudy: '', startYear: '', endYear: '', currentlyEnrolled: false, documentName: null }
}
function newWorkEntry(): WorkEntry {
  return { id: crypto.randomUUID(), jobTitle: '', company: '', employmentType: '', startMonth: '', startYear: '', endMonth: '', endYear: '', currentlyWorking: false, description: '', verificationStatus: 'unverified', verificationEmail: '', documentName: null }
}

export default function OnboardingProfilePage() {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)

  // ── Form state ───────────────────────────────────────────────────────────
  const [phase, setPhase] = useState(1)
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set())
  const [unlockToast, setUnlockToast] = useState<number | null>(null)
  const [showVerifyNudge, setShowVerifyNudge] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isIdle, setIsIdle] = useState(false)

  const [identity, setIdentity] = useState({ firstName: '', middleName: '', lastName: '', dateOfBirth: '' })
  const [education, setEducation] = useState<EducationEntry[]>([newEduEntry()])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([newWorkEntry()])
  const [expandedVerify, setExpandedVerify] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [saq, setSaq] = useState<SaqState>({
    goal1Year: '', goal5Year: '', dreamRole: '',
    characterResponses: {}, strengthResponse: '', weaknessResponse: '',
    personalHobbies: [], professionalInterests: [],
    platformIntention: '', currentSituation: '', intentionWhy: '',
  })

  // ── Mouse parallax via CSS custom properties (no re-render) ──────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mx', String(e.clientX / window.innerWidth))
      document.documentElement.style.setProperty('--my', String(e.clientY / window.innerHeight))
    }
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [])

  // ── Idle detection ────────────────────────────────────────────────────────
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const reset = () => { setIsIdle(false); clearTimeout(t); t = setTimeout(() => setIsIdle(true), 3500) }
    reset()
    ;['mousemove','keydown','click','touchstart'].forEach(ev => window.addEventListener(ev, reset, { passive: true }))
    return () => { clearTimeout(t); ['mousemove','keydown','click','touchstart'].forEach(ev => window.removeEventListener(ev, reset)) }
  }, [])

  // ── Scroll to top on phase change ─────────────────────────────────────────
  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [phase])

  // ── Phase completion checks ───────────────────────────────────────────────
  const isPhase1Complete = useCallback(() => identity.firstName.trim().length >= 2 && identity.lastName.trim().length >= 2 && identity.dateOfBirth.length === 10, [identity])
  const isPhase2Complete = useCallback(() => education.some(e => e.institution.trim() && e.mqfLevel), [education])
  const isPhase3Complete = useCallback(() => true, [])
  const isPhase4Complete = useCallback(() => bio.trim().length >= 30 || importDone, [bio, importDone])
  const isPhase5Complete = useCallback(() => saq.goal1Year.trim().length >= 10 && saq.goal5Year.trim().length >= 10 && Object.keys(saq.characterResponses).length >= 3 && saq.platformIntention.length > 0 && saq.currentSituation.length > 0, [saq])

  const isCurrentComplete = useCallback(() => {
    switch (phase) {
      case 1: return isPhase1Complete()
      case 2: return isPhase2Complete()
      case 3: return isPhase3Complete()
      case 4: return isPhase4Complete()
      case 5: return isPhase5Complete()
      default: return false
    }
  }, [phase, isPhase1Complete, isPhase2Complete, isPhase3Complete, isPhase4Complete, isPhase5Complete])

  // ── Save phase ────────────────────────────────────────────────────────────
  async function savePhase(p: number) {
    setSaving(true); setError(null)
    try {
      let body: Record<string, unknown> = { phase: p }
      if (p === 1) body = { phase: 1, firstName: identity.firstName, middleName: identity.middleName, lastName: identity.lastName, dateOfBirth: identity.dateOfBirth }
      if (p === 2) body = { phase: 2, education: education.filter(e => e.institution.trim()).map(e => ({ institution: e.institution, degree: e.mqfLevel, field: e.fieldOfStudy||null, graduation_year: e.endYear ? parseInt(e.endYear) : null, mqf_level: e.mqfLevel, start_year: e.startYear ? parseInt(e.startYear) : null, currently_enrolled: e.currentlyEnrolled, document_uploaded: !!e.documentName })) }
      if (p === 3) body = { phase: 3, workExperience: workEntries.filter(e => e.jobTitle.trim() && e.company.trim()).map(e => ({ title: e.jobTitle, company: e.company, start_date: e.startYear ? `${e.startYear}-${e.startMonth.padStart(2,'0')}` : null, end_date: e.currentlyWorking ? null : (e.endYear ? `${e.endYear}-${e.endMonth.padStart(2,'0')}` : null), duration_months: null, description: e.description||null, key_technologies: [], employment_type: e.employmentType||null, verification_status: e.verificationStatus === 'doc_uploaded' ? 'document_uploaded' : e.verificationStatus === 'email_sent' ? 'email_sent' : 'unverified', verification_email: e.verificationEmail||null })) }
      if (p === 4) body = { phase: 4, bio: bio.trim()||undefined }
      if (p === 5) body = { phase: 5, complete: true, saqData: { goal_1_year: saq.goal1Year, goal_5_year: saq.goal5Year, dream_role: saq.dreamRole||null, character_responses: saq.characterResponses, personal_hobbies: saq.personalHobbies, professional_interests: saq.professionalInterests, strength_scenario: saq.strengthResponse||null, weakness_scenario: saq.weaknessResponse||null, platform_intention: saq.platformIntention, current_situation_intent: saq.currentSituation, intention_why: saq.intentionWhy||null } }
      const res = await fetch('/api/candidate/onboarding', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Save failed — please try again')
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); setSaving(false); return false }
    setSaving(false); return true
  }

  async function advancePhase() {
    const ok = await savePhase(phase); if (!ok) return
    const next = new Set(completedPhases); next.add(phase); setCompletedPhases(next)
    if (phase < 5) { setUnlockToast(phase + 1) }
    else { router.push('/dashboard') }
  }

  async function handleContinue() {
    if (!isCurrentComplete() && phase !== 3) return
    if (phase === 3) {
      const hasEntries = workEntries.some(e => e.jobTitle.trim() && e.company.trim())
      const hasVerified = workEntries.some(e => e.verificationStatus !== 'unverified')
      if (hasEntries && !hasVerified) { setShowVerifyNudge(true); return }
    }
    await advancePhase()
  }

  // ── Updaters ──────────────────────────────────────────────────────────────
  const updateIdentity = (k: string, v: string) => setIdentity(prev => ({ ...prev, [k]: v }))
  const updateEdu = (id: string, field: string, value: string | boolean | null) => setEducation(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  const updateWork = (id: string, field: string, value: string | boolean | null) => setWorkEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  const updateSaq = (field: string, value: string) => {
    if (field.startsWith('character_')) { const qId = field.replace('character_', ''); setSaq(prev => ({ ...prev, characterResponses: { ...prev.characterResponses, [qId]: value } })) }
    else setSaq(prev => ({ ...prev, [field]: value }))
  }
  const toggleHobby = (h: string) => setSaq(prev => ({ ...prev, personalHobbies: prev.personalHobbies.includes(h) ? prev.personalHobbies.filter(x => x !== h) : [...prev.personalHobbies, h] }))
  const toggleInterest = (i: string) => setSaq(prev => ({ ...prev, professionalInterests: prev.professionalInterests.includes(i) ? prev.professionalInterests.filter(x => x !== i) : [...prev.professionalInterests, i] }))

  async function handleImport() {
    if (!importUrl.trim()) return; setImportLoading(true)
    try {
      const res = await fetch('/api/candidate/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: importUrl }) })
      if (res.ok) { const d = await res.json() as { bio?: string }; if (d.bio) setBio(d.bio); setImportDone(true) }
    } catch { /* silent — user can type manually */ }
    setImportLoading(false)
  }

  const canContinue = isCurrentComplete()
  const isLast = phase === 5
  const phaseData = PHASES.find(p => p.num === phase)!
  const heading = PHASE_HEADINGS[phase - 1]!

  return (
    <div className="min-h-screen flex flex-col" style={{ cursor: 'none', background: '#04071a' }}>
      <AuroraBackground />
      <CustomCursor />

      {/* Unlock toast */}
      {unlockToast && <UnlockToast phase={unlockToast} onDone={() => { setPhase(unlockToast); setUnlockToast(null) }} />}

      {/* Verify nudge */}
      {showVerifyNudge && <VerifyNudgeModal onVerify={() => setShowVerifyNudge(false)} onSkip={async () => { setShowVerifyNudge(false); await advancePhase() }} />}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
            C
          </div>
          <span className="text-slate-200 font-semibold text-sm tracking-tight">Career OS</span>
        </div>
        <button onClick={() => router.push('/dashboard')} className="text-slate-600 hover:text-slate-400 text-xs transition-colors tracking-wide">
          Save & exit
        </button>
      </header>

      {/* Phase progress */}
      <div className="relative z-10 px-6 pt-6 pb-2 flex-shrink-0">
        <PhaseProgress currentPhase={phase} completedPhases={completedPhases} />
      </div>

      {/* Scrollable content */}
      <div ref={contentRef} className="relative z-10 flex-1 overflow-y-auto px-4 pb-36">
        <div className="max-w-lg mx-auto">
          {/* Heading */}
          <div className="mb-6 px-1">
            <h1 className={`text-3xl font-bold tracking-tight bg-gradient-to-r ${phaseData.gradient} bg-clip-text text-transparent animate-shimmer`}
              style={{ backgroundSize: '200% 200%' }}>
              {heading.line1}
            </h1>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">{heading.sub}</p>
          </div>

          {/* Glass card */}
          <div className={`rounded-3xl p-6 transition-all duration-700 ${isIdle ? 'animate-card-breathe' : ''}`}
            style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: `0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 80px ${phaseData.glow}15` }}>

            {/* Top edge shimmer */}
            <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
              style={{ background: `linear-gradient(90deg, transparent, ${phaseData.glow.replace('0.4', '0.5')}, transparent)` }} />

            {phase === 1 && <Phase1 data={identity} onChange={updateIdentity} />}
            {phase === 2 && <Phase2 entries={education} onChange={updateEdu} onAdd={() => setEducation(prev => [...prev, newEduEntry()])} onRemove={id => setEducation(prev => prev.filter(e => e.id !== id))} />}
            {phase === 3 && <Phase3 entries={workEntries} onChange={updateWork} onAdd={() => setWorkEntries(prev => [...prev, newWorkEntry()])} onRemove={id => setWorkEntries(prev => prev.filter(e => e.id !== id))} expandedVerify={expandedVerify} setExpandedVerify={setExpandedVerify} />}
            {phase === 4 && <Phase4 bio={bio} onBioChange={setBio} importUrl={importUrl} onImportUrlChange={setImportUrl} onImport={handleImport} importLoading={importLoading} importDone={importDone} />}
            {phase === 5 && <Phase5 data={saq} onChange={updateSaq} onToggleHobby={toggleHobby} onToggleInterest={toggleInterest} />}
          </div>

          {/* Completion signal */}
          {canContinue && (
            <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Phase {phase} complete — ready to continue
            </div>
          )}

          {error && <div className="mt-3 text-center text-red-400 text-xs">{error}</div>}
        </div>
      </div>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-4"
        style={{ background: 'rgba(4,7,26,0.92)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {phase > 1 && (
            <button onClick={() => setPhase(p => p - 1)} disabled={saving}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-400 disabled:opacity-40 transition-colors px-3 py-2">
              ← Back
            </button>
          )}
          <button onClick={handleContinue} disabled={(!canContinue && phase !== 3) || saving}
            className={`flex-1 rounded-2xl py-3.5 text-sm font-semibold transition-all duration-300 ${
              canContinue || phase === 3
                ? 'text-white'
                : 'bg-white/[0.06] text-slate-600 cursor-not-allowed'
            }`}
            style={canContinue || phase === 3 ? {
              background: `linear-gradient(135deg, #6366f1, #8b5cf6)`,
              boxShadow: `0 4px 24px rgba(129,140,248,0.35), 0 1px 0 rgba(255,255,255,0.1) inset`,
            } : {}}>
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : isLast ? 'Complete my profile →' : phase === 3 ? 'Continue →' : 'Save & continue →'}
          </button>
        </div>

        {/* Fine print */}
        <p className="text-center text-[10px] text-slate-800 mt-2">
          Career OS respects your data. See our{' '}
          <a href="#" className="hover:text-slate-600 underline">Privacy Policy</a>
          {' '}and{' '}
          <a href="#" className="hover:text-slate-600 underline">Terms of Use</a>
          {' '}· © 2026 Career OS. All rights reserved.
        </p>
      </div>
    </div>
  )
}
