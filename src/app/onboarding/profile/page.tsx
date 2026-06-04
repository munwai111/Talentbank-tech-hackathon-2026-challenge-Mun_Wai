'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Guided Candidate Registration — 5-Phase Wizard
//
// Phase 1 — Personal Identity   (name, DOB)
// Phase 2 — Academic Background (MQF levels, document upload)
// Phase 3 — Work Experience     (employment type, optional verification)
// Phase 4 — Resume & Portfolio  (AI import, PDF, manual)
// Phase 5 — About You           (goals, character SAQ, hobbies, intention)
//
// Design: dark-gradient full-screen, dating-app style progression,
// phase-lock system with smooth unlock animations, no information overload.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ── Constants ─────────────────────────────────────────────────────────────────

const MQF_LEVELS = [
  { value: 'high_school',    label: 'High School / SPM / STPM' },
  { value: 'mqf_1_3',       label: 'Certificate (MQF Levels 1–3)' },
  { value: 'mqf_4',         label: 'Diploma (MQF Level 4)' },
  { value: 'mqf_5',         label: 'Advanced Diploma (MQF Level 5)' },
  { value: 'mqf_6',         label: "Bachelor's Degree (MQF Level 6)" },
  { value: 'mqf_7',         label: "Master's Degree (MQF Level 7)" },
  { value: 'mqf_8',         label: 'Doctoral Degree / PhD (MQF Level 8)' },
  { value: 'professional',  label: 'Professional Certification / Qualification' },
  { value: 'self_taught',   label: 'Self-taught / Bootcamp / Online Courses' },
]

