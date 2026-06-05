'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CareerPath, PathMatchType } from '@/lib/ai/path-navigator'

// ── Pure utilities (outside component — no closure over state) ────────────────

function extractJSON(raw: string): string {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || start >= end) throw new Error('No JSON object found in response')
  return raw.slice(start, end + 1)
}

async function readStreamedPaths(): Promise<{ paths?: CareerPath[]; error?: string }> {
  const res = await fetch('/api/candidate/paths')
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error ?? 'Generation failed')
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    accumulated += decoder.decode(value, { stream: true })
  }
  return JSON.parse(extractJSON(accumulated)) as { paths?: CareerPath[]; error?: string }
}

// ── Visual config per match type ─────────────────────────────────────────────

type MatchConfig = {
  label: string
  border: string
  badge: string
  dot: string
}

const MATCH_CONFIG: Record<PathMatchType, MatchConfig> = {
  strong:   { label: 'Strong Match',   border: 'border-t-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-500' },
  emerging: { label: 'Emerging Path',  border: 'border-t-amber-400',   badge: 'bg-amber-500/15 text-amber-400',    dot: 'bg-amber-400'   },
  stretch:  { label: 'Stretch Goal',   border: 'border-t-indigo-500',  badge: 'bg-indigo-500/15 text-indigo-400',  dot: 'bg-indigo-500'  },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SkillChip({ name, variant }: { name: string; variant: 'have' | 'develop' }) {
  const cls = variant === 'have'
    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
    : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {name}
    </span>
  )
}

