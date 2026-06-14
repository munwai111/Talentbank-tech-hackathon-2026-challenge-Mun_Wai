'use client'

// /jobs — Candidate's ranked job matches
// The core demo page: every open role scored against this candidate's
// verified skill profile AND career goals (E-01), sorted best-match first.
// The score anatomy bar teaches WHY each score is what it is.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MatchResult } from '@/app/api/candidate/matches/route'
import { FadeUp } from '@/components/animations/FadeUp'
import { StaggerContainer } from '@/components/animations/StaggerContainer'
import { WorkModeMeta, LocationMeta, SalaryMeta } from '@/components/shared/meta'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import {
  Check, X, Vault, ArrowRight, ChevronDown, ChevronUp,
  Crosshair, Compass, CircleAlert,
} from 'lucide-react'

const SIZE_LABELS: Record<string, string> = {
  startup: 'Startup',
  sme:     'SME',
  mid:     'Mid-size',
  large:   'Large company',
}

function scoreTone(pct: number) {
  if (pct >= 70) return { text: 'text-emerald-400', chip: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
  if (pct >= 40) return { text: 'text-amber-400', chip: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
  return { text: 'text-zinc-400', chip: 'bg-white/8 text-zinc-400 border-white/15' }
}

/* ── Score anatomy — the insight, visualized ────────────────────────────────
   Combined = 70% skill fit + 30% goal alignment. Instead of one opaque bar,
   show the two contributions as distinct segments so the user learns how
   the score is built — and which lever moves it. */
function ScoreAnatomy({ skillPct, goalPct, combinedPct }: {
  skillPct: number
  goalPct: number
  combinedPct: number
}) {
  const { t } = useLanguage()
  const hasGoals = goalPct > 0
  const skillPts = hasGoals ? skillPct * 0.7 : skillPct
  const goalPts = hasGoals ? goalPct * 0.3 : 0

  return (
    <div className="mt-3">
      <div className="h-1.5 bg-white/7 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-indigo-400 rounded-l-full transition-[width] duration-300 ease-snap"
          style={{ width: `${skillPts}%` }}
        />
        {hasGoals && (
          <div
            className="h-full bg-violet-400/80 transition-[width] duration-300 ease-snap"
            style={{ width: `${goalPts}%` }}
          />
        )}
      </div>
      <div className="flex items-center gap-4 mt-1.5 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          {t('jobs.skillFit')} {skillPct}%
        </span>
        {hasGoals && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400/80" />
            {t('jobs.goalPull')} {goalPct}%
          </span>
        )}
        <span className="ml-auto text-zinc-600">= {combinedPct} {t('jobs.combined')}</span>
      </div>
    </div>
  )
}

export default function JobsPage() {
  const { t } = useLanguage()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/candidate/matches').then(r => r.json()),
      fetch('/api/candidate/applications').then(r => r.json()),
    ]).then(([matchData, appData]) => {
      setMatches(matchData.matches ?? [])
      setReason(matchData.reason ?? null)
      setAppliedIds(new Set((appData.applications ?? []).map((a: { job_id: string }) => a.job_id)))
      setLoading(false)
    })
  }, [])

  async function applyToJob(jobId: string) {
    setApplying(jobId)
    try {
      const res = await fetch('/api/candidate/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      })
      if (res.ok) setAppliedIds(prev => new Set([...prev, jobId]))
    } finally {
      setApplying(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-400">
        <div className="w-5 h-5 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
        {t('common.loading')}
      </div>
    )
  }

  const strong = matches.filter(m => m.score_pct >= 70).length
  const partial = matches.filter(m => m.score_pct >= 40 && m.score_pct < 70).length

  return (
    <div className="px-8 py-6 max-w-5xl">
      <FadeUp className="mb-7" scrollTrigger={false}>
        <p className="section-label mb-2">{t('jobs.eyebrow')}</p>
        <h1 className="text-2xl font-bold text-white">{t('jobs.title')}</h1>
        <p className="text-zinc-400 mt-1">
          {t('jobs.subtitle')}
        </p>
      </FadeUp>

      {/* ── Empty states ──────────────────────────────────────────────────── */}
      {reason === 'no_skills' && (
        <div className="p-10 text-center surface">
          <Vault size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-500" />
          <h3 className="font-semibold mb-1 text-white">Add skills to unlock matching</h3>
          <p className="text-sm text-zinc-400 mb-5">
            We need to know your skills before we can rank jobs for you.
          </p>
          <Link href="/profile">
            <Button className="bg-indigo-600 hover:bg-indigo-500 border-0 text-white">
              Go to Skills Vault
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      )}

      {reason === 'no_jobs' && (
        <div className="p-10 text-center surface">
          <Crosshair size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-500" />
          <h3 className="font-semibold mb-1 text-white">No open jobs yet</h3>
          <p className="text-sm text-zinc-400">
            Employers are posting jobs now. Check back soon.
          </p>
        </div>
      )}

      {/* ── Match summary strip ───────────────────────────────────────────── */}
      {matches.length > 0 && (
        <div className="flex gap-5 mb-6 text-sm">
          <span className="text-zinc-400">{matches.length} {t('jobs.openRoles')}</span>
          <span className="text-emerald-400 font-medium">{strong} {t('jobs.strong')}</span>
          <span className="text-amber-400">{partial} {t('jobs.partial')}</span>
          <span className="text-zinc-500">{matches.length - strong - partial} {t('jobs.stretchN')}</span>
        </div>
      )}

      {/* ── Job cards ─────────────────────────────────────────────────────── */}
      <StaggerContainer className="space-y-3" stagger={0.07} scrollTrigger={false} childSelector=":scope > div">
        {matches.map(match => {
          const tone = scoreTone(match.score_pct)
          const isExpanded = expanded === match.job.id
          return (
            <div key={match.job.id} className="surface overflow-hidden">
              {/* Header row */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-white">{match.job.title}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {match.job.company.name}
                      {match.job.company.size && (
                        <span className="text-zinc-500"> · {SIZE_LABELS[match.job.company.size]}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {match.goal_alignment_label === 'goal_match' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                        <Compass size={11} strokeWidth={2} />
                        On your route
                      </span>
                    )}
                    {match.goal_alignment_label === 'career_pivot' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Career pivot
                      </span>
                    )}
                    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${tone.chip}`}>
                      {match.score_pct}%
                    </span>
                  </div>
                </div>

                <ScoreAnatomy
                  skillPct={match.skill_pct}
                  goalPct={match.goal_alignment_pct}
                  combinedPct={match.score_pct}
                />
              </div>

              {/* Meta row */}
              <div className="px-5 pb-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                {match.job.location && <LocationMeta>{match.job.location}</LocationMeta>}
                <WorkModeMeta mode={match.job.remote} />
                {match.job.salary_min && (
                  <SalaryMeta min={match.job.salary_min} max={match.job.salary_max} />
                )}
              </div>

              {/* Skill chips */}
              <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                {match.matched_skills.map(s => (
                  <Badge key={s} className="gap-1 bg-emerald-500/12 text-emerald-400 border border-emerald-500/25 text-xs font-normal">
                    <Check size={10} strokeWidth={2.5} /> {s}
                  </Badge>
                ))}
                {match.missing_required.map(s => (
                  <Badge key={s} className="gap-1 bg-red-500/12 text-red-400 border border-red-500/25 text-xs font-normal">
                    <X size={10} strokeWidth={2.5} /> {s}
                  </Badge>
                ))}
                {match.missing_nice.slice(0, 3).map(s => (
                  <Badge key={s} className="bg-white/5 text-zinc-500 border border-white/10 text-xs font-normal">
                    {s}
                  </Badge>
                ))}
              </div>

              {/* Expand / collapse */}
              <button
                onClick={() => setExpanded(e => e === match.job.id ? null : match.job.id)}
                className="w-full px-5 py-2.5 text-xs text-zinc-500 hover:text-zinc-300
                           border-t border-white/7 text-left hover:bg-white/3 transition-colors flex items-center gap-2"
              >
                {isExpanded
                  ? <><ChevronUp size={13} /> {t('common.back')}</>
                  : <><ChevronDown size={13} /> {t('jobs.fullAnalysis')}</>}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-3 border-t border-white/7 space-y-4">
                  <div>
                    <p className="section-label mb-1.5">About the role</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{match.job.description}</p>
                  </div>

                  {match.missing_required.length > 0 && (
                    <div className="p-4 bg-red-500/8 border border-red-500/20 rounded-lg">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-2">
                        <CircleAlert size={13} strokeWidth={2} />
                        Missing {match.missing_required.length} required skill{match.missing_required.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {match.missing_required.map(s => (
                          <span key={s} className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">{s}</span>
                        ))}
                      </div>
                      <p className="text-xs text-red-400/70">
                        Closing these gaps is the fastest way to move this role onto your route.
                      </p>
                    </div>
                  )}

                  {match.missing_nice.length > 0 && (
                    <div className="p-3 surface">
                      <p className="section-label mb-2">Nice-to-have gaps</p>
                      <div className="flex flex-wrap gap-1.5">
                        {match.missing_nice.map(s => (
                          <span key={s} className="text-xs bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full border border-white/10">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.missing_required.length === 0 && (
                    <div className="p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
                      <p className="inline-flex items-center gap-2 text-sm text-emerald-400 font-medium">
                        <Check size={15} strokeWidth={2.5} />
                        You meet all required skills for this role.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {appliedIds.has(match.job.id) ? (
                      <div className="flex-1 flex items-center justify-center gap-2 text-sm font-medium
                        text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-md px-3 py-1.5">
                        <Check size={14} strokeWidth={2.5} /> {t('jobs.applied')}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 border-0 text-white"
                        disabled={applying === match.job.id}
                        onClick={() => applyToJob(match.job.id)}
                      >
                        {applying === match.job.id ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t('common.loading')}
                          </span>
                        ) : <>{t('jobs.apply')} <ArrowRight size={14} /></>}
                      </Button>
                    )}
                    <Link href="/profile">
                      <Button size="sm" variant="outline"
                        className="border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300">
                        Add missing skills
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </StaggerContainer>

      {matches.length > 0 && (
        <div className="mt-6 flex flex-col items-center gap-2">
          {appliedIds.size > 0 && (
            <Link href="/applications"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
              View my applications ({appliedIds.size})
              <ArrowRight size={13} />
            </Link>
          )}
          <p className="text-xs text-zinc-500 text-center">
            Scores combine skill fit (70%) and goal alignment (30%).
            {' '}<Link href="/profile" className="underline hover:text-zinc-300">Skills Vault</Link>
            {' · '}
            <Link href="/discover" className="underline hover:text-zinc-300">Career Identity</Link>
          </p>
        </div>
      )}
    </div>
  )
}