const EMPLOYMENT_TYPES = [
  { value: 'full_time',   label: 'Full-time', icon: '💼' },
  { value: 'part_time',   label: 'Part-time', icon: '⏱️' },
  { value: 'freelance',   label: 'Freelance', icon: '🧑‍💻' },
  { value: 'contract',    label: 'Contract',  icon: '📄' },
  { value: 'internship',  label: 'Internship',icon: '🎓' },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const SAQ_QUESTIONS = [
  {
    id: 'learning_agility',
    dimension: 'Learning & Growth',
    scenario: "You're assigned to lead a project in an area you've never worked in before. Your instinct is to:",
    options: [
      { key: 'a', label: 'Research independently until I feel ready, then start' },
      { key: 'b', label: 'Find someone who\'s done it before and learn from them first' },
      { key: 'c', label: 'Jump in with what I know and adapt as I go' },
      { key: 'd', label: 'Propose a small pilot before committing to the full scope' },
    ],
  },
  {
    id: 'drive',
    dimension: 'Drive & Ambition',
    scenario: 'When you set a major career goal, which best describes your approach?',
    options: [
      { key: 'a', label: 'I map milestones, track progress, and push hard on timelines' },
      { key: 'b', label: 'I stay directionally clear but stay flexible on how I get there' },
      { key: 'c', label: 'I focus on doing excellent work today — recognition will follow' },
      { key: 'd', label: 'I prefer to set goals in collaboration with those around me' },
    ],
  },
  {
    id: 'interpersonal',
    dimension: 'Working With Others',
    scenario: "A colleague you respect is taking an approach that's clearly slowing your team down. You:",
    options: [
      { key: 'a', label: 'Speak to them privately and directly — specific, not vague' },
      { key: 'b', label: 'Raise it as a team in the next retrospective' },
      { key: 'c', label: 'Absorb the slack myself to protect team output' },
      { key: 'd', label: 'Involve a manager after one direct attempt goes nowhere' },
    ],
  },
  {
    id: 'change_agility',
    dimension: 'Navigating Change',
    scenario: 'Your company announces a major pivot — your role will change significantly in 90 days. You feel:',
    options: [
      { key: 'a', label: 'Curious — this is a chance to grow in a new direction' },
      { key: 'b', label: 'Careful — I want to understand the full picture first' },
      { key: 'c', label: 'Concerned — I value stability and need time to assess' },
      { key: 'd', label: 'Energised — I was already feeling ready for something new' },
    ],
  },
  {
    id: 'resilience',
    dimension: 'Resilience',
    scenario: 'After a significant professional setback — a project that failed publicly — you typically:',
    options: [
      { key: 'a', label: 'Take time to decompress before re-engaging with full energy' },
      { key: 'b', label: 'Debrief immediately with a mentor or someone I trust' },
      { key: 'c', label: 'Analyse exactly what went wrong and build a corrective plan' },
      { key: 'd', label: 'Reset quickly and move forward — dwelling doesn\'t serve me' },
    ],
  },
]

const STRENGTH_SCENARIO = {
  id: 'strength',
  scenario: 'In a high-pressure situation with a tight deadline and an imperfect brief, you are most likely to be the person who:',
  options: [
    { key: 'a', label: 'Takes charge of coordinating the team and keeping everyone aligned' },
    { key: 'b', label: 'Dives into the problem and produces a working output fast' },
    { key: 'c', label: 'Spots the gaps in the brief and asks the clarifying questions no-one else asked' },
    { key: 'd', label: 'Keeps the group calm, focused, and moving without drama' },
  ],
}

const WEAKNESS_SCENARIO = {
  id: 'weakness',
  scenario: 'When you look back at your professional life honestly, the pattern you most want to change is:',
  options: [
    { key: 'a', label: 'I take on too much and don\'t delegate enough' },
    { key: 'b', label: 'I sometimes over-think before acting — I could move faster' },
    { key: 'c', label: 'I avoid difficult conversations longer than I should' },
    { key: 'd', label: 'I lose energy on routine tasks — I need variety to stay engaged' },
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
  'Actively job hunting — I want a new role now',
  'Passively open — not unhappy, but the right opportunity matters',
  'Building my profile for future opportunities',
  'Exploring — understanding what\'s out there for me',
  'Upskilling — growing before my next move',
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
  { num: 1, icon: '👤', title: 'Identity',   short: 'You'        },
  { num: 2, icon: '🎓', title: 'Education',  short: 'Background' },
  { num: 3, icon: '💼', title: 'Experience', short: 'Work'       },
  { num: 4, icon: '📋', title: 'Portfolio',  short: 'Resume'     },
  { num: 5, icon: '💬', title: 'About You',  short: 'Goals & SAQ'},
]

// ── Local data types ───────────────────────────────────────────────────────────

type EducationEntry = {
  id: string
  institution: string
  mqfLevel: string
  fieldOfStudy: string
  startYear: string
  endYear: string
  currentlyEnrolled: boolean
  documentName: string | null
}

type WorkEntry = {
  id: string
  jobTitle: string
  company: string
  employmentType: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyWorking: boolean
  description: string
  verificationStatus: 'unverified' | 'email_sent' | 'doc_uploaded'
  verificationEmail: string
  documentName: string | null
}

type SaqState = {
  goal1Year: string
  goal5Year: string
  dreamRole: string
  characterResponses: Record<string, string>
  strengthResponse: string
  weaknessResponse: string
  personalHobbies: string[]
  professionalInterests: string[]
  platformIntention: string
  currentSituation: string
  intentionWhy: string
}

// ── Shared input styles ────────────────────────────────────────────────────────

const INPUT = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-blue-400/60 focus:bg-white/8 transition-all'
const SELECT = `${INPUT} appearance-none cursor-pointer`
const LABEL = 'block text-xs font-medium text-zinc-400 mb-1.5'

// ── Small UI components ────────────────────────────────────────────────────────

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-full text-xs border transition-all text-left ${
        selected
          ? 'bg-blue-500/20 border-blue-400 text-blue-300'
          : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  )
}

function ScenarioCard({
  questionId, option, selected, onSelect
}: {
  questionId: string
  option: { key: string; label: string }
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border text-sm transition-all ${
        selected
          ? 'bg-blue-500/15 border-blue-400/60 text-blue-100'
          : 'bg-white/[0.03] border-white/8 text-zinc-300 hover:bg-white/6 hover:border-white/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 transition-all ${
          selected ? 'border-blue-400 bg-blue-400 text-white' : 'border-zinc-600 text-zinc-600'
        }`}>
          {questionId.slice(0,1).toUpperCase()}{option.key.toUpperCase()}
        </div>
        <span>{option.label}</span>
      </div>
    </button>
  )
}

// ── Phase progress nav ─────────────────────────────────────────────────────────

function PhaseProgress({
  currentPhase,
  completedPhases,
}: {
  currentPhase: number
  completedPhases: Set<number>
}) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {PHASES.map((phase, idx) => {
        const isCompleted = completedPhases.has(phase.num)
        const isCurrent   = currentPhase === phase.num
        const isLocked    = !isCompleted && !isCurrent && phase.num > currentPhase

        return (
          <div key={phase.num} className="flex items-center">
            {/* Connector line */}
            {idx > 0 && (
              <div className={`w-8 h-px transition-colors duration-500 ${
                completedPhases.has(phase.num - 1) ? 'bg-emerald-500' : 'bg-white/10'
              }`} />
            )}
            {/* Phase node */}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                isCompleted ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' :
                isCurrent   ? 'bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.5)] animate-pulse' :
                              'bg-white/8 border border-white/10'
              }`}>
                {isCompleted ? '✓' :
                 isLocked    ? <span className="text-zinc-600">🔒</span> :
                               <span className={isCurrent ? 'text-white font-bold' : 'text-zinc-500'}>{phase.num}</span>}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                isCurrent ? 'text-blue-300' : isCompleted ? 'text-emerald-400' : 'text-zinc-600'
              }`}>
                {phase.short}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Unlock toast ───────────────────────────────────────────────────────────────

function UnlockToast({ phase, onDone }: { phase: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  const next = PHASES.find(p => p.num === phase)
  if (!next) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-xl rounded-2xl px-8 py-6 text-center animate-bounce-in shadow-2xl">
        <div className="text-4xl mb-2">{next.icon}</div>
        <p className="text-emerald-300 font-bold text-lg">Phase {next.num} unlocked!</p>
        <p className="text-emerald-400/70 text-sm mt-1">{next.title}</p>
      </div>
    </div>
  )
}

// ── Verification modal (Phase 3) ───────────────────────────────────────────────

function VerifyNudgeModal({ onVerify, onSkip }: { onVerify: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">🏆</div>
          <h3 className="text-white font-bold text-lg">Verified candidates get hired 3× faster</h3>
          <p className="text-zinc-400 text-sm mt-2">
            Add a document or work email to any experience to unlock your
            <span className="text-blue-400"> Verified Candidate</span> badge.
          </p>
        </div>
        <div className="space-y-2 mb-5 text-sm">
          {['Blue verified badge on your profile', 'Prioritised in employer talent searches', 'Higher weighting in our match algorithm'].map(b => (
            <div key={b} className="flex items-center gap-2 text-zinc-300">
              <span className="text-emerald-400 text-xs">✓</span>
              {b}
            </div>
          ))}
        </div>
        <button
          onClick={onVerify}
          className="w-full bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl py-3 text-sm transition-all mb-2"
        >
          Add verification now
        </button>
        <button
          onClick={onSkip}
          className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition-colors"
        >
          Skip this time — I&apos;ll verify later
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — Personal Identity
// ─────────────────────────────────────────────────────────────────────────────

function Phase1({
  data, onChange
}: {
  data: { firstName: string; middleName: string; lastName: string; dateOfBirth: string }
  onChange: (k: string, v: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Nice to meet you.</h2>
        <p className="text-zinc-400 text-sm">
          Enter your name exactly as it appears on your government-issued ID.
          This is how employers will see you.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>First name <span className="text-blue-400">*</span></label>
          <input className={INPUT} placeholder="e.g. Ahmad" value={data.firstName}
            onChange={e => onChange('firstName', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Last name <span className="text-blue-400">*</span></label>
          <input className={INPUT} placeholder="e.g. Razali" value={data.lastName}
            onChange={e => onChange('lastName', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={LABEL}>Middle name <span className="text-zinc-600">(optional)</span></label>
        <input className={INPUT} placeholder="e.g. bin / binti / —" value={data.middleName}
          onChange={e => onChange('middleName', e.target.value)} />
      </div>

      <div>
        <label className={LABEL}>Date of birth <span className="text-blue-400">*</span></label>
        <input type="date" className={INPUT} value={data.dateOfBirth}
          onChange={e => onChange('dateOfBirth', e.target.value)}
          max={new Date(Date.now() - 16 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]} />
        <p className="text-xs text-zinc-600 mt-1">
          This is kept private and used only to verify you are 16 or older.
        </p>
      </div>

      <div className="bg-blue-500/8 border border-blue-400/20 rounded-2xl p-4 text-xs text-zinc-400">
        <span className="text-blue-400 font-medium">🔒 Privacy note — </span>
        Your legal name and date of birth are private. Employers only see the name you confirm for your public profile in a later step.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Academic Background
// ─────────────────────────────────────────────────────────────────────────────

function Phase2({
  entries, onChange, onAdd, onRemove
}: {
  entries: EducationEntry[]
  onChange: (id: string, field: string, value: string | boolean | null) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 40 }, (_, i) => String(currentYear - i))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Your academic background.</h2>
        <p className="text-zinc-400 text-sm">
          Add your education history, starting from your most recent or current qualification.
          Malaysia uses the MQF (Malaysian Qualifications Framework) — select the level that fits.
        </p>
      </div>

      {entries.map((entry, idx) => (
        <div key={entry.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-medium text-sm">
              {idx === 0 ? 'Most recent education' : `Education ${idx + 1}`}
            </span>
            {entries.length > 1 && (
              <button onClick={() => onRemove(entry.id)}
                className="text-xs text-zinc-600 hover:text-red-400 transition-colors">
                Remove
              </button>
            )}
          </div>

          <div>
            <label className={LABEL}>Institution name <span className="text-blue-400">*</span></label>
            <input className={INPUT} placeholder="e.g. Universiti Malaya, INTI, UniKL"
              value={entry.institution}
              onChange={e => onChange(entry.id, 'institution', e.target.value)} />
          </div>

          <div>
            <label className={LABEL}>Qualification level <span className="text-blue-400">*</span></label>
            <select className={SELECT} value={entry.mqfLevel}
              onChange={e => onChange(entry.id, 'mqfLevel', e.target.value)}>
              <option value="">Select your qualification level</option>
              {MQF_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <div>
            <label className={LABEL}>Field of study / Programme</label>
            <input className={INPUT} placeholder="e.g. Computer Science, Business Administration"
              value={entry.fieldOfStudy}
              onChange={e => onChange(entry.id, 'fieldOfStudy', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Start year</label>
              <select className={SELECT} value={entry.startYear}
                onChange={e => onChange(entry.id, 'startYear', e.target.value)}>
                <option value="">Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>
                {entry.currentlyEnrolled ? 'Expected graduation' : 'Graduation year'}
              </label>
              <select className={SELECT} value={entry.endYear}
                onChange={e => onChange(entry.id, 'endYear', e.target.value)}
                disabled={entry.currentlyEnrolled && !entry.endYear}>
                <option value="">Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => onChange(entry.id, 'currentlyEnrolled', !entry.currentlyEnrolled)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                entry.currentlyEnrolled ? 'bg-blue-500 border-blue-500' : 'border-zinc-600 bg-transparent'
              }`}
            >
              {entry.currentlyEnrolled && <span className="text-white text-xs">✓</span>}
            </div>
            <span className="text-zinc-300 text-sm">I am currently enrolled here</span>
          </label>

          {/* Document upload */}
          <div className="border border-dashed border-white/15 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📎</div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-300 text-sm font-medium">
                  Upload proof of qualification <span className="text-zinc-600">(optional)</span>
                </p>
                <p className="text-zinc-600 text-xs mt-0.5">
                  Transcript, certificate, or offer of admission — PDF or image, max 10MB
                </p>
                {entry.documentName ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-emerald-400 text-xs">✓ {entry.documentName}</span>
                    <button onClick={() => onChange(entry.id, 'documentName', null)}
                      className="text-xs text-zinc-600 hover:text-red-400">Remove</button>
                  </div>
                ) : (
                  <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) onChange(entry.id, 'documentName', file.name)
                      }} />
                    Choose file →
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={onAdd}
        className="w-full border border-dashed border-white/15 rounded-2xl py-3 text-sm text-zinc-500 hover:text-zinc-300 hover:border-white/25 transition-all">
        + Add another qualification
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — Work Experience
// ─────────────────────────────────────────────────────────────────────────────