function PathStats({ path }: { path: CareerPath }) {
  const salary = `RM ${path.salary_min_myr.toLocaleString()} – ${path.salary_max_myr.toLocaleString()}/mo`
  const timeline = `${path.timeline_months_min}–${path.timeline_months_max} months`
  return (
    <div className="space-y-3">
      {/* Fair Pay signal — prominent salary display (C-04) */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
        <p className="text-xs text-emerald-400 font-medium mb-0.5">💰 Market salary for this move</p>
        <p className="text-base font-bold text-emerald-300">{salary}</p>
        <p className="text-xs text-emerald-400/70 mt-0.5">
          Professionals in Malaysia with a similar profile typically earn in this range.
        </p>
      </div>
      <div className="text-sm">
        <p className="text-xs text-zinc-500 mb-0.5">Typical timeline to reach this role</p>
        <p className="font-semibold text-zinc-200">{timeline}</p>
      </div>
    </div>
  )
}

function SkillSection({ path }: { path: CareerPath }) {
  return (
    <div className="space-y-2">
      {path.skills_you_have.length > 0 && (
        <div>
          <p className="text-xs text-zinc-400 mb-1">Skills you have</p>
          <div className="flex flex-wrap gap-1">
            {path.skills_you_have.map(s => <SkillChip key={s} name={s} variant="have" />)}
          </div>
        </div>
      )}
      {path.skills_to_develop.length > 0 && (
        <div>
          <p className="text-xs text-zinc-400 mb-1">Skills to develop</p>
          <div className="flex flex-wrap gap-1">
            {path.skills_to_develop.map(s => <SkillChip key={s} name={s} variant="develop" />)}
          </div>
        </div>
      )}
    </div>
  )
}

function PathCard({ path }: { path: CareerPath }) {
  const cfg = MATCH_CONFIG[path.id] ?? MATCH_CONFIG.emerging
  return (
    <div className={`bg-white/4 rounded-xl border border-white/8 border-t-4 ${cfg.border}
      backdrop-blur-sm flex flex-col gap-5 p-6 hover:border-white/15 transition-all`}>
      {/* Header */}
      <div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge} mb-3`}
          style={{ borderColor: 'transparent' }}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
        <h3 className="text-lg font-bold text-white">{path.title}</h3>
        <p className="text-xs text-zinc-400 mt-1">{path.match_label}</p>
        <p className="text-xs text-zinc-500 mt-1">
          {path.company_types.join(' · ')}
        </p>
      </div>

      <PathStats path={path} />
      <SkillSection path={path} />

      {/* Trade-off */}
      <div className="bg-white/4 rounded-lg px-4 py-3 text-xs text-zinc-400 border-l-2 border-white/20">
        <span className="font-semibold text-zinc-300">Trade-off: </span>
        {path.trade_off}
      </div>

      {/* Navigation note */}
      <p className="text-xs text-zinc-500 italic">{path.navigation_note}</p>

      {/* CTA */}
      <a
        href="/jobs"
        className="mt-auto inline-block text-center text-sm font-medium text-white
          bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
          rounded-lg px-4 py-2 transition-all shadow-lg shadow-indigo-500/20"
      >
        Explore matching jobs →
      </a>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-4">🗺️</p>
      <h2 className="text-lg font-semibold text-white mb-2">No paths generated yet</h2>
      <p className="text-sm text-zinc-400 max-w-sm mx-auto">
        Add some skills to your profile first — the navigator needs at least a few to map realistic paths.
      </p>
      <a href="/profile" className="mt-6 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
        Add skills to your vault →
      </a>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PathsPage() {
  const [paths, setPaths] = useState<CareerPath[]>([])
  const [loading, setLoading] = useState(true)  // true = skeleton visible on mount
  const [error, setError] = useState<string | null>(null)

  // fetchPaths: called from the Refresh button (event handler context).
  // Calling setLoading(true) synchronously here is fine — event handlers
  // are not subject to react-hooks/set-state-in-effect.
  const fetchPaths = useCallback(() => {
    setLoading(true)
    setError(null)
    readStreamedPaths()
      .then(parsed => {
        if (parsed.error) throw new Error(parsed.error)
        setPaths(parsed.paths ?? [])
        setLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setLoading(false)
      })
  }, [])

  // Initial load: inline Promise chain so all setState calls happen inside
  // callbacks (.then / .catch), never synchronously in the effect body.
  // This satisfies react-hooks/set-state-in-effect.
  // `loading` is already true from initial state — no setLoading(true) needed.
  useEffect(() => {
    let cancelled = false
    readStreamedPaths()
      .then(parsed => {
        if (cancelled) return
        if (parsed.error) throw new Error(parsed.error)
        setPaths(parsed.paths ?? [])
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Career Path Navigator</h1>
          <p className="text-sm text-zinc-400 mt-1">
            3 directions mapped from your skills — not predictions, navigation.
          </p>
        </div>
        <button
          onClick={fetchPaths}
          disabled={loading}
          className="text-sm font-medium text-zinc-400 border border-white/10 bg-white/4
            rounded-lg px-4 py-2 hover:bg-white/8 hover:text-zinc-200 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating…' : '↺ Refresh paths'}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white/4 rounded-xl border border-white/8 border-t-4 border-t-white/15 p-6 animate-pulse space-y-4">
              <div className="h-4 bg-white/8 rounded w-24" />
              <div className="h-6 bg-white/8 rounded w-3/4" />
              <div className="h-4 bg-white/8 rounded w-1/2" />
              <div className="h-12 bg-white/8 rounded" />
              <div className="h-16 bg-white/8 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-sm text-red-400 font-medium mb-3">{error}</p>
          <button onClick={fetchPaths} className="text-sm text-red-400 hover:text-red-300 hover:underline">
            Try again
          </button>
        </div>
      )}

      {/* Paths grid */}
      {!loading && !error && paths.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paths.map(path => <PathCard key={path.id} path={path} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && paths.length === 0 && <EmptyState />}

      {/* Disclaimer — only when paths are visible (not during error state) */}
      {!loading && !error && paths.length > 0 && (
        <p className="mt-8 text-xs text-zinc-400 text-center max-w-2xl mx-auto">
          Paths are generated from aggregated market data and your current skill profile.
          They show where similar professionals typically move — not a guarantee of any individual outcome.
        </p>
      )}
    </div>
  )
}
