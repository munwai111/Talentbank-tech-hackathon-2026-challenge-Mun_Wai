'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, Wrench, Trophy, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import type { CandidateProfile, Skill, PortfolioItem, WorkExperienceEntry, EducationEntry } from '@/types/database'
import type { ExtractedProfile } from '@/lib/ai/profile-extractor'
import type { TopSkill } from '@/app/api/candidate/top-skills/route'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type FullProfile = CandidateProfile & {
  skills: Skill[]
  portfolio_items: PortfolioItem[]
  work_experience: WorkExperienceEntry[] | null
  education: EducationEntry[] | null
}

type BubblePhysics = { x: number; y: number; vx: number; vy: number }
type VaultView = 'vault' | 'expanding' | 'list' | 'collapsing'
type BubbleOrigin = { cx: number; cy: number; cr: number; color: string }

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const LEVEL_LABELS: Record<number, string> = {
  1: 'Elementary', 2: 'Beginner', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert',
}

const LEVEL_COLORS: Record<number, { badge: string; bar: string; accent: string }> = {
  1: { badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',   bar: 'bg-zinc-500',   accent: '#71717a' },
  2: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',   bar: 'bg-blue-500',   accent: '#60a5fa' },
  3: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', bar: 'bg-emerald-500', accent: '#34d399' },
  4: { badge: 'bg-violet-500/15 text-violet-400 border-violet-500/20', bar: 'bg-violet-500', accent: '#a78bfa' },
  5: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', bar: 'bg-gradient-to-r from-amber-400 to-orange-400', accent: '#fbbf24' },
}

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  manual:     { label: 'Self-reported',  color: 'bg-white/6 text-zinc-500 border-white/8' },
  import:     { label: '📄 Resume',      color: 'bg-amber-500/10 text-amber-400 border-amber-500/15' },
  github:     { label: '🐙 GitHub',      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' },
  assessment: { label: '✅ Assessed',    color: 'bg-blue-500/10 text-blue-400 border-blue-500/15' },
}

const LEVELS = [1, 2, 3, 4, 5] as const

// ─────────────────────────────────────────────────────────────
// RestructureButton
// ─────────────────────────────────────────────────────────────
function RestructureButton({
  onDone,
  workExperience,
}: {
  onDone: (updated: number) => void
  workExperience: WorkExperienceEntry[]
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const allStructured = workExperience.every(e => (e.key_impacts?.length ?? 0) > 0)
  if (allStructured) return null

  async function run() {
    setLoading(true)
    try {
      const res = await fetch('/api/candidate/work-experience/restructure', { method: 'POST' })
      const data = await res.json() as { updated?: number }
      onDone(data.updated ?? 0)
      setDone(true)
    } catch { /* silently fail */ }
    setLoading(false)
  }

  if (done) return (
    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
      <Sparkles size={11} /> Done
    </span>
  )

  return (
    <button
      onClick={run}
      disabled={loading}
      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg
        bg-indigo-500/10 text-indigo-400 border border-indigo-500/20
        hover:bg-indigo-500/20 disabled:opacity-50 transition-all whitespace-nowrap"
    >
      {loading ? (
        <><span className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />Analyzing…</>
      ) : (
        <><Sparkles size={11} />Analyze with AI</>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// WorkExperienceCard
// ─────────────────────────────────────────────────────────────
function WorkExperienceCard({ job }: { job: WorkExperienceEntry }) {
  const [expanded, setExpanded] = useState(false)
  const hasStructured = (job.key_impacts?.length ?? 0) > 0 || (job.key_skills?.length ?? 0) > 0

  const empLabel: Record<string, string> = {
    full_time: 'Full-time', part_time: 'Part-time',
    freelance: 'Freelance', contract: 'Contract', internship: 'Internship',
  }

  return (
    <div className="rounded-2xl border border-white/7 bg-white/3 overflow-hidden hover:border-white/12 transition-all duration-200">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-sm text-white leading-snug">{job.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{job.company}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {job.employment_type && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/6 text-zinc-500 border border-white/8">
                {empLabel[job.employment_type] ?? job.employment_type}
              </span>
            )}
            <span className="text-[11px] text-zinc-600 whitespace-nowrap">
              {job.start_date ?? '?'} – {job.end_date ?? 'Present'}
            </span>
          </div>
        </div>
        {job.role_context && (
          <p className="text-xs text-indigo-400/80 mt-2 italic">{job.role_context}</p>
        )}
      </div>

      {hasStructured ? (
        <div className="px-5 pb-4 space-y-4">
          {(job.key_impacts?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={11} className="text-emerald-500" strokeWidth={2} />
                <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Impact</p>
              </div>
              <ul className="space-y-1.5">
                {job.key_impacts!.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                    <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-emerald-500" />{point}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(job.achievements?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy size={11} className="text-amber-500" strokeWidth={2} />
                <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Achievements</p>
              </div>
              <ul className="space-y-1.5">
                {job.achievements!.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                    <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-amber-500" />{a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(job.key_skills?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Wrench size={11} className="text-violet-400" strokeWidth={2} />
                <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Skills applied</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.key_skills!.map(s => (
                  <span key={s} className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20 font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
          {job.key_technologies.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={11} className="text-sky-400" strokeWidth={2} />
                <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Tech stack</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.key_technologies.map(t => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-lg bg-sky-500/8 text-sky-400 border border-sky-500/15">{t}</span>
                ))}
              </div>
            </div>
          )}
          {job.description && (
            <div>
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? 'Hide full description' : 'Show full description'}
              </button>
              {expanded && (
                <p className="text-xs text-zinc-500 leading-relaxed mt-2 border-t border-white/6 pt-3">{job.description}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 pb-4">
          {job.description && <p className="text-xs text-zinc-400 leading-relaxed mb-3">{job.description}</p>}
          {job.key_technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {job.key_technologies.map(t => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/6 text-zinc-500 border border-white/8">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SkillStatsBar
// ─────────────────────────────────────────────────────────────
function SkillStatsBar({ skills }: { skills: Skill[] }) {
  const total = skills.length
  const countByLevel = LEVELS.reduce<Record<number, number>>((acc, l) => {
    acc[l] = skills.filter(s => s.level === l).length
    return acc
  }, {})

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-white/3 border border-white/7">
      <span className="text-sm font-semibold text-white mr-2">{total} Skills Total</span>
      {LEVELS.map(l => (
        <span
          key={l}
          className={`text-[11px] px-2.5 py-1 rounded-lg font-medium border ${LEVEL_COLORS[l].badge}`}
        >
          {LEVEL_LABELS[l]}: {countByLevel[l]}
        </span>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SkillPieChart (pure SVG)
// ─────────────────────────────────────────────────────────────
function SkillPieChart({ skills }: { skills: Skill[] }) {
  const total = skills.length
  if (total === 0) return null

  const countByLevel = LEVELS.reduce<Record<number, number>>((acc, l) => {
    acc[l] = skills.filter(s => s.level === l).length
    return acc
  }, {})

  const cx = 100, cy = 100, r = 70
  let startAngle = -Math.PI / 2

  const segments = LEVELS.map(level => {
    const count = countByLevel[level]
    const fraction = count / total
    const angle = fraction * 2 * Math.PI
    const endAngle = startAngle + angle

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = angle > Math.PI ? 1 : 0

    const path = count === total
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`

    const seg = { level, count, fraction, path, startAngle, endAngle }
    startAngle = endAngle
    return seg
  })

  return (
    <div className="flex items-center gap-6 p-4 rounded-xl bg-white/3 border border-white/7">
      <svg viewBox="0 0 200 200" width={160} height={160} className="shrink-0">
        {segments.map(({ level, count, path }) => (
          count > 0 ? (
            <path
              key={level}
              d={path}
              fill={LEVEL_COLORS[level].accent + '99'}
              stroke={LEVEL_COLORS[level].accent}
              strokeWidth={1.5}
            />
          ) : null
        ))}
        <circle cx={cx} cy={cy} r={38} fill="#08081a" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize={22} fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#71717a" fontSize={10}>skills</text>
      </svg>
      <div className="space-y-2 flex-1 min-w-0">
        {LEVELS.map(level => {
          const count = countByLevel[level]
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={level} className={`flex items-center gap-2 text-xs ${count === 0 ? 'opacity-40' : ''}`}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LEVEL_COLORS[level].accent }} />
              <span className="flex-1 text-zinc-300">{LEVEL_LABELS[level]}</span>
              <span className="font-semibold text-zinc-200">{count}</span>
              <span className="text-zinc-500 w-9 text-right">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TopSkillsSection
// ─────────────────────────────────────────────────────────────
function TopSkillsSection() {
  const [topSkills, setTopSkills] = useState<TopSkill[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/candidate/top-skills')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json() as { skills: TopSkill[] }
      setTopSkills(data.skills)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="rounded-xl border border-white/7 bg-white/3 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-amber-400" />
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">AI-recommended skills to develop</p>
      </div>
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      )}
      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-zinc-500 mb-2">Could not load recommendations</p>
          <Button variant="ghost" size="sm" onClick={load}>Retry</Button>
        </div>
      )}
      {topSkills && (
        <div className="space-y-2">
          {topSkills.map((skill, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white/4 hover:bg-white/6 transition-colors">
              <span className="text-xs font-bold text-zinc-600 mt-0.5 w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{skill.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{skill.reason}</p>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5 ${
                skill.demand === 'Very High'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-amber-500/15 text-amber-400'
              }`}>
                {skill.demand}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SkillDetailCard
// ─────────────────────────────────────────────────────────────
function SkillDetailCard({ skill, accentColor }: { skill: Skill; accentColor: string }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const src = SOURCE_BADGES[skill.source] ?? SOURCE_BADGES.manual

  const sourceText: Record<string, string> = {
    manual: 'self-reported by the candidate',
    import: 'extracted from an uploaded resume or CV',
    github: 'verified from GitHub repositories via AI analysis',
    assessment: 'confirmed by a skills assessment',
  }

  const fullText = `Use-case: ${skill.name} supports ${skill.source === 'github' ? 'software engineering' : 'professional'} workflows.\n\nSource: Skill is ${sourceText[skill.source] ?? 'user-provided'}.\n\nBenefit: Enhances your match score for roles requiring ${skill.name} expertise.`

  function startTyping() {
    setTyped('')
    let idx = 0
    intervalRef.current = setInterval(() => {
      idx++
      setTyped(fullText.slice(0, idx))
      if (idx >= fullText.length && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 20)
  }

  function toggle() {
    if (open) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      setTyped('')
      setOpen(false)
    } else {
      setOpen(true)
      startTyping()
    }
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const lvl = LEVEL_COLORS[skill.level] ?? LEVEL_COLORS[3]

  return (
    <div className="rounded-xl border border-white/7 bg-white/3 overflow-hidden hover:border-white/12 transition-all"
      style={{ borderLeft: `3px solid ${accentColor}33` }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-200">{skill.name}</span>
          <div className="flex gap-0.5 mt-1.5">
            {LEVELS.map(n => (
              <div key={n} className={`h-1 w-4 rounded-full ${n <= skill.level ? lvl.bar : 'bg-white/6'}`} />
            ))}
          </div>
        </div>
        <span className={`text-[11px] px-2.5 py-1 rounded-lg border shrink-0 ${src.color}`}>{src.label}</span>
        <button
          onClick={toggle}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 flex items-center gap-1"
        >
          See details {open ? '▴' : '▾'}
        </button>
      </div>
      {open && (
        <div className="px-4 pb-3 border-t border-white/6 pt-2">
          <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line font-mono">
            {typed}
            {typed.length < fullText.length && (
              <span className="inline-block w-2 animate-pulse">▌</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SkillHotBar — sticky level nav within the full-screen overlay
// ─────────────────────────────────────────────────────────────
function SkillHotBar({
  selectedLevel, skills, show, onSelect,
}: {
  selectedLevel: number; skills: Skill[]; show: boolean; onSelect: (l: number) => void
}) {
  const [opacity, setOpacity] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // After 2s of entering, fade to 35%
  useEffect(() => {
    if (!show) return
    timerRef.current = setTimeout(() => setOpacity(0.35), 2000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [show, selectedLevel])

  function resetTimer() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpacity(1)
    timerRef.current = setTimeout(() => setOpacity(0.35), 2000)
  }

  return (
    <div
      className="sticky top-0 z-20 flex justify-center pt-5 pb-3 pointer-events-auto"
      style={{
        opacity: show ? opacity : 0,
        transition: 'opacity 0.7s ease',
        animation: show ? 'hotbar-appear 0.35s cubic-bezier(0.22,1,0.36,1) forwards' : undefined,
      }}
      onMouseEnter={() => { if (timerRef.current) clearTimeout(timerRef.current); setOpacity(1) }}
      onMouseLeave={resetTimer}
    >
      <div className="flex gap-1.5 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl">
        {LEVELS.map((level, i) => {
          const count = skills.filter(s => s.level === level).length
          const accent = LEVEL_COLORS[level].accent
          const isActive = level === selectedLevel
          return (
            <button
              key={level}
              onClick={() => onSelect(level)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap"
              style={{
                color: isActive ? accent : 'rgba(255,255,255,0.45)',
                backgroundColor: isActive ? accent + '1a' : 'transparent',
                boxShadow: isActive ? `0 0 0 1.5px ${accent}90, 0 0 14px ${accent}35` : 'none',
                animation: show ? `level-btn-pop 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 60 + 280}ms both` : undefined,
              }}
            >
              {LEVEL_LABELS[level]}{count > 0 ? ` ${count}` : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SkillListPanel — animated list for a given level
// ─────────────────────────────────────────────────────────────
function SkillListPanel({
  skills, level, slideDir,
}: {
  skills: Skill[]; level: number; slideDir: 'left' | 'right' | null
}) {
  const levelSkills = skills.filter(s => s.level === level)
  const accent = LEVEL_COLORS[level]?.accent ?? '#71717a'

  const itemStyle = (i: number): React.CSSProperties => ({
    animation: `skill-item-rise 0.42s cubic-bezier(0.22,1,0.36,1) ${400 + i * 55}ms both`,
  })

  return (
    <div className="px-6 pb-12 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-5" style={{ animation: 'skill-item-rise 0.4s cubic-bezier(0.22,1,0.36,1) 350ms both' }}>
        <span className="text-2xl font-bold" style={{ color: accent }}>{levelSkills.length}</span>
        <span className="text-lg font-semibold text-white/80">{LEVEL_LABELS[level]} Skills</span>
        {levelSkills.length === 0 && <span className="text-sm text-white/40 ml-2">— nothing here yet</span>}
      </div>
      <div className="space-y-2">
        {levelSkills.map((skill, i) => (
          <div key={skill.id} style={itemStyle(i)}>
            <SkillDetailCard skill={skill} accentColor={accent} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FullScreenLevelOverlay — covers the main content area
// ─────────────────────────────────────────────────────────────
type OverlayProps = {
  vaultView: VaultView
  origin: BubbleOrigin
  selectedLevel: number
  skills: Skill[]
  onBack: () => void
  onLevelSelect: (l: number) => void
}

function FullScreenLevelOverlay({ vaultView, origin, selectedLevel, skills, onBack, onLevelSelect }: OverlayProps) {
  const [clipPath, setClipPath] = useState(`circle(${origin.cr}px at ${origin.cx}px ${origin.cy}px)`)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [displayLevel, setDisplayLevel] = useState(selectedLevel)
  const [listKey, setListKey] = useState(0)
  const showContent = vaultView === 'list'

  // Expanding: next frame trigger the CSS transition to full screen
  useEffect(() => {
    if (vaultView === 'expanding') {
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setClipPath(`circle(200% at ${origin.cx}px ${origin.cy}px)`)
        )
      )
      return () => cancelAnimationFrame(id)
    }
    if (vaultView === 'collapsing') {
      setClipPath(`circle(${origin.cr}px at ${origin.cx}px ${origin.cy}px)`)
    }
  }, [vaultView, origin])

  // Level switch: animate out then in
  function handleLevelSelect(level: number) {
    if (level === displayLevel) return
    const dir = level > displayLevel ? 'left' : 'right'
    setSlideDir(dir)
    setTimeout(() => {
      setDisplayLevel(level)
      setListKey(k => k + 1)
      setSlideDir(null)
      onLevelSelect(level)
    }, 220)
  }

  return (
    <div
      className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden"
      style={{
        clipPath,
        transition: vaultView === 'expanding'
          ? 'clip-path 0.48s cubic-bezier(0.25,0.46,0.45,0.94)'
          : vaultView === 'collapsing'
          ? 'clip-path 0.42s cubic-bezier(0.55,0,1,0.45)'
          : undefined,
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Background particle/space feel */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${origin.color}40, transparent 70%)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-8"
          style={{ background: `radial-gradient(circle, ${origin.color}25, transparent 70%)` }} />
      </div>

      {/* Back button — top left of overlay, not overlapping sidebar */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-white/50
          hover:text-white/90 transition-colors z-30 group"
        style={{ animation: showContent ? 'skill-item-rise 0.4s cubic-bezier(0.22,1,0.36,1) 200ms both' : undefined }}
      >
        <span className="text-lg leading-none group-hover:-translate-x-1 transition-transform duration-150">←</span>
        <span className="font-medium">Skills Vault</span>
      </button>

      {/* Hot bar */}
      <SkillHotBar
        selectedLevel={displayLevel}
        skills={skills}
        show={showContent}
        onSelect={handleLevelSelect}
      />

      {/* Skill list */}
      {showContent && (
        <div
          key={listKey}
          style={{
            transform: slideDir === 'left' ? 'translateX(-60px)' : slideDir === 'right' ? 'translateX(60px)' : 'none',
            opacity: slideDir ? 0 : 1,
            transition: slideDir ? 'transform 0.22s ease, opacity 0.18s ease' : undefined,
          }}
        >
          <SkillListPanel skills={skills} level={displayLevel} slideDir={slideDir} />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// BurstCanvas — canvas particle burst overlay
// ─────────────────────────────────────────────────────────────
type BurstTrigger = { x: number; y: number; color: string }

type OrbParticle = {
  x: number; y: number; vx: number; vy: number
  size: number; life: number; decay: number
}
type SparkleParticle = {
  x: number; y: number; vx: number; vy: number
  size: number; life: number; decay: number
}
type ShardParticle = {
  x: number; y: number; vx: number; vy: number
  size: number; life: number; decay: number
  rotation: number; rotSpeed: number
}
type RingState = { radius: number; life: number; decay: number; growSpeed: number; lineWidth: number; white: boolean }

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath()
  for (let arm = 0; arm < 4; arm++) {
    const a = (arm * Math.PI) / 2
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size)
    ctx.lineTo(x + Math.cos(a + Math.PI / 4) * size * 0.28, y + Math.sin(a + Math.PI / 4) * size * 0.28)
  }
  ctx.closePath()
}

function BurstCanvas({
  containerRef,
  trigger,
  onComplete,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  trigger: BurstTrigger | null
  onComplete: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!trigger) return
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctxRaw = canvas.getContext('2d')
    if (!ctxRaw) return
    const ctx: CanvasRenderingContext2D = ctxRaw
    ctx.scale(dpr, dpr)

    const { x: ox, y: oy, color: accent } = trigger

    // Orbs
    const orbs: OrbParticle[] = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5)
      const speed = 3 + Math.random() * 5
      return {
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        life: 1,
        decay: 0.018 + Math.random() * 0.012,
      }
    })

    // Sparkles
    const sparkles: SparkleParticle[] = Array.from({ length: 20 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 8
      return {
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        life: 1,
        decay: 0.025 + Math.random() * 0.025,
      }
    })

    // Shards
    const shards: ShardParticle[] = Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
      const speed = 2 + Math.random() * 4
      return {
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        life: 1,
        decay: 0.022 + Math.random() * 0.018,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.5,
      }
    })

    // Rings
    const rings: RingState[] = [
      { radius: 0, life: 1, decay: 0.035, growSpeed: 10, lineWidth: 2.5, white: false },
    ]
    let ring2Spawned = false
    let elapsed = 0

    function step() {
      ctx.clearRect(0, 0, rect.width, rect.height)
      elapsed++

      // Spawn ring2 after ~80ms (≈5 frames at 60fps)
      if (!ring2Spawned && elapsed >= 5) {
        ring2Spawned = true
        rings.push({ radius: 0, life: 1, decay: 0.025, growSpeed: 6, lineWidth: 1.5, white: true })
      }

      // Draw rings
      for (const ring of rings) {
        ring.radius += ring.growSpeed
        ring.life -= ring.decay
        if (ring.life <= 0) continue
        ctx.save()
        ctx.globalAlpha = ring.white ? ring.life * 0.25 : ring.life * 0.6
        ctx.strokeStyle = ring.white ? 'rgba(255,255,255,1)' : accent
        ctx.lineWidth = ring.lineWidth
        ctx.beginPath()
        ctx.arc(ox, oy, ring.radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // Draw orbs
      for (const p of orbs) {
        p.x += p.vx; p.y += p.vy
        p.vy += 0.08
        p.vx *= 0.965; p.vy *= 0.965
        p.life -= p.decay
        if (p.life <= 0) continue
        const alpha = Math.pow(Math.max(0, p.life), 0.7)
        ctx.save()
        ctx.globalAlpha = alpha
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        grad.addColorStop(0, 'rgba(255,255,255,1)')
        grad.addColorStop(0.3, accent)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = alpha
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Draw sparkles
      for (const p of sparkles) {
        p.x += p.vx; p.y += p.vy
        p.vy += 0.08
        p.vx *= 0.965; p.vy *= 0.965
        p.life -= p.decay
        if (p.life <= 0) continue
        ctx.save()
        ctx.globalAlpha = Math.pow(Math.max(0, p.life), 0.7)
        ctx.fillStyle = 'rgba(255,255,255,1)'
        drawSparkle(ctx, p.x, p.y, p.size)
        ctx.fill()
        ctx.restore()
      }

      // Draw shards
      for (const p of shards) {
        p.x += p.vx; p.y += p.vy
        p.vy += 0.08
        p.vx *= 0.965; p.vy *= 0.965
        p.life -= p.decay
        p.rotation += p.rotSpeed
        if (p.life <= 0) continue
        ctx.save()
        ctx.globalAlpha = Math.pow(Math.max(0, p.life), 0.7)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = accent
        ctx.fillRect(-p.size / 2, -p.size * 0.25, p.size, p.size * 0.5)
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fillRect(-p.size / 2, -p.size * 0.25, p.size, p.size * 0.1)
        ctx.restore()
      }

      const allDead =
        rings.every(r => r.life <= 0) &&
        orbs.every(p => p.life <= 0) &&
        sparkles.every(p => p.life <= 0) &&
        shards.every(p => p.life <= 0)

      if (allDead) {
        ctx.clearRect(0, 0, rect.width, rect.height)
        onComplete()
        return
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// SkillBubbleBank — glassmorphic physics bubbles
// ─────────────────────────────────────────────────────────────
type BubbleClickInfo = { level: number; cx: number; cy: number; cr: number }

function SkillBubbleBank({
  skills, isExiting, onBubbleClick,
}: {
  skills: Skill[]
  isExiting: boolean
  onBubbleClick: (info: BubbleClickInfo) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const statesRef = useRef<BubblePhysics[]>([])
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [positions, setPositions] = useState<BubblePhysics[]>([])
  const [mounted, setMounted] = useState(false)
  const [burstTrigger, setBurstTrigger] = useState<BurstTrigger | null>(null)
  const [poppingLevel, setPoppingLevel] = useState<number | null>(null)

  const countByLevel = LEVELS.reduce<Record<number, number>>((acc, l) => {
    acc[l] = skills.filter(s => s.level === l).length
    return acc
  }, {})

  const radiusFor = (level: number) => Math.min(Math.max(38, 38 + countByLevel[level] * 5.5), 92)

  // Pentagon initial positions
  useEffect(() => {
    const W = containerRef.current?.clientWidth ?? 500
    const H = 320
    const cx = W / 2, cy = H / 2, spread = Math.min(W, H) * 0.32
    const init: BubblePhysics[] = LEVELS.map((_, i) => {
      const angle = (i * 2 * Math.PI) / LEVELS.length - Math.PI / 2
      return {
        x: cx + spread * Math.cos(angle) + (Math.random() - 0.5) * 12,
        y: cy + spread * Math.sin(angle) * 0.72 + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }
    })
    statesRef.current = init
    setPositions([...init])
    setTimeout(() => setMounted(true), 50)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Soft-wall + spring-collision physics
  useEffect(() => {
    const H = 320
    const getW = () => containerRef.current?.clientWidth ?? 500
    const DAMP = 0.992, SPEED = 0.6, DRIFT = 0.025, WALL_R = 20

    function step() {
      const W = getW(), states = statesRef.current
      if (!states.length) { rafRef.current = requestAnimationFrame(step); return }

      for (let i = 0; i < states.length; i++) {
        const b = states[i], r = radiusFor(LEVELS[i])
        b.vx = (b.vx + (Math.random() - 0.5) * DRIFT) * DAMP
        b.vy = (b.vy + (Math.random() - 0.5) * DRIFT) * DAMP
        const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
        if (sp > SPEED) { b.vx *= SPEED / sp; b.vy *= SPEED / sp }
        b.x += b.vx; b.y += b.vy
        // Soft wall repulsion
        if (b.x - r < WALL_R) b.vx += (WALL_R - (b.x - r)) * 0.04
        if (b.x + r > W - WALL_R) b.vx -= (b.x + r - (W - WALL_R)) * 0.04
        if (b.y - r < WALL_R) b.vy += (WALL_R - (b.y - r)) * 0.04
        if (b.y + r > H - WALL_R) b.vy -= (b.y + r - (H - WALL_R)) * 0.04
        b.x = Math.max(r, Math.min(W - r, b.x))
        b.y = Math.max(r, Math.min(H - r, b.y))
      }

      // Spring separation
      for (let i = 0; i < states.length; i++) {
        for (let j = i + 1; j < states.length; j++) {
          const a = states[i], b = states[j]
          const ri = radiusFor(LEVELS[i]), rj = radiusFor(LEVELS[j])
          const dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
          const minD = ri + rj + 6
          if (dist < minD) {
            const nx = dx / dist, ny = dy / dist
            const f = (minD - dist) * 0.15
            a.vx -= nx * f; a.vy -= ny * f
            b.vx += nx * f; b.vy += ny * f
          }
        }
      }

      setPositions([...states])
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills])

  function handleClick(level: number, idx: number) {
    const el = btnRefs.current[idx]
    const containerEl = containerRef.current
    if (!el || !containerEl) return
    const br = el.getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()

    // Position relative to container for canvas burst
    const localX = br.left + br.width / 2 - containerRect.left
    const localY = br.top + br.height / 2 - containerRect.top

    // Position relative to vault root for clip-path overlay
    const vaultRoot = containerEl.closest('[data-vault-root]')?.getBoundingClientRect() ?? containerRect
    const overlayX = br.left + br.width / 2 - vaultRoot.left
    const overlayY = br.top + br.height / 2 - vaultRoot.top

    setPoppingLevel(level)
    setBurstTrigger({ x: localX, y: localY, color: LEVEL_COLORS[level].accent })

    setTimeout(() => {
      onBubbleClick({
        level,
        cx: overlayX,
        cy: overlayY,
        cr: br.width / 2,
      })
    }, 180)
  }

  const breatheDurations = [3.8, 4.4, 3.2, 4.8, 3.5]
  const breatheDelays = [0, 0.6, 1.2, 0.3, 1.8]

  return (
    <div
      ref={containerRef}
      className="h-[320px] w-full relative overflow-hidden rounded-2xl"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {LEVELS.map((level, i) => {
        const r = radiusFor(level)
        const pos = positions[i]
        if (!pos) return null
        const count = countByLevel[level]
        const accent = LEVEL_COLORS[level].accent
        const popClass = isExiting ? 'bubble-pop-out' : mounted ? 'bubble-pop-in' : ''
        const isPopping = poppingLevel === level

        return (
          <div
            key={level}
            style={{
              position: 'absolute',
              left: pos.x - r,
              top: pos.y - r,
              width: r * 2,
              height: r * 2,
              ['--pop-delay' as string]: `${i * 80}ms`,
              transform: isPopping ? 'scale(0)' : undefined,
              opacity: isPopping ? 0 : undefined,
              transition: isPopping
                ? 'transform 0.22s cubic-bezier(0.55,0,1,0.45), opacity 0.18s ease'
                : undefined,
              pointerEvents: isPopping ? 'none' : undefined,
            }}
            className={popClass}
          >
            <button
              ref={el => { btnRefs.current[i] = el }}
              onClick={() => handleClick(level, i)}
              className="relative w-full h-full rounded-full flex flex-col items-center justify-center cursor-pointer focus:outline-none group"
              style={{
                ['--breathe-dur' as string]: `${breatheDurations[i]}s`,
                ['--breathe-delay' as string]: `${breatheDelays[i]}s`,
                animation: `bubble-breathe ${breatheDurations[i]}s ease-in-out ${breatheDelays[i]}s infinite`,
                background: count > 0
                  ? `radial-gradient(circle at 32% 28%, ${accent}38, ${accent}12 60%, transparent)`
                  : 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.04), transparent)',
                border: `1.5px solid ${count > 0 ? accent + '55' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: count > 0
                  ? `0 4px 28px ${accent}1a, inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 0 ${accent}00`
                  : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                backdropFilter: 'blur(6px)',
                transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                const t = e.currentTarget as HTMLButtonElement
                t.style.transform = 'scale(1.1)'
                t.style.boxShadow = count > 0
                  ? `0 8px 36px ${accent}30, inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1.5px ${accent}60`
                  : 'inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.15)'
              }}
              onMouseLeave={e => {
                const t = e.currentTarget as HTMLButtonElement
                t.style.transform = ''
                t.style.boxShadow = count > 0
                  ? `0 4px 28px ${accent}1a, inset 0 1px 0 rgba(255,255,255,0.12)`
                  : 'inset 0 1px 0 rgba(255,255,255,0.06)'
              }}
            >
              {/* Iridescent shimmer — soap-bubble light refraction */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, transparent 55%)' }}
              />
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  top: '12%', left: '18%', width: '30%', height: '18%',
                  background: 'radial-gradient(ellipse, rgba(255,255,255,0.5), transparent 70%)',
                  filter: 'blur(1px)',
                }}
              />
              <span className="text-[10px] font-medium leading-none mb-1.5 tracking-wide"
                style={{ color: count > 0 ? accent + 'bb' : 'rgba(255,255,255,0.3)' }}>
                {LEVEL_LABELS[level]}
              </span>
              <span className="text-2xl font-bold leading-none"
                style={{ color: count > 0 ? accent : 'rgba(255,255,255,0.2)' }}>
                {count}
              </span>
            </button>
          </div>
        )
      })}
      <BurstCanvas
        containerRef={containerRef}
        trigger={burstTrigger}
        onComplete={() => setBurstTrigger(null)}
      />
      <span className="absolute bottom-2.5 right-3 text-[10px] text-white/20 pointer-events-none select-none">
        click a bubble
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SettingsTab — profile info + import + github sub-sections
// ─────────────────────────────────────────────────────────────
type BioState = { name: string; headline: string; location: string; bio: string; github_url: string; salary_min: string; salary_max: string }

type ImportState = {
  mode: 'pdf' | 'url' | 'text'
  url: string
  text: string
  file: File | null
  extracting: boolean
  extracted: ExtractedProfile | null
  error: string | null
  applyBio: boolean
  applySkills: boolean
  applying: boolean
  applySuccess: boolean
}

type GithubImportState = {
  url: string
  importing: boolean
  result: { skills: string[]; summary: string } | null
}

function SettingsTab({
  bio,
  setBio,
  saving,
  saveSuccess,
  onSaveBio,
  imp,
  setImp,
  onExtractProfile,
  onApplyExtracted,
  gh,
  setGh,
  onImportFromGithub,
}: {
  bio: BioState
  setBio: React.Dispatch<React.SetStateAction<BioState>>
  saving: boolean
  saveSuccess: boolean
  onSaveBio: () => void
  imp: ImportState
  setImp: React.Dispatch<React.SetStateAction<ImportState>>
  onExtractProfile: () => void
  onApplyExtracted: () => void
  gh: GithubImportState
  setGh: React.Dispatch<React.SetStateAction<GithubImportState>>
  onImportFromGithub: () => void
}) {
  const [importOpen, setImportOpen] = useState(false)
  const [githubOpen, setGithubOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Profile Info Form */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Profile information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Full name</Label><Input value={bio.name} onChange={e => setBio(b => ({ ...b, name: e.target.value }))} /></div>
            <div><Label>Location</Label><Input placeholder="e.g. Kuala Lumpur, Malaysia" value={bio.location} onChange={e => setBio(b => ({ ...b, location: e.target.value }))} /></div>
          </div>
          <div>
            <Label>Professional headline</Label>
            <Input placeholder="e.g. Full-stack developer with 3 years building fintech products" value={bio.headline} onChange={e => setBio(b => ({ ...b, headline: e.target.value }))} />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea
              placeholder="Tell employers what makes you unique."
              value={bio.bio}
              onChange={e => setBio(b => ({ ...b, bio: e.target.value }))}
              rows={4}
            />
          </div>
          <div><Label>GitHub URL</Label><Input placeholder="https://github.com/username" value={bio.github_url} onChange={e => setBio(b => ({ ...b, github_url: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Min salary (MYR/year)</Label><Input type="number" placeholder="48000" value={bio.salary_min} onChange={e => setBio(b => ({ ...b, salary_min: e.target.value }))} /></div>
            <div><Label>Max salary (MYR/year)</Label><Input type="number" placeholder="72000" value={bio.salary_max} onChange={e => setBio(b => ({ ...b, salary_max: e.target.value }))} /></div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={onSaveBio} disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
            {saveSuccess && <span className="text-sm text-emerald-400 font-medium">✓ Saved</span>}
          </div>
        </div>
      </Card>

      {/* Import Profile accordion */}
      <div className="rounded-xl border border-white/7 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
          onClick={() => setImportOpen(o => !o)}
        >
          <span className="font-medium text-sm">📥 Import Profile</span>
          {importOpen ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
        </button>
        {importOpen && <div className="px-5 pb-5"><ImportSection imp={imp} setImp={setImp} onExtract={onExtractProfile} onApply={onApplyExtracted} /></div>}
      </div>

      {/* GitHub Import accordion */}
      <div className="rounded-xl border border-white/7 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
          onClick={() => setGithubOpen(o => !o)}
        >
          <span className="font-medium text-sm">🐙 GitHub Import</span>
          {githubOpen ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
        </button>
        {githubOpen && <div className="px-5 pb-5"><GithubSection gh={gh} setGh={setGh} onImport={onImportFromGithub} /></div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ImportSection (extracted from old TabsContent value="import")
// ─────────────────────────────────────────────────────────────
function ImportSection({
  imp, setImp, onExtract, onApply,
}: {
  imp: ImportState
  setImp: React.Dispatch<React.SetStateAction<ImportState>>
  onExtract: () => void
  onApply: () => void
}) {
  return (
    <div className="space-y-5 pt-2">
      <p className="text-sm text-zinc-500">
        Upload your resume or CV, paste a URL, or drop in any text. Our AI reads,
        normalises, and cross-checks everything before adding it to your vault.
      </p>
      <div className="flex gap-2">
        {(['pdf', 'url', 'text'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setImp(s => ({ ...s, mode, error: null, extracted: null }))}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              imp.mode === mode ? 'bg-indigo-600 text-white' : 'bg-white/6 text-zinc-400 hover:bg-white/10'
            }`}
          >
            {mode === 'pdf' ? '📎 Upload File' : mode === 'url' ? '🔗 URL' : '📋 Paste Text'}
          </button>
        ))}
      </div>

      {imp.mode === 'pdf' && (
        <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          imp.file ? 'border-indigo-500/50 bg-indigo-500/8' : 'border-white/15 hover:border-white/30 hover:bg-white/4'
        }`}>
          <input type="file" accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp" className="hidden"
            onChange={e => setImp(s => ({ ...s, file: e.target.files?.[0] ?? null, extracted: null }))} />
          {imp.file ? (
            <><p className="text-2xl mb-1">📎</p><p className="text-sm font-medium text-indigo-300">{imp.file.name}</p><p className="text-xs text-zinc-400">{(imp.file.size / 1024).toFixed(0)} KB — click to change</p></>
          ) : (
            <><p className="text-2xl mb-1">📤</p><p className="text-sm text-zinc-500">Click to upload your resume or CV</p><p className="text-xs text-zinc-400 mt-1">PDF, DOCX, TXT, or image — up to 20 MB</p></>
          )}
        </label>
      )}

      {imp.mode === 'url' && (
        <div className="space-y-2">
          <Input placeholder="https://seek.com/profile/..." value={imp.url}
            onChange={e => setImp(s => ({ ...s, url: e.target.value, extracted: null }))} />
          {imp.url.toLowerCase().includes('linkedin.com') ? (
            <div className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg text-xs text-amber-400 space-y-1">
              <p className="font-semibold">⚠️ LinkedIn blocks automated access</p>
              <p>Use Paste Text instead: copy your full page with Cmd+A → Cmd+C</p>
              <button onClick={() => setImp(s => ({ ...s, mode: 'text', url: '' }))}
                className="text-amber-400 font-semibold underline hover:text-amber-300">Switch to Paste Text →</button>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">Works for Seek profiles and most personal/portfolio websites.</p>
          )}
        </div>
      )}

      {imp.mode === 'text' && (
        <Textarea placeholder="Paste your resume text here…" value={imp.text}
          onChange={e => setImp(s => ({ ...s, text: e.target.value, extracted: null }))} rows={8} className="text-sm" />
      )}

      <Button onClick={onExtract} disabled={imp.extracting} className="w-full">
        {imp.extracting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            AI is reading your profile...
          </span>
        ) : 'Extract profile with AI'}
      </Button>

      {imp.error && <div className="p-4 bg-red-500/8 border border-red-500/20 rounded-xl text-sm text-red-400">⚠️ {imp.error}</div>}

      {imp.extracting && (
        <div className="p-4 bg-white/4 rounded-xl text-sm text-zinc-400 space-y-1.5">
          <p>🔍 Reading source content...</p>
          <p>🧠 Identifying skills and background...</p>
          <p>✅ Cross-checking skill levels...</p>
          <p>📊 Normalising and estimating salary range...</p>
        </div>
      )}

      {imp.extracted && !imp.extracting && <ExtractedResults imp={imp} setImp={setImp} onApply={onApply} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ExtractedResults — sub-component for the extracted profile preview
// ─────────────────────────────────────────────────────────────
function ExtractedResults({ imp, setImp, onApply }: {
  imp: ImportState
  setImp: React.Dispatch<React.SetStateAction<ImportState>>
  onApply: () => void
}) {
  const ep = imp.extracted!
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          ep.confidence === 'high' ? 'bg-emerald-500/15 text-emerald-400' :
          ep.confidence === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
        }`}>
          {ep.confidence === 'high' ? '✓ High confidence' : ep.confidence === 'medium' ? '~ Medium confidence' : '! Low confidence'}
        </span>
        <span className="text-xs text-zinc-400">Source: <strong>{ep.source_type_detected}</strong></span>
      </div>

      {ep.warnings.length > 0 && (
        <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <p className="text-xs font-semibold text-amber-400 mb-2">⚠️ AI flagged these for review:</p>
          <ul className="space-y-1">{ep.warnings.map((w, i) => <li key={i} className="text-xs text-amber-400">• {w}</li>)}</ul>
        </div>
      )}

      {(ep.name || ep.headline || ep.location) && (
        <Card className="p-5">
          <h4 className="font-semibold text-sm mb-3">Profile info extracted</h4>
          <div className="space-y-2 text-sm">
            {ep.name && <p><span className="text-zinc-400 inline-block w-20">Name</span>{ep.name}</p>}
            {ep.headline && <p><span className="text-zinc-400 inline-block w-20">Headline</span>{ep.headline}</p>}
            {ep.location && <p><span className="text-zinc-400 inline-block w-20">Location</span>{ep.location}</p>}
            {(ep.salary_min || ep.salary_max) && <p><span className="text-zinc-400 inline-block w-20">Salary</span>{ep.salary_min?.toLocaleString()} – {ep.salary_max?.toLocaleString()}</p>}
          </div>
        </Card>
      )}

      {ep.skills.length > 0 && (
        <Card className="p-5">
          <h4 className="font-semibold text-sm mb-3">{ep.skills.length} skills extracted</h4>
          <div className="space-y-2">
            {ep.skills.map((skill, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex-1 text-sm font-medium">{skill.name}</span>
                <span className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border shrink-0 ${(LEVEL_COLORS[skill.level] ?? LEVEL_COLORS[3]).badge}`}>{LEVEL_LABELS[skill.level]}</span>
                <span className="text-xs text-zinc-400 shrink-0 w-20 text-right">{skill.source_type === 'inferred' ? '🔍 inferred' : '📝 explicit'}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5 border-indigo-500/20 bg-indigo-500/8">
        <h4 className="font-semibold text-sm mb-4">What would you like to apply?</h4>
        <div className="space-y-3 mb-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={imp.applyBio} onChange={e => setImp(s => ({ ...s, applyBio: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm">Update profile info (name, headline, location, salary)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={imp.applySkills} onChange={e => setImp(s => ({ ...s, applySkills: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm">Add {ep.skills.length} extracted skills <span className="text-zinc-400 ml-1">(never downgraded)</span></span>
          </label>
        </div>
        <Button onClick={onApply} disabled={imp.applying || (!imp.applyBio && !imp.applySkills)} className="w-full">
          {imp.applying ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Applying...</span> : 'Apply to my profile'}
        </Button>
        {imp.applySuccess && <p className="text-sm text-emerald-400 font-medium text-center mt-3">✅ Done! Check your Vault tab.</p>}
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GithubSection
// ─────────────────────────────────────────────────────────────
function GithubSection({ gh, setGh, onImport }: {
  gh: GithubImportState
  setGh: React.Dispatch<React.SetStateAction<GithubImportState>>
  onImport: () => void
}) {
  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-zinc-500">
        Paste your GitHub profile URL. Our AI reads your top repositories, extracts real skills from
        your actual code, and adds them with a <span className="text-emerald-400 font-medium">GitHub-verified</span> badge.
      </p>
      <div className="flex gap-3">
        <Input placeholder="https://github.com/yourusername" value={gh.url}
          onChange={e => setGh(s => ({ ...s, url: e.target.value }))} className="flex-1" />
        <Button onClick={onImport} disabled={gh.importing || !gh.url.trim()}>
          {gh.importing ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analysing...</span> : 'Import skills'}
        </Button>
      </div>
      {gh.importing && (
        <div className="p-4 bg-white/4 rounded-lg text-sm text-zinc-400 space-y-1">
          <p>🔍 Fetching repositories...</p><p>🧠 Reading code to identify skills...</p><p>✨ Generating skill evidence...</p>
        </div>
      )}
      {gh.result && (
        <div className="p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
          <p className="font-medium text-emerald-300 mb-2">✅ {gh.result.skills.length} skills extracted!</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {gh.result.skills.map(s => <Badge key={s} className="bg-emerald-500/15 text-emerald-400 border-0">{s}</Badge>)}
          </div>
          <p className="text-sm text-emerald-400/80">{gh.result.summary}</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ProfilePageInner
// ─────────────────────────────────────────────────────────────
function ProfilePageInner() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const defaultTab = tab === 'portfolio' ? 'portfolio' : tab === 'settings' ? 'settings' : 'vault'

  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  // Bubble overlay state machine
  const [vaultView, setVaultView] = useState<VaultView>('vault')
  const [selectedLevel, setSelectedLevel] = useState<number>(4)
  const [bubbleOrigin, setBubbleOrigin] = useState<BubbleOrigin | null>(null)

  const [bio, setBio] = useState<BioState>({ name: '', headline: '', location: '', bio: '', github_url: '', salary_min: '', salary_max: '' })
  const [newSkill, setNewSkill] = useState({ name: '', level: '3' })
  const [addingSkill, setAddingSkill] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', description: '', url: '', repo_url: '', tech_stack: '', impact: '' })
  const [addingItem, setAddingItem] = useState(false)

  const [imp, setImp] = useState<ImportState>({
    mode: 'pdf', url: '', text: '', file: null,
    extracting: false, extracted: null, error: null,
    applyBio: true, applySkills: true, applying: false, applySuccess: false,
  })

  const [gh, setGh] = useState<GithubImportState>({ url: '', importing: false, result: null })

  // Load profile
  useEffect(() => {
    fetch('/api/candidate/profile')
      .then(r => r.json())
      .then(({ profile: p }: { profile: FullProfile }) => {
        setProfile(p)
        if (p) {
          setBio({
            name: p.name ?? '', headline: p.headline ?? '', location: p.location ?? '',
            bio: p.bio ?? '', github_url: p.github_url ?? '',
            salary_min: p.salary_min?.toString() ?? '', salary_max: p.salary_max?.toString() ?? '',
          })
          setGh(g => ({ ...g, url: p.github_url ?? '' }))
        }
        setLoading(false)
      })
  }, [])

  async function saveBio() {
    setSaving(true); setSaveSuccess(false)
    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bio, salary_min: bio.salary_min ? parseInt(bio.salary_min) : null, salary_max: bio.salary_max ? parseInt(bio.salary_max) : null }),
      })
      if (res.ok) setSaveSuccess(true)
    } catch { /* handled by save button */ }
    finally { setSaving(false) }
  }

  async function addSkill() {
    if (!newSkill.name.trim()) return
    setAddingSkill(true)
    const res = await fetch('/api/candidate/skills', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSkill.name.trim(), level: parseInt(newSkill.level), source: 'manual' }),
    })
    const { skill } = await res.json() as { skill: Skill }
    setProfile(p => p ? { ...p, skills: [...p.skills, skill] } : p)
    setNewSkill({ name: '', level: '3' })
    setAddingSkill(false)
  }

  async function deleteSkill(skillId: string) {
    await fetch(`/api/candidate/skills/${skillId}`, { method: 'DELETE' })
    setProfile(p => p ? { ...p, skills: p.skills.filter(s => s.id !== skillId) } : p)
  }

  async function addPortfolioItem() {
    if (!newItem.title.trim()) return
    setAddingItem(true)
    const res = await fetch('/api/candidate/portfolio', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, tech_stack: newItem.tech_stack.split(',').map(s => s.trim()).filter(Boolean) }),
    })
    const { item } = await res.json() as { item: PortfolioItem }
    setProfile(p => p ? { ...p, portfolio_items: [...(p.portfolio_items ?? []), item] } : p)
    setNewItem({ title: '', description: '', url: '', repo_url: '', tech_stack: '', impact: '' })
    setAddingItem(false)
  }

  async function importFromGithub() {
    if (!gh.url.trim()) return
    setGh(g => ({ ...g, importing: true, result: null }))
    try {
      const res = await fetch('/api/candidate/github-import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: gh.url }),
      })
      const data = await res.json() as { skills: string[]; summary: string }
      setGh(g => ({ ...g, result: data }))
      const refreshed = await fetch('/api/candidate/profile').then(r => r.json()) as { profile: FullProfile }
      setProfile(refreshed.profile)
    } finally {
      setGh(g => ({ ...g, importing: false }))
    }
  }

  async function extractProfile() {
    setImp(s => ({ ...s, extracting: true, extracted: null, error: null, applySuccess: false }))
    try {
      let res: Response
      if (imp.mode === 'pdf') {
        if (!imp.file) { setImp(s => ({ ...s, extracting: false, error: 'Please select a file.' })); return }
        const fd = new FormData(); fd.append('file', imp.file)
        res = await fetch('/api/candidate/import/pdf', { method: 'POST', body: fd })
      } else if (imp.mode === 'url') {
        if (!imp.url.trim()) { setImp(s => ({ ...s, extracting: false, error: 'Please enter a URL.' })); return }
        res = await fetch('/api/candidate/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: imp.url.trim() }) })
      } else {
        if (!imp.text.trim()) { setImp(s => ({ ...s, extracting: false, error: 'Please paste some text.' })); return }
        res = await fetch('/api/candidate/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: imp.text.trim() }) })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; message?: string }
        setImp(s => ({ ...s, extracting: false, error: err.message ?? err.error ?? 'Extraction failed' })); return
      }

      if (!res.body) throw new Error('Empty response from server')
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let accumulated = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        accumulated += decoder.decode(value, { stream: true })
      }

      const start = accumulated.indexOf('{'); const end = accumulated.lastIndexOf('}')
      if (start === -1) throw new Error('AI returned an unexpected response')

      let data: ExtractedProfile & { error?: unknown }
      try {
        data = JSON.parse(accumulated.slice(start, end + 1)) as ExtractedProfile & { error?: unknown }
      } catch {
        const truncated = accumulated.slice(start).trimEnd().replace(/,\s*$/, '')
        const opened = (truncated.match(/\{/g) ?? []).length; const closed = (truncated.match(/\}/g) ?? []).length
        const braces = '}'.repeat(Math.max(0, opened - closed))
        const candidates = [truncated + braces, truncated + '"' + braces, truncated + '"}' + (braces.length > 1 ? braces.slice(1) : ''), truncated + '"]}' + (braces.length > 2 ? braces.slice(2) : '')]
        let patched: string | null = null
        for (const c of candidates) { try { JSON.parse(c); patched = c; break } catch { /* try next */ } }
        if (!patched) throw new Error('AI response could not be parsed — try Paste Text with only key sections.')
        data = JSON.parse(patched) as ExtractedProfile & { error?: unknown }
        if (!data.warnings) data.warnings = []
        ;(data.warnings as string[]).push('Profile may be incomplete — resume was very long.')
      }

      if (data.error) {
        const msg = typeof data.error === 'string' ? data.error : 'AI extraction failed'
        setImp(s => ({ ...s, extracting: false, error: msg }))
      } else {
        setImp(s => ({ ...s, extracting: false, extracted: data }))
      }
    } catch (err) {
      setImp(s => ({ ...s, extracting: false, error: err instanceof Error ? err.message : 'Network error' }))
    }
  }

  async function applyExtracted() {
    if (!imp.extracted) return
    setImp(s => ({ ...s, applying: true }))
    try {
      const res = await fetch('/api/candidate/import/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracted: imp.extracted, applyBio: imp.applyBio, applySkills: imp.applySkills }),
      })
      if (res.ok) {
        setImp(s => ({ ...s, applySuccess: true }))
        const { profile: refreshed } = await fetch('/api/candidate/profile').then(r => r.json()) as { profile: FullProfile }
        setProfile(refreshed)
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string }
        setImp(s => ({ ...s, error: err.error ?? 'Failed to apply profile' }))
      }
    } catch {
      setImp(s => ({ ...s, error: 'Network error — please try again.' }))
    } finally {
      setImp(s => ({ ...s, applying: false }))
    }
  }

  function refreshProfile() {
    fetch('/api/candidate/profile').then(r => r.json()).then(({ profile: p }: { profile: FullProfile }) => { if (p) setProfile(p) })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-400">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
        Loading your Skills Vault...
      </div>
    )
  }

  const allSkills = profile?.skills ?? []

  function handleBubbleClick(info: BubbleClickInfo) {
    setSelectedLevel(info.level)
    setBubbleOrigin({ cx: info.cx, cy: info.cy, cr: info.cr, color: LEVEL_COLORS[info.level]?.accent ?? '#71717a' })
    setVaultView('expanding')
    // After expansion animation, switch to list view
    setTimeout(() => setVaultView('list'), 520)
  }

  function handleBack() {
    setVaultView('collapsing')
    setTimeout(() => {
      setVaultView('vault')
      setBubbleOrigin(null)
    }, 460)
  }

  return (
    <div className="px-8 py-6 relative" data-vault-root>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Skills Vault 🗂️</h1>
        <p className="text-zinc-500 mt-1">Your evidence base. Employers see skills, not school names.</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="vault">Vault ({allSkills.length})</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio ({profile?.portfolio_items?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ── VAULT TAB ──────────────────────────────────────── */}
        <TabsContent value="vault" className="space-y-6">
          {/* 1. Stats bar */}
          <SkillStatsBar skills={allSkills} />

          {/* 2. Pie chart */}
          <SkillPieChart skills={allSkills} />

          {/* 3. Top skills from AI */}
          <TopSkillsSection />

          {/* 4. Bubble bank */}
          <SkillBubbleBank
            skills={allSkills}
            isExiting={vaultView === 'collapsing'}
            onBubbleClick={handleBubbleClick}
          />

          {/* 5. Quick add — compact inline form, not a full card */}
          <div className="flex items-center gap-3 px-1">
            <Input
              placeholder="Quick add a skill…"
              value={newSkill.name}
              onChange={e => setNewSkill(s => ({ ...s, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addSkill()}
              className="flex-1 h-9 text-sm"
            />
            <Select value={newSkill.level} onValueChange={v => setNewSkill(s => ({ ...s, level: v ?? '3' }))}>
              <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEVELS.map(l => <SelectItem key={l} value={String(l)}>{LEVEL_LABELS[l]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={addSkill} disabled={addingSkill || !newSkill.name.trim()} className="h-9 px-4">
              {addingSkill ? '…' : '+ Add'}
            </Button>
          </div>

          {/* Work Experience */}
          {(profile?.work_experience ?? []).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mt-8 mb-4">
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-600">Work Experience</p>
                <div className="flex-1 h-px bg-white/6" />
                <RestructureButton onDone={() => refreshProfile()} workExperience={profile!.work_experience ?? []} />
              </div>
              <div className="space-y-4">
                {profile!.work_experience!.map((job, i) => <WorkExperienceCard key={i} job={job} />)}
              </div>
            </div>
          )}

          {/* Education */}
          {(profile?.education ?? []).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mt-8 mb-4">
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-600">Education</p>
                <div className="flex-1 h-px bg-white/6" />
              </div>
              <div className="space-y-2">
                {profile!.education!.map((edu, i) => (
                  <div key={i} className="flex items-start justify-between px-4 py-3.5 bg-white/3 border border-white/7 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-white">{edu.institution}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{[edu.degree, edu.field].filter(Boolean).join(' · ')}</p>
                    </div>
                    {edu.graduation_year && <span className="text-xs text-zinc-600 mt-0.5 shrink-0">{edu.graduation_year}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── PORTFOLIO TAB ──────────────────────────────────── */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Add a project</h3>
            <div className="space-y-3">
              <div>
                <Label>Project title *</Label>
                <Input placeholder="e.g. E-commerce Platform..." value={newItem.title} onChange={e => setNewItem(i => ({ ...i, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Live URL</Label><Input placeholder="https://..." value={newItem.url} onChange={e => setNewItem(i => ({ ...i, url: e.target.value }))} /></div>
                <div><Label>GitHub repo URL</Label><Input placeholder="https://github.com/..." value={newItem.repo_url} onChange={e => setNewItem(i => ({ ...i, repo_url: e.target.value }))} /></div>
              </div>
              <div><Label>Tech stack (comma-separated)</Label><Input placeholder="React, Node.js, PostgreSQL..." value={newItem.tech_stack} onChange={e => setNewItem(i => ({ ...i, tech_stack: e.target.value }))} /></div>
              <div><Label>What did you achieve? (impact)</Label><Input placeholder="e.g. Reduced API latency by 40%..." value={newItem.impact} onChange={e => setNewItem(i => ({ ...i, impact: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea placeholder="Brief description..." value={newItem.description} onChange={e => setNewItem(i => ({ ...i, description: e.target.value }))} rows={3} /></div>
              <Button onClick={addPortfolioItem} disabled={addingItem || !newItem.title.trim()}>{addingItem ? 'Adding...' : 'Add project'}</Button>
            </div>
          </Card>

          <div className="space-y-3">
            {(profile?.portfolio_items ?? []).length === 0 ? (
              <div className="text-center py-12 text-zinc-400 border-2 border-dashed rounded-xl">
                <p className="text-4xl mb-3">📁</p>
                <p className="font-medium">No projects yet</p>
                <p className="text-sm mt-1">Add projects to show employers what you&apos;ve actually built</p>
              </div>
            ) : (
              (profile?.portfolio_items ?? []).map(item => (
                <Card key={item.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{item.title}</h3>
                    <div className="flex gap-2">
                      {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">Live ↗</a>}
                      {item.repo_url && <a href={item.repo_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">GitHub ↗</a>}
                    </div>
                  </div>
                  {item.impact && <p className="text-sm text-emerald-400 font-medium mt-1">✓ {item.impact}</p>}
                  {item.description && <p className="text-sm text-zinc-500 mt-1">{item.description}</p>}
                  {item.tech_stack?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tech_stack.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                    </div>
                  )}
                  {item.ai_summary && (
                    <div className="mt-3 p-3 bg-indigo-500/8 rounded-lg">
                      <p className="text-xs font-medium text-indigo-400 mb-1">🤖 AI analysis</p>
                      <p className="text-xs text-indigo-300/80">{item.ai_summary}</p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── SETTINGS TAB ──────────────────────────────────── */}
        <TabsContent value="settings">
          <SettingsTab
            bio={bio} setBio={setBio}
            saving={saving} saveSuccess={saveSuccess} onSaveBio={saveBio}
            imp={imp} setImp={setImp}
            onExtractProfile={extractProfile} onApplyExtracted={applyExtracted}
            gh={gh} setGh={setGh} onImportFromGithub={importFromGithub}
          />
        </TabsContent>
      </Tabs>

      {/* ── Full-screen level overlay (clip-path bubble expansion) ── */}
      {vaultView !== 'vault' && bubbleOrigin && (
        <FullScreenLevelOverlay
          vaultView={vaultView}
          origin={bubbleOrigin}
          selectedLevel={selectedLevel}
          skills={allSkills}
          onBack={handleBack}
          onLevelSelect={setSelectedLevel}
        />
      )}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center gap-3 text-zinc-500"><div className="w-5 h-5 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />Loading vault…</div>}>
      <ProfilePageInner />
    </Suspense>
  )
}
