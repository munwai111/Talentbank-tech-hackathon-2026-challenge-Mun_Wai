'use client'

// AI Profiling — edit-mode section.
// Runs the persona profiler (/api/candidate/ai-profile) against the candidate's
// profile data plus an optional resume/CV source, renders the full persona
// analysis (MBTI, Big Five, KF4D, field fit, priorities, behaviour), and saves
// it into career_data.ai_persona.

import { useState, useRef } from 'react'
import {
  Sparkles, Info, Upload, Loader2, Check, FileText, Link2, User,
  Trophy, Compass, HeartPulse, Target, ListChecks, AlertTriangle,
  Users, Handshake, Lightbulb,
} from 'lucide-react'
import type { CandidateProfile, Skill, PortfolioItem, PersonaAnalysis, CareerData } from '@/types/database'
import { repairTruncatedJson } from '@/lib/repair-json'

type FullProfile = CandidateProfile & { skills: Skill[]; portfolio_items: PortfolioItem[] }

const inputCls = 'w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-400/40 focus:outline-none transition-colors'

// ── Result primitives ─────────────────────────────────────────────────────────

function ScoreBar({ label, score, insight, color = 'bg-indigo-500' }: {
  label: string; score: number; insight?: string; color?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-zinc-300">{label}</p>
        <span className="text-[11px] text-zinc-500 tabular-nums">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
      {insight && <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">{insight}</p>}
    </div>
  )
}

const LEVEL_STYLES: Record<string, string> = {
  high:     'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  moderate: 'bg-sky-500/12 text-sky-400 border-sky-500/25',
  emerging: 'bg-zinc-500/12 text-zinc-400 border-zinc-500/25',
}

function LevelChips({ title, items }: { title: string; items: { name: string; level: string; insight: string }[] }) {
  if (!items?.length) return null
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item.name} title={item.insight}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium cursor-help ${LEVEL_STYLES[item.level] ?? LEVEL_STYLES.emerging}`}>
            {item.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function ResultCard({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>; title: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/2 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-indigo-400" />
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{title}</p>
      </div>
      {children}
    </div>
  )
}

function BulletList({ items, dotColor = 'bg-emerald-500' }: { items: string[]; dotColor?: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
          <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${dotColor}`} />{item}
        </li>
      ))}
    </ul>
  )
}

// ── Workplace behaviour: spectrum slider ──────────────────────────────────────

function SpectrumRow({ name, left, right, position, insight }: {
  name: string; left: string; right: string; position: number; insight: string
}) {
  const pos = Math.min(100, Math.max(0, position))
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-wider uppercase text-zinc-600 mb-1.5">{name}</p>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-zinc-500 w-24 shrink-0 text-right">{left}</span>
        <div className="flex-1 relative h-1.5 rounded-full bg-white/6">
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-400 ring-2 ring-[#0a0a14] shadow-[0_0_8px_rgba(129,140,248,0.6)]"
            style={{ left: `calc(${pos}% - 6px)` }} />
        </div>
        <span className="text-[11px] text-zinc-500 w-24 shrink-0">{right}</span>
      </div>
      {insight && <p className="text-[11px] text-zinc-600 mt-1 text-center leading-snug">{insight}</p>}
    </div>
  )
}

