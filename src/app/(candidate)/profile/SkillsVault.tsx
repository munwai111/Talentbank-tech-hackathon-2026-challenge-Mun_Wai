'use client'

// Gamified Skills Vault — an interactive mastery ladder across the 5 skill tiers.
// Skills (from resume parsing or self-input) sit in their tier; clicking a skill
// opens an AI-generated professional read (roles that need it + why, use cases &
// impact, and where it shows in the candidate's own work history).
//
// readOnly mode powers the employer-facing profile scroll: same interactive
// tier ladder + AI insight "zoom-in", but no add/remove controls.
// Theme-aware via semantic tokens so it reads in both dark and light.

import { useState, useMemo, useRef } from 'react'
import {
  Layers, Plus, Trash2, Loader2, Sparkles, Target, Zap, TrendingUp,
  X, Briefcase, AlertTriangle, BadgeCheck,
} from 'lucide-react'
import type { Skill } from '@/types/database'
import { repairTruncatedJson } from '@/lib/repair-json'

type SkillInsight = {
  summary: string
  roles: { title: string; reason: string }[]
  use_cases: { scenario: string; impact: string }[]
  evidence: { where: string; detail: string }[]
  has_evidence: boolean
  growth_tip: string
}

type TierConfig = { level: number; name: string; text: string; border: string; bg: string; glow: string; grad: string }

// Professional proficiency tiers (a competency framework, not game ranks).
// `text` carries dark+light variants so chips read on either background.
const TIERS: TierConfig[] = [
  { level: 5, name: 'Expert',       text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-500/40',  bg: 'bg-amber-500/10',   glow: 'rgba(251,191,36,0.45)',  grad: 'from-amber-300 to-orange-500' },
  { level: 4, name: 'Advanced',     text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-500/40', bg: 'bg-violet-500/10',  glow: 'rgba(167,139,250,0.45)', grad: 'from-violet-300 to-fuchsia-500' },
  { level: 3, name: 'Proficient',   text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/40',bg: 'bg-emerald-500/10', glow: 'rgba(52,211,153,0.4)',   grad: 'from-emerald-300 to-teal-500' },
  { level: 2, name: 'Developing',   text: 'text-sky-700 dark:text-sky-300',       border: 'border-sky-500/40',    bg: 'bg-sky-500/10',     glow: 'rgba(56,189,248,0.4)',   grad: 'from-sky-300 to-blue-500' },
  { level: 1, name: 'Foundational', text: 'text-zinc-600 dark:text-zinc-300',     border: 'border-zinc-400/40',   bg: 'bg-zinc-500/10',    glow: 'rgba(161,161,170,0.35)', grad: 'from-zinc-300 to-zinc-500' },
]
const ROMAN = ['I', 'II', 'III', 'IV', 'V']
const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
const cfg = (level: number) => TIERS.find(t => t.level === level) ?? TIERS[4]

const SOURCE_LABEL: Record<string, string> = {
  import: 'From résumé', github: 'From GitHub', assessment: 'From assessment', manual: 'Self-added',
}

// ── Tier emblem (CSS-drawn hexagon rank badge) ────────────────────────────────

function TierEmblem({ level, size = 56 }: { level: number; size?: number }) {
  const t = cfg(level)
  return (
    <div className="relative shrink-0 animate-float" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full blur-md opacity-60" style={{ background: t.glow }} />
      <div className={`absolute inset-0 bg-gradient-to-br ${t.grad}`} style={{ clipPath: HEX }} />
      <div className="absolute inset-[3px] bg-background flex items-center justify-center" style={{ clipPath: HEX }}>
        <span className={`font-bold ${t.text}`} style={{ fontSize: size * 0.32 }}>{ROMAN[level - 1]}</span>
      </div>
    </div>
  )
}

// ── Animated level meter (5 segments) ─────────────────────────────────────────

function LevelMeter({ level }: { level: number }) {
  const t = cfg(level)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-muted">
          <div className={`h-full rounded-full bg-gradient-to-r ${t.grad} transition-all duration-500`}
            style={{ width: i <= level ? '100%' : '0%', transitionDelay: `${i * 80}ms` }} />
        </div>
      ))}
    </div>
  )
}

// ── Interactive skill node ────────────────────────────────────────────────────