function Phase3({
  entries, onChange, onAdd, onRemove, expandedVerify, setExpandedVerify
}: {
  entries: WorkEntry[]
  onChange: (id: string, field: string, value: string | boolean | null) => void
  onAdd: () => void
  onRemove: (id: string) => void
  expandedVerify: string | null
  setExpandedVerify: (id: string | null) => void
}) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 40 }, (_, i) => String(currentYear - i))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Your work experience.</h2>
        <p className="text-zinc-400 text-sm">
          Include all types — full-time, part-time, freelance, contracts, and internships all count.
          This section is optional, but verified experience makes your profile stand out.
        </p>
      </div>

      {entries.map((entry, idx) => (
        <div key={entry.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium text-sm">
              {idx === 0 ? 'Most recent role' : `Role ${idx + 1}`}
            </span>
            <div className="flex items-center gap-3">
              {entry.verificationStatus !== 'unverified' && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  entry.verificationStatus === 'doc_uploaded'
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                    : 'bg-blue-500/15 border-blue-400/40 text-blue-300'
                }`}>
                  {entry.verificationStatus === 'doc_uploaded' ? '✓ Document uploaded' : '📧 Email sent'}
                </span>
              )}
              {entries.length > 0 && (
                <button onClick={() => onRemove(entry.id)}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors">Remove</button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={LABEL}>Job title <span className="text-blue-400">*</span></label>
              <input className={INPUT} placeholder="e.g. Software Engineer, Marketing Executive"
                value={entry.jobTitle}
                onChange={e => onChange(entry.id, 'jobTitle', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Company / Organisation <span className="text-blue-400">*</span></label>
              <input className={INPUT} placeholder="e.g. Grab, Maybank, Self-employed"
                value={entry.company}
                onChange={e => onChange(entry.id, 'company', e.target.value)} />
            </div>
          </div>

          {/* Employment type */}
          <div>
            <label className={LABEL}>Employment type <span className="text-blue-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map(et => (
                <button key={et.value} type="button"
                  onClick={() => onChange(entry.id, 'employmentType', et.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    entry.employmentType === et.value
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/25'
                  }`}>
                  {et.icon} {et.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Start</label>
              <div className="grid grid-cols-2 gap-1.5">
                <select className={SELECT} value={entry.startMonth}
                  onChange={e => onChange(entry.id, 'startMonth', e.target.value)}>
                  <option value="">Mon</option>
                  {MONTHS.map((m,i) => <option key={m} value={String(i+1)}>{m}</option>)}
                </select>
                <select className={SELECT} value={entry.startYear}
                  onChange={e => onChange(entry.id, 'startYear', e.target.value)}>
                  <option value="">Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>{entry.currentlyWorking ? 'Present' : 'End'}</label>
              {entry.currentlyWorking ? (
                <div className={`${INPUT} text-zinc-500`}>Now</div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <select className={SELECT} value={entry.endMonth}
                    onChange={e => onChange(entry.id, 'endMonth', e.target.value)}>
                    <option value="">Mon</option>
                    {MONTHS.map((m,i) => <option key={m} value={String(i+1)}>{m}</option>)}
                  </select>
                  <select className={SELECT} value={entry.endYear}
                    onChange={e => onChange(entry.id, 'endYear', e.target.value)}>
                    <option value="">Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div onClick={() => onChange(entry.id, 'currentlyWorking', !entry.currentlyWorking)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                entry.currentlyWorking ? 'bg-blue-500 border-blue-500' : 'border-zinc-600'
              }`}>
              {entry.currentlyWorking && <span className="text-white text-xs">✓</span>}
            </div>
            <span className="text-zinc-300 text-sm">I currently work here</span>
          </label>

          <div>
            <label className={LABEL}>What did you do here? <span className="text-zinc-600">(optional)</span></label>
            <textarea className={`${INPUT} resize-none`} rows={2}
              placeholder="Key responsibilities or achievements — one to two sentences is enough"
              value={entry.description}
              onChange={e => onChange(entry.id, 'description', e.target.value)} />
          </div>

          {/* Verify section */}
          {entry.verificationStatus === 'unverified' && (
            <button onClick={() => setExpandedVerify(expandedVerify === entry.id ? null : entry.id)}
              className="w-full border border-dashed border-blue-400/30 rounded-xl py-3 text-xs text-blue-400 hover:bg-blue-500/8 transition-all flex items-center justify-center gap-2">
              <span>🏆</span>
              <span>Verify this experience for a profile boost →</span>
            </button>
          )}

          {expandedVerify === entry.id && (
            <div className="bg-blue-500/8 border border-blue-400/20 rounded-2xl p-4 space-y-4">
              <p className="text-blue-300 text-xs font-medium">Choose your verification method:</p>

              {/* Option A: Work email */}
              <div className="space-y-2">
                <p className="text-zinc-300 text-xs">📧 <strong>Work email</strong> — we&apos;ll send a one-click verification link</p>
                <div className="flex gap-2">
                  <input className={`${INPUT} flex-1`} type="email"
                    placeholder="yourname@company.com"
                    value={entry.verificationEmail}
                    onChange={e => onChange(entry.id, 'verificationEmail', e.target.value)} />
                  <button
                    onClick={() => {
                      if (entry.verificationEmail.includes('@')) {
                        onChange(entry.id, 'verificationStatus', 'email_sent')
                        setExpandedVerify(null)
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-400 transition-all whitespace-nowrap">
                    Send link
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-zinc-700">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs">or</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Option B: Document upload */}
              <div>
                <p className="text-zinc-300 text-xs mb-2">📄 <strong>Upload a document</strong> — salary slip, EPF statement, LHDN contribution, or offer letter</p>
                <label className="flex items-center gap-2 border border-dashed border-white/15 rounded-xl p-3 cursor-pointer hover:border-white/25 transition-colors">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onChange(entry.id, 'documentName', file.name)
                        onChange(entry.id, 'verificationStatus', 'doc_uploaded')
                        setExpandedVerify(null)
                      }
                    }} />
                  <span className="text-zinc-500 text-xs">Choose file (PDF, JPG, PNG — max 10MB)</span>
                </label>
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={onAdd}
        className="w-full border border-dashed border-white/15 rounded-2xl py-3 text-sm text-zinc-500 hover:text-zinc-300 hover:border-white/25 transition-all">
        + Add a role
      </button>

      <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-4 text-xs text-zinc-500">
        <p className="font-medium text-zinc-400 mb-1">This section is optional.</p>
        <p>You can skip it now and add work experience from your profile later. Fresh graduates or students — don&apos;t worry, the other phases matter more for your matching score.</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4 — Resume & Portfolio
// ─────────────────────────────────────────────────────────────────────────────

function Phase4({
  bio, onBioChange, importUrl, onImportUrlChange, onImport, importLoading, importDone
}: {
  bio: string
  onBioChange: (v: string) => void
  importUrl: string
  onImportUrlChange: (v: string) => void
  onImport: () => void
  importLoading: boolean
  importDone: boolean
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Your professional story.</h2>
        <p className="text-zinc-400 text-sm">
          Import your CV, paste a LinkedIn URL, or write a short bio. Our AI will extract your
          skills and build your profile automatically.
        </p>
      </div>

      {/* Option A: AI URL import */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🔗</span>
          <span className="text-white font-medium text-sm">Import from LinkedIn or personal site</span>
          <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">AI-powered</span>
        </div>
        <p className="text-zinc-500 text-xs">Paste your LinkedIn profile URL, personal website, or portfolio link — Claude will extract your experience and skills automatically.</p>
        <div className="flex gap-2">
          <input className={`${INPUT} flex-1`} type="url" placeholder="https://linkedin.com/in/yourname"
            value={importUrl} onChange={e => onImportUrlChange(e.target.value)} />
          <button onClick={onImport} disabled={importLoading || !importUrl.trim()}
            className="px-4 py-2 bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-medium hover:bg-blue-400 transition-all whitespace-nowrap min-w-[80px]">
            {importLoading ? '...' : importDone ? '✓ Done' : 'Import'}
          </button>
        </div>
        {importDone && (
          <p className="text-emerald-400 text-xs">✓ Skills and experience extracted — you can review them in your profile after registration.</p>
        )}
      </div>

      <div className="flex items-center gap-3 text-zinc-600">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-xs">or write your own</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Option B: Manual bio */}
      <div>
        <label className={LABEL}>Professional bio / summary <span className="text-blue-400">*</span></label>
        <textarea
          className={`${INPUT} resize-none`} rows={5}
          placeholder="Describe your professional background, skills, and what you're looking for next. Two to four sentences works well.&#10;&#10;e.g. I'm a data analyst with 3 years of experience in e-commerce and fintech. I'm strong in SQL, Python, and data storytelling, and I'm currently looking to move into a data engineering role..."
          value={bio}
          onChange={e => onBioChange(e.target.value)}
        />
        <p className="text-xs text-zinc-600 mt-1.5">{bio.length} characters</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — About You (SAQ)
// ─────────────────────────────────────────────────────────────────────────────

function Phase5({
  data, onChange, onToggleHobby, onToggleInterest
}: {
  data: SaqState
  onChange: (field: string, value: string) => void
  onToggleHobby: (h: string) => void
  onToggleInterest: (i: string) => void
}) {
  const [saqSection, setSaqSection] = useState(0)

  const SAQ_SECTIONS = [
    { id: 'goals',     label: 'Goals',       icon: '🎯' },
    { id: 'character', label: 'Character',   icon: '🧠' },
    { id: 'hobbies',   label: 'Interests',   icon: '✨' },
    { id: 'scenarios', label: 'Strengths',   icon: '💪' },
    { id: 'intention', label: 'Intention',   icon: '🔮' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">The real you.</h2>
        <p className="text-zinc-400 text-sm">
          These answers shape how our AI connects you to the right roles and employers.
          No right or wrong — be honest, not impressive.
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {SAQ_SECTIONS.map((s, i) => (
          <button key={s.id} onClick={() => setSaqSection(i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all flex-shrink-0 ${
              saqSection === i
                ? 'bg-blue-500/20 border border-blue-400/40 text-blue-300 font-medium'
                : 'bg-white/5 border border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Section 0: Goals */}
      {saqSection === 0 && (
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Where do you want to be in 1 year? <span className="text-blue-400">*</span></label>
            <textarea className={`${INPUT} resize-none`} rows={2}
              placeholder="e.g. I want to be leading a small data team and owning our analytics infrastructure end-to-end"
              value={data.goal1Year} onChange={e => onChange('goal1Year', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>And in 5 years? <span className="text-blue-400">*</span></label>
            <textarea className={`${INPUT} resize-none`} rows={2}
              placeholder="e.g. Head of Data or CTO at a Series B startup, or running my own consultancy"
              value={data.goal5Year} onChange={e => onChange('goal5Year', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Dream role — if you could design it yourself</label>
            <input className={INPUT} placeholder="e.g. Principal AI Researcher at a healthcare company"
              value={data.dreamRole} onChange={e => onChange('dreamRole', e.target.value)} />
          </div>
          <button onClick={() => setSaqSection(1)}
            className="w-full bg-blue-500/15 border border-blue-400/30 text-blue-300 rounded-xl py-2.5 text-sm hover:bg-blue-500/20 transition-all">
            Next: Character assessment →
          </button>
        </div>
      )}

      {/* Section 1: Character SAQ */}
      {saqSection === 1 && (
        <div className="space-y-6">
          <p className="text-zinc-500 text-xs">5 scenario-based questions. Pick the response that best describes how you actually behave — not how you wish you did.</p>
          {SAQ_QUESTIONS.map(q => (
            <div key={q.id} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{q.dimension}</span>
              </div>
              <p className="text-zinc-200 text-sm font-medium leading-snug">{q.scenario}</p>
              <div className="grid grid-cols-1 gap-2">
                {q.options.map(opt => (
                  <ScenarioCard key={opt.key} questionId={q.id} option={opt}
                    selected={data.characterResponses[q.id] === opt.key}
                    onSelect={() => onChange(`character_${q.id}`, opt.key)} />
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setSaqSection(2)}
            className="w-full bg-blue-500/15 border border-blue-400/30 text-blue-300 rounded-xl py-2.5 text-sm hover:bg-blue-500/20 transition-all">
            Next: Interests →
          </button>
        </div>
      )}

      {/* Section 2: Hobbies */}
      {saqSection === 2 && (
        <div className="space-y-5">
          <div>
            <label className={LABEL}>Personal hobbies & interests</label>
            <div className="flex flex-wrap gap-2">
              {PERSONAL_HOBBIES.map(h => (
                <Pill key={h} label={h} selected={data.personalHobbies.includes(h)}
                  onClick={() => onToggleHobby(h)} />
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Professional interests — what excites you outside your job</label>
            <div className="flex flex-wrap gap-2">
              {PROFESSIONAL_INTERESTS.map(i => (
                <Pill key={i} label={i} selected={data.professionalInterests.includes(i)}
                  onClick={() => onToggleInterest(i)} />
              ))}
            </div>
          </div>
          <button onClick={() => setSaqSection(3)}
            className="w-full bg-blue-500/15 border border-blue-400/30 text-blue-300 rounded-xl py-2.5 text-sm hover:bg-blue-500/20 transition-all">
            Next: Strengths & weaknesses →
          </button>
        </div>
      )}

      {/* Section 3: Strengths & weaknesses */}
      {saqSection === 3 && (
        <div className="space-y-6">
          <p className="text-zinc-500 text-xs">Two honest scenarios. These help employers understand how you work, not how you perform in interviews.</p>

          <div className="space-y-2">
            <p className="text-zinc-200 text-sm font-medium leading-snug">{STRENGTH_SCENARIO.scenario}</p>
            <div className="grid grid-cols-1 gap-2">
              {STRENGTH_SCENARIO.options.map(opt => (
                <ScenarioCard key={opt.key} questionId="strength" option={opt}
                  selected={data.strengthResponse === opt.key}
                  onSelect={() => onChange('strengthResponse', opt.key)} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-zinc-200 text-sm font-medium leading-snug">{WEAKNESS_SCENARIO.scenario}</p>
            <div className="grid grid-cols-1 gap-2">
              {WEAKNESS_SCENARIO.options.map(opt => (
                <ScenarioCard key={opt.key} questionId="weakness" option={opt}
                  selected={data.weaknessResponse === opt.key}
                  onSelect={() => onChange('weaknessResponse', opt.key)} />
              ))}
            </div>
          </div>

          <button onClick={() => setSaqSection(4)}
            className="w-full bg-blue-500/15 border border-blue-400/30 text-blue-300 rounded-xl py-2.5 text-sm hover:bg-blue-500/20 transition-all">
            Last section: Intention →
          </button>
        </div>
      )}

      {/* Section 4: Platform intention */}
      {saqSection === 4 && (
        <div className="space-y-5">
          <div>
            <label className={LABEL}>Why are you here? <span className="text-blue-400">*</span></label>
            <div className="space-y-2">
              {PLATFORM_INTENTIONS.map(intent => (
                <button key={intent} type="button"
                  onClick={() => onChange('platformIntention', intent)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    data.platformIntention === intent
                      ? 'bg-blue-500/15 border-blue-400/50 text-blue-100'
                      : 'bg-white/[0.03] border-white/8 text-zinc-300 hover:bg-white/6 hover:border-white/20'
                  }`}>
                  {data.platformIntention === intent
                    ? <span className="text-blue-400 mr-2">●</span>
                    : <span className="text-zinc-700 mr-2">○</span>}
                  {intent}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL}>Current situation <span className="text-blue-400">*</span></label>
            <div className="space-y-2">
              {CURRENT_SITUATIONS.map(s => (
                <button key={s} type="button"
                  onClick={() => onChange('currentSituation', s)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    data.currentSituation === s
                      ? 'bg-blue-500/15 border-blue-400/50 text-blue-100'
                      : 'bg-white/[0.03] border-white/8 text-zinc-300 hover:bg-white/6 hover:border-white/20'
                  }`}>
                  {data.currentSituation === s
                    ? <span className="text-blue-400 mr-2">●</span>
                    : <span className="text-zinc-700 mr-2">○</span>}
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL}>Anything else you want us to know? <span className="text-zinc-600">(optional)</span></label>
            <textarea className={`${INPUT} resize-none`} rows={3}
              placeholder="Context helps our AI give you better matches and coaching. e.g. I'm returning after a 2-year career break and want to pivot into product management..."
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
  const [phase, setPhase] = useState(1)
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set())
  const [unlockToast, setUnlockToast] = useState<number | null>(null)
  const [showVerifyNudge, setShowVerifyNudge] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Phase 1 state
  const [identity, setIdentity] = useState({ firstName: '', middleName: '', lastName: '', dateOfBirth: '' })

  // Phase 2 state
  const [education, setEducation] = useState<EducationEntry[]>([newEduEntry()])

  // Phase 3 state
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([newWorkEntry()])
  const [expandedVerify, setExpandedVerify] = useState<string | null>(null)

  // Phase 4 state
  const [bio, setBio] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importDone, setImportDone] = useState(false)

  // Phase 5 state
  const [saq, setSaq] = useState<SaqState>({
    goal1Year: '', goal5Year: '', dreamRole: '',
    characterResponses: {},
    strengthResponse: '', weaknessResponse: '',
    personalHobbies: [], professionalInterests: [],
    platformIntention: '', currentSituation: '', intentionWhy: '',
  })

  // ── Phase completion checks ────────────────────────────────────────────────

  const isPhase1Complete = useCallback(() =>
    identity.firstName.trim().length >= 2 &&
    identity.lastName.trim().length >= 2 &&
    identity.dateOfBirth.length === 10,
  [identity])

  const isPhase2Complete = useCallback(() =>
    education.some(e => e.institution.trim() && e.mqfLevel),
  [education])

  const isPhase3Complete = useCallback(() => true, []) // optional

  const isPhase4Complete = useCallback(() =>
    bio.trim().length >= 30 || importDone,
  [bio, importDone])

  const isPhase5Complete = useCallback(() =>
    saq.goal1Year.trim().length >= 10 &&
    saq.goal5Year.trim().length >= 10 &&
    Object.keys(saq.characterResponses).length >= 3 &&
    saq.platformIntention.length > 0 &&
    saq.currentSituation.length > 0,
  [saq])

  const isCurrentPhaseComplete = useCallback(() => {
    switch (phase) {
      case 1: return isPhase1Complete()
      case 2: return isPhase2Complete()
      case 3: return isPhase3Complete()
      case 4: return isPhase4Complete()
      case 5: return isPhase5Complete()
      default: return false
    }
  }, [phase, isPhase1Complete, isPhase2Complete, isPhase3Complete, isPhase4Complete, isPhase5Complete])

  // ── Save and advance ───────────────────────────────────────────────────────

  async function savePhase(p: number) {
    setSaving(true)
    setError(null)

    try {
      let body: Record<string, unknown> = { phase: p }

      switch (p) {
        case 1:
          body = { phase: 1, firstName: identity.firstName, middleName: identity.middleName, lastName: identity.lastName, dateOfBirth: identity.dateOfBirth }
          break
        case 2:
          body = {
            phase: 2,
            education: education.filter(e => e.institution.trim()).map(e => ({
              institution: e.institution,
              degree: e.mqfLevel,
              field: e.fieldOfStudy || null,
              graduation_year: e.endYear ? parseInt(e.endYear) : null,
              mqf_level: e.mqfLevel,
              start_year: e.startYear ? parseInt(e.startYear) : null,
              currently_enrolled: e.currentlyEnrolled,
              document_uploaded: !!e.documentName,
            })),
          }
          break
        case 3:
          body = {
            phase: 3,
            workExperience: workEntries.filter(e => e.jobTitle.trim() && e.company.trim()).map(e => ({
              title: e.jobTitle,
              company: e.company,
              start_date: e.startYear ? `${e.startYear}-${e.startMonth.padStart(2,'0')}` : null,
              end_date: e.currentlyWorking ? null : (e.endYear ? `${e.endYear}-${e.endMonth.padStart(2,'0')}` : null),
              duration_months: null,
              description: e.description || null,
              key_technologies: [],
              employment_type: e.employmentType as 'full_time' | 'part_time' | 'freelance' | 'contract' | 'internship' || null,
              verification_status: e.verificationStatus === 'doc_uploaded' ? 'document_uploaded' : e.verificationStatus === 'email_sent' ? 'email_sent' : 'unverified',
              verification_email: e.verificationEmail || null,
            })),
          }
          break
        case 4:
          body = { phase: 4, bio: bio.trim() || undefined }
          break
        case 5:
          body = {
            phase: 5,
            complete: true,
            saqData: {
              goal_1_year: saq.goal1Year,
              goal_5_year: saq.goal5Year,
              dream_role: saq.dreamRole || null,
              character_responses: saq.characterResponses,
              personal_hobbies: saq.personalHobbies,
              professional_interests: saq.professionalInterests,
              strength_scenario: saq.strengthResponse || null,
              weakness_scenario: saq.weaknessResponse || null,
              platform_intention: saq.platformIntention,
              current_situation_intent: saq.currentSituation,
              intention_why: saq.intentionWhy || null,
            },
          }
          break
      }

      const res = await fetch('/api/candidate/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Save failed — please try again')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
      return false
    }

    setSaving(false)
    return true
  }

  async function handleContinue() {
    if (!isCurrentPhaseComplete() && phase !== 3) return

    // Phase 3: check if no entries are verified — show nudge
    if (phase === 3) {
      const hasEntries = workEntries.some(e => e.jobTitle.trim() && e.company.trim())
      const hasVerified = workEntries.some(e => e.verificationStatus !== 'unverified')
      if (hasEntries && !hasVerified) {
        setShowVerifyNudge(true)
        return
      }
    }

    await advancePhase()
  }

  async function advancePhase() {
    const ok = await savePhase(phase)
    if (!ok) return

    const newCompleted = new Set(completedPhases)
    newCompleted.add(phase)
    setCompletedPhases(newCompleted)

    if (phase < 5) {
      setUnlockToast(phase + 1)
    } else {
      router.push('/dashboard')
    }
  }

  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [phase])

  // ── Identity field updater ─────────────────────────────────────────────────
  function updateIdentity(k: string, v: string) {
    setIdentity(prev => ({ ...prev, [k]: v }))
  }

  // ── Education updaters ─────────────────────────────────────────────────────
  function updateEdu(id: string, field: string, value: string | boolean | null) {
    setEducation(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  // ── Work updaters ──────────────────────────────────────────────────────────
  function updateWork(id: string, field: string, value: string | boolean | null) {
    setWorkEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  // ── SAQ updaters ───────────────────────────────────────────────────────────
  function updateSaq(field: string, value: string) {
    if (field.startsWith('character_')) {
      const qId = field.replace('character_', '')
      setSaq(prev => ({ ...prev, characterResponses: { ...prev.characterResponses, [qId]: value } }))
    } else {
      setSaq(prev => ({ ...prev, [field]: value }))
    }
  }
  function toggleHobby(h: string) {
    setSaq(prev => ({
      ...prev,
      personalHobbies: prev.personalHobbies.includes(h)
        ? prev.personalHobbies.filter(x => x !== h)
        : [...prev.personalHobbies, h],
    }))
  }
  function toggleInterest(i: string) {
    setSaq(prev => ({
      ...prev,
      professionalInterests: prev.professionalInterests.includes(i)
        ? prev.professionalInterests.filter(x => x !== i)
        : [...prev.professionalInterests, i],
    }))
  }

  // ── AI import ──────────────────────────────────────────────────────────────
  async function handleImport() {
    if (!importUrl.trim()) return
    setImportLoading(true)
    try {
      const res = await fetch('/api/candidate/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      })
      if (res.ok) {
        const data = await res.json() as { bio?: string }
        if (data.bio) setBio(data.bio)
        setImportDone(true)
      }
    } catch {
      // Silent — user can still type manually
    }
    setImportLoading(false)
  }

  const canContinue = isCurrentPhaseComplete()
  const isLastPhase = phase === 5

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 flex flex-col">

      {/* Unlock toast */}
      {unlockToast && (
        <UnlockToast phase={unlockToast} onDone={() => {
          setPhase(unlockToast)
          setUnlockToast(null)
        }} />
      )}

      {/* Verify nudge modal */}
      {showVerifyNudge && (
        <VerifyNudgeModal
          onVerify={() => setShowVerifyNudge(false)}
          onSkip={async () => { setShowVerifyNudge(false); await advancePhase() }}
        />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm font-bold">C</div>
          <span className="text-white font-semibold text-sm hidden sm:block">Career OS</span>
        </div>
        <div className="text-xs text-zinc-500">
          Phase {phase} of 5 — {PHASES[phase - 1]?.title}
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Save & exit
        </button>
      </header>

      {/* Phase progress */}
      <div className="px-6 pt-8 pb-2 flex-shrink-0">
        <PhaseProgress currentPhase={phase} completedPhases={completedPhases} />
      </div>

      {/* Scrollable content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-4 pb-36">
        <div className="max-w-lg mx-auto">
          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 shadow-2xl">
            {phase === 1 && <Phase1 data={identity} onChange={updateIdentity} />}
            {phase === 2 && (
              <Phase2
                entries={education}
                onChange={updateEdu}
                onAdd={() => setEducation(prev => [...prev, newEduEntry()])}
                onRemove={id => setEducation(prev => prev.filter(e => e.id !== id))}
              />
            )}
            {phase === 3 && (
              <Phase3
                entries={workEntries}
                onChange={updateWork}
                onAdd={() => setWorkEntries(prev => [...prev, newWorkEntry()])}
                onRemove={id => setWorkEntries(prev => prev.filter(e => e.id !== id))}
                expandedVerify={expandedVerify}
                setExpandedVerify={setExpandedVerify}
              />
            )}
            {phase === 4 && (
              <Phase4
                bio={bio} onBioChange={setBio}
                importUrl={importUrl} onImportUrlChange={setImportUrl}
                onImport={handleImport}
                importLoading={importLoading} importDone={importDone}
              />
            )}
            {phase === 5 && (
              <Phase5
                data={saq}
                onChange={updateSaq}
                onToggleHobby={toggleHobby}
                onToggleInterest={toggleInterest}
              />
            )}
          </div>

          {/* Completion indicator */}
          {canContinue && (
            <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 text-xs animate-pulse">
              <span>✓</span>
              <span>Phase {phase} complete — ready to continue</span>
            </div>
          )}

          {error && (
            <div className="mt-3 text-center text-red-400 text-xs">{error}</div>
          )}
        </div>
      </div>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur border-t border-white/5 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {phase > 1 && (
            <button
              onClick={() => setPhase(p => p - 1)}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition-colors px-3 py-2"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={(!canContinue && phase !== 3) || saving}
            className={`flex-1 rounded-2xl py-3.5 text-sm font-semibold transition-all ${
              canContinue || phase === 3
                ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                : 'bg-white/5 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' :
             isLastPhase ? 'Complete registration →' :
             phase === 3 ? 'Continue →' :
             'Save & continue →'}
          </button>
        </div>

        {/* Fine print */}
        <p className="text-center text-[10px] text-zinc-700 mt-2">
          Career OS respects your data. See our{' '}
          <a href="#" className="underline hover:text-zinc-500">Privacy Policy</a>
          {' '}and{' '}
          <a href="#" className="underline hover:text-zinc-500">Terms of Use</a>.
          {' '}© 2026 Career OS. All rights reserved.
        </p>
      </div>
    </div>
  )
}