function WorkplaceBehaviourCard({ wb }: { wb: NonNullable<PersonaAnalysis['workplace_behaviour']> }) {
  const styleRows: { label: string; value?: string }[] = [
    { label: 'Collaboration', value: wb.collaboration_style },
    { label: 'Communication', value: wb.communication_style },
    { label: 'Conflict', value: wb.conflict_style },
    { label: 'Decisions', value: wb.decision_style },
    { label: 'Under pressure', value: wb.stress_response },
  ].filter(r => r.value)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Users size={15} className="text-indigo-400" />
        <p className="text-sm font-semibold text-white">Workplace Behaviour</p>
        <span className="ml-auto text-[10px] text-zinc-700 uppercase tracking-wider">how they work · for hiring teams</span>
      </div>

      {wb.spectrums?.length > 0 && (
        <ResultCard icon={Compass} title="Behavioural Spectrums">
          <div className="space-y-4 pt-1">
            {wb.spectrums.map(s => <SpectrumRow key={s.name} {...s} />)}
          </div>
        </ResultCard>
      )}

      {styleRows.length > 0 && (
        <ResultCard icon={HeartPulse} title="Working Style">
          <div className="space-y-2.5">
            {styleRows.map(r => (
              <div key={r.label} className="flex gap-3">
                <span className="text-[11px] font-semibold text-zinc-500 w-24 shrink-0 pt-0.5">{r.label}</span>
                <span className="text-xs text-zinc-300 leading-relaxed">{r.value}</span>
              </div>
            ))}
          </div>
          {wb.motivation_drivers?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/6">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">Motivated by</p>
              <div className="flex flex-wrap gap-1.5">
                {wb.motivation_drivers.map(d => (
                  <span key={d} className="text-[11px] px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">{d}</span>
                ))}
              </div>
            </div>
          )}
          {wb.ideal_environment && (
            <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">
              <span className="text-zinc-400 font-medium">Thrives in:</span> {wb.ideal_environment}
            </p>
          )}
        </ResultCard>
      )}

      {(wb.working_with_guide?.length > 0 || wb.watch_outs?.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {wb.working_with_guide?.length > 0 && (
            <ResultCard icon={Handshake} title="How to Work With Them">
              <BulletList items={wb.working_with_guide} dotColor="bg-emerald-500" />
            </ResultCard>
          )}
          {wb.watch_outs?.length > 0 && (
            <ResultCard icon={Lightbulb} title="Watch-outs">
              <BulletList items={wb.watch_outs} dotColor="bg-amber-500" />
            </ResultCard>
          )}
        </div>
      )}
    </div>
  )
}

// ── MBTI card ─────────────────────────────────────────────────────────────────

function MbtiCard({ mbti }: { mbti: PersonaAnalysis['mbti'] }) {
  return (
    <ResultCard icon={User} title="MBTI-style Type Indication">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl font-bold text-indigo-300 tracking-widest">{mbti.type}</span>
        <span className="text-sm text-zinc-400">{mbti.label}</span>
      </div>
      <p className="text-[11px] text-zinc-600 mb-3 leading-snug">
        Confidence = how consistently each preference shows across contexts (not how strong one example is). Higher = more defining and less likely to flex.
      </p>
      <div className="space-y-2.5 mb-3">
        {mbti.dichotomies.map(d => (
          <ScoreBar key={d.dimension} label={`${d.dimension} → ${d.pole}`} score={d.confidence} insight={d.rationale} color="bg-violet-500" />
        ))}
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed">{mbti.summary}</p>
    </ResultCard>
  )
}

// ── Full results panel ────────────────────────────────────────────────────────