function SkillNode({ skill, index, onOpen }: { skill: Skill; index: number; onOpen: () => void }) {
  const t = cfg(skill.level)
  return (
    <button onClick={onOpen}
      className={`vault-pop relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium
        ${t.bg} ${t.border} ${t.text} transition-all duration-200
        hover:-translate-y-0.5 active:translate-y-0 active:scale-95`}
      style={{ animationDelay: `${index * 45}ms` }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 14px ${t.glow}` }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
      {skill.name}
    </button>
  )
}

// ── Add-skill inline form ─────────────────────────────────────────────────────

function AddSkillForm({ onAdd, onClose }: { onAdd: (name: string, level: number) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState(3)
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setBusy(true)
    await onAdd(name.trim(), level)
    setBusy(false); setName('')
  }

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3 animate-fade-up">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Add a skill</p>
        <button onClick={onClose} className="text-muted-foreground/70 hover:text-foreground"><X size={14} /></button>
      </div>
      <input autoFocus value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit() }}
        placeholder="e.g. React, Stakeholder Management, Figma"
        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none" />
      <div>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70 mb-1.5">Proficiency</p>
        <div className="flex gap-1.5">
          {TIERS.slice().reverse().map(t => (
            <button key={t.level} onClick={() => setLevel(t.level)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                level === t.level ? `${t.bg} ${t.border} ${t.text}` : 'border-border text-muted-foreground hover:text-foreground'
              }`}>
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <button onClick={submit} disabled={busy || !name.trim()}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-medium text-white transition-colors">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Add skill
      </button>
    </div>
  )
}

// ── Insight drawer ────────────────────────────────────────────────────────────

function InsightBlock({ icon: Icon, title, children, delay }: {
  icon: React.ComponentType<{ size?: number; className?: string }>; title: string; children: React.ReactNode; delay: number
}) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className="text-indigo-500 dark:text-indigo-400" />
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">{title}</p>
      </div>
      {children}
    </div>
  )
}

