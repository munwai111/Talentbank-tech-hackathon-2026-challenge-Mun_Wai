'use client'

// /jobs — Candidate's ranked job matches
// The core demo page: shows every open role scored against this candidate's
// verified skill profile AND career goals (E-01). Sorted best-match first.
// Gap analysis + goal alignment chips per role.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MatchResult } from '@/app/api/candidate/matches/route'
import { FadeUp } from '@/components/animations/FadeUp'
import { StaggerContainer } from '@/components/animations/StaggerContainer'

const REMOTE_LABELS = {
  remote: '🌐 Remote',
  hybrid: '🏠 Hybrid',
  onsite: '🏢 On-site',
}

const SIZE_LABELS: Record<string, string> = {
  startup: 'Startup',
  sme:     'SME',
  mid:     'Mid-size',
  large:   'Large company',
}

function ScoreBadge({ pct }: { pct: number }) {
  const color =
    pct >= 70 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
    pct >= 40 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                'bg-red-500/15 text-red-400 border-red-500/30'
  return (
    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${color}`}>
      {pct}% match
    </span>
  )
}

function ScoreBar({ pct }: { pct: number }) {
  const color = pct >= 70
    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
    : pct >= 40
    ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
    : 'bg-gradient-to-r from-red-500 to-rose-500'
  return (
    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mt-2">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function JobsPage() {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/candidate/matches')
      .then(r => r.json())
      .then(data => {
        setMatches(data.matches ?? [])
        setReason(data.reason ?? null)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-400">
        <div className="w-5 h-5 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
        Calculating your matches...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <FadeUp className="mb-6" scrollTrigger={false}>
        <h1 className="text-2xl font-bold text-white">Job Matches 🎯</h1>
        <p className="text-zinc-400 mt-1">
          Ranked by skill fit + career goal alignment — not keywords. Every score shows exactly why.
        </p>
      </FadeUp>

      {/* ── Empty states ──────────────────────────────────────────────────── */}
      {reason === 'no_skills' && (
        <div className="p-8 text-center rounded-xl border border-white/8 bg-white/3">
          <p className="text-3xl mb-3">🗂️</p>
          <h3 className="font-semibold mb-1 text-white">Add skills to unlock matching</h3>
          <p className="text-sm text-zinc-400 mb-4">
            We need to know your skills before we can rank jobs for you.
          </p>
          <Link href="/profile">
            <Button className="bg-indigo-600 hover:bg-indigo-500 border-0 text-white">
              Go to Skills Vault →
            </Button>
          </Link>
        </div>
      )}

      {reason === 'no_jobs' && (
        <div className="p-8 text-center rounded-xl border border-white/8 bg-white/3">
          <p className="text-3xl mb-3">📋</p>
          <h3 className="font-semibold mb-1 text-white">No open jobs yet</h3>
          <p className="text-sm text-zinc-400">
            Employers are posting jobs now. Check back soon.
          </p>
        </div>
      )}

      {/* ── Match summary strip ───────────────────────────────────────────── */}
      {matches.length > 0 && (
        <div className="flex gap-4 mb-6 text-sm">
          <span className="text-zinc-400">{matches.length} open roles</span>
          <span className="text-emerald-400 font-medium">
            {matches.filter(m => m.score_pct >= 70).length} strong matches
          </span>
          <span className="text-amber-400">
            {matches.filter(m => m.score_pct >= 40 && m.score_pct < 70).length} partial
          </span>
          <span className="text-zinc-500">
            {matches.filter(m => m.score_pct < 40).length} stretch
          </span>
        </div>
      )}

      {/* ── Job cards ─────────────────────────────────────────────────────── */}
      <StaggerContainer className="space-y-3" stagger={0.07} scrollTrigger={false} childSelector=":scope > div">
        {matches.map(match => (
          <div key={match.job.id}
            className="rounded-xl border border-white/8 bg-white/3 overflow-hidden backdrop-blur-sm">
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
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      🎯 Goal match
                    </span>
                  )}
                  {match.goal_alignment_label === 'career_pivot' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      🔀 Career pivot
                    </span>
                  )}
                  <ScoreBadge pct={match.score_pct} />
                </div>
              </div>
              <ScoreBar pct={match.score_pct} />
              {match.goal_alignment_pct > 0 && (
                <p className="text-xs text-zinc-500 mt-1.5">
                  Skills {match.skill_pct}% · Goals {match.goal_alignment_pct}% · Combined {match.score_pct}%
                </p>
              )}
            </div>

            {/* Meta row */}
            <div className="px-5 pb-3 flex flex-wrap gap-2 text-xs text-zinc-500">
              {match.job.location && <span>📍 {match.job.location}</span>}
              <span>{REMOTE_LABELS[match.job.remote]}</span>
              {match.job.salary_min && (
                <span>
                  💰 RM {match.job.salary_min.toLocaleString()} –{' '}
                  {match.job.salary_max?.toLocaleString()}/mo
                </span>
              )}
            </div>

            {/* Skill chips */}
            <div className="px-5 pb-4 flex flex-wrap gap-1.5">
              {match.matched_skills.map(s => (
                <Badge key={s} className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-normal">
                  ✓ {s}
                </Badge>
              ))}
              {match.missing_required.map(s => (
                <Badge key={s} className="bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-normal">
                  ✗ {s}
                </Badge>
              ))}
              {match.missing_nice.slice(0, 3).map(s => (
                <Badge key={s} className="bg-white/5 text-zinc-500 border border-white/10 text-xs font-normal">
                  ~ {s}
                </Badge>
              ))}
            </div>

            {/* Expand / collapse */}
            <button
              onClick={() => setExpanded(e => e === match.job.id ? null : match.job.id)}
              className="w-full px-5 py-2.5 text-xs text-zinc-500 hover:text-zinc-300
                         border-t border-white/7 text-left hover:bg-white/3 transition-colors flex items-center gap-2"
            >
              {expanded === match.job.id ? '▲ Show less' : '▼ See full role + gap analysis'}
            </button>

            {expanded === match.job.id && (
              <div className="px-5 pb-5 pt-3 border-t border-white/7 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">About the role</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{match.job.description}</p>
                </div>

                {match.missing_required.length > 0 && (
                  <div className="p-4 bg-red-500/8 border border-red-500/20 rounded-lg">
                    <p className="text-xs font-semibold text-red-400 mb-2">
                      ⚠️ Missing {match.missing_required.length} required skill{match.missing_required.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {match.missing_required.map(s => (
                        <span key={s} className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">{s}</span>
                      ))}
                    </div>
                    <p className="text-xs text-red-400/70">
                      Adding these skills will significantly increase your match score.
                    </p>
                  </div>
                )}

                {match.missing_nice.length > 0 && (
                  <div className="p-3 bg-white/3 border border-white/8 rounded-lg">
                    <p className="text-xs font-semibold text-zinc-500 mb-2">Nice-to-have gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_nice.map(s => (
                        <span key={s} className="text-xs bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full border border-white/10">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {match.missing_required.length === 0 && (
                  <div className="p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
                    <p className="text-sm text-emerald-400 font-medium">
                      ✅ You meet all required skills for this role.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-500 border-0 text-white">
                    Apply now →
                  </Button>
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
        ))}
      </StaggerContainer>

      {matches.length > 0 && (
        <p className="text-xs text-zinc-500 text-center mt-6">
          Scores combine skill overlap (70%) and career goal alignment (30%).
          Add skills or complete your Career Identity to improve your matches.
          {' '}<Link href="/profile" className="underline hover:text-zinc-300">Skills Vault</Link>
          {' · '}
          <Link href="/discover" className="underline hover:text-zinc-300">Career Identity →</Link>
        </p>
      )}
    </div>
  )
}