function PersonaResults({ persona }: { persona: PersonaAnalysis }) {
  return (
    <div className="space-y-3">
      <ResultCard icon={Sparkles} title={persona.confidence ? `Persona Summary · ${persona.confidence} confidence` : 'Persona Summary'}>
        <p className="text-sm text-zinc-300 leading-relaxed">{persona.persona_summary}</p>
      </ResultCard>

      {persona.tangible_achievements?.length > 0 && (
        <ResultCard icon={Trophy} title="Tangible Achievements">
          <BulletList items={persona.tangible_achievements} />
        </ResultCard>
      )}

      {persona.professional_engagements?.length > 0 && (
        <ResultCard icon={ListChecks} title="Professional Engagements">
          <BulletList items={persona.professional_engagements} dotColor="bg-sky-500" />
        </ResultCard>
      )}

      {persona.mbti && <MbtiCard mbti={persona.mbti} />}

      {persona.big_five?.length > 0 && (
        <ResultCard icon={HeartPulse} title="Big Five (OCEAN)">
          <p className="text-[11px] text-zinc-600 mb-3 leading-snug">
            Scores reflect how consistently a trait holds across role, goals, social life, stress and values — 50 is balanced; higher means more defining and less likely to flex, not &ldquo;better&rdquo;.
          </p>
          <div className="space-y-3">
            {persona.big_five.map(t => <ScoreBar key={t.name} label={t.name} score={t.score} insight={t.insight} />)}
          </div>
        </ResultCard>
      )}

      {persona.kf4d && (
        <ResultCard icon={Compass} title="Korn Ferry-style Four Dimensions">
          <div className="space-y-4">
            <LevelChips title="Competencies" items={persona.kf4d.competencies} />
            <LevelChips title="Drivers" items={persona.kf4d.drivers} />
            <LevelChips title="Traits" items={persona.kf4d.traits} />
            {persona.kf4d.experiences && (
              <p className="text-xs text-zinc-400 leading-relaxed border-t border-white/6 pt-3">{persona.kf4d.experiences}</p>
            )}
          </div>
          <p className="text-[10px] text-zinc-700 mt-3">Hover a chip for the evidence behind it.</p>
        </ResultCard>
      )}

      {persona.field_fit?.length > 0 && (
        <ResultCard icon={Target} title="Field of Expertise Fit">
          <div className="space-y-3">
            {persona.field_fit.map(f => (
              <ScoreBar key={f.field} label={f.field} score={f.fit_score} insight={f.rationale} color="bg-emerald-500" />
            ))}
          </div>
        </ResultCard>
      )}

      {(persona.strengths?.length > 0 || persona.growth_areas?.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <ResultCard icon={Sparkles} title="Strengths">
            <BulletList items={persona.strengths ?? []} />
          </ResultCard>
          <ResultCard icon={Compass} title="Growth Areas">
            <BulletList items={persona.growth_areas ?? []} dotColor="bg-amber-500" />
          </ResultCard>
        </div>
      )}

      {(persona.drive_and_goals || persona.life_priorities?.length > 0) && (
        <ResultCard icon={Target} title="Drive, Goals & Life Priorities">
          {persona.drive_and_goals && <p className="text-xs text-zinc-400 leading-relaxed mb-3">{persona.drive_and_goals}</p>}
          <div className="flex flex-wrap gap-1.5">
            {(persona.life_priorities ?? []).map(p => (
              <span key={p} className="text-xs px-2.5 py-1 rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-300">{p}</span>
            ))}
            {(persona.interests ?? []).map(p => (
              <span key={p} className="text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/4 text-zinc-400">{p}</span>
            ))}
          </div>
        </ResultCard>
      )}

      {persona.behaviour_and_emotion && (
        <ResultCard icon={HeartPulse} title="Behaviour & Emotion">
          <p className="text-xs text-zinc-400 leading-relaxed">{persona.behaviour_and_emotion}</p>
        </ResultCard>
      )}

      {persona.workplace_behaviour && <WorkplaceBehaviourCard wb={persona.workplace_behaviour} />}

      {persona.evidence_notes?.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-amber-500/15 bg-amber-500/5">
          <AlertTriangle size={13} className="text-amber-500/70 shrink-0 mt-0.5" />
          <div className="text-[11px] text-zinc-500 leading-relaxed space-y-1">
            {persona.evidence_notes.map((n, i) => <p key={i}>{n}</p>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Source picker + run flow ──────────────────────────────────────────────────

type SourceMode = 'profile' | 'file' | 'text'

function extractJSONObject(raw: string): string {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || start >= end) throw new Error('No JSON found')
  return raw.slice(start, end + 1)
}

async function readStream(res: Response): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let acc = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    acc += decoder.decode(value, { stream: true })
  }
  return acc
}

export function AIProfilingSection({ profile, onSave }: {
  profile: FullProfile
  onSave: (data: Partial<FullProfile>) => Promise<void>
}) {
  const existing = profile.career_data?.ai_persona ?? null
  const [persona, setPersona] = useState<PersonaAnalysis | null>(existing)
  const [mode, setMode] = useState<SourceMode>('profile')
  const [pastedText, setPastedText] = useState('')
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!existing)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function runAnalysis(file?: File) {
    setRunning(true); setError(null); setSaved(false)
    try {
      let res: Response
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        res = await fetch('/api/candidate/ai-profile', { method: 'POST', body: fd })
      } else {
        const isUrl = /^https?:\/\//.test(pastedText.trim())
        const body = mode === 'text' && pastedText.trim()
          ? (isUrl ? { url: pastedText.trim() } : { text: pastedText })
          : {}
        res = await fetch('/api/candidate/ai-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { message?: string; error?: string } | null
        throw new Error(data?.message ?? data?.error ?? 'Analysis failed — please try again')
      }
      const raw = await readStream(res)
      let parsed: PersonaAnalysis & { error?: string }
      try {
        parsed = JSON.parse(extractJSONObject(raw))
      } catch {
        // stream hit the token cap mid-JSON — close the open brackets and retry
        parsed = JSON.parse(repairTruncatedJson(raw))
      }
      if (parsed.error) throw new Error(parsed.error)
      setPersona(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed — please try again')
    }
    setRunning(false)
  }

  async function handleSave() {
    if (!persona) return
    setSaving(true)
    const careerData = {
      ...(profile.career_data ?? {}),
      ai_persona: persona,
      persona_generated_at: new Date().toISOString(),
    } as CareerData
    await onSave({ career_data: careerData })
    setSaving(false); setSaved(true)
  }

  const sourceOptions: { id: SourceMode; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; hint: string }[] = [
    { id: 'profile', icon: User,     label: 'My profile data',  hint: 'Experience, education, skills & goals already on Career OS' },
    { id: 'file',    icon: FileText, label: 'Upload resume/CV', hint: 'PDF, Word, text, JSON or image' },
    { id: 'text',    icon: Link2,    label: 'Paste text or URL', hint: 'LinkedIn export, portfolio URL, anything' },
  ]

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
        <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          AI Profiling reads your resume/CV and profile to build a whole-person professional persona:
          tangible achievements, MBTI-style type indication, Big Five traits, a Korn Ferry-style
          competency/driver read, field-of-expertise fit, life priorities, and behavioural insights.
          Results are <span className="text-zinc-300">indicative readings of your written materials</span> —
          not a clinical or validated psychometric assessment. You choose whether to save them to your profile.
        </p>
      </div>

      {/* Source picker */}
      <div className="grid grid-cols-3 gap-2">
        {sourceOptions.map(({ id, icon: Icon, label, hint }) => (
          <button key={id} onClick={() => setMode(id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              mode === id ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/8 bg-white/2 hover:border-white/15'
            }`}>
            <Icon size={15} className={mode === id ? 'text-indigo-400' : 'text-zinc-500'} />
            <p className={`text-xs font-medium mt-1.5 ${mode === id ? 'text-indigo-300' : 'text-zinc-400'}`}>{label}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5 leading-snug">{hint}</p>
          </button>
        ))}
      </div>

      {mode === 'text' && (
        <textarea className={`${inputCls} resize-none`} rows={5} value={pastedText}
          onChange={e => setPastedText(e.target.value)}
          placeholder="Paste your resume text, LinkedIn profile, or a public URL…" />
      )}

      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,.json,.png,.jpg,.jpeg,.webp" className="hidden"
        onChange={e => { if (e.target.files?.[0]) runAnalysis(e.target.files[0]) }} />

      {/* Run button */}
      <button
        onClick={() => mode === 'file' ? fileRef.current?.click() : runAnalysis()}
        disabled={running || (mode === 'text' && pastedText.trim().length < 10)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500
          disabled:opacity-50 text-sm font-medium text-white transition-colors">
        {running ? <Loader2 size={15} className="animate-spin" /> : mode === 'file' ? <Upload size={15} /> : <Sparkles size={15} />}
        {running ? 'Analysing your persona… this takes ~20 seconds' : mode === 'file' ? 'Choose file & analyse' : persona ? 'Re-run AI profiling' : 'Run AI profiling'}
      </button>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}
        </div>
      )}

      {persona && !running && (
        <>
          <PersonaResults persona={persona} />
          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={saving || saved}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60
                text-sm font-medium text-white transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
              {saving ? 'Saving…' : saved ? 'Saved to profile' : 'Save to my profile'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