function InsightDrawer({ skill, insight, loading, error, readOnly, onClose, onDelete }: {
  skill: Skill; insight: SkillInsight | null; loading: boolean; error: string | null; readOnly: boolean
  onClose: () => void; onDelete: () => void
}) {
  const t = cfg(skill.level)
  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-up" onClick={onClose} />
      <div className="vault-drawer relative w-full max-w-md h-full overflow-y-auto bg-background border-l border-border shadow-2xl">
        {/* Header */}
        <div className="relative p-5 border-b border-border"
          style={{ backgroundImage: `linear-gradient(135deg, ${t.glow}22, transparent)` }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={18} /></button>
          <div className="flex items-center gap-3 mb-3">
            <TierEmblem level={skill.level} size={48} />
            <div>
              <h3 className="text-lg font-bold text-foreground leading-tight">{skill.name}</h3>
              <p className={`text-xs ${t.text}`}>Level {skill.level} · {cfg(skill.level).name}</p>
            </div>
          </div>
          <LevelMeter level={skill.level} />
          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
            <BadgeCheck size={10} />{SOURCE_LABEL[skill.source] ?? 'Self-added'}
          </p>
        </div>

        <div className="p-5 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Sparkles size={26} className="text-indigo-500 dark:text-indigo-400 animate-glow-pulse" />
              <p className="text-sm text-muted-foreground">Analysing how <span className="text-foreground">{skill.name}</span> plays at work…</p>
              <div className="w-40 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-1/3 bg-indigo-500 animate-shimmer rounded-full" />
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 dark:text-red-400">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}
            </div>
          )}

          {insight && !loading && (
            <>
              <p className="text-sm text-foreground/90 leading-relaxed animate-fade-up">{insight.summary}</p>

              {insight.roles?.length > 0 && (
                <InsightBlock icon={Target} title="Where it's needed" delay={80}>
                  <div className="space-y-2">
                    {insight.roles.map((r, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                        <p className="text-xs font-medium text-foreground">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{r.reason}</p>
                      </div>
                    ))}
                  </div>
                </InsightBlock>
              )}

              {insight.use_cases?.length > 0 && (
                <InsightBlock icon={Zap} title="Use & impact" delay={160}>
                  <div className="space-y-2">
                    {insight.use_cases.map((u, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                        <p className="text-xs text-foreground/80">{u.scenario}</p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80 mt-1 flex items-start gap-1">
                          <TrendingUp size={10} className="shrink-0 mt-0.5" />{u.impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </InsightBlock>
              )}

              <InsightBlock icon={Briefcase} title={readOnly ? 'Evidence in their history' : 'Your evidence'} delay={240}>
                {insight.has_evidence && insight.evidence?.length > 0 ? (
                  <div className="space-y-2">
                    {insight.evidence.map((e, i) => (
                      <div key={i} className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2">
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300">{e.where}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{e.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground leading-relaxed rounded-lg border border-dashed border-border px-3 py-2.5">
                    {readOnly
                      ? 'No direct evidence of this skill in the listed work history.'
                      : 'No clear evidence of this skill in your work history yet. Add a role or project that used it to make it verifiable to employers.'}
                  </p>
                )}
              </InsightBlock>

              {!readOnly && insight.growth_tip && (
                <InsightBlock icon={TrendingUp} title="How to develop further" delay={320}>
                  <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border bg-muted/40 px-3 py-2.5">{insight.growth_tip}</p>
                </InsightBlock>
              )}
            </>
          )}

          {!readOnly && (
            <button onClick={onDelete}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-red-500 dark:hover:text-red-400 transition-colors pt-2">
              <Trash2 size={12} />Remove this skill
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── JSON stream helpers ───────────────────────────────────────────────────────

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

function parseInsight(raw: string): SkillInsight {
  const slice = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
  try { return JSON.parse(slice) } catch { return JSON.parse(repairTruncatedJson(raw)) }
}

// ── Main vault ────────────────────────────────────────────────────────────────

export function SkillsVault({ skills: initialSkills, readOnly = false }: { skills: Skill[]; readOnly?: boolean }) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [selected, setSelected] = useState<Skill | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const cache = useRef<Map<string, SkillInsight>>(new Map())
  const [insight, setInsight] = useState<SkillInsight | null>(null)

  const byTier = useMemo(
    () => TIERS.map(t => ({ ...t, items: skills.filter(s => s.level === t.level) })),
    [skills],
  )
  const mastery = skills.length
    ? Math.round((skills.reduce((sum, s) => sum + s.level, 0) / (skills.length * 5)) * 100)
    : 0

  async function openSkill(skill: Skill) {
    setSelected(skill); setError(null)
    const cached = cache.current.get(skill.id)
    if (cached) { setInsight(cached); setLoading(false); return }
    setInsight(null); setLoading(true)
    try {
      const res = await fetch('/api/candidate/skill-insight', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: skill.name, level: skill.level }),
      })
      if (!res.ok) throw new Error('Could not analyse this skill — try again')
      const parsed = parseInsight(await readStream(res))
      if ((parsed as { error?: string }).error) throw new Error((parsed as { error?: string }).error)
      cache.current.set(skill.id, parsed)
      setInsight(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not analyse this skill')
    }
    setLoading(false)
  }

  async function addSkill(name: string, level: number) {
    try {
      const res = await fetch('/api/candidate/skills', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, level, source: 'manual' }),
      })
      if (!res.ok) return
      const { skill } = await res.json() as { skill: Skill }
      setSkills(prev => [...prev, skill])
    } catch { /* silently fail */ }
  }

  async function deleteSelected() {
    if (!selected) return
    const id = selected.id
    setSkills(prev => prev.filter(s => s.id !== id))
    setSelected(null)
    try { await fetch(`/api/candidate/skills/${id}`, { method: 'DELETE' }) } catch { /* ignore */ }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/8 to-transparent p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Layers size={18} className="text-indigo-500 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">Skills Vault</p>
              <p className="text-[11px] text-muted-foreground">{skills.length} skills · {mastery}% mastery</p>
            </div>
          </div>
          {!readOnly && (
            <button onClick={() => setAdding(a => !a)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors hover:scale-105">
              <Plus size={13} />Add skill
            </button>
          )}
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400 transition-all duration-700"
            style={{ width: `${mastery}%` }} />
        </div>
        {readOnly && <p className="text-[10px] text-muted-foreground/70 mt-2">Tap any skill for an AI breakdown of where it&rsquo;s used and the evidence behind it.</p>}
      </div>

      {!readOnly && adding && <AddSkillForm onAdd={addSkill} onClose={() => setAdding(false)} />}

      {/* Tier ladder */}
      {skills.length === 0 && !adding ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Layers size={28} className="text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No skills {readOnly ? 'listed' : 'yet'}</p>
          {!readOnly && (
            <>
              <p className="text-xs text-muted-foreground/70 mb-4">Import a resume from Linked Accounts, or add skills manually.</p>
              <button onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-colors">
                <Plus size={14} />Add your first skill
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {byTier.map(tier => (
            <div key={tier.level}
              className={`rounded-2xl border ${tier.items.length ? tier.border : 'border-border'} ${tier.items.length ? tier.bg : 'bg-muted/20'} p-4`}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                  <TierEmblem level={tier.level} />
                  <p className={`text-[11px] font-bold ${tier.items.length ? tier.text : 'text-muted-foreground/70'}`}>{tier.name}</p>
                  <p className="text-[9px] text-muted-foreground/70 uppercase tracking-wider">{tier.items.length} skill{tier.items.length === 1 ? '' : 's'}</p>
                </div>
                <div className="flex-1 min-h-[56px] flex items-center">
                  {tier.items.length ? (
                    <div className="flex flex-wrap gap-2">
                      {tier.items.map((s, i) => <SkillNode key={s.id} skill={s} index={i} onOpen={() => openSkill(s)} />)}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/50 italic">No {tier.name.toLowerCase()} skills {readOnly ? 'listed' : 'yet'}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <InsightDrawer skill={selected} insight={insight} loading={loading} error={error} readOnly={readOnly}
          onClose={() => setSelected(null)} onDelete={deleteSelected} />
      )}
    </div>
  )
}
