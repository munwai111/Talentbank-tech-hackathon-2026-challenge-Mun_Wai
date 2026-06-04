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
    pct >= 70 ? 'bg-green-100 text-green-700 border-green-200' :
    pct >= 40 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                'bg-red-100 text-red-700 border-red-200'
  return (
    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${color}`}>
      {pct}% match
    </span>
  )
}

function ScoreBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
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
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
        Calculating your matches...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Job Matches 🎯</h1>
        <p className="text-zinc-500 mt-1">
          Ranked by skill fit + career goal alignment — not keywords. Every score shows exactly why.
        </p>
      </div>

      {/* ── Empty states ──────────────────────────────────────────────────── */}
      {reason === 'no_skills' && (
        <Card className="p-8 text-center border-dashed">
          <p className="text-3xl mb-3">🗂️</p>
          <h3 className="font-semibold mb-1">Add skills to unlock matching</h3>
          <p className="text-sm text-zinc-500 mb-4">
            We need to know your skills before we can rank jobs for you.
          </p>
          <Link href="/profile">
            <Button>Go to Skills Vault →</Button>
          </Link>
        </Card>
      )}

      {reason === 'no_jobs' && (
        <Card className="p-8 text-center border-dashed">
          <p className="text-3xl mb-3">📋</p>
          <h3 className="font-semibold mb-1">No open jobs yet</h3>
          <p className="text-sm text-zinc-500">
            Employers are posting jobs now. Check back soon.
          </p>
        </Card>
      )}

      {/* ── Match summary strip ───────────────────────────────────────────── */}
      {matches.length > 0 && (
        <div className="flex gap-4 mb-6 text-sm">
          <span className="text-zinc-500">{matches.length} open roles</span>
          <span className="text-green-600 font-medium">
            {matches.filter(m => m.score_pct >= 70).length} strong matches
          </span>
          <span className="text-yellow-600">
            {matches.filter(m => m.score_pct >= 40 && m.score_pct < 70).length} partial
          </span>
          <span className="text-zinc-400">
            {matches.filter(m => m.score_pct < 40).length} stretch
          </span>
        </div>
      )}

      {/* ── Job cards ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {matches.map(match => (
          <Card key={match.job.id} className="overflow-hidden">
            {/* Header row */}
            <div className="p-5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base">{match.job.title}</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {match.job.company.name}
                    {match.job.company.size && (
                      <span className="text-zinc-400"> · {SIZE_LABELS[match.job.company.size]}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {match.goal_alignment_label === 'goal_match' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      🎯 Goal match
                    </span>
                  )}
                  {match.goal_alignment_label === 'career_pivot' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      🔀 Career pivot
                    </span>
                  )}
                  <ScoreBadge pct={match.score_pct} />
                </div>
              </div>
              <ScoreBar pct={match.score_pct} />
              {/* Score breakdown — shown when goal alignment is active */}
              {match.goal_alignment_pct > 0 && (
                <p className="text-xs text-zinc-400 mt-1.5">
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
                  {match.job.salary_max?.toLocaleString()}
                  /mo
                </span>
              )}
            </div>

            {/* Skill chips */}
            <div className="px-5 pb-4 flex flex-wrap gap-1.5">
              {match.matched_skills.map(s => (
                <Badge key={s} className="bg-green-50 text-green-700 border border-green-200 text-xs font-normal">
                  ✓ {s}
                </Badge>
              ))}
              {match.missing_required.map(s => (
                <Badge key={s} variant="outline" className="text-red-500 border-red-200 text-xs font-normal">
                  ✗ {s}
                </Badge>
              ))}
              {match.missing_nice.slice(0, 3).map(s => (
                <Badge key={s} variant="outline" className="text-zinc-400 border-zinc-200 text-xs font-normal">
                  ~ {s}
                </Badge>
              ))}
            </div>

            {/* Expand / collapse */}
            <button
              onClick={() => setExpanded(e => e === match.job.id ? null : match.job.id)}
              className="w-full px-5 py-2.5 text-xs text-zinc-400 hover:text-zinc-600
                         border-t border-zinc-100 text-left hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              {expanded === match.job.id ? '▲ Show less' : '▼ See full role + gap analysis'}
            </button>

            {expanded === match.job.id && (
              <div className="px-5 pb-5 pt-3 border-t border-zinc-100 space-y-4">
                {/* Description */}
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">About the role</p>
                  <p className="text-sm text-zinc-600 leading-relaxed">{match.job.description}</p>
                </div>

                {/* Gap analysis */}
                {match.missing_required.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-xs font-semibold text-red-600 mb-2">
                      ⚠️ Missing {match.missing_required.length} required skill{match.missing_required.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {match.missing_required.map(s => (
                        <span key={s} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                    <p className="text-xs text-red-500">
                      Adding these skills will significantly increase your match score.
                    </p>
                  </div>
                )}

                {match.missing_nice.length > 0 && (
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <p className="text-xs font-semibold text-zinc-500 mb-2">Nice-to-have gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_nice.map(s => (
                        <span key={s} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {match.missing_required.length === 0 && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      ✅ You meet all required skills for this role.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1">
                    Apply now →
                  </Button>
                  <Link href="/profile">
                    <Button size="sm" variant="outline">
                      Add missing skills
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {matches.length > 0 && (
        <p className="text-xs text-zinc-400 text-center mt-6">
          Scores combine skill overlap (70%) and career goal alignment (30%).
          Add skills or complete your Career Identity to improve your matches.
          {' '}<Link href="/profile" className="underline hover:text-zinc-600">Skills Vault</Link>
          {' · '}
          <Link href="/discover" className="underline hover:text-zinc-600">Career Identity →</Link>
        </p>
      )}
    </div>
  )
}
